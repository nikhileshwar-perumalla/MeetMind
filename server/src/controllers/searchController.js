import { z } from 'zod';
import { asyncHandler } from '../utils/ApiError.js';
import { searchWorkspace } from '../services/vectorStore.js';
import { Meeting } from '../models/Meeting.js';

export const searchSchema = z.object({
  workspaceId: z.string().min(1),
  query: z.string().min(2).max(500),
  limit: z.number().int().min(1).max(20).optional(),
});

/**
 * POST /api/search — semantic search across a workspace's meetings. Results are
 * grouped by meeting and enriched with meeting metadata.
 */
export const search = asyncHandler(async (req, res) => {
  const { query, limit } = req.body;

  const hits = await searchWorkspace({
    workspaceId: req.workspace._id,
    query,
    limit: limit || 8,
  });

  // Group hits by meeting and attach titles/dates for a clean UI.
  const byMeeting = new Map();
  for (const hit of hits) {
    if (!hit.meetingId) continue;
    if (!byMeeting.has(hit.meetingId)) {
      byMeeting.set(hit.meetingId, { meetingId: hit.meetingId, title: hit.title, matches: [] });
    }
    byMeeting.get(hit.meetingId).matches.push({ snippet: hit.snippet, score: hit.score });
  }

  const ids = [...byMeeting.keys()];
  const meetings = await Meeting.find({ _id: { $in: ids } }).select('title meetingDate summary');
  const meta = new Map(meetings.map((m) => [String(m._id), m]));

  const results = [...byMeeting.values()]
    .map((group) => {
      const m = meta.get(group.meetingId);
      return {
        ...group,
        meetingDate: m?.meetingDate,
        summary: m?.summary,
        topScore: Math.max(...group.matches.map((x) => x.score)),
      };
    })
    .sort((a, b) => b.topScore - a.topScore);

  res.json({ query, results });
});
