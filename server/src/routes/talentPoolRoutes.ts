import { Router } from 'express';
import { TalentPoolController } from '../controllers/talentPoolController.js';
import { authenticate } from '../middleware/auth.js';
import { requireHR } from '../middleware/rbac.js';

const router = Router();

router.get('/', authenticate, requireHR, TalentPoolController.listTalentPool);
router.put('/:profileId/toggle', authenticate, requireHR, TalentPoolController.toggleTalentPool);
router.post('/:profileId/favorite', authenticate, requireHR, TalentPoolController.toggleFavorite);
router.post('/notes/:applicationId', authenticate, requireHR, TalentPoolController.addNote);

export default router;
