import { Router } from 'express';
import * as ctrl from '../controllers/meetingController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { loadWorkspace } from '../middleware/workspaceAccess.js';
import { loadMeeting } from '../middleware/loadMeeting.js';
import { uploadMedia } from '../middleware/upload.js';

const router = Router();
router.use(requireAuth);

// Collection routes are scoped to a workspace (via query or body).
router.get('/', loadWorkspace, ctrl.list);
router.post(
  '/',
  uploadMedia, // parses multipart first so req.body is populated
  validate(ctrl.createSchema),
  loadWorkspace,
  ctrl.create
);

// Single-meeting routes resolve the workspace from the meeting itself.
router.get('/:id', loadMeeting, ctrl.get);
router.delete('/:id', loadMeeting, ctrl.remove);
router.post('/:id/reprocess', loadMeeting, ctrl.reprocess);

router.patch('/:id/actions/:actionId', loadMeeting, ctrl.updateAction);
router.post(
  '/:id/actions/:actionId/jira',
  loadMeeting,
  validate(ctrl.jiraSchema),
  ctrl.exportActionToJira
);
router.post(
  '/:id/share/slack',
  loadMeeting,
  validate(ctrl.shareSlackSchema),
  ctrl.shareToSlack
);

export default router;
