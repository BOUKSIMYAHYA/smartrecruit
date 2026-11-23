import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { ApplicationStatus, ResumeType, Role } from '@prisma/client';
import { AiMatchingService } from '../services/aiMatching.js';
import { EmailService } from '../services/emailService.js';
import { AuditService } from '../middleware/audit.js';
import { StorageService } from '../services/storageService.js';
import { PdfParserService } from '../services/pdfParser.js';

export class ApplicationController {
  /**
   * Candidate applies for a job
   */
  public static async apply(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { jobId, resumeId, coverLetterId, coverLetterText } = req.body;

      if (!jobId) {
        res.status(400).json({ error: 'L\'identifiant de l\'offre est requis.' });
        return;
      }

      // Check job exists and is open
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { requirements: true },
      });

      if (!job || job.status !== 'PUBLISHED') {
        res.status(400).json({ error: 'Cette offre d\'emploi n\'est plus ouverte aux candidatures.' });
        return;
      }

      // Candidate profile
      let profile = await prisma.candidateProfile.findUnique({
        where: { userId: user.id },
        include: { skills: { include: { skill: true } } },
      });

      if (!profile) {
        profile = await prisma.candidateProfile.create({
          data: { userId: user.id, country: 'France' },
          include: { skills: { include: { skill: true } } },
        });
      }

      // Check if already applied to this specific job
      const existingApp = await prisma.application.findUnique({
        where: {
          jobId_candidateProfileId: {
            jobId,
            candidateProfileId: profile.id,
          },
        },
      });

      if (existingApp) {
        res.status(400).json({
          error: 'Vous avez déjà postulé à cette offre d\'emploi.',
          applicationNumber: existingApp.applicationNumber,
        });
        return;
      }

      // Resolve Resume: either provided resumeId or uploaded in current request
      let targetResumeId = resumeId;
      let resumeRecord: any = null;

      if (req.file) {
        // Uploaded in current request
        const saved = await StorageService.saveResume(req.file.buffer, req.file.originalname);
        let extractedText = '';
        try {
          const parsed = await PdfParserService.parseResume(req.file.buffer);
          extractedText = parsed.text;
        } catch {
          extractedText = req.file.buffer.toString('utf-8', 0, 3000);
        }

        resumeRecord = await prisma.resume.create({
          data: {
            profileId: profile.id,
            type: ResumeType.UPLOADED_PDF,
            title: req.file.originalname,
            fileName: saved.fileName,
            filePath: saved.filePath,
            fileSize: saved.fileSize,
            mimeType: 'application/pdf',
            fileHash: saved.fileHash,
            extractedText,
            isDefault: true,
          },
        });
        targetResumeId = resumeRecord.id;
      } else if (targetResumeId) {
        resumeRecord = await prisma.resume.findUnique({ where: { id: targetResumeId } });
      } else {
        // Try to get default resume
        resumeRecord = await prisma.resume.findFirst({
          where: { profileId: profile.id },
          orderBy: { createdAt: 'desc' },
        });
        if (resumeRecord) targetResumeId = resumeRecord.id;
      }

      if (!resumeRecord || !targetResumeId) {
        res.status(400).json({ error: 'Veuillez joindre ou sélectionner un CV pour postuler.' });
        return;
      }

      // Resolve Cover Letter
      let targetCoverLetterId = coverLetterId || null;
      let coverLetterContent = coverLetterText || null;

      if (coverLetterText && !targetCoverLetterId) {
        const cl = await prisma.coverLetter.create({
          data: {
            profileId: profile.id,
            title: `Lettre pour ${job.title}`,
            content: coverLetterText,
          },
        });
        targetCoverLetterId = cl.id;
      } else if (targetCoverLetterId) {
        const cl = await prisma.coverLetter.findUnique({ where: { id: targetCoverLetterId } });
        if (cl?.content) coverLetterContent = cl.content;
      }

      // Generate unique application number (e.g. APP-2026-7842)
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const appCount = await prisma.application.count();
      const applicationNumber = `APP-2026-${String(appCount + 1).padStart(3, '0')}${randomSuffix}`;

      // Create Application in DB
      const application = await prisma.application.create({
        data: {
          applicationNumber,
          jobId,
          candidateProfileId: profile.id,
          resumeId: targetResumeId,
          coverLetterId: targetCoverLetterId,
          status: ApplicationStatus.SUBMITTED,
          currentStage: 'Candidature reçue',
          statusHistory: {
            create: {
              toStatus: ApplicationStatus.SUBMITTED,
              reason: 'Dépôt initial de la candidature',
            },
          },
        },
        include: {
          job: true,
          candidateProfile: { include: { user: true } },
          resume: true,
        },
      });

      // 4. Trigger AI Matching Agent asynchronously
      const reqSkills = job.requirements.filter((r) => r.isRequired).map((r) => r.skillName);
      const desSkills = job.requirements.filter((r) => !r.isRequired).map((r) => r.skillName);

      try {
        const matchResult = await AiMatchingService.matchCandidate(
          {
            jobTitle: job.title,
            department: job.department,
            requiredSkills: reqSkills,
            desiredSkills: desSkills,
            requiredExpYears: job.requiredExpYears,
          },
          {
            extractedText: resumeRecord.extractedText || '',
            skills: profile.skills.map((s) => s.skill.name),
            yearsOfExp: profile.yearsOfExp || 0,
            location: profile.city || undefined,
            availability: profile.availability || undefined,
          }
        );

        await prisma.aiMatchResult.create({
          data: {
            applicationId: application.id,
            overallScore: matchResult.overallScore,
            category: matchResult.category,
            recommendation: matchResult.recommendation,
            foundRequiredSkills: matchResult.foundRequiredSkills,
            missingRequiredSkills: matchResult.missingRequiredSkills,
            foundDesiredSkills: matchResult.foundDesiredSkills,
            missingDesiredSkills: matchResult.missingDesiredSkills,
            strengths: matchResult.strengths,
            pointsToVerify: matchResult.pointsToVerify,
            justification: matchResult.justification,
          },
        });
      } catch (aiErr) {
        console.warn('AI matching generation deferred or failed:', aiErr);
      }

      // 5. Send Notification Email to HR Team (Case 1 vs Case 2)
      const candFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      EmailService.notifyHrNewApplication({
        candidateName: candFullName,
        candidateEmail: user.email,
        candidatePhone: profile.phone || undefined,
        candidateCity: profile.city || undefined,
        jobTitle: job.title,
        jobReference: job.reference,
        applicationNumber,
        yearsOfExp: profile.yearsOfExp || 0,
        skills: profile.skills.map((s) => s.skill.name),
        coverLetterContent: coverLetterContent || undefined,
        profileId: profile.id,
        resumeType: resumeRecord.type,
        resumeFilePath: resumeRecord.filePath || undefined,
        resumeFileName: resumeRecord.fileName || undefined,
      }).catch((e) => console.error('Email error HR:', e));

      // 6. Send confirmation email to candidate
      EmailService.sendCandidateConfirmation(user.email, candFullName, job.title, applicationNumber).catch((e) =>
        console.error('Email error Candidate:', e)
      );

      // In-app notification for candidate
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'NEW_APPLICATION',
          title: 'Candidature enregistrée',
          message: `Votre candidature pour le poste de ${job.title} a bien été enregistrée avec la référence ${applicationNumber}.`,
          link: '/candidate/applications',
        },
      });

      await AuditService.log(req, 'APPLICATION_SUBMIT', 'Application', application.id, {
        applicationNumber,
        jobTitle: job.title,
      });

      res.status(201).json({
        message: 'Votre candidature a été transmise avec succès !',
        application: {
          id: application.id,
          applicationNumber,
          status: application.status,
          createdAt: application.createdAt,
        },
      });
    } catch (error) {
      console.error('Erreur apply:', error);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement de votre candidature.' });
    }
  }

  /**
   * Candidate views their own applications (Protected: Candidate isolation)
   */
  public static async getMyApplications(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });

      if (!profile) {
        res.json({ applications: [] });
        return;
      }

      const applications = await prisma.application.findMany({
        where: { candidateProfileId: profile.id },
        include: {
          job: {
            select: {
              id: true,
              reference: true,
              title: true,
              department: true,
              location: true,
              contractType: true,
            },
          },
          resume: { select: { id: true, title: true, type: true, createdAt: true } },
          statusHistory: { orderBy: { createdAt: 'desc' } },
          interviews: {
            orderBy: { scheduledAt: 'asc' },
            select: { id: true, type: true, title: true, scheduledAt: true, durationMinutes: true, meetingLink: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ applications });
    } catch (error) {
      console.error('Erreur getMyApplications:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de vos candidatures.' });
    }
  }

  /**
   * Candidate withdraws application
   */
  public static async withdrawApplication(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const app = await prisma.application.findUnique({
        where: { id },
        include: { candidateProfile: true },
      });

      if (!app || app.candidateProfile.userId !== user.id) {
        res.status(404).json({ error: 'Candidature introuvable.' });
        return;
      }

      if (app.status === ApplicationStatus.WITHDRAWN) {
        res.status(400).json({ error: 'Cette candidature est déjà retirée.' });
        return;
      }

      const updated = await prisma.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.WITHDRAWN,
          currentStage: 'Candidature retirée',
          statusHistory: {
            create: {
              fromStatus: app.status,
              toStatus: ApplicationStatus.WITHDRAWN,
              reason: req.body.reason || 'Retirée à la demande du candidat',
              changedById: user.id,
            },
          },
        },
      });

      await AuditService.log(req, 'APPLICATION_WITHDRAW', 'Application', id);

      res.json({ message: 'Candidature retirée avec succès.', application: updated });
    } catch (error) {
      console.error('Erreur withdrawApplication:', error);
      res.status(500).json({ error: 'Erreur lors du retrait de la candidature.' });
    }
  }

  /**
   * HR List Applications with Multi-criteria Filtering, Sort & Pagination
   */
  public static async listHrApplications(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const {
        jobId,
        status,
        category,
        search,
        minScore,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = '1',
        limit = '25',
      } = req.query;

      const pageNum = Math.max(1, parseInt(String(page), 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
      const skip = (pageNum - 1) * limitNum;

      const whereClause: any = {};

      if (jobId) whereClause.jobId = String(jobId);
      if (status && Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
        whereClause.status = status as ApplicationStatus;
      }

      // Operational manager assignment check
      if (user.role === Role.OPERATIONAL_MANAGER) {
        whereClause.job = {
          collaborators: { some: { userId: user.id } },
        };
      }

      if (category) {
        whereClause.aiMatchResult = {
          category: String(category),
        };
      }

      if (minScore) {
        whereClause.aiMatchResult = {
          ...(whereClause.aiMatchResult || {}),
          overallScore: { gte: parseInt(String(minScore), 10) },
        };
      }

      if (search) {
        const s = String(search);
        whereClause.OR = [
          { applicationNumber: { contains: s, mode: 'insensitive' } },
          { candidateProfile: { user: { firstName: { contains: s, mode: 'insensitive' } } } },
          { candidateProfile: { user: { lastName: { contains: s, mode: 'insensitive' } } } },
          { candidateProfile: { user: { email: { contains: s, mode: 'insensitive' } } } },
          { job: { title: { contains: s, mode: 'insensitive' } } },
        ];
      }

      const [total, applications] = await Promise.all([
        prisma.application.count({ where: whereClause }),
        prisma.application.findMany({
          where: whereClause,
          include: {
            job: { select: { id: true, reference: true, title: true, department: true } },
            candidateProfile: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
                skills: { include: { skill: true } },
              },
            },
            resume: { select: { id: true, title: true, type: true, fileName: true, fileSize: true } },
            aiMatchResult: true,
            _count: { select: { recruitmentNotes: true, interviews: true } },
          },
          orderBy: { [String(sortBy)]: sortOrder === 'asc' ? 'asc' : 'desc' },
          skip,
          take: limitNum,
        }),
      ]);

      res.json({
        applications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Erreur listHrApplications:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des candidatures RH.' });
    }
  }

  /**
   * HR Kanban View: Grouped by recruitment stages
   */
  public static async getKanban(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { jobId } = req.query;

      const whereClause: any = {};
      if (jobId) whereClause.jobId = String(jobId);
      if (user.role === Role.OPERATIONAL_MANAGER) {
        whereClause.job = { collaborators: { some: { userId: user.id } } };
      }

      const applications = await prisma.application.findMany({
        where: whereClause,
        include: {
          job: { select: { title: true, reference: true } },
          candidateProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          aiMatchResult: { select: { overallScore: true, category: true, recommendation: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Group into stages
      const stages: Record<string, any[]> = {
        [ApplicationStatus.SUBMITTED]: [],
        [ApplicationStatus.UNDER_REVIEW]: [],
        [ApplicationStatus.PRESELECTED]: [],
        [ApplicationStatus.PHONE_INTERVIEW]: [],
        [ApplicationStatus.TECHNICAL_INTERVIEW]: [],
        [ApplicationStatus.HR_INTERVIEW]: [],
        [ApplicationStatus.DECISION_PENDING]: [],
        [ApplicationStatus.ACCEPTED]: [],
        [ApplicationStatus.REJECTED]: [],
      };

      for (const app of applications) {
        if (stages[app.status]) {
          stages[app.status].push(app);
        }
      }

      res.json({ kanban: stages });
    } catch (error) {
      console.error('Erreur getKanban:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du Kanban.' });
    }
  }

  /**
   * HR Get single Application dossier with complete data
   */
  public static async getApplicationDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          job: { include: { requirements: true } },
          candidateProfile: {
            include: {
              user: true,
              skills: { include: { skill: true } },
              experiences: { orderBy: { startDate: 'desc' } },
              education: { orderBy: { startDate: 'desc' } },
            },
          },
          resume: true,
          coverLetter: true,
          aiMatchResult: {
            include: { humanValidator: { select: { firstName: true, lastName: true, email: true } } },
          },
          statusHistory: { orderBy: { createdAt: 'desc' } },
          recruitmentNotes: {
            include: { author: { select: { firstName: true, lastName: true, email: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
          interviews: {
            include: { interviewer: { select: { firstName: true, lastName: true, email: true } } },
            orderBy: { scheduledAt: 'asc' },
          },
        },
      });

      if (!application) {
        res.status(404).json({ error: 'Dossier de candidature introuvable.' });
        return;
      }

      res.json({ application });
    } catch (error) {
      console.error('Erreur getApplicationDetail:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du dossier.' });
    }
  }

  /**
   * HR Update Application Status with email notification and audit
   */
  public static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason, notifyCandidate = true } = req.body;
      const user = req.user!;

      if (!Object.values(ApplicationStatus).includes(status)) {
        res.status(400).json({ error: 'Statut de candidature non valide.' });
        return;
      }

      const current = await prisma.application.findUnique({
        where: { id },
        include: {
          job: true,
          candidateProfile: { include: { user: true } },
        },
      });

      if (!current) {
        res.status(404).json({ error: 'Candidature introuvable.' });
        return;
      }

      const frenchLabels: Record<ApplicationStatus, string> = {
        SUBMITTED: 'Candidature reçue',
        UNDER_REVIEW: 'En cours d\'analyse',
        PRESELECTED: 'Présélectionné',
        PHONE_INTERVIEW: 'Entretien téléphonique',
        TECHNICAL_INTERVIEW: 'Entretien technique',
        HR_INTERVIEW: 'Entretien RH',
        DECISION_PENDING: 'En attente de décision',
        ACCEPTED: 'Candidature Acceptée',
        REJECTED: 'Candidature Non Retenue',
        WITHDRAWN: 'Candidature Retirée',
      };

      const frenchStatus = frenchLabels[status as ApplicationStatus] || status;

      const updated = await prisma.application.update({
        where: { id },
        data: {
          status,
          currentStage: frenchStatus,
          statusHistory: {
            create: {
              fromStatus: current.status,
              toStatus: status,
              reason: reason || `Statut changé par ${user.firstName || user.email}`,
              changedById: user.id,
            },
          },
        },
      });

      // Send status update notification email if opted in
      if (notifyCandidate) {
        const candName = `${current.candidateProfile.user.firstName || ''} ${current.candidateProfile.user.lastName || ''}`.trim() || 'Candidat';
        EmailService.sendStatusUpdate(
          current.candidateProfile.user.email,
          candName,
          current.job.title,
          frenchStatus,
          reason
        ).catch((e) => console.error('Email status update error:', e));

        // In-app notification
        await prisma.notification.create({
          data: {
            userId: current.candidateProfile.user.id,
            type: 'APPLICATION_STATUS_UPDATED',
            title: `Statut mis à jour : ${frenchStatus}`,
            message: `Votre candidature pour ${current.job.title} est désormais : ${frenchStatus}.`,
            link: '/candidate/applications',
          },
        });
      }

      await AuditService.log(req, 'APPLICATION_STATUS_UPDATE', 'Application', id, {
        from: current.status,
        to: status,
        reason,
      });

      res.json({ message: 'Statut mis à jour avec succès.', application: updated });
    } catch (error) {
      console.error('Erreur updateStatus:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du statut.' });
    }
  }

  /**
   * Export Applications to CSV
   */
  public static async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.query;
      const whereClause: any = {};
      if (jobId) whereClause.jobId = String(jobId);

      const applications = await prisma.application.findMany({
        where: whereClause,
        include: {
          job: { select: { title: true, reference: true } },
          candidateProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              skills: { include: { skill: true } },
            },
          },
          aiMatchResult: { select: { overallScore: true, category: true, recommendation: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const header = 'Numero_Candidature,Date,Poste,Reference,Candidat,Email,Telephone,Score_IA,Categorie_IA,Statut\n';
      const rows = applications.map((app) => {
        const name = `"${app.candidateProfile.user.firstName || ''} ${app.candidateProfile.user.lastName || ''}".trim()`;
        const email = app.candidateProfile.user.email;
        const phone = app.candidateProfile.phone || '';
        const job = `"${app.job.title}"`;
        const score = app.aiMatchResult?.overallScore ?? '';
        const cat = app.aiMatchResult?.category ?? '';
        return `${app.applicationNumber},${app.createdAt.toISOString().slice(0, 10)},${job},${app.job.reference},${name},${email},${phone},${score},${cat},${app.status}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="smartrecruit_candidatures.csv"');
      res.send('\uFEFF' + header + rows);
    } catch (error) {
      console.error('Erreur exportCsv:', error);
      res.status(500).json({ error: 'Erreur lors de l\'export CSV.' });
    }
  }

  /**
   * Duplicate Candidate & CV Detection
   */
  public static async detectDuplicates(req: Request, res: Response): Promise<void> {
    try {
      // Find candidate profiles with identical email or phone
      const duplicatesByEmail = await prisma.$queryRaw<any[]>`
        SELECT email, COUNT(*) as count
        FROM users
        GROUP BY email
        HAVING COUNT(*) > 1
      `;

      // Find identical CV file hashes
      const duplicatesByHash = await prisma.$queryRaw<any[]>`
        SELECT "fileHash", COUNT(*) as count
        FROM resumes
        WHERE "fileHash" IS NOT NULL
        GROUP BY "fileHash"
        HAVING COUNT(*) > 1
      `;

      res.json({
        duplicatesByEmail,
        duplicatesByHash,
        hasDuplicates: duplicatesByEmail.length > 0 || duplicatesByHash.length > 0,
      });
    } catch (error) {
      console.error('Erreur detectDuplicates:', error);
      res.status(500).json({ error: 'Erreur lors de la détection des doublons.' });
    }
  }

  /**
   * Batch upload multiple CV files and run AI matching against a specific job
   */
  public static async batchUploadAndAnalyze(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const { jobId } = req.body;

      if (!files || files.length === 0) {
        res.status(400).json({ error: 'Aucun fichier transmis pour le traitement par lot.' });
        return;
      }

      if (!jobId) {
        res.status(400).json({ error: 'Identifiant du poste cible manquant.' });
        return;
      }

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { requirements: true },
      });

      if (!job) {
        res.status(404).json({ error: 'Poste cible introuvable.' });
        return;
      }

      const results: any[] = [];
      const reqSkills = job.requirements.filter((r) => r.isRequired).map((r) => r.skillName);
      const desSkills = job.requirements.filter((r) => !r.isRequired).map((r) => r.skillName);

      for (const file of files) {
        try {
          const saved = await StorageService.saveResume(file.buffer, file.originalname);
          const parsed = await PdfParserService.parseResume(file.buffer);

          // Infer a dummy candidate email from file name if none
          const cleanName = file.originalname.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_\s-]/g, '');
          const pseudoEmail = `candidat_${Date.now()}_${Math.floor(Math.random() * 1000)}@smartrecruit.temp`;

          // Create temporary candidate & profile
          const user = await prisma.user.create({
            data: {
              email: pseudoEmail,
              clerkId: `batch_${Date.now()}_${Math.random()}`,
              firstName: cleanName.split(/[\s_-]+/)[0] || 'Candidat',
              lastName: cleanName.split(/[\s_-]+/)[1] || 'Import Lot',
              role: Role.CANDIDATE,
              candidateProfile: {
                create: {
                  country: 'France',
                  summary: 'Importé par lot CV',
                },
              },
            },
            include: { candidateProfile: true },
          });

          const resume = await prisma.resume.create({
            data: {
              profileId: user.candidateProfile!.id,
              type: ResumeType.UPLOADED_PDF,
              title: file.originalname,
              fileName: saved.fileName,
              filePath: saved.filePath,
              fileSize: saved.fileSize,
              fileHash: saved.fileHash,
              extractedText: parsed.text,
            },
          });

          // Run AI matching
          const matchResult = await AiMatchingService.matchCandidate(
            {
              jobTitle: job.title,
              department: job.department,
              requiredSkills: reqSkills,
              desiredSkills: desSkills,
              requiredExpYears: job.requiredExpYears,
            },
            {
              extractedText: parsed.text,
              skills: parsed.extractedSkills,
              yearsOfExp: 2,
            }
          );

          // Create application
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const applicationNumber = `APP-BATCH-${randomSuffix}`;

          const application = await prisma.application.create({
            data: {
              applicationNumber,
              jobId: job.id,
              candidateProfileId: user.candidateProfile!.id,
              resumeId: resume.id,
              status: ApplicationStatus.SUBMITTED,
              currentStage: 'Importé par lot',
              aiMatchResult: {
                create: {
                  overallScore: matchResult.overallScore,
                  category: matchResult.category,
                  recommendation: matchResult.recommendation,
                  foundRequiredSkills: matchResult.foundRequiredSkills,
                  missingRequiredSkills: matchResult.missingRequiredSkills,
                  foundDesiredSkills: matchResult.foundDesiredSkills,
                  missingDesiredSkills: matchResult.missingDesiredSkills,
                  strengths: matchResult.strengths,
                  pointsToVerify: matchResult.pointsToVerify,
                  justification: matchResult.justification,
                },
              },
            },
            include: { aiMatchResult: true },
          });

          results.push({
            fileName: file.originalname,
            applicationNumber,
            score: matchResult.overallScore,
            category: matchResult.category,
            recommendation: matchResult.recommendation,
            success: true,
          });
        } catch (fileErr: any) {
          results.push({
            fileName: file.originalname,
            success: false,
            error: fileErr.message || 'Erreur lors du traitement',
          });
        }
      }

      await AuditService.log(req, 'BATCH_CV_UPLOAD', 'Job', jobId, { count: files.length });

      res.json({
        message: `${results.filter((r) => r.success).length}/${files.length} CV(s) importés et analysés par l'agent IA avec succès.`,
        results,
      });
    } catch (error) {
      console.error('Erreur batchUploadAndAnalyze:', error);
      res.status(500).json({ error: 'Erreur lors du traitement par lot des CV.' });
    }
  }
}
