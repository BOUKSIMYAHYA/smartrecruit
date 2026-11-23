import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export class NotificationController {
  /**
   * Get all notifications for the authenticated user
   */
  public static async getMyNotifications(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: user.id, isRead: false },
      });

      res.json({ notifications, unreadCount });
    } catch (error) {
      console.error('Erreur getMyNotifications:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des notifications.' });
    }
  }

  /**
   * Mark a single notification as read
   */
  public static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      await prisma.notification.updateMany({
        where: { id, userId: user.id },
        data: { isRead: true },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Erreur markAsRead:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification.' });
    }
  }

  /**
   * Mark all notifications as read for current user
   */
  public static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;

      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Erreur markAllAsRead:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des notifications.' });
    }
  }
}
