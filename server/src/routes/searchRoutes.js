import { Router } from 'express';
import { search, searchSchema } from '../controllers/searchController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { loadWorkspace } from '../middleware/workspaceAccess.js';

const router = Router();

router.post('/', requireAuth, validate(searchSchema), loadWorkspace, search);

export default router;
