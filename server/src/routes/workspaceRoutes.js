import { Router } from 'express';
import * as ctrl from '../controllers/workspaceController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { loadWorkspace, requireRole } from '../middleware/workspaceAccess.js';

const router = Router();

router.use(requireAuth);

router.get('/', ctrl.list);
router.post('/', validate(ctrl.createSchema), ctrl.create);

// Routes below operate on a specific workspace.
router.get('/:workspaceId', loadWorkspace, ctrl.get);

router.post(
  '/:workspaceId/members',
  loadWorkspace,
  requireRole('admin'),
  validate(ctrl.addMemberSchema),
  ctrl.addMember
);

router.delete(
  '/:workspaceId/members/:userId',
  loadWorkspace,
  requireRole('admin'),
  ctrl.removeMember
);

export default router;
