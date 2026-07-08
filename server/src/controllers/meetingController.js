import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { Meeting } from '../models/Meeting.js';
import { env } from '../config/env.js';
import { processMeeting, reprocessMeeting } from '../services/meetingPipeline.js';
import { removeMeeting } from '../services/vectorStore.js';
import { postMeetingSummary } from '../services/integrations/slack.js';
import { createIssueFromAction } from '../services/integrations/jira.js';

const csv = (v) =>
  Array.isArray(v)
    ? v
    : typeof v === 'string' && v.trim()
    ? v.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

export const createSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  participants: z.union([z.string(), z.array(z.string())]).optional(),
  meetingDate: z.string().optional(),
  // Present when the client pastes a transcript instead of uploading media.
  transcript: z.string().optional(),
});

export const shareSlackSchema = z.object({ channel: z.string().optional() });
export const jiraSchema = z.object({ projectKey: z.string().optional() });

/** GET /api/meetings?workspaceId=... — list meetings in a workspace. */
export const list = asyncHandler(async (req, res) => {
  const meetings = await Meeting.find({ workspace: req.workspace._id })
    .select('-transcript')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ meetings });
});

/** GET /api/meetings/:id */
export const get = asyncHandler(async (req, res) => {
  res.json({ meeting: req.meeting });
});

/**
 * POST /api/meetings — create a meeting from an upload or a pasted transcript,
 * then kick off async processing.
 */
export const create = asyncHandler(async (req, res) => {
  const { title, description, participants, meetingDate, transcript } = req.body;
  const hasFile = Boolean(req.file);
  const hasTranscript = Boolean(transcript && transcript.trim());

  if (!hasFile && !hasTranscript) {
    throw ApiError.badRequest('Provide either a media file or a transcript.');
  }

  const meeting = await Meeting.create({
    workspace: req.workspace._id,
    createdBy: req.user._id,
    title,
    description,
    participants: csv(participants),
    meetingDate: meetingDate ? new Date(meetingDate) : new Date(),
    source: hasFile
      ? {
          type: 'upload',
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          storageKey: req.file.filename,
        }
      : { type: 'transcript' },
    transcript: hasTranscript ? transcript.trim() : undefined,
    status: 'uploaded',
  });

  // Fire-and-forget the pipeline; the client polls the meeting for status.
  processMeeting(meeting._id).catch(() => {});

  res.status(201).json({ meeting });
});

/** POST /api/meetings/:id/reprocess */
export const reprocess = asyncHandler(async (req, res) => {
  reprocessMeeting(req.meeting._id).catch(() => {});
  res.json({ ok: true, status: 'processing' });
});

/** DELETE /api/meetings/:id */
export const remove = asyncHandler(async (req, res) => {
  const meeting = req.meeting;
  await removeMeeting(meeting._id).catch(() => {});
  if (meeting.source?.type === 'upload' && meeting.source.storageKey) {
    const filePath = path.resolve(env.uploads.dir, meeting.source.storageKey);
    fs.rm(filePath, { force: true }, () => {});
  }
  await meeting.deleteOne();
  res.json({ ok: true });
});

/** PATCH /api/meetings/:id/actions/:actionId — toggle status / edit. */
export const updateAction = asyncHandler(async (req, res) => {
  const action = req.meeting.actionItems.id(req.params.actionId);
  if (!action) throw ApiError.notFound('Action item not found');

  const { status, title, assignee, dueDate, priority } = req.body;
  if (status) action.status = status;
  if (title) action.title = title;
  if (assignee !== undefined) action.assignee = assignee;
  if (dueDate !== undefined) action.dueDate = dueDate;
  if (priority) action.priority = priority;

  await req.meeting.save();
  res.json({ meeting: req.meeting });
});

/** POST /api/meetings/:id/actions/:actionId/jira — export an action to Jira. */
export const exportActionToJira = asyncHandler(async (req, res) => {
  const action = req.meeting.actionItems.id(req.params.actionId);
  if (!action) throw ApiError.notFound('Action item not found');
  if (action.jira?.issueKey) {
    throw ApiError.conflict(`Already exported as ${action.jira.issueKey}`);
  }

  const { issueKey, url } = await createIssueFromAction(
    action,
    req.meeting,
    req.body.projectKey
  );
  action.jira = { issueKey, url };
  await req.meeting.save();
  res.status(201).json({ action });
});

/** POST /api/meetings/:id/share/slack — post the summary to Slack. */
export const shareToSlack = asyncHandler(async (req, res) => {
  if (req.meeting.status !== 'completed') {
    throw ApiError.badRequest('Meeting is not fully processed yet.');
  }
  const result = await postMeetingSummary(req.meeting, req.body.channel);
  res.json({ ok: true, ...result });
});
