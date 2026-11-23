import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env.js';
import { AiMatchCategory, AiRecommendation } from '@prisma/client';

export interface JobMatchCriteria {
  jobTitle: string;
  department?: string;
  requiredSkills: string[];
  desiredSkills: string[];
  requiredExpYears: number;
  location?: string;
  availability?: string;
  description?: string;
}

export interface CandidateResumeData {
  extractedText: string;
  skills: string[];
  yearsOfExp?: number;
  education?: string[];
  experiences?: string[];
  location?: string;
  availability?: string;
}

export interface GridScoreBreakdown {
  scoreFormation: number; // 0 ou 20
  detailFormation: string;
  scoreExperience: number; // 0, 10 ou 20
  detailExperience: string;
  scoreKeySkills: number; // 0 à 40 (10 pts par compétence clé)
  detailKeySkills: string;
  scoreFrench: number; // 0 ou 10
  detailFrench: string;
  scoreTools: number; // 0 à 10 (5 pts par outil : Canva / CRM)
  detailTools: string;
  totalScore: number; // 0 à 100
}

export interface MatchAnalysisOutput {
  overallScore: number; // 0 to 100
  category: AiMatchCategory; // HIGH_MATCH, PARTIAL_MATCH, LOW_MATCH
  recommendation: AiRecommendation; // APPROVED_FOR_SHORTLIST, NOT_APPROVED
  foundRequiredSkills: string[];
  missingRequiredSkills: string[];
  foundDesiredSkills: string[];
  missingDesiredSkills: string[];
  strengths: string[];
  pointsToVerify: string[];
  justification: string;
  gridBreakdown?: GridScoreBreakdown;
}

export class AiMatchingService {
  private static geminiClient = ENV.GEMINI_API_KEY
    ? new GoogleGenerativeAI(ENV.GEMINI_API_KEY)
    : null;

