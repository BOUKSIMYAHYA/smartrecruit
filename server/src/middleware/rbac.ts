import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export const HR_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.HR_ADMIN,
  Role.HR_MANAGER,
  Role.OPERATIONAL_MANAGER,
  Role.RECRUITER,
];

/**
 * Check if the user has one of the allowed roles
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Accès non autorisé : authentification requise.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Accès refusé : votre rôle (${req.user.role}) ne dispose pas des privilèges nécessaires pour cette opération.`,
      });
      return;
    }

    next();
  };
}

/**
 * Require any HR-related role (SUPER_ADMIN, HR_ADMIN, HR_MANAGER, OPERATIONAL_MANAGER, RECRUITER)
 */
export const requireHR = requireRole(HR_ROLES);

/**
 * Require SUPER_ADMIN role strictly
 */
export const requireSuperAdmin = requireRole([Role.SUPER_ADMIN]);

/**
 * Require CANDIDATE role strictly
 */
export const requireCandidate = requireRole([Role.CANDIDATE]);

/**
 * For OPERATIONAL_MANAGER: check if they have access to the specific job
 */
export async function checkJobAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Accès non autorisé.' });
    return;
  }

  // Super Admin, HR Admin and HR Manager have global access
  if (
    req.user.role === Role.SUPER_ADMIN ||
    req.user.role === Role.HR_ADMIN ||
    req.user.role === Role.HR_MANAGER
  ) {
    return next();
  }

  // Operational manager must be assigned as collaborator on the job
  if (req.user.role === Role.OPERATIONAL_MANAGER) {
    const jobId = req.params.jobId || req.body.jobId;
    if (!jobId) {
      res.status(400).json({ error: 'Identifiant d\'offre requis pour vérifier les autorisations.' });
      return;
    }

    const assignment = await prisma.jobCollaborator.findUnique({
      where: {
        jobId_userId: {
          jobId,
          userId: req.user.id,
        },
      },
    });

    if (!assignment) {
      res.status(403).json({
        error: 'Accès refusé : vous n\'êtes pas assigné comme responsable opérationnel sur ce poste.',
      });
      return;
    }
  }

  next();
}
