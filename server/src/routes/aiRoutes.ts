import { Router } from 'express';
import { AiController } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import { requireHR } from '../middleware/rbac.js';

const router = Router();

router.post('/match/:applicationId', authenticate, requireHR, AiController.matchSingle);
router.post('/validate/:applicationId', authenticate, requireHR, AiController.humanValidation);
router.post('/assistant', authenticate, requireHR, AiController.askAssistant);
router.post('/compare', authenticate, requireHR, AiController.compareCandidates);

export default router;
