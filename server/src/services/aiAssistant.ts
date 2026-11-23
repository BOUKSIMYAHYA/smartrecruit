import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class AiAssistantService {
  private static geminiClient = ENV.GEMINI_API_KEY
    ? new GoogleGenerativeAI(ENV.GEMINI_API_KEY)
    : null;

  /**
   * Answer natural language queries about candidates, applications and jobs
   */
  public static async askAssistant(
    userQuery: string,
    history: ChatMessage[] = [],
    userId?: string
  ): Promise<string> {
    // 1. Fetch live snapshot from PostgreSQL
    const [jobs, applications, talentPoolCount] = await Promise.all([
      prisma.job.findMany({
        select: {
          id: true,
          title: true,
          reference: true,
          department: true,
          location: true,
          contractType: true,
          status: true,
          requiredExpYears: true,
          requirements: {
            select: { skillName: true, isRequired: true },
          },
          _count: { select: { applications: true } },
        },
        take: 20,
      }),
      prisma.application.findMany({
        select: {
          id: true,
          applicationNumber: true,
          status: true,
          createdAt: true,
          job: {
            select: { title: true, reference: true },
          },
          candidateProfile: {
            select: {
              yearsOfExp: true,
              city: true,
              availability: true,
              inTalentPool: true,
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
              skills: {
                select: { skill: { select: { name: true } }, level: true },
              },
            },
          },
          aiMatchResult: {
            select: {
              overallScore: true,
              category: true,
              recommendation: true,
              justification: true,
              foundRequiredSkills: true,
              missingRequiredSkills: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.candidateProfile.count({ where: { inTalentPool: true } }),
    ]);

    // Format context summary for LLM
    const contextData = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === 'PUBLISHED').map((j) => ({
        ref: j.reference,
        title: j.title,
        dept: j.department,
        candidatures: j._count.applications,
        skills: j.requirements.map((r) => `${r.skillName}${r.isRequired ? '*' : ''}`),
      })),
      totalApplications: applications.length,
      candidatesSummary: applications.map((app) => ({
        appNum: app.applicationNumber,
        candidateName: `${app.candidateProfile.user.firstName || ''} ${app.candidateProfile.user.lastName || ''}`.trim() || app.candidateProfile.user.email,
        email: app.candidateProfile.user.email,
        jobApplied: app.job.title,
        jobRef: app.job.reference,
        status: app.status,
        expYears: app.candidateProfile.yearsOfExp || 0,
        skills: app.candidateProfile.skills.map((s) => s.skill.name),
        aiScore: app.aiMatchResult ? `${app.aiMatchResult.overallScore}% (${app.aiMatchResult.category})` : 'Non calculé',
        aiRec: app.aiMatchResult?.recommendation || 'N/A',
        inTalentPool: app.candidateProfile.inTalentPool,
      })),
      talentPoolCount,
    };

    // If Gemini API is available, invoke it
    if (this.geminiClient && ENV.GEMINI_API_KEY) {
      try {
        const model = this.geminiClient.getGenerativeModel({
          model: ENV.AI_MODEL || 'gemini-1.5-flash',
          systemInstruction: `Tu es l'Assistant IA RH intelligent de SMARTRECRUIT ATS.
Tu as accès aux données réelles de la base de données PostgreSQL de l'entreprise.
Règles :
1. Réponds toujours en français de façon synthétique, professionnelle et structurée (puces, gras).
2. Base-toi EXCLUSIVEMENT sur les données fournies dans le contexte. N'invente pas de candidats fictifs.
3. Si un recruteur demande de trouver des profils avec des compétences (ex: React, PostgreSQL), filtre la liste et cite précisément les noms, e-mails, scores IA et années d'expérience.
4. Si le recruteur demande une comparaison, crée un comparatif clair (points forts, lacunes, recommandation).
5. Rappelle courtoisement que les recommandations IA nécessitent toujours une validation humaine finale.`,
        });

        const prompt = `Voici l'état actuel de la base de données SmartRecruit ATS :
${JSON.stringify(contextData, null, 2)}

Question du recruteur RH :
"${userQuery}"`;

        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        console.warn('Gemini chat error, fallback to smart structured responder:', err);
      }
    }

    // Built-in intelligent structured fallback responder
    return this.fallbackAssistantResponse(userQuery, contextData);
  }

  /**
   * Deterministic NLP responder when Gemini is not configured or offline
   */
  private static fallbackAssistantResponse(query: string, data: any): string {
    const q = query.toLowerCase();

    // 1. Skill lookup query (e.g., "Trouve-moi les candidats qui maîtrisent React...")
    if (q.includes('react') || q.includes('postgres') || q.includes('node') || q.includes('compétence') || q.includes('maîtris')) {
      const targetSkills: string[] = [];
      if (q.includes('react')) targetSkills.push('React');
      if (q.includes('postgres')) targetSkills.push('PostgreSQL');
      if (q.includes('node')) targetSkills.push('Node.js');
      if (q.includes('typescript')) targetSkills.push('TypeScript');
      if (q.includes('python')) targetSkills.push('Python');
      if (q.includes('docker')) targetSkills.push('Docker');

      const matchingCandidates = data.candidatesSummary.filter((c: any) =>
        targetSkills.length === 0 ||
        targetSkills.some((ts) => c.skills.some((s: string) => s.toLowerCase().includes(ts.toLowerCase())))
      );

      if (matchingCandidates.length === 0) {
        return `**Recherche par compétences :** Aucun candidat actuellement enregistré ne correspond exactement à vos critères (${targetSkills.join(', ')}). Consultez les autres offres ou le Vivier de Talents.`;
      }

      let resp = `**Candidats trouvés pour les compétences recherchées (${targetSkills.join(', ') || 'techniques'}) :**\n\n`;
      for (const cand of matchingCandidates) {
        resp += `• **${cand.candidateName}** (${cand.email})\n`;
        resp += `   - Poste : *${cand.jobApplied}* (Réf: ${cand.jobRef})\n`;
        resp += `   - Expérience : **${cand.expYears} an(s)** | Score IA : **${cand.aiScore}**\n`;
        resp += `   - Compétences : ${cand.skills.join(', ') || 'Non renseignées'}\n\n`;
      }
      resp += `*Note : Conformément aux règles de sécurité, validez ces profils manuellement avant convocation.*`;
      return resp;
    }

    // 2. Best profiles query (e.g. "Quels sont les meilleurs profils...")
    if (q.includes('meilleur') || q.includes('top') || q.includes('score') || q.includes('présélection')) {
      const sorted = [...data.candidatesSummary].sort((a: any, b: any) => {
        const scoreA = parseInt(a.aiScore, 10) || 0;
        const scoreB = parseInt(b.aiScore, 10) || 0;
        return scoreB - scoreA;
      });

      const top = sorted.slice(0, 5);
      let resp = `**Top des profils selon l'évaluation du matching IA :**\n\n`;
      top.forEach((c: any, idx: number) => {
        resp += `${idx + 1}. **${c.candidateName}** – Score IA : **${c.aiScore}**\n`;
        resp += `   - Poste visé : ${c.jobApplied}\n`;
        resp += `   - Statut actuel : \`${c.status}\` | Expérience : ${c.expYears} an(s)\n`;
        resp += `   - Recommandation IA : ${c.aiRec}\n\n`;
      });
      resp += `*Conseil : Vous pouvez cliquer sur une candidature depuis le tableau pour consulter son CV complet.*`;
      return resp;
    }

    // 3. Experience check query (e.g., "au moins 3 ans d'expérience")
    if (q.includes('expérience') || q.includes('an') || q.includes('senior')) {
      const experienced = data.candidatesSummary.filter((c: any) => c.expYears >= 3);
      let resp = `**Candidats justifiant d'au moins 3 ans d'expérience professionnelle :**\n\n`;
      if (experienced.length === 0) {
        return `Aucun candidat n'a pour l'instant indiqué au moins 3 années d'expérience.`;
      }
      for (const c of experienced) {
        resp += `• **${c.candidateName}** : ${c.expYears} an(s) d'expérience – Poste : ${c.jobApplied} (Score IA : ${c.aiScore})\n`;
      }
      return resp;
    }

    // 4. General summary
    return `**Assistant RH SmartRecruit ATS** à votre service !\n\n` +
      `**État actuel de la plateforme :**\n` +
      `• **${data.activeJobs.length}** offre(s) d'emploi active(s)\n` +
      `• **${data.totalApplications}** candidature(s) enregistrée(s)\n` +
      `• **${data.talentPoolCount}** profil(s) dans le Vivier de Talents\n\n` +
      `Vous pouvez me demander :\n` +
      `- *"Trouve-moi les candidats qui maîtrisent React et PostgreSQL"*\n` +
      `- *"Quels sont les meilleurs profils pour le poste de développeur ?"*\n` +
      `- *"Quels candidats ont au moins 3 ans d'expérience ?"*\n` +
      `- *"Génère une synthèse de présélection"*`;
  }
}
