import { Router } from 'express';
import { JobController } from '../controllers/jobController.js';
import { authenticate } from '../middleware/auth.js';
import { requireHR } from '../middleware/rbac.js';

const router = Router();

// Public / Candidate routes
router.get('/public', JobController.listPublicJobs);
router.get('/public/:idOrSlug', JobController.getJob);

// HR Protected routes
router.get('/hr', authenticate, requireHR, JobController.listHrJobs);
router.post('/hr', authenticate, requireHR, JobController.createJob);
router.put('/hr/:id', authenticate, requireHR, JobController.updateJob);
router.delete('/hr/:id', authenticate, requireHR, JobController.deleteJob);

export default router;
