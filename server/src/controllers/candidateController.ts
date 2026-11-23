import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { StorageService } from '../services/storageService.js';
import { PdfParserService } from '../services/pdfParser.js';
import { FileSecurity } from '../utils/fileSecurity.js';
import { ResumeType, CoverLetterType, Role } from '@prisma/client';
import { AuditService } from '../middleware/audit.js';

export class CandidateController {
  /**
   * Get candidate profile
   */
  public static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      let profile = await prisma.candidateProfile.findUnique({
        where: { userId: user.id },
        include: {
          skills: { include: { skill: true } },
          experiences: { orderBy: { startDate: 'desc' } },
          education: { orderBy: { startDate: 'desc' } },
          resumes: { orderBy: { createdAt: 'desc' } },
          coverLetters: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!profile) {
        // Auto-create if missing
        profile = await prisma.candidateProfile.create({
          data: {
            userId: user.id,
            country: 'France',
          },
          include: {
            skills: { include: { skill: true } },
            experiences: true,
            education: true,
            resumes: true,
            coverLetters: true,
          },
        });
      }

      res.json({ profile });
    } catch (error) {
      console.error('Erreur getProfile:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
    }
  }

  /**
   * Update candidate profile info
   */
  public static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const {
        firstName,
        lastName,
        phone,
        address,
        city,
        country,
        linkedInUrl,
        portfolioUrl,
        currentTitle,
        summary,
        yearsOfExp,
        availability,
        salaryExpectation,
        skills,
        experiences,
        education,
      } = req.body;

      // Update user base fields
      if (firstName !== undefined || lastName !== undefined) {
        await prisma.user.update({
          where: { id: user.id },
          data: { firstName, lastName },
        });
      }

      // Ensure profile exists
      let profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
      if (!profile) {
        profile = await prisma.candidateProfile.create({ data: { userId: user.id } });
      }

      // Transactionally update profile & nested relations
      await prisma.$transaction(async (tx) => {
        await tx.candidateProfile.update({
          where: { id: profile!.id },
          data: {
            phone,
            address,
            city,
            country,
            linkedInUrl,
            portfolioUrl,
            currentTitle,
            summary,
            yearsOfExp: yearsOfExp !== undefined ? Number(yearsOfExp) : undefined,
            availability,
            salaryExpectation,
          },
        });

        // Update skills if provided
        if (Array.isArray(skills)) {
          await tx.candidateSkill.deleteMany({ where: { profileId: profile!.id } });
          for (const s of skills) {
            const skillName = typeof s === 'string' ? s.trim() : s.name.trim();
            if (!skillName) continue;

            const skillRecord = await tx.skill.upsert({
              where: { name: skillName },
              update: {},
              create: { name: skillName },
            });

            await tx.candidateSkill.create({
              data: {
                profileId: profile!.id,
                skillId: skillRecord.id,
                level: typeof s === 'object' && s.level ? Number(s.level) : 3,
                yearsOfExp: typeof s === 'object' && s.yearsOfExp ? Number(s.yearsOfExp) : 1,
              },
            });
          }
        }

        // Update experiences if provided
        if (Array.isArray(experiences)) {
          await tx.experience.deleteMany({ where: { profileId: profile!.id } });
          for (const exp of experiences) {
            if (!exp.jobTitle || !exp.company) continue;
            await tx.experience.create({
              data: {
                profileId: profile!.id,
                jobTitle: exp.jobTitle,
                company: exp.company,
                location: exp.location,
                startDate: new Date(exp.startDate || Date.now()),
                endDate: exp.endDate ? new Date(exp.endDate) : null,
                isCurrent: Boolean(exp.isCurrent),
                description: exp.description,
              },
            });
          }
        }

        // Update education if provided
        if (Array.isArray(education)) {
          await tx.education.deleteMany({ where: { profileId: profile!.id } });
          for (const edu of education) {
            if (!edu.degree || !edu.institution) continue;
            await tx.education.create({
              data: {
                profileId: profile!.id,
                degree: edu.degree,
                fieldOfStudy: edu.fieldOfStudy,
                institution: edu.institution,
                location: edu.location,
                startDate: new Date(edu.startDate || Date.now()),
                endDate: edu.endDate ? new Date(edu.endDate) : null,
                isCurrent: Boolean(edu.isCurrent),
                description: edu.description,
              },
            });
          }
        }
      });

      const updated = await prisma.candidateProfile.findUnique({
        where: { id: profile.id },
        include: {
          skills: { include: { skill: true } },
          experiences: true,
          education: true,
        },
      });

      res.json({ message: 'Profil mis à jour avec succès.', profile: updated });
    } catch (error) {
      console.error('Erreur updateProfile:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du profil.' });
    }
  }

  /**
   * Upload resume PDF (Option 1)
   */
  public static async uploadResume(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      if (!req.file) {
        res.status(400).json({ error: 'Aucun fichier CV transmis.' });
        return;
      }

      // Ensure profile exists
      let profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
      if (!profile) {
        profile = await prisma.candidateProfile.create({ data: { userId: user.id } });
      }

      // Save securely to private disk
      const saved = await StorageService.saveResume(req.file.buffer, req.file.originalname);

      // Extract text and structured info with PDF parser
      let extractedText = '';
      let parsedSkills: string[] = [];
      try {
        const parsed = await PdfParserService.parseResume(req.file.buffer);
        extractedText = parsed.text;
        parsedSkills = parsed.extractedSkills;
      } catch (parseErr) {
        console.warn('Extraction automatique de texte partielle:', parseErr);
        extractedText = FileSecurity.sanitizeTextForAi(req.file.buffer.toString('utf-8', 0, 2000));
      }

      // Check duplicate file hash
      const existingHash = await prisma.resume.findFirst({
        where: { fileHash: saved.fileHash },
      });

      const resume = await prisma.resume.create({
        data: {
          profileId: profile.id,
          type: ResumeType.UPLOADED_PDF,
          title: req.body.title || req.file.originalname,
          fileName: saved.fileName,
          filePath: saved.filePath,
          fileSize: saved.fileSize,
          mimeType: 'application/pdf',
          fileHash: saved.fileHash,
          extractedText,
          isDefault: true,
        },
      });

      // Save extracted AI analysis log
      await prisma.aiAnalysis.create({
        data: {
          resumeId: resume.id,
          rawTextExtracted: extractedText.slice(0, 10000),
          detectedSkills: parsedSkills,
          summary: `Texte extrait avec succès (${saved.fileSize} octets).`,
        },
      });

      // Optionally enrich candidate skills in profile if candidate has none
      if (parsedSkills.length > 0) {
        for (const skillName of parsedSkills.slice(0, 10)) {
          const sRecord = await prisma.skill.upsert({
            where: { name: skillName },
            update: {},
            create: { name: skillName },
          });
          await prisma.candidateSkill.upsert({
            where: { profileId_skillId: { profileId: profile.id, skillId: sRecord.id } },
            update: {},
            create: { profileId: profile.id, skillId: sRecord.id, level: 3 },
          });
        }
      }

      await AuditService.log(req, 'RESUME_UPLOAD_PDF', 'Resume', resume.id, {
        fileName: req.file.originalname,
        fileSize: saved.fileSize,
        isDuplicate: Boolean(existingHash),
      });

      res.status(201).json({
        resume,
        extractedSkills: parsedSkills,
        isDuplicate: Boolean(existingHash),
      });
    } catch (error: any) {
      console.error('Erreur uploadResume:', error);
      res.status(500).json({ error: error.message || 'Erreur lors du traitement du fichier CV.' });
    }
  }

  /**
   * Save resume built via Internal Platform CV Builder (Option 2)
   */
  public static async savePlatformResume(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { title, contentJson } = req.body;

      if (!contentJson) {
        res.status(400).json({ error: 'Données du constructeur de CV manquantes.' });
        return;
      }

      let profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
      if (!profile) {
        profile = await prisma.candidateProfile.create({ data: { userId: user.id } });
      }

      // Build structured extracted text from CV Builder JSON
      const jsonStr = typeof contentJson === 'string' ? contentJson : JSON.stringify(contentJson);
      const parsedObj = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;

      let extractedText = `
        NOM : ${parsedObj.personalInfo?.fullName || ''}
        EMAIL : ${parsedObj.personalInfo?.email || user.email}
        TITRE : ${parsedObj.personalInfo?.title || ''}
        RÉSUMÉ : ${parsedObj.personalInfo?.summary || ''}
        COMPÉTENCES : ${(parsedObj.skills || []).map((s: any) => typeof s === 'string' ? s : s.name).join(', ')}
        EXPÉRIENCES :
        ${(parsedObj.experiences || []).map((e: any) => `- ${e.jobTitle} chez ${e.company} (${e.startDate} - ${e.endDate || 'Présent'}) : ${e.description}`).join('\n')}
        FORMATIONS :
        ${(parsedObj.education || []).map((ed: any) => `- ${ed.degree} à ${ed.institution} (${ed.startDate} - ${ed.endDate || ''})`).join('\n')}
        PROJETS :
        ${(parsedObj.projects || []).map((p: any) => `- ${p.title} : ${p.description}`).join('\n')}
      `.trim();

      extractedText = FileSecurity.sanitizeTextForAi(extractedText);

      const resume = await prisma.resume.create({
        data: {
          profileId: profile.id,
          type: ResumeType.PLATFORM_BUILDER,
          title: title || 'Mon CV SmartRecruit ATS',
          contentJson: parsedObj,
          extractedText,
          isDefault: true,
        },
      });

      await AuditService.log(req, 'RESUME_CREATE_BUILDER', 'Resume', resume.id, { title: resume.title });

      res.status(201).json({ resume });
    } catch (error) {
      console.error('Erreur savePlatformResume:', error);
      res.status(500).json({ error: 'Erreur lors de la sauvegarde du CV plateforme.' });
    }
  }

  /**
   * Generate temporary signed download token for secure file access (15 minutes expiry)
   */
  public static async getResumeDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { resumeId } = req.params;
      const user = req.user!;

      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        include: { profile: true },
      });

      if (!resume) {
        res.status(404).json({ error: 'CV introuvable.' });
        return;
      }

      // Security check: must be owner candidate OR HR team
      const isOwner = resume.profile.userId === user.id;
      const isHr = ([Role.SUPER_ADMIN, Role.HR_ADMIN, Role.HR_MANAGER, Role.OPERATIONAL_MANAGER, Role.RECRUITER] as Role[]).includes(user.role);

      if (!isOwner && !isHr) {
        res.status(403).json({ error: 'Accès refusé au document demandé.' });
        return;
      }

      if (!resume.filePath) {
        res.status(400).json({ error: 'Ce CV a été créé sur la plateforme et n\'a pas de fichier PDF binaire associé.' });
        return;
      }

      const token = FileSecurity.generateSignedDownloadToken(resume.id, resume.filePath, user.id);
      const downloadUrl = `/api/candidates/resumes/download?token=${encodeURIComponent(token)}`;

      res.json({ downloadUrl, token });
    } catch (error) {
      console.error('Erreur getResumeDownloadUrl:', error);
      res.status(500).json({ error: 'Erreur lors de la génération du lien sécurisé.' });
    }
  }

  /**
   * Stream resume securely to client
   */
  public static async downloadResume(req: Request, res: Response): Promise<void> {
    try {
      const token = (req.query.token as string) || (req.headers['x-download-token'] as string);
      if (!token) {
        res.status(401).json({ error: 'Jeton de téléchargement manquant.' });
        return;
      }

      const decoded = FileSecurity.verifySignedDownloadToken(token);
      if (!decoded) {
        res.status(401).json({ error: 'Lien de téléchargement expiré ou invalide.' });
        return;
      }

      // Verify file exists
      const resume = await prisma.resume.findUnique({ where: { id: decoded.fileId } });
      if (!resume || !resume.filePath) {
        res.status(404).json({ error: 'Fichier CV introuvable sur le stockage sécurisé.' });
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${resume.fileName || 'CV.pdf'}"`);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      const stream = StorageService.getFileStream(resume.filePath);
      stream.pipe(res);
    } catch (error) {
      console.error('Erreur downloadResume:', error);
      res.status(500).json({ error: 'Erreur lors du streaming du document.' });
    }
  }

  /**
   * Save or upload cover letter
   */
  public static async saveCoverLetter(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { title, content } = req.body;

      let profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
      if (!profile) {
        profile = await prisma.candidateProfile.create({ data: { userId: user.id } });
      }

      let filePath: string | undefined;
      let type: CoverLetterType = CoverLetterType.PLATFORM_TEXT;

      if (req.file) {
        const saved = await StorageService.saveCoverLetter(req.file.buffer, req.file.originalname);
        filePath = saved.filePath;
        type = CoverLetterType.UPLOADED_PDF;
      }

      const coverLetter = await prisma.coverLetter.create({
        data: {
          profileId: profile.id,
          type,
          title: title || 'Lettre de motivation',
          content: content ? FileSecurity.sanitizeTextForAi(content) : undefined,
          filePath,
        },
      });

      res.status(201).json({ coverLetter });
    } catch (error) {
      console.error('Erreur saveCoverLetter:', error);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la lettre de motivation.' });
    }
  }

  /**
   * Upload or update candidate profile picture
   */
  public static async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      if (!req.file) {
        res.status(400).json({ error: 'Aucun fichier image sélectionné.' });
        return;
      }

      const saved = await StorageService.saveAvatar(req.file.buffer, req.file.originalname);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: saved.url },
      });

      await AuditService.log(req, 'AVATAR_UPDATE', 'User', user.id, { avatarUrl: saved.url });

      res.json({
        success: true,
        avatarUrl: saved.url,
        message: 'Photo de profil mise à jour avec succès.',
      });
    } catch (error: any) {
      console.error('Erreur uploadAvatar:', error);
      res.status(500).json({ error: error.message || 'Erreur lors du téléchargement de la photo de profil.' });
    }
  }

  /**
   * Remove candidate profile picture
   */
  public static async deleteAvatar(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;

      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: null },
      });

      await AuditService.log(req, 'AVATAR_DELETE', 'User', user.id);

      res.json({
        success: true,
        message: 'Photo de profil supprimée.',
      });
    } catch (error: any) {
      console.error('Erreur deleteAvatar:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de la photo.' });
    }
  }
}
