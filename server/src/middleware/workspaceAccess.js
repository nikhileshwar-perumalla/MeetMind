import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { Workspace, ROLE_RANK } from '../models/Workspace.js';

/**
 * Loads the workspace referenced by `:workspaceId` (param) or `workspaceId`
 * (body/query) and verifies the current user is a member. Attaches
 * `req.workspace` and `req.workspaceRole`.
 */
export const loadWorkspace = asyncHandler(async (req, _res, next) => {
  const workspaceId =
    req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;
  if (!workspaceId) throw ApiError.badRequest('workspaceId is required');

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const role = workspace.roleOf(req.user._id);
  if (!role) throw ApiError.forbidden('You are not a member of this workspace');

  req.workspace = workspace;
  req.workspaceRole = role;
  next();
});

/**
 * RBAC guard — requires the current user's workspace role to meet or exceed the
 * given minimum. Must run after `loadWorkspace`.
 * @param {'owner'|'admin'|'member'} minRole
 */
export const requireRole = (minRole) => (req, _res, next) => {
  const rank = ROLE_RANK[req.workspaceRole] || 0;
  if (rank < ROLE_RANK[minRole]) {
    return next(ApiError.forbidden(`Requires ${minRole} role or higher`));
  }
  next();
};
