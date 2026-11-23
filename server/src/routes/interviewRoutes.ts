import { Router } from 'express';
import { InterviewController } from '../controllers/interviewController.js';
import { authenticate } from '../middleware/auth.js';
import { requireHR } from '../middleware/rbac.js';

const router = Router();

router.get('/', authenticate, requireHR, InterviewController.listInterviews);
router.post('/', authenticate, requireHR, InterviewController.scheduleInterview);
router.put('/:id', authenticate, requireHR, InterviewController.updateInterview);

export default router;
