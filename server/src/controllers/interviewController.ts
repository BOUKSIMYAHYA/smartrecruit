import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { InterviewType, InterviewStatus } from '@prisma/client';
import { EmailService } from '../services/emailService.js';
import { AuditService } from '../middleware/audit.js';

export class InterviewController {
  /**
   * Schedule an interview for an application
   */
  public static async scheduleInterview(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const {
        applicationId,
        type = InterviewType.PHONE,
        title,
        scheduledAt,
        durationMinutes = 45,
        meetingLink,
        location,
      } = req.body;

      if (!applicationId || !scheduledAt) {
        res.status(400).json({ error: 'Candidature et date d\'entretien requises.' });
        return;
      }

      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: true,
          candidateProfile: { include: { user: true } },
        },
      });

      if (!application) {
        res.status(404).json({ error: 'Candidature introuvable.' });
        return;
      }

      const interview = await prisma.interview.create({
        data: {
          applicationId,
          interviewerId: user.id,
          type: type as InterviewType,
          title: title || `Entretien ${type} - ${application.job.title}`,
          scheduledAt: new Date(scheduledAt),
          durationMinutes: Number(durationMinutes),
          meetingLink,
          location,
          status: InterviewStatus.SCHEDULED,
        },
        include: {
          interviewer: { select: { firstName: true, lastName: true, email: true } },
        },
      });

      // Update application stage accordingly
      let nextStatus = application.status;
      if (type === InterviewType.PHONE) nextStatus = 'PHONE_INTERVIEW';
      else if (type === InterviewType.TECHNICAL) nextStatus = 'TECHNICAL_INTERVIEW';
      else if (type === InterviewType.HR || type === InterviewType.FINAL) nextStatus = 'HR_INTERVIEW';

      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: nextStatus,
          currentStage: `Entretien programmé (${type})`,
        },
      });

      // Send email notification to candidate
      const candUser = application.candidateProfile.user;
      const candName = `${candUser.firstName || ''} ${candUser.lastName || ''}`.trim() || candUser.email;
      EmailService.sendInterviewNotification(
        candUser.email,
        candName,
        application.job.title,
        interview.title,
        new Date(scheduledAt),
        meetingLink
      ).catch((e) => console.error('Email error interview:', e));

      // In-app notification
      await prisma.notification.create({
        data: {
          userId: candUser.id,
          type: 'INTERVIEW_SCHEDULED',
          title: 'Nouvel entretien programmé',
          message: `Un entretien (${interview.title}) a été planifié le ${new Date(scheduledAt).toLocaleDateString('fr-FR')}.`,
          link: '/candidate/applications',
        },
      });

      await AuditService.log(req, 'INTERVIEW_SCHEDULE', 'Interview', interview.id, {
        applicationId,
        scheduledAt,
      });

      res.status(201).json({ interview });
    } catch (error) {
      console.error('Erreur scheduleInterview:', error);
      res.status(500).json({ error: 'Erreur lors de la programmation de l\'entretien.' });
    }
  }

  /**
   * List interviews for calendar view
   */
  public static async listInterviews(req: Request, res: Response): Promise<void> {
    try {
      const { status, month, year } = req.query;
      const whereClause: any = {};

      if (status && Object.values(InterviewStatus).includes(status as InterviewStatus)) {
        whereClause.status = status as InterviewStatus;
      }

      if (month && year) {
        const m = parseInt(String(month), 10);
        const y = parseInt(String(year), 10);
        whereClause.scheduledAt = {
          gte: new Date(y, m - 1, 1),
          lt: new Date(y, m, 1),
        };
      }

      const interviews = await prisma.interview.findMany({
        where: whereClause,
        include: {
          interviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
          application: {
            include: {
              job: { select: { id: true, title: true, reference: true } },
              candidateProfile: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
      });

      res.json({ interviews });
    } catch (error) {
      console.error('Erreur listInterviews:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des entretiens.' });
    }
  }

  /**
   * Update or reschedule interview
   */
  public static async updateInterview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, scheduledAt, meetingLink, feedback, rating } = req.body;

      const updated = await prisma.interview.update({
        where: { id },
        data: {
          status,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          meetingLink,
          feedback,
          rating: rating !== undefined ? Number(rating) : undefined,
        },
        include: {
          application: {
            include: {
              job: true,
              candidateProfile: { include: { user: true } },
            },
          },
        },
      });

      if (status === InterviewStatus.RESCHEDULED && scheduledAt) {
        const candUser = updated.application.candidateProfile.user;
        const candName = `${candUser.firstName || ''} ${candUser.lastName || ''}`.trim() || candUser.email;
        EmailService.sendInterviewNotification(
          candUser.email,
          candName,
          updated.application.job.title,
          `Report d'entretien : ${updated.title}`,
          new Date(scheduledAt),
          meetingLink
        ).catch(() => {});
      }

      await AuditService.log(req, 'INTERVIEW_UPDATE', 'Interview', id, { status, scheduledAt });

      res.json({ interview: updated });
    } catch (error) {
      console.error('Erreur updateInterview:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'entretien.' });
    }
  }
}
