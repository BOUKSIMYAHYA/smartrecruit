import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuditService } from '../middleware/audit.js';

export class TalentPoolController {
  /**
   * List candidates currently in the Talent Pool
   */
  public static async listTalentPool(req: Request, res: Response): Promise<void> {
    try {
      const { search, skill } = req.query;
      const whereClause: any = {
        inTalentPool: true,
      };

      if (search) {
        whereClause.user = {
          OR: [
            { firstName: { contains: String(search), mode: 'insensitive' } },
            { lastName: { contains: String(search), mode: 'insensitive' } },
            { email: { contains: String(search), mode: 'insensitive' } },
          ],
        };
      }

      if (skill) {
        whereClause.skills = {
          some: { skill: { name: { contains: String(skill), mode: 'insensitive' } } },
        };
      }

      const profiles = await prisma.candidateProfile.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          skills: { include: { skill: true } },
          experiences: { orderBy: { startDate: 'desc' }, take: 2 },
          resumes: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      res.json({ talentPool: profiles });
    } catch (error) {
      console.error('Erreur listTalentPool:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du vivier de talents.' });
    }
  }

  /**
   * Toggle candidate in/out of the Talent Pool
   */
  public static async toggleTalentPool(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const { notes } = req.body;

      const profile = await prisma.candidateProfile.findUnique({ where: { id: profileId } });
      if (!profile) {
        res.status(404).json({ error: 'Profil candidat introuvable.' });
        return;
      }

      const updated = await prisma.candidateProfile.update({
        where: { id: profileId },
        data: {
          inTalentPool: !profile.inTalentPool,
          talentPoolNotes: notes !== undefined ? notes : profile.talentPoolNotes,
        },
      });

      await AuditService.log(req, 'TALENT_POOL_TOGGLE', 'CandidateProfile', profileId, {
        inTalentPool: updated.inTalentPool,
      });

      res.json({
        message: updated.inTalentPool
          ? 'Candidat ajouté au vivier de talents.'
          : 'Candidat retiré du vivier de talents.',
        profile: updated,
      });
    } catch (error) {
      console.error('Erreur toggleTalentPool:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du vivier de talents.' });
    }
  }

  /**
   * Toggle Recruiter Favorite on candidate
   */
  public static async toggleFavorite(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const user = req.user!;

      const existing = await prisma.recruiterFavorite.findUnique({
        where: {
          userId_profileId: {
            userId: user.id,
            profileId,
          },
        },
      });

      if (existing) {
        await prisma.recruiterFavorite.delete({ where: { id: existing.id } });
        res.json({ isFavorite: false, message: 'Retiré des favoris.' });
      } else {
        await prisma.recruiterFavorite.create({
          data: { userId: user.id, profileId },
        });
        res.json({ isFavorite: true, message: 'Ajouté aux favoris.' });
      }
    } catch (error) {
      console.error('Erreur toggleFavorite:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des favoris.' });
    }
  }

  /**
   * Add internal recruiter note to application
   */
  public static async addNote(req: Request, res: Response): Promise<void> {
    try {
      const { applicationId } = req.params;
      const { content, isPrivate = false } = req.body;
      const user = req.user!;

      if (!content || !content.trim()) {
        res.status(400).json({ error: 'Le contenu de la note ne peut pas être vide.' });
        return;
      }

      const note = await prisma.recruitmentNote.create({
        data: {
          applicationId,
          authorId: user.id,
          content: content.trim(),
          isPrivate: Boolean(isPrivate),
        },
        include: {
          author: { select: { firstName: true, lastName: true, email: true, role: true } },
        },
      });

      await AuditService.log(req, 'NOTE_CREATE', 'RecruitmentNote', note.id, { applicationId });

      res.status(201).json({ note });
    } catch (error) {
      console.error('Erreur addNote:', error);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la note.' });
    }
  }
}
