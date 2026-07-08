import { getOpenAI } from './openaiClient.js';
import { env } from '../../config/env.js';

/**
 * Splits text into overlapping chunks on sentence/paragraph boundaries so that
 * embeddings capture coherent spans of discussion.
 * @param {string} text
 * @param {{ chunkSize?: number, overlap?: number }} [opts] sizes are in characters
 */
export function chunkText(text, { chunkSize = 1200, overlap = 200 } = {}) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + chunkSize, clean.length);
    // Try to break on a sentence boundary within the last 200 chars.
    if (end < clean.length) {
      const window = clean.slice(end - 200, end);
      const period = window.lastIndexOf('. ');
      if (period !== -1) end = end - 200 + period + 1;
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = end - overlap;
  }
  return chunks.filter(Boolean);
}

/** Embeds an array of texts. Returns an array of vectors (number[][]). */
export async function embedTexts(texts) {
  if (!texts.length) return [];
  const openai = getOpenAI();
  const res = await openai.embeddings.create({
    model: env.openai.embeddingModel,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

/** Embeds a single query string. */
export async function embedQuery(text) {
  const [vec] = await embedTexts([text]);
  return vec;
}
