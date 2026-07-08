import { ChromaClient } from 'chromadb';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { chunkText, embedTexts, embedQuery } from './ai/embeddings.js';

const COLLECTION = 'meetmind_transcripts';

let client = null;
let collectionPromise = null;

function getClient() {
  if (!client) client = new ChromaClient({ path: env.chromaUrl });
  return client;
}

/**
 * We compute embeddings ourselves (OpenAI), so we register a no-op embedding
 * function with Chroma and always pass vectors explicitly.
 */
const passthroughEmbedder = { generate: async (texts) => texts.map(() => []) };

async function getCollection() {
  if (!collectionPromise) {
    collectionPromise = getClient().getOrCreateCollection({
      name: COLLECTION,
      embeddingFunction: passthroughEmbedder,
      metadata: { 'hnsw:space': 'cosine' },
    });
  }
  return collectionPromise;
}

/**
 * Indexes a meeting transcript: chunk → embed → upsert into Chroma. Chunks are
 * tagged with workspaceId + meetingId so search can be scoped and cleaned up.
 * @returns {Promise<number>} number of chunks indexed
 */
export async function indexMeeting({ meetingId, workspaceId, title, transcript }) {
  const chunks = chunkText(transcript);
  if (!chunks.length) return 0;

  const vectors = await embedTexts(chunks);
  const collection = await getCollection();

  await collection.upsert({
    ids: chunks.map((_, i) => `${meetingId}:${i}`),
    embeddings: vectors,
    documents: chunks,
    metadatas: chunks.map((_, i) => ({
      meetingId: String(meetingId),
      workspaceId: String(workspaceId),
      title,
      chunkIndex: i,
    })),
  });

  logger.info('Indexed meeting into vector store', { meetingId, chunks: chunks.length });
  return chunks.length;
}

/** Removes all chunks belonging to a meeting. */
export async function removeMeeting(meetingId) {
  const collection = await getCollection();
  await collection.delete({ where: { meetingId: String(meetingId) } });
}

/**
 * Semantic search scoped to a workspace.
 * @returns {Promise<Array<{ meetingId, title, snippet, score }>>}
 */
export async function searchWorkspace({ workspaceId, query, limit = 8 }) {
  const collection = await getCollection();
  const queryVector = await embedQuery(query);

  const res = await collection.query({
    queryEmbeddings: [queryVector],
    nResults: limit,
    where: { workspaceId: String(workspaceId) },
  });

  const docs = res.documents?.[0] || [];
  const metas = res.metadatas?.[0] || [];
  const distances = res.distances?.[0] || [];

  return docs.map((doc, i) => ({
    meetingId: metas[i]?.meetingId,
    title: metas[i]?.title,
    snippet: doc,
    // Convert cosine distance → similarity score in [0,1].
    score: Number((1 - (distances[i] ?? 0)).toFixed(4)),
  }));
}

/** Best-effort connectivity check for the health endpoint. */
export async function vectorStoreHealthy() {
  try {
    await getClient().heartbeat();
    return true;
  } catch {
    return false;
  }
}
