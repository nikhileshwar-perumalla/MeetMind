import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { Meeting } from '../models/Meeting.js';
import { Workspace } from '../models/Workspace.js';

/**
 * Loads the meeting referenced by `:id`, verifies the current user is a member
 * of the meeting's workspace, and attaches `req.meeting` + `req.workspaceRole`.
 */
export const loadMeeting = asyncHandler(async (req, _res, next) => {
  const meeting = await Meeting.findById(req.params.id);
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const workspace = await Workspace.findById(meeting.workspace);
  const role = workspace?.roleOf(req.user._id);
  if (!role) throw ApiError.forbidden('You do not have access to this meeting');

  req.meeting = meeting;
  req.workspace = workspace;
  req.workspaceRole = role;
  next();
});
