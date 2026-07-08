import { z } from 'zod';
import { asyncHandler } from '../utils/ApiError.js';
import {
  createWorkspace,
  listUserWorkspaces,
  addMemberByEmail,
} from '../services/workspaceService.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../models/Workspace.js';

export const createSchema = z.object({ name: z.string().min(1).max(120) });
export const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

export const list = asyncHandler(async (req, res) => {
  const workspaces = await listUserWorkspaces(req.user._id);
  res.json({ workspaces });
});

export const create = asyncHandler(async (req, res) => {
  const workspace = await createWorkspace(req.user, req.body.name);
  res.status(201).json({ workspace });
});

export const get = asyncHandler(async (req, res) => {
  await req.workspace.populate('members.user', 'name email avatarUrl');
  res.json({ workspace: req.workspace, role: req.workspaceRole });
});

export const addMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { workspace, error } = await addMemberByEmail(req.workspace, email, role);
  if (error) throw ApiError.badRequest(error);
  await workspace.populate('members.user', 'name email avatarUrl');
  res.status(201).json({ workspace });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (String(req.workspace.owner) === userId) {
    throw ApiError.badRequest('The workspace owner cannot be removed');
  }
  req.workspace.members = req.workspace.members.filter(
    (m) => String(m.user) !== userId
  );
  await req.workspace.save();
  res.json({ workspace: req.workspace });
});

export { ROLES };
