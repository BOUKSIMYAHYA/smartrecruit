import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';
import { requireHR } from '../middleware/rbac.js';

const router = Router();

router.get('/kpis', authenticate, requireHR, AnalyticsController.getDashboardKpis);
router.get('/charts', authenticate, requireHR, AnalyticsController.getDashboardCharts);

export default router;
