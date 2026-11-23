import {
  PrismaClient,
  Role,
  JobStatus,
  ContractType,
  ApplicationStatus,
  ResumeType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AiMatchingService } from '../src/services/aiMatching.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Démarrage du seed pour la Mise en situation...');

  const defaultHash = await bcrypt.hash('candidate123', 10);

  // 1. Récupérer un super admin pour créer l'offre
  let admin = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'yhykk8899@gmail.com',
        clerkId: 'user_superadmin_yhykk',
        firstName: 'Yahya',
        lastName: 'Admin',
        role: Role.SUPER_ADMIN,
        isActive: true,
        isVerified: true,
      },
    });
  }

  // 2. Création de l'offre d'emploi "Chargé de Marketing Digital"
  const job = await prisma.job.upsert({
    where: { reference: 'REC-2026-MKT' },
    update: {
      title: 'Chargé(e) de Marketing Digital',
      department: 'Marketing & Digital',
      location: 'Casablanca (Hybride)',
      description: 'Campagnes digitales, animation et suivi des résultats. Bac+3 minimum en marketing, management digital ou domaine proche. 1 an d\'expérience souhaité, stages compris.',
      responsibilities: 'Concevoir et déployer des campagnes digitales multi-canaux.\nAnimer les réseaux sociaux et développer l\'engagement communautaire.\nOptimiser le référencement naturel (SEO) et analyser le trafic via Google Analytics.\nCréer des visuels sur Canva et suivre les prospects via CRM.',
      requiredExpYears: 1,
      contractType: ContractType.CDI,
      status: JobStatus.PUBLISHED,
    },
    create: {
      reference: 'REC-2026-MKT',
      title: 'Chargé(e) de Marketing Digital',
      slug: 'charge-de-marketing-digital-rec-2026-mkt',
      department: 'Marketing & Digital',
      location: 'Casablanca (Hybride)',
      isRemote: true,
      contractType: ContractType.CDI,
      openings: 1,
      description: 'Campagnes digitales, animation et suivi des résultats. Bac+3 minimum en marketing, management digital ou domaine proche. 1 an d\'expérience souhaité, stages compris.',
      responsibilities: 'Concevoir et déployer des campagnes digitales multi-canaux.\nAnimer les réseaux sociaux et développer l\'engagement communautaire.\nOptimiser le référencement naturel (SEO) et analyser le trafic via Google Analytics.\nCréer des visuels sur Canva et suivre les prospects via CRM.',
      requiredExpYears: 1,
      availability: 'Immédiate',
      salaryMin: 40000,
      salaryMax: 55000,
      status: JobStatus.PUBLISHED,
      createdById: admin.id,
      requirements: {
        create: [
          { skillName: 'SEO', isRequired: true, minExpYears: 1 },
          { skillName: 'Réseaux sociaux', isRequired: true, minExpYears: 1 },
          { skillName: 'Google Analytics', isRequired: true, minExpYears: 1 },
          { skillName: 'Excel', isRequired: true, minExpYears: 1 },
          { skillName: 'Canva', isRequired: false, minExpYears: 1 },
          { skillName: 'CRM', isRequired: false, minExpYears: 1 },
        ],
      },
    },
    include: { requirements: true },
  });

  console.log(`✅ Offre créée : ${job.title} (${job.reference})`);

  // 3. Définition des 5 candidats de la Mise en situation
  const candidatesData = [
    {
      firstName: 'Salma',
      lastName: 'Bennani',
      email: 'salma.bennani@example.com',
      clerkId: 'user_cand_salma_b',
      title: 'Chargée de Marketing Digital',
      education: 'Master marketing digital',
      degree: 'Master marketing digital',
      fieldOfStudy: 'Marketing digital',
      yearsOfExp: 2,
      skills: ['SEO', 'Google Analytics', 'Réseaux sociaux', 'Excel', 'Canva'],
      experiences: ['Chargée de marketing digital - 2 ans d\'expérience en gestion de campagnes web et SEO'],
      extractedText: 'Salma Bennani. Formation : Master marketing digital. Expérience : 2 ans en agence web. Compétences : SEO, Google Analytics, réseaux sociaux, Excel, Canva. Gestion de campagnes digitales et animation de communauté.',
    },
    {
      firstName: 'Youssef',
      lastName: 'Alami',
      email: 'youssef.alami@example.com',
      clerkId: 'user_cand_youssef_a',
      title: 'Community Manager & Digital Specialist',
      education: 'Licence management digital',
      degree: 'Licence management digital',
      fieldOfStudy: 'Management digital',
      yearsOfExp: 1,
      skills: ['Réseaux sociaux', 'Excel', 'Canva', 'CRM'],
      experiences: ['Community Manager - 1 an d\'expérience dans l\'animation de réseaux sociaux et suivi CRM'],
      extractedText: 'Youssef Alami. Formation : Licence management digital. Expérience : 1 an. Compétences : Réseaux sociaux, Excel, Canva, CRM (HubSpot). Animation de contenu et fidélisation client.',
    },
    {
      firstName: 'Imane',
      lastName: 'Chraibi',
      email: 'imane.chraibi@example.com',
      clerkId: 'user_cand_imane_c',
      title: 'Analyste Financière',
      education: 'Master finance',
      degree: 'Master finance',
      fieldOfStudy: 'Finance',
      yearsOfExp: 3,
      skills: ['Excel', 'CRM', 'Analyse financière'],
      experiences: ['Analyste financière - 3 ans d\'expérience en cabinet d\'audit et modélisation financière'],
      extractedText: 'Imane Chraibi. Formation : Master finance. Expérience : 3 ans en audit et modélisation. Compétences : Excel avancé, CRM, analyse financière, reporting financier.',
    },
    {
      firstName: 'Amine',
      lastName: 'Tazi',
      email: 'amine.tazi@example.com',
      clerkId: 'user_cand_amine_t',
      title: 'Assistant Marketing Digital (Stagiaire)',
      education: 'Licence marketing',
      degree: 'Licence marketing',
      fieldOfStudy: 'Marketing',
      yearsOfExp: 0, // 6 mois de stage
      skills: ['SEO', 'Google Analytics', 'Réseaux sociaux', 'Excel'],
      experiences: ['Stagiaire Marketing Digital - 6 mois de stage en référencement SEO et gestion des réseaux sociaux'],
      extractedText: 'Amine Tazi. Formation : Licence marketing. Expérience : 6 mois de stage en marketing digital. Compétences : SEO, Google Analytics, réseaux sociaux, Excel. Optimisation de mots-clés et reporting mensuel.',
    },
    {
      firstName: 'Nadia',
      lastName: 'Mansouri',
      email: 'nadia.mansouri@example.com',
      clerkId: 'user_cand_nadia_m',
      title: 'Spécialiste Communication & Marketing Digital',
      education: 'Master communication digitale',
      degree: 'Master communication digitale',
      fieldOfStudy: 'Communication digitale',
      yearsOfExp: 1,
      skills: ['SEO', 'Réseaux sociaux', 'Google Analytics', 'Excel', 'Canva', 'CRM'],
      experiences: ['Chargée de communication digitale - 1 an d\'expérience en gestion de contenu, SEO et CRM'],
      extractedText: 'Nadia Mansouri. Formation : Master communication digitale. Expérience : 1 an en entreprise. Compétences : SEO, réseaux sociaux, Google Analytics, Excel, Canva, CRM. Maîtrise complète de la chaîne digitale et création de visuels.',
    },
  ];

  console.log('\n📊 Traitement et évaluation des 5 candidatures selon la Grille de notation...');

  const reqSkills = job.requirements.filter((r) => r.isRequired).map((r) => r.skillName);
  const desSkills = job.requirements.filter((r) => !r.isRequired).map((r) => r.skillName);

  for (const cand of candidatesData) {
    // Créer ou mettre à jour l'utilisateur
    const user = await prisma.user.upsert({
      where: { email: cand.email },
      update: {
        firstName: cand.firstName,
        lastName: cand.lastName,
      },
      create: {
        email: cand.email,
        clerkId: cand.clerkId,
        firstName: cand.firstName,
        lastName: cand.lastName,
        passwordHash: defaultHash,
        role: Role.CANDIDATE,
        isActive: true,
        isVerified: true,
      },
    });

    // Profil candidat
    const profile = await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      update: {
        currentTitle: cand.title,
        yearsOfExp: cand.yearsOfExp,
        summary: `Profil de ${cand.firstName} ${cand.lastName} - ${cand.education}`,
      },
      create: {
        userId: user.id,
        currentTitle: cand.title,
        yearsOfExp: cand.yearsOfExp,
        summary: `Profil de ${cand.firstName} ${cand.lastName} - ${cand.education}`,
      },
    });

    // Education
    await prisma.education.deleteMany({ where: { profileId: profile.id } });
    await prisma.education.create({
      data: {
        profileId: profile.id,
        degree: cand.degree,
        fieldOfStudy: cand.fieldOfStudy,
        institution: 'Université / École de Commerce',
        startDate: new Date('2021-09-01'),
        endDate: new Date('2024-06-30'),
      },
    });

    // Experiences
    await prisma.experience.deleteMany({ where: { profileId: profile.id } });
    await prisma.experience.create({
      data: {
        profileId: profile.id,
        jobTitle: cand.title,
        company: 'Entreprise Partenaire',
        startDate: new Date('2023-01-01'),
        description: cand.experiences[0],
      },
    });

    // Compétences
    await prisma.candidateSkill.deleteMany({ where: { profileId: profile.id } });
    for (const skName of cand.skills) {
      const skill = await prisma.skill.upsert({
        where: { name: skName },
        update: {},
        create: { name: skName, category: 'Digital' },
      });
      await prisma.candidateSkill.create({
        data: {
          profileId: profile.id,
          skillId: skill.id,
          level: 4,
          yearsOfExp: cand.yearsOfExp || 1,
        },
      });
    }

    // CV
    let resume = await prisma.resume.findFirst({
      where: { profileId: profile.id },
    });
    if (!resume) {
      resume = await prisma.resume.create({
        data: {
          profileId: profile.id,
          type: ResumeType.UPLOADED_PDF,
          title: `CV_${cand.firstName}_${cand.lastName}.pdf`,
          extractedText: cand.extractedText,
          isDefault: true,
        },
      });
    } else {
      resume = await prisma.resume.update({
        where: { id: resume.id },
        data: { extractedText: cand.extractedText },
      });
    }

    // Calcul du score IA selon la Grille
    const matchResult = await AiMatchingService.matchCandidate(
      {
        jobTitle: job.title,
        department: job.department,
        requiredSkills: reqSkills,
        desiredSkills: desSkills,
        requiredExpYears: job.requiredExpYears,
        description: job.description,
      },
      {
        extractedText: cand.extractedText,
        skills: cand.skills,
        yearsOfExp: cand.yearsOfExp,
        education: [cand.education],
        experiences: cand.experiences,
      }
    );

    // Candidature
    const appNumber = `APP-MKT-${cand.firstName.toUpperCase()}`;
    const application = await prisma.application.upsert({
      where: {
        jobId_candidateProfileId: {
          jobId: job.id,
          candidateProfileId: profile.id,
        },
      },
      update: {
        status: ApplicationStatus.SUBMITTED,
        currentStage: matchResult.overallScore >= 75 ? 'Sélectionné pour entretien' : 'Candidature reçue',
      },
      create: {
        applicationNumber: appNumber,
        jobId: job.id,
        candidateProfileId: profile.id,
        resumeId: resume.id,
        status: ApplicationStatus.SUBMITTED,
        currentStage: matchResult.overallScore >= 75 ? 'Sélectionné pour entretien' : 'Candidature reçue',
      },
    });

    // Enregistrer le résultat IA avec la grille de notation
    await prisma.aiMatchResult.upsert({
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

    console.log(`\n--------------------------------------------`);
    console.log(`👤 Candidat : ${cand.firstName} ${cand.lastName}`);
    console.log(`🎯 Score calculé : ${matchResult.overallScore}/100 [${matchResult.category}]`);
    console.log(`📋 Justification :`);
    console.log(matchResult.justification);
  }

  console.log('\n============================================');
  console.log('✅ Mise en situation importée et notée avec succès !');
  console.log('============================================');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
