import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireHR, requireCandidate } from '../middleware/rbac.js';
import { upload, uploadBatch } from '../middleware/upload.js';

const router = Router();

// Candidate endpoints
router.post('/apply', authenticate, upload.single('resumeFile'), ApplicationController.apply);
router.get('/my-applications', authenticate, requireCandidate, ApplicationController.getMyApplications);
router.put('/:id/withdraw', authenticate, requireCandidate, ApplicationController.withdrawApplication);

// HR endpoints
router.get('/hr/all', authenticate, requireHR, ApplicationController.listHrApplications);
router.get('/hr/kanban', authenticate, requireHR, ApplicationController.getKanban);
router.get('/hr/export/csv', authenticate, requireHR, ApplicationController.exportCsv);
router.get('/hr/duplicates', authenticate, requireHR, ApplicationController.detectDuplicates);
router.get('/hr/:id', authenticate, requireHR, ApplicationController.getApplicationDetail);
router.put('/hr/:id/status', authenticate, requireHR, ApplicationController.updateStatus);
router.post('/hr/batch-upload', authenticate, requireHR, uploadBatch.array('files', 10), ApplicationController.batchUploadAndAnalyze);

export default router;
