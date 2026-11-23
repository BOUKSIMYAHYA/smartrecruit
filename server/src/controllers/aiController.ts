import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AiMatchingService } from '../services/aiMatching.js';
import { AiAssistantService } from '../services/aiAssistant.js';
import { AuditService } from '../middleware/audit.js';

export class AiController {
  /**
   * Run or re-calculate AI matching on an application
   */
  public static async matchSingle(req: Request, res: Response): Promise<void> {
    try {
      const { applicationId } = req.params;

      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: { include: { requirements: true } },
          resume: true,
          candidateProfile: {
            include: {
              skills: { include: { skill: true } },
              experiences: true,
              education: true,
            },
          },
        },
      });

      if (!application) {
        res.status(404).json({ error: 'Candidature introuvable.' });
        return;
      }

      const reqSkills = application.job.requirements.filter((r) => r.isRequired).map((r) => r.skillName);
      const desSkills = application.job.requirements.filter((r) => !r.isRequired).map((r) => r.skillName);

      const matchResult = await AiMatchingService.matchCandidate(
        {
          jobTitle: application.job.title,
          department: application.job.department,
          requiredSkills: reqSkills,
          desiredSkills: desSkills,
          requiredExpYears: application.job.requiredExpYears,
        },
        {
          extractedText: application.resume.extractedText || '',
          skills: application.candidateProfile.skills.map((s) => s.skill.name),
          yearsOfExp: application.candidateProfile.yearsOfExp || 0,
          location: application.candidateProfile.city || undefined,
          availability: application.candidateProfile.availability || undefined,
        }
      );

      const aiMatch = await prisma.aiMatchResult.upsert({
        where: { applicationId: application.id },
        update: {
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
        create: {
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

      await AuditService.log(req, 'AI_MATCH_RERUN', 'AiMatchResult', aiMatch.id, {
        score: aiMatch.overallScore,
        category: aiMatch.category,
      });

      res.json({ aiMatchResult: aiMatch });
    } catch (error) {
      console.error('Erreur matchSingle:', error);
      res.status(500).json({ error: 'Erreur lors du calcul du matching IA.' });
    }
  }

  /**
   * Human Recruiter Validation / Override of AI recommendation
   */
  public static async humanValidation(req: Request, res: Response): Promise<void> {
    try {
      const { applicationId } = req.params;
      const { decision, notes } = req.body;
      const user = req.user!;

      if (!decision) {
        res.status(400).json({ error: 'La décision humaine est requise (ex: CONFIRMED_PRESELECTION, OVERRIDDEN_REJECTED).' });
        return;
      }

      const match = await prisma.aiMatchResult.findUnique({
        where: { applicationId },
      });

      if (!match) {
        res.status(404).json({ error: 'Résultat d\'analyse IA introuvable pour cette candidature.' });
        return;
      }

      const updated = await prisma.aiMatchResult.update({
        where: { applicationId },
        data: {
          humanValidated: true,
          humanDecision: decision,
          humanNotes: notes || null,
          humanValidatedById: user.id,
          humanValidatedAt: new Date(),
        },
        include: {
          humanValidator: { select: { firstName: true, lastName: true, email: true } },
        },
      });

      // Optionally advance application status if confirmed
      if (decision === 'CONFIRMED_PRESELECTION') {
        await prisma.application.update({
          where: { id: applicationId },
          data: {
            status: 'PRESELECTED',
            currentStage: 'Présélectionné (validé par RH)',
            statusHistory: {
              create: {
                fromStatus: 'UNDER_REVIEW',
                toStatus: 'PRESELECTED',
                reason: `Validation humaine IA par ${user.firstName || user.email}: ${notes || 'Conforme aux attentes'}`,
                changedById: user.id,
              },
            },
          },
        });
      }

      await AuditService.log(req, 'AI_HUMAN_VALIDATION', 'AiMatchResult', match.id, {
        decision,
        notes,
      });

      res.json({
        message: 'Validation humaine enregistrée avec succès dans le registre d\'audit.',
        aiMatchResult: updated,
      });
    } catch (error) {
      console.error('Erreur humanValidation:', error);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la validation humaine.' });
    }
  }

  /**
   * HR Conversational Assistant Chatbot
   */
  public static async askAssistant(req: Request, res: Response): Promise<void> {
    try {
      const { query, history } = req.body;
      const user = req.user!;

      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Requête textuelle manquante pour l\'assistant.' });
        return;
      }

      const answer = await AiAssistantService.askAssistant(query, history || [], user.id);

      await AuditService.log(req, 'AI_ASSISTANT_QUERY', 'AiAssistant', undefined, { query: query.slice(0, 150) });

      res.json({ answer });
    } catch (error) {
      console.error('Erreur askAssistant:', error);
      res.status(500).json({ error: 'Erreur lors de la réponse de l\'Assistant IA.' });
    }
  }

  /**
   * Compare 2 to 4 candidates side-by-side
   */
  public static async compareCandidates(req: Request, res: Response): Promise<void> {
    try {
      const { applicationIds } = req.body;

      if (!Array.isArray(applicationIds) || applicationIds.length < 2) {
        res.status(400).json({ error: 'Veuillez sélectionner au moins 2 candidatures à comparer.' });
        return;
      }

      if (applicationIds.length > 5) {
        res.status(400).json({ error: 'La comparaison est limitée à 5 candidatures simultanément.' });
        return;
      }

      const applications = await prisma.application.findMany({
        where: { id: { in: applicationIds } },
        include: {
          job: { select: { title: true, reference: true, requiredExpYears: true } },
          candidateProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              skills: { include: { skill: true } },
              experiences: { take: 3, orderBy: { startDate: 'desc' } },
              education: { take: 2, orderBy: { startDate: 'desc' } },
            },
          },
          aiMatchResult: true,
        },
      });

      const matrix = applications.map((app) => ({
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        candidateName: `${app.candidateProfile.user.firstName || ''} ${app.candidateProfile.user.lastName || ''}`.trim() || app.candidateProfile.user.email,
        email: app.candidateProfile.user.email,
        phone: app.candidateProfile.phone || 'Non renseigné',
        city: app.candidateProfile.city || 'France',
        yearsOfExp: app.candidateProfile.yearsOfExp || 0,
        availability: app.candidateProfile.availability || 'Immédiate',
        skills: app.candidateProfile.skills.map((s) => s.skill.name),
        aiScore: app.aiMatchResult?.overallScore ?? 0,
        aiCategory: app.aiMatchResult?.category ?? 'N/A',
        aiRecommendation: app.aiMatchResult?.recommendation ?? 'N/A',
        strengths: app.aiMatchResult?.strengths ?? [],
        pointsToVerify: app.aiMatchResult?.pointsToVerify ?? [],
        foundRequiredSkills: app.aiMatchResult?.foundRequiredSkills ?? [],
        missingRequiredSkills: app.aiMatchResult?.missingRequiredSkills ?? [],
        latestExperience: app.candidateProfile.experiences[0]?.jobTitle || 'N/A',
        highestDegree: app.candidateProfile.education[0]?.degree || 'N/A',
      }));

      res.json({ comparison: matrix });
    } catch (error) {
      console.error('Erreur compareCandidates:', error);
      res.status(500).json({ error: 'Erreur lors de la comparaison des candidats.' });
    }
  }
}
