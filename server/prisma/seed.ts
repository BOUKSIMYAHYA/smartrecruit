import { PrismaClient, Role, JobStatus, ContractType, ApplicationStatus, AiMatchCategory, AiRecommendation, ResumeType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed SmartRecruit ATS...');

  const hashYhykk = await bcrypt.hash('yhykk8899', 10);
  const hashSaad = await bcrypt.hash('dimawydad', 10);
  const hashDefault = await bcrypt.hash('candidate123', 10);

  // 1. Initial Super Admins (Mandatory per specification)
  const superAdmin1 = await prisma.user.upsert({
    where: { email: 'yhykk8899@gmail.com' },
    update: { role: Role.SUPER_ADMIN, isActive: true, passwordHash: hashYhykk, isVerified: true },
    create: {
      email: 'yhykk8899@gmail.com',
      clerkId: 'user_superadmin_yhykk',
      firstName: 'Yahya',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      isActive: true,
      isVerified: true,
      passwordHash: hashYhykk,
    },
  });

  const superAdmin2 = await prisma.user.upsert({
    where: { email: 'saadtoufik67@gmail.com' },
    update: { role: Role.SUPER_ADMIN, isActive: true, passwordHash: hashSaad, isVerified: true },
    create: {
      email: 'saadtoufik67@gmail.com',
      clerkId: 'user_superadmin_saadtoufik',
      firstName: 'Saad',
      lastName: 'Toufik',
      role: Role.SUPER_ADMIN,
      isActive: true,
      isVerified: true,
      passwordHash: hashSaad,
    },
  });

  // Additional HR Users
  const hrManager = await prisma.user.upsert({
    where: { email: 'hr.manager@smartrecruit.internal' },
    update: {},
    create: {
      email: 'hr.manager@smartrecruit.internal',
      clerkId: 'user_hr_manager_01',
      firstName: 'Camille',
      lastName: 'Dubois',
      role: Role.HR_MANAGER,
      isActive: true,
    },
  });

  const techLead = await prisma.user.upsert({
    where: { email: 'tech.lead@smartrecruit.internal' },
    update: {},
    create: {
      email: 'tech.lead@smartrecruit.internal',
      clerkId: 'user_tech_lead_01',
      firstName: 'Alexandre',
      lastName: 'Mercier',
      role: Role.OPERATIONAL_MANAGER,
      isActive: true,
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruteur@smartrecruit.internal' },
    update: {},
    create: {
      email: 'recruteur@smartrecruit.internal',
      clerkId: 'user_recruiter_01',
      firstName: 'Sophie',
      lastName: 'Moreau',
      role: Role.RECRUITER,
      isActive: true,
    },
  });

  console.log('✅ Administrateurs et utilisateurs RH créés.');

  // 2. Jobs
  const job1 = await prisma.job.upsert({
    where: { reference: 'REC-2026-001' },
    update: {},
    create: {
      reference: 'REC-2026-001',
      title: 'Développeur Full Stack React / Node.js',
      slug: 'developpeur-full-stack-react-nodejs-rec-2026-001',
      department: 'Ingénierie & Tech',
      location: 'Paris (Hybride)',
      isRemote: true,
      contractType: ContractType.CDI,
      openings: 2,
      description: 'Nous recrutons un(e) Développeur(se) Full Stack Senior pour concevoir et faire évoluer nos applications métiers et nos microservices à forte valeur ajoutée.',
      responsibilities: 'Développer des interfaces utilisateur ultra-performantes en React et TypeScript.\nConcevoir des APIs REST et GraphQL robustes avec Node.js et Prisma.\nOptimiser les requêtes PostgreSQL et participer à l\'architecture système.',
      requiredExpYears: 3,
      availability: 'Immédiate ou sous 1 mois',
      salaryMin: 55000,
      salaryMax: 68000,
      status: JobStatus.PUBLISHED,
      createdById: superAdmin2.id,
      requirements: {
        create: [
          { skillName: 'React', isRequired: true, minExpYears: 3 },
          { skillName: 'TypeScript', isRequired: true, minExpYears: 2 },
          { skillName: 'Node.js', isRequired: true, minExpYears: 3 },
          { skillName: 'PostgreSQL', isRequired: true, minExpYears: 2 },
          { skillName: 'Docker', isRequired: false, minExpYears: 1 },
          { skillName: 'AWS', isRequired: false, minExpYears: 1 },
          { skillName: 'Git', isRequired: false, minExpYears: 2 },
          { skillName: 'REST API', isRequired: false, minExpYears: 2 },
        ],
      },
      collaborators: {
        create: [
          { userId: techLead.id },
          { userId: recruiter.id },
        ],
      },
    },
  });

  const job2 = await prisma.job.upsert({
    where: { reference: 'REC-2026-002' },
    update: {},
    create: {
      reference: 'REC-2026-002',
      title: 'Ingénieur DevOps & Cloud Kubernetes',
      slug: 'ingenieur-devops-cloud-kubernetes-rec-2026-002',
      department: 'Infrastructure & Cloud',
      location: 'Lyon (Télétravail possible)',
      isRemote: true,
      contractType: ContractType.CDI,
      openings: 1,
      description: 'Responsable du maintien en condition opérationnelle, de l\'automatisation CI/CD et de l\'orchestration de nos clusters Kubernetes sur AWS.',
      responsibilities: 'Maintenir les pipelines CI/CD GitLab et GitHub Actions.\nAutomatiser le provisioning cloud via Terraform.\nGarantir la sécurité et le monitoring Prometheus / Grafana.',
      requiredExpYears: 4,
      availability: 'Sous 2 mois',
      salaryMin: 62000,
      salaryMax: 75000,
      status: JobStatus.PUBLISHED,
      createdById: superAdmin1.id,
      requirements: {
        create: [
          { skillName: 'Docker', isRequired: true, minExpYears: 4 },
          { skillName: 'Kubernetes', isRequired: true, minExpYears: 3 },
          { skillName: 'AWS', isRequired: true, minExpYears: 3 },
          { skillName: 'CI/CD', isRequired: true, minExpYears: 3 },
          { skillName: 'Linux', isRequired: true, minExpYears: 4 },
          { skillName: 'Terraform', isRequired: false, minExpYears: 2 },
        ],
      },
    },
  });

  const job3 = await prisma.job.upsert({
    where: { reference: 'REC-2026-003' },
    update: {},
    create: {
      reference: 'REC-2026-003',
      title: 'Product Designer UI/UX Senior',
      slug: 'product-designer-ui-ux-senior-rec-2026-003',
      department: 'Design & Produit',
      location: 'Paris (Présentiel partiel)',
      isRemote: false,
      contractType: ContractType.CDI,
      openings: 1,
      description: 'Concevoir l\'expérience utilisateur et le design system de notre suite logicielle ATS et RH.',
      responsibilities: 'Mener des entretiens utilisateurs et prototyper sur Figma.\nCréer des parcours candidats intuitifs et fluides.\nCollaborer étroitement avec les équipes de développement frontend.',
      requiredExpYears: 3,
      salaryMin: 48000,
      salaryMax: 60000,
      status: JobStatus.PUBLISHED,
      createdById: superAdmin2.id,
      requirements: {
        create: [
          { skillName: 'Figma', isRequired: true, minExpYears: 3 },
          { skillName: 'Design System', isRequired: true, minExpYears: 2 },
          { skillName: 'Communication', isRequired: true, minExpYears: 2 },
          { skillName: 'HTML5', isRequired: false, minExpYears: 1 },
          { skillName: 'CSS3', isRequired: false, minExpYears: 1 },
        ],
      },
    },
  });

  console.log('✅ Offres d\'emploi créées avec succès.');

  // 3. Candidates and Applications
  // Candidate 1: High Match for Job 1
  const cand1User = await prisma.user.upsert({
    where: { email: 'lucas.bernard@example.com' },
    update: {},
    create: {
      email: 'lucas.bernard@example.com',
      clerkId: 'user_cand_lucas_b',
      firstName: 'Lucas',
      lastName: 'Bernard',
      role: Role.CANDIDATE,
      candidateProfile: {
        create: {
          phone: '+33 6 12 34 56 78',
          city: 'Paris',
          country: 'France',
          currentTitle: 'Développeur Full Stack TypeScript',
          yearsOfExp: 4,
          availability: 'Immédiate',
          summary: 'Ingénieur logiciel passionné par React, Node.js et l\'écosystème TypeScript. Expérience significative sur des architectures SaaS distribuées.',
          skills: {
            create: [
              { skill: { connectOrCreate: { where: { name: 'React' }, create: { name: 'React' } } }, level: 5, yearsOfExp: 4 },
              { skill: { connectOrCreate: { where: { name: 'TypeScript' }, create: { name: 'TypeScript' } } }, level: 5, yearsOfExp: 4 },
              { skill: { connectOrCreate: { where: { name: 'Node.js' }, create: { name: 'Node.js' } } }, level: 4, yearsOfExp: 3 },
              { skill: { connectOrCreate: { where: { name: 'PostgreSQL' }, create: { name: 'PostgreSQL' } } }, level: 4, yearsOfExp: 3 },
              { skill: { connectOrCreate: { where: { name: 'Docker' }, create: { name: 'Docker' } } }, level: 3, yearsOfExp: 2 },
              { skill: { connectOrCreate: { where: { name: 'Git' }, create: { name: 'Git' } } }, level: 5, yearsOfExp: 4 },
            ],
          },
          experiences: {
            create: [
              {
                jobTitle: 'Senior Full Stack Engineer',
                company: 'TechCorp SAS',
                location: 'Paris',
                startDate: new Date('2022-01-01'),
                isCurrent: true,
                description: 'Développement d\'une application web en React 18, Node.js et PostgreSQL. Mise en place de CI/CD et tests automatisés.',
              },
            ],
          },
          education: {
            create: [
              {
                degree: 'Master Informatique & Génie Logiciel',
                institution: 'Université Paris-Saclay',
                startDate: new Date('2017-09-01'),
                endDate: new Date('2022-06-30'),
              },
            ],
          },
        },
      },
    },
    include: { candidateProfile: true },
  });

  const cand1Resume = await prisma.resume.create({
    data: {
      profileId: cand1User.candidateProfile!.id,
      type: ResumeType.UPLOADED_PDF,
      title: 'CV_Lucas_Bernard_FullStack.pdf',
      extractedText: 'Lucas Bernard. Développeur Full Stack Senior. Compétences : React, TypeScript, Node.js, PostgreSQL, Docker, AWS, Git, REST API. 4 ans d\'expérience chez TechCorp.',
      isDefault: true,
    },
  });

  await prisma.application.create({
    data: {
      applicationNumber: 'APP-2026-0012',
      jobId: job1.id,
      candidateProfileId: cand1User.candidateProfile!.id,
      resumeId: cand1Resume.id,
      status: ApplicationStatus.PRESELECTED,
      currentStage: 'Présélectionné (validé)',
      statusHistory: {
        createMany: {
          data: [
            { toStatus: ApplicationStatus.SUBMITTED, reason: 'Dépôt de candidature en ligne' },
            { toStatus: ApplicationStatus.PRESELECTED, reason: 'Validation humaine IA : profil idéal' },
          ],
        },
      },
      aiMatchResult: {
        create: {
          overallScore: 94,
          category: AiMatchCategory.HIGH_MATCH,
          recommendation: AiRecommendation.APPROVED_FOR_SHORTLIST,
          foundRequiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
          missingRequiredSkills: [],
          foundDesiredSkills: ['Docker', 'AWS', 'Git', 'REST API'],
          missingDesiredSkills: [],
          strengths: ['100% des compétences obligatoires validées', 'Expérience solide de 4 ans sur la stack cible', 'Disponibilité immédiate'],
          pointsToVerify: ['Attentes salariales'],
          justification: 'Le candidat répond parfaitement à l\'ensemble des critères requis et souhaités. Profil hautement recommandé pour présélection.',
          humanValidated: true,
          humanDecision: 'CONFIRMED_PRESELECTION',
          humanNotes: 'Excellente impression sur le CV, convié pour entretien technique.',
        },
      },
      recruitmentNotes: {
        create: {
          authorId: superAdmin2.id,
          content: 'Profil très solide, à programmer en entretien technique rapidement.',
        },
      },
      interviews: {
        create: {
          interviewerId: techLead.id,
          type: 'TECHNICAL',
          title: 'Entretien Technique Full Stack',
          scheduledAt: new Date(Date.now() + 2 * 86400000), // In 2 days
          durationMinutes: 60,
          meetingLink: 'https://meet.google.com/xyz-tech-test',
        },
      },
    },
  });

  // Candidate 2: Partial Match for Job 1
  const cand2User = await prisma.user.upsert({
    where: { email: 'sarah.mansouri@example.com' },
    update: {},
    create: {
      email: 'sarah.mansouri@example.com',
      clerkId: 'user_cand_sarah_m',
      firstName: 'Sarah',
      lastName: 'Mansouri',
      role: Role.CANDIDATE,
      candidateProfile: {
        create: {
          phone: '+33 6 98 76 54 32',
          city: 'Lyon',
          country: 'France',
          currentTitle: 'Développeuse Frontend React',
          yearsOfExp: 2,
          availability: '1 mois',
          skills: {
            create: [
              { skill: { connectOrCreate: { where: { name: 'React' }, create: { name: 'React' } } }, level: 4, yearsOfExp: 2 },
              { skill: { connectOrCreate: { where: { name: 'JavaScript' }, create: { name: 'JavaScript' } } }, level: 4, yearsOfExp: 2 },
              { skill: { connectOrCreate: { where: { name: 'HTML5' }, create: { name: 'HTML5' } } }, level: 5, yearsOfExp: 2 },
            ],
          },
        },
      },
    },
    include: { candidateProfile: true },
  });

  const cand2Resume = await prisma.resume.create({
    data: {
      profileId: cand2User.candidateProfile!.id,
      type: ResumeType.PLATFORM_BUILDER,
      title: 'Mon CV Conçu sur SmartRecruit',
      extractedText: 'Sarah Mansouri. Développeuse Frontend. React, JavaScript, HTML5, CSS3, Git. 2 ans d\'expérience.',
      isDefault: true,
    },
  });

  await prisma.application.create({
    data: {
      applicationNumber: 'APP-2026-0045',
      jobId: job1.id,
      candidateProfileId: cand2User.candidateProfile!.id,
      resumeId: cand2Resume.id,
      status: ApplicationStatus.UNDER_REVIEW,
      currentStage: 'En cours d\'analyse',
      aiMatchResult: {
        create: {
          overallScore: 62,
          category: AiMatchCategory.PARTIAL_MATCH,
          recommendation: AiRecommendation.APPROVED_FOR_SHORTLIST,
          foundRequiredSkills: ['React'],
          missingRequiredSkills: ['Node.js', 'PostgreSQL', 'TypeScript'],
          foundDesiredSkills: ['Git'],
          missingDesiredSkills: ['Docker', 'AWS'],
          strengths: ['Bonne maîtrise de React en frontend'],
          pointsToVerify: ['Manque d\'expérience en backend Node.js et PostgreSQL'],
          justification: 'Profil junior à potentiel sur la partie React, mais compétences backend à approfondir. À valider manuellement par le recruteur.',
          humanValidated: false,
        },
      },
    },
  });

  console.log(' Candidatures et analyses IA générées avec succès.');
  console.log(' Seed SmartRecruit ATS terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);

  })
  .finally(async () => {
    await prisma.$disconnect();
  });
