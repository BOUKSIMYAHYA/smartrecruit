import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireHR, requireSuperAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/hr-team', authenticate, requireHR, UserController.listHrUsers);
router.put('/:id/role', authenticate, requireHR, UserController.updateUserRole);
router.put('/:id/status', authenticate, requireHR, UserController.toggleUserStatus);
router.post('/collaborators', authenticate, requireHR, UserController.assignJobCollaborator);
router.get('/audit-logs', authenticate, requireSuperAdmin, UserController.getAuditLogs);

export default router;
