import { Request } from 'express';
import { prisma } from '../config/prisma.js';

export class AuditService {
  public static async log(
    req: Request | null,
    action: string,
    targetType: string,
    targetId?: string,
    details?: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: req?.user?.id || null,
          action,
          targetType,
          targetId: targetId || null,
          details: details ? details : undefined,
          ipAddress: req?.ip || req?.socket?.remoteAddress || null,
          userAgent: req?.headers['user-agent'] || null,
        },
      });
    } catch (e) {
      console.error('AuditLog write error:', e);
    }
  }
}
