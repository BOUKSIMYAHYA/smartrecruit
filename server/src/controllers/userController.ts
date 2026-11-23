import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';
import { ENV } from '../config/env.js';
import { AuditService } from '../middleware/audit.js';

export class UserController {
  /**
   * List all HR / Admin team members
   */
  public static async listHrUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: {
            in: [
              Role.SUPER_ADMIN,
              Role.HR_ADMIN,
              Role.HR_MANAGER,
              Role.OPERATIONAL_MANAGER,
              Role.RECRUITER,
            ],
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          assignedJobs: {
            include: { job: { select: { id: true, title: true, reference: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json({ users });
    } catch (error) {
      console.error('Erreur listHrUsers:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs RH.' });
    }
  }

  /**
   * Update User Role (Strictly protected: Super Admins immutable, only SUPER_ADMIN or HR_ADMIN can execute)
   */
  public static async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const currentUser = req.user!;

      if (!Object.values(Role).includes(role)) {
        res.status(400).json({ error: 'Rôle spécifié invalide.' });
        return;
      }

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser) {
        res.status(404).json({ error: 'Utilisateur cible introuvable.' });
        return;
      }

      // Security Check: Target cannot be an initial Super Admin if role is changing from SUPER_ADMIN
      if (ENV.SUPER_ADMIN_EMAILS.includes(targetUser.email.toLowerCase()) && role !== Role.SUPER_ADMIN) {
        res.status(403).json({
          error: 'Action interdite : les Super Administrateurs initiaux ne peuvent être rétrogradés.',
        });
        return;
      }

      // Only SUPER_ADMIN can assign SUPER_ADMIN role
      if (role === Role.SUPER_ADMIN && currentUser.role !== Role.SUPER_ADMIN) {
        res.status(403).json({
          error: 'Seul un Super Administrateur peut attribuer le rôle SUPER_ADMIN.',
        });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
      });

      await AuditService.log(req, 'USER_ROLE_UPDATE', 'User', id, {
        targetEmail: targetUser.email,
        fromRole: targetUser.role,
        toRole: role,
      });

      res.json({ message: 'Rôle mis à jour avec succès.', user: updated });
    } catch (error) {
      console.error('Erreur updateUserRole:', error);
      res.status(500).json({ error: 'Erreur lors de la modification du rôle.' });
    }
  }

  /**
   * Toggle user active status
   */
  public static async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const targetUser = await prisma.user.findUnique({ where: { id } });

      if (!targetUser) {
        res.status(404).json({ error: 'Utilisateur introuvable.' });
        return;
      }

      if (ENV.SUPER_ADMIN_EMAILS.includes(targetUser.email.toLowerCase())) {
        res.status(403).json({ error: 'Action interdite : les Super Administrateurs ne peuvent être désactivés.' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !targetUser.isActive },
      });

      await AuditService.log(req, 'USER_STATUS_TOGGLE', 'User', id, { isActive: updated.isActive });

      res.json({
        message: `Compte ${updated.isActive ? 'activé' : 'désactivé'} avec succès.`,
        user: updated,
      });
    } catch (error) {
      console.error('Erreur toggleUserStatus:', error);
      res.status(500).json({ error: 'Erreur lors du changement de statut.' });
    }
  }

  /**
   * Assign Operational Manager to a Job
   */
  public static async assignJobCollaborator(req: Request, res: Response): Promise<void> {
    try {
      const { jobId, userId } = req.body;

      const assignment = await prisma.jobCollaborator.upsert({
        where: {
          jobId_userId: { jobId, userId },
        },
        update: {},
        create: { jobId, userId },
        include: {
          job: { select: { title: true } },
          user: { select: { email: true, firstName: true } },
        },
      });

      await AuditService.log(req, 'JOB_COLLABORATOR_ASSIGN', 'JobCollaborator', undefined, { jobId, userId });

      res.json({ message: 'Responsable assigné au poste avec succès.', assignment });
    } catch (error) {
      console.error('Erreur assignJobCollaborator:', error);
      res.status(500).json({ error: 'Erreur lors de l\'assignation du responsable.' });
    }
  }

  /**
   * Fetch Audit Logs
   */
  public static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '50', action } = req.query;
      const whereClause: any = {};
      if (action) whereClause.action = String(action);

      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(String(limit), 10),
      });

      res.json({ logs });
    } catch (error) {
      console.error('Erreur getAuditLogs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des logs d\'audit.' });
    }
  }
}
