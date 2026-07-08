import path from 'path';
import { Meeting } from '../models/Meeting.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { transcribeFile } from './ai/transcription.js';
import { extractInsights } from './ai/insights.js';
import { indexMeeting, removeMeeting } from './vectorStore.js';

/**
 * Runs the full AI pipeline for a meeting, updating its status as it goes:
 *   uploaded → processing → (transcribe) → (insights) → (index) → completed
 *
 * Designed to be fired asynchronously (fire-and-forget) after upload. In a
 * production deployment this would run on a queue/worker (e.g. BullMQ, SQS);
 * here it runs in-process but is fully isolated with its own error handling.
 *
 * @param {string} meetingId
 */
export async function processMeeting(meetingId) {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) return;

  if (!env.openai.enabled) {
    meeting.status = 'failed';
    meeting.processingError = 'OpenAI is not configured on the server.';
    await meeting.save();
    return;
  }

  try {
    meeting.status = 'processing';
    meeting.processingError = undefined;
    await meeting.save();

    // 1. Obtain a transcript (either from uploaded media or a pasted transcript).
    if (meeting.source.type === 'upload') {
      const filePath = path.resolve(env.uploads.dir, meeting.source.storageKey);
      logger.info('Transcribing meeting', { meetingId, file: meeting.source.filename });
      meeting.transcript = await transcribeFile(filePath);
      await meeting.save();
    }

    if (!meeting.transcript?.trim()) {
      throw new Error('Transcript is empty — nothing to analyze.');
    }

    // 2. Extract structured insights via LangChain.
    logger.info('Extracting insights', { meetingId });
    const insights = await extractInsights({
      title: meeting.title,
      transcript: meeting.transcript,
    });
    meeting.summary = insights.summary;
    meeting.topics = insights.topics || [];
    meeting.keyDecisions = insights.keyDecisions || [];
    meeting.actionItems = (insights.actionItems || []).map((a) => ({
      title: a.title,
      assignee: a.assignee,
      dueDate: a.dueDate,
      priority: a.priority || 'medium',
      status: 'open',
    }));
    await meeting.save();

    // 3. Index transcript for semantic search.
    const chunkCount = await indexMeeting({
      meetingId: meeting._id,
      workspaceId: meeting.workspace,
      title: meeting.title,
      transcript: meeting.transcript,
    });
    meeting.embedded = chunkCount > 0;
    meeting.chunkCount = chunkCount;

    meeting.status = 'completed';
    await meeting.save();
    logger.info('Meeting processing complete', { meetingId });
  } catch (err) {
    logger.error('Meeting processing failed', { meetingId, message: err.message });
    meeting.status = 'failed';
    meeting.processingError = err.message;
    await meeting.save();
  }
}

/** Re-indexes and re-analyzes an existing meeting (e.g. after an edit). */
export async function reprocessMeeting(meetingId) {
  await removeMeeting(meetingId).catch(() => {});
  return processMeeting(meetingId);
}
