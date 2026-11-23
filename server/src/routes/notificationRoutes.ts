import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, NotificationController.getMyNotifications);
router.put('/:id/read', authenticate, NotificationController.markAsRead);
router.put('/read-all', authenticate, NotificationController.markAllAsRead);

export default router;