  /**
   * Calcul du score selon la Grille de notation officielle (sur 100) :
   * - Formation liée au poste : 20 pts (Domaine pertinent : 20 ; autre : 0)
   * - Expérience : 20 pts (>= 1 an : 20 ; 6 à 11 mois : 10 ; < 6 mois : 0)
   * - 4 compétences clés : 40 pts (10 points chacune)
   * - Français professionnel : 10 pts (Mentionné : 10 ; non documenté : 0)
   * - Canva et CRM : 10 pts (5 points par outil maîtrisé)
   */
  public static computeGridScore(
    job: JobMatchCriteria,
    candidate: CandidateResumeData
  ): GridScoreBreakdown {
    const textLower = (candidate.extractedText || '').toLowerCase();
    const candidateSkillsLower = (candidate.skills || []).map((s) => s.toLowerCase());
    const candidateEdu = (candidate.education || []).join(' ').toLowerCase();
    const candidateExpText = (candidate.experiences || []).join(' ').toLowerCase();
    const fullText = `${textLower} ${candidateSkillsLower.join(' ')} ${candidateEdu} ${candidateExpText}`;

    // Helper pour tester la présence d'un mot ou expression
    const containsKeyword = (keyword: string): boolean => {
      const kLower = keyword.toLowerCase();
      return (
        candidateSkillsLower.includes(kLower) ||
        fullText.includes(kLower) ||
        new RegExp(`\\b${kLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(fullText)
      );
    };

    // ---------------------------------------------------------
    // 1. Formation liée au poste (20 pts)
    // Règle : Domaine pertinent : 20 ; autre : 0
    // ---------------------------------------------------------
    const relevantDomains = [
      'marketing',
      'marketing digital',
      'management digital',
      'communication',
      'communication digitale',
      'commerce',
      'e-commerce',
      'web',
      'multimédia',
      'digital',
      'stratégie digitale',
      'gestion',
      'management',
      'publicité',
    ];

    // Domaines exclus / non pertinents dans le cas digital
    const hasExplicitIrrelevantEducation =
      (candidateEdu.includes('finance') || textLower.includes('master finance')) &&
      !relevantDomains.some((d) => candidateEdu.includes(d) || textLower.includes(`master ${d}`) || textLower.includes(`licence ${d}`));

    const isEducationRelevant =
      !hasExplicitIrrelevantEducation &&
      (relevantDomains.some((d) => candidateEdu.includes(d) || textLower.includes(d)) ||
        containsKeyword('licence marketing') ||
        containsKeyword('master marketing') ||
        containsKeyword('management digital') ||
        containsKeyword('communication digitale') ||
        containsKeyword('bac+3') ||
        containsKeyword('bac+5'));

    let scoreFormation = 0;
    let detailFormation = '';
    if (isEducationRelevant) {
      scoreFormation = 20;
      detailFormation = 'Domaine pertinent validé (+20 pts)';
    } else {
      scoreFormation = 0;
      detailFormation = 'Autre domaine / non pertinent pour le poste (0 pt)';
    }

    // ---------------------------------------------------------
    // 2. Expérience (20 pts)
    // Règle : >= 1 an : 20 ; 6 à 11 mois : 10 ; < 6 mois : 0
    // ---------------------------------------------------------
    let candYears = candidate.yearsOfExp || 0;

    // Détection textuelle si yearsOfExp est 0
    if (candYears === 0) {
      if (
        fullText.includes('2 ans') ||
        fullText.includes('3 ans') ||
        fullText.includes('4 ans') ||
        fullText.includes('5 ans') ||
        fullText.includes('1 an') ||
        fullText.includes('1 ans') ||
        fullText.includes('12 mois')
      ) {
        candYears = 1;
      } else if (
        fullText.includes('6 mois') ||
        fullText.includes('7 mois') ||
        fullText.includes('8 mois') ||
        fullText.includes('9 mois') ||
        fullText.includes('10 mois') ||
        fullText.includes('11 mois') ||
        fullText.includes('stage de 6 mois')
      ) {
        candYears = 0.5;
      }
    }

    let scoreExperience = 0;
    let detailExperience = '';
    if (candYears >= 1) {
      scoreExperience = 20;
      detailExperience = `≥ 1 an validé (${candYears >= 1 ? `${candYears} an(s)` : '≥ 1 an'}) (+20 pts)`;
    } else if (candYears >= 0.5 || fullText.includes('6 mois')) {
      scoreExperience = 10;
      detailExperience = '6 à 11 mois de stage/expérience (+10 pts)';
    } else {
      scoreExperience = 0;
      detailExperience = '< 6 mois ou débutant (0 pt)';
    }

    // ---------------------------------------------------------
    // 3. 4 compétences clés (40 pts)
    // Règle : SEO, réseaux sociaux, Analytics, Excel : 10 chacune
    // ---------------------------------------------------------
    const keySkillsConfig = [
      {
        name: 'SEO',
        test: () => containsKeyword('seo') || containsKeyword('référencement') || containsKeyword('referencement') || containsKeyword('sem'),
      },
      {
        name: 'Réseaux sociaux',
        test: () =>
          containsKeyword('réseaux sociaux') ||
          containsKeyword('reseaux sociaux') ||
          containsKeyword('social media') ||
          containsKeyword('community management'),
      },
      {
        name: 'Google Analytics',
        test: () =>
          containsKeyword('analytics') ||
          containsKeyword('google analytics') ||
          containsKeyword('web analytics') ||
          containsKeyword('kpi'),
      },
      {
        name: 'Excel',
        test: () => containsKeyword('excel') || containsKeyword('tableur') || containsKeyword('google sheets'),
      },
    ];

    let scoreKeySkills = 0;
    const validatedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const item of keySkillsConfig) {
      if (item.test()) {
        scoreKeySkills += 10;
        validatedSkills.push(`${item.name} (+10 pts)`);
      } else {
        missingSkills.push(`${item.name} (0 pt)`);
      }
    }

    const detailKeySkills =
      validatedSkills.length > 0
        ? `Validées (${scoreKeySkills}/40 pts) : ${validatedSkills.join(', ')}`
        : 'Aucune des 4 compétences clés validée (0/40 pts)';

    // ---------------------------------------------------------
    // 4. Français professionnel (10 pts)
    // Règle : Mentionné : 10 ; non documenté : 0 dans l'exercice
    // ---------------------------------------------------------
    const hasFrench =
      containsKeyword('français') ||
      containsKeyword('francais') ||
      containsKeyword('french') ||
      containsKeyword('langue française') ||
      containsKeyword('français professionnel') ||
      containsKeyword('français courant');

    let scoreFrench = 0;
    let detailFrench = '';
    if (hasFrench) {
      scoreFrench = 10;
      detailFrench = 'Français professionnel mentionné (+10 pts)';
    } else {
      scoreFrench = 0;
      detailFrench = 'Non documenté dans l’exercice (0 pt)';
    }

    // ---------------------------------------------------------
    // 5. Canva et CRM (10 pts)
    // Règle : 5 points par outil maîtrisé (Canva : 5, CRM : 5)
    // ---------------------------------------------------------
    const hasCanva = containsKeyword('canva');
    const hasCrm =
      containsKeyword('crm') ||
      containsKeyword('hubspot') ||
      containsKeyword('salesforce') ||
      containsKeyword('zoho') ||
      containsKeyword('pipedrive');

    let scoreTools = 0;
    const toolsFound: string[] = [];
    if (hasCanva) {
      scoreTools += 5;
      toolsFound.push('Canva (+5 pts)');
    }
    if (hasCrm) {
      scoreTools += 5;
      toolsFound.push('CRM (+5 pts)');
    }

    const detailTools =
      toolsFound.length > 0
        ? toolsFound.join(', ') + ` [Total : ${scoreTools}/10 pts]`
        : 'Canva et CRM non mentionnés (0/10 pts)';

    // Score total sur 100
    const totalScore = scoreFormation + scoreExperience + scoreKeySkills + scoreFrench + scoreTools;

    return {
      scoreFormation,
      detailFormation,
      scoreExperience,
      detailExperience,
      scoreKeySkills,
      detailKeySkills,
      scoreFrench,
      detailFrench,
      scoreTools,
      detailTools,
      totalScore: Math.min(100, Math.max(0, totalScore)),
    };
  }

  /**
   * Main entrypoint: Matches candidate resume against job requirements
   */
  public static async matchCandidate(
    job: JobMatchCriteria,
    candidate: CandidateResumeData
  ): Promise<MatchAnalysisOutput> {
    // 1. Calcul selon la Grille de notation officielle (sur 100)
    const grid = this.computeGridScore(job, candidate);
    const overallScore = grid.totalScore;

    // Compétences requises et souhaitées détectées
    const textLower = (candidate.extractedText || '').toLowerCase();
    const candidateSkillsLower = (candidate.skills || []).map((s) => s.toLowerCase());
    const hasSkill = (skill: string): boolean => {
      const sLower = skill.toLowerCase();
      return (
        candidateSkillsLower.includes(sLower) ||
        textLower.includes(sLower) ||
        new RegExp(`\\b${sLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(textLower)
      );
    };

    const foundReq: string[] = [];
    const missingReq: string[] = [];
    for (const req of job.requiredSkills) {
      if (hasSkill(req)) foundReq.push(req);
      else missingReq.push(req);
    }

    const foundDes: string[] = [];
    const missingDes: string[] = [];
    for (const des of job.desiredSkills) {
      if (hasSkill(des)) foundDes.push(des);
      else missingDes.push(des);
    }

    // Try calling Gemini if API key is configured
    if (this.geminiClient && ENV.GEMINI_API_KEY) {
      try {
        const geminiResult = await this.evaluateWithGemini(job, candidate, {
          grid,
          foundReq,
          missingReq,
          foundDes,
          missingDes,
        });
        if (geminiResult) return geminiResult;
      } catch (err) {
        console.warn('Gemini LLM call failed or quota exceeded, using rule-based scoring grid:', err);
      }
    }

    // Fallback: Robust deterministic result strictly adhering to the 100-point grid
    return this.buildDeterministicResult(
      job,
      candidate,
      grid,
      foundReq,
      missingReq,
      foundDes,
      missingDes
    );
  }

  /**
   * Deterministic matching evaluator with detailed official rating grid
   */
  private static buildDeterministicResult(
    job: JobMatchCriteria,
    candidate: CandidateResumeData,
    grid: GridScoreBreakdown,
    foundReq: string[],
    missingReq: string[],
    foundDes: string[],
    missingDes: string[]
  ): MatchAnalysisOutput {
    const overallScore = grid.totalScore;

    let category: AiMatchCategory = AiMatchCategory.LOW_MATCH;
    let recommendation: AiRecommendation = AiRecommendation.NOT_APPROVED;

    if (overallScore >= 75) {
      category = AiMatchCategory.HIGH_MATCH;
      recommendation = AiRecommendation.APPROVED_FOR_SHORTLIST;
    } else if (overallScore >= 50) {
      category = AiMatchCategory.PARTIAL_MATCH;
      recommendation =
        overallScore >= 70
          ? AiRecommendation.APPROVED_FOR_SHORTLIST
          : AiRecommendation.NOT_APPROVED;
    } else {
      category = AiMatchCategory.LOW_MATCH;
      recommendation = AiRecommendation.NOT_APPROVED;
    }

    const strengths: string[] = [];
    const pointsToVerify: string[] = [];

    if (grid.scoreFormation === 20) strengths.push('Formation liée au poste validée (20/20 pts)');
    else pointsToVerify.push('Formation hors domaine ou non pertinente (0/20 pt)');

    if (grid.scoreExperience === 20) strengths.push('Expérience professionnelle requise validée (≥ 1 an : 20/20 pts)');
    else if (grid.scoreExperience === 10) strengths.push('Expérience de 6 à 11 mois (10/20 pts)');
    else pointsToVerify.push('Expérience inférieure à 6 mois ou non documentée (0/20 pt)');

    if (grid.scoreKeySkills >= 30) strengths.push(`Compétences clés fortement maîtrisées (${grid.scoreKeySkills}/40 pts)`);
    else pointsToVerify.push(`Lacunes sur les 4 compétences clés (${grid.scoreKeySkills}/40 pts)`);

    if (grid.scoreFrench === 10) strengths.push('Français professionnel mentionné (10/10 pts)');
    else pointsToVerify.push('Français professionnel non documenté dans l’exercice (0/10 pt)');

    if (grid.scoreTools === 10) strengths.push('Maîtrise complète des outils Canva et CRM (10/10 pts)');
    else if (grid.scoreTools === 5) strengths.push('Maîtrise partielle des outils (Canva ou CRM : 5/10 pts)');
    else pointsToVerify.push('Outils Canva et CRM non mentionnés (0/10 pt)');

    const justification = `Grille de notation officielle (Score global : ${overallScore}/100) :
• 1. Formation liée au poste : ${grid.scoreFormation}/20 pts (${grid.detailFormation})
• 2. Expérience : ${grid.scoreExperience}/20 pts (${grid.detailExperience})
• 3. 4 compétences clés : ${grid.scoreKeySkills}/40 pts (${grid.detailKeySkills})
• 4. Français professionnel : ${grid.scoreFrench}/10 pts (${grid.detailFrench})
• 5. Canva et CRM : ${grid.scoreTools}/10 pts (${grid.detailTools})

Synthèse : Le candidat obtient ${overallScore}/100 (${
      category === AiMatchCategory.HIGH_MATCH
        ? 'MATCH ÉLEVÉ'
        : category === AiMatchCategory.PARTIAL_MATCH
        ? 'MATCH PARTIEL'
        : 'MATCH FAIBLE'
    }). ${
      recommendation === AiRecommendation.APPROVED_FOR_SHORTLIST
        ? 'Présélection recommandée pour validation par le recruteur.'
        : 'Profil non recommandé pour la présélection automatique ; vérification manuelle recommandée.'
    }`;

    return {
      overallScore,
      category,
      recommendation,
      foundRequiredSkills: foundReq,
      missingRequiredSkills: missingReq,
      foundDesiredSkills: foundDes,
      missingDesiredSkills: missingDes,
      strengths,
      pointsToVerify,
      justification,
      gridBreakdown: grid,
    };
  }

  /**
   * Gemini Generative AI Evaluation strictly instructed with the Official Rating Grid
   */
  private static async evaluateWithGemini(
    job: JobMatchCriteria,
    candidate: CandidateResumeData,
    precomputed: {
      grid: GridScoreBreakdown;
      foundReq: string[];
      missingReq: string[];
      foundDes: string[];
      missingDes: string[];
    }
  ): Promise<MatchAnalysisOutput | null> {
    if (!this.geminiClient) return null;

    const model = this.geminiClient.getGenerativeModel({
      model: ENV.AI_MODEL || 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const prompt = `Tu es l'agent IA d'évaluation et de matching de recrutement pour SMARTRECRUIT ATS.
Tu dois évaluer la candidature STRICTEMENT selon la grille de notation officielle suivante (Total sur 100 points) :

=== GRILLE DE NOTATION OFFICIELLE (SUR 100) ===
1. Formation liée au poste (Maximum : 20 points) :
   - Domaine pertinent (ex: Marketing, Management digital, Communication digitale, etc.) : 20 points
   - Autre domaine / non pertinent (ex: Finance pure, etc.) : 0 point

2. Expérience (Maximum : 20 points) :
   - >= 1 an (stages compris) : 20 points
   - 6 à 11 mois : 10 points
   - < 6 mois : 0 point

3. 4 compétences clés (Maximum : 40 points) :
   - Évalue la présence de : SEO, Réseaux sociaux, Google Analytics, Excel.
   - Règle : 10 points chacune (max 40 pts).

4. Français professionnel (Maximum : 10 points) :
   - Mentionné ou documenté dans le profil/CV : 10 points
   - Non documenté dans l'exercice : 0 point

5. Canva et CRM (Maximum : 10 points) :
   - Règle : 5 points par outil maîtrisé (Canva : 5 pts, CRM : 5 pts). Max : 10 points.

TOTAL = Formation (20) + Expérience (20) + 4 compétences (40) + Français (10) + Canva & CRM (10) = 100 points.

Recommandation :
- Score >= 70 : "APPROVED_FOR_SHORTLIST"
- Score < 70 : "NOT_APPROVED"

Catégorie :
- Score >= 75 : "HIGH_MATCH"
- Score 50 à 74 : "PARTIAL_MATCH"
- Score < 50 : "LOW_MATCH"

Réponds STRICTEMENT au format JSON suivant :
{
  "overallScore": number (0 à 100 calculé selon la grille),
  "category": "HIGH_MATCH" | "PARTIAL_MATCH" | "LOW_MATCH",
  "recommendation": "APPROVED_FOR_SHORTLIST" | "NOT_APPROVED",
  "foundRequiredSkills": string[],
  "missingRequiredSkills": string[],
  "foundDesiredSkills": string[],
  "missingDesiredSkills": string[],
  "strengths": string[],
  "pointsToVerify": string[],
  "justification": string (Inclure impérativement le détail précis des points par critère selon la grille)
}

Offre d'emploi :
Poste : ${job.jobTitle}
Département : ${job.department || 'Marketing Digital'}
Compétences clés : ${job.requiredSkills.join(', ')}
Atouts / Outils : ${job.desiredSkills.join(', ')}
Années d'expérience requises : ${job.requiredExpYears}
Description : ${job.description || ''}

Candidat :
Compétences déclarées : ${candidate.skills.join(', ')}
Années d'expérience : ${candidate.yearsOfExp || 0}
Formations : ${(candidate.education || []).join(' | ')}
Texte du CV :
${candidate.extractedText.slice(0, 3000)}`;

    const response = await model.generateContent(prompt);
    const jsonText = response.response.text();
    const parsed = JSON.parse(jsonText);

    let category: AiMatchCategory = AiMatchCategory.LOW_MATCH;
    const score = parsed.overallScore !== undefined ? parsed.overallScore : precomputed.grid.totalScore;
    if (score >= 75) category = AiMatchCategory.HIGH_MATCH;
    else if (score >= 50) category = AiMatchCategory.PARTIAL_MATCH;

    return {
      overallScore: Math.min(100, Math.max(0, score)),
      category: parsed.category in AiMatchCategory ? parsed.category : category,
      recommendation:
        parsed.recommendation === 'APPROVED_FOR_SHORTLIST'
          ? AiRecommendation.APPROVED_FOR_SHORTLIST
          : AiRecommendation.NOT_APPROVED,
      foundRequiredSkills: parsed.foundRequiredSkills || precomputed.foundReq,
      missingRequiredSkills: parsed.missingRequiredSkills || precomputed.missingReq,
      foundDesiredSkills: parsed.foundDesiredSkills || precomputed.foundDes,
      missingDesiredSkills: parsed.missingDesiredSkills || precomputed.missingDes,
      strengths: parsed.strengths || [],
      pointsToVerify: parsed.pointsToVerify || [],
      justification: parsed.justification || 'Évaluation réalisée selon la grille de notation officielle.',
      gridBreakdown: precomputed.grid,
    };
  }
}
