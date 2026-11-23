import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { JobStatus, ContractType } from '@prisma/client';
import { AuditService } from '../middleware/audit.js';

const jobSchema = z.object({
  title: z.string().min(3, 'Le titre du poste doit comporter au moins 3 caractères'),
  department: z.string().min(2, 'Le département est requis'),
  location: z.string().min(2, 'La localisation est requise'),
  isRemote: z.boolean().default(false),
  contractType: z.nativeEnum(ContractType).default(ContractType.CDI),
  openings: z.number().int().min(1).default(1),
  description: z.string().min(10, 'La description doit être détaillée'),
  responsibilities: z.string().optional(),
  requiredExpYears: z.number().int().min(0).default(2),
  availability: z.string().optional(),
  salaryMin: z.number().int().optional().nullable(),
  salaryMax: z.number().int().optional().nullable(),
  status: z.nativeEnum(JobStatus).default(JobStatus.DRAFT),
  deadline: z.string().optional().nullable(),
  requiredSkills: z.array(z.string()).default([]),
  desiredSkills: z.array(z.string()).default([]),
});

export class JobController {
  /**
   * Public or Candidate list of published jobs with search & filters
   */
  public static async listPublicJobs(req: Request, res: Response): Promise<void> {
    try {
      const { search, department, contractType, location, isRemote } = req.query;

      const whereClause: any = {
        status: JobStatus.PUBLISHED,
      };

      if (search) {
        whereClause.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } },
          { requirements: { some: { skillName: { contains: String(search), mode: 'insensitive' } } } },
        ];
      }

      if (department) whereClause.department = String(department);
      if (contractType) whereClause.contractType = contractType as ContractType;
      if (location) whereClause.location = { contains: String(location), mode: 'insensitive' };
      if (isRemote === 'true') whereClause.isRemote = true;

      const jobs = await prisma.job.findMany({
        where: whereClause,
        include: {
          requirements: true,
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ jobs });
    } catch (error) {
      console.error('Erreur listPublicJobs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des offres.' });
    }
  }

  /**
   * HR list of all jobs (draft, published, archived) with collaborator filter
   */
  public static async listHrJobs(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { status, search } = req.query;

      const whereClause: any = {};

      if (status && Object.values(JobStatus).includes(status as JobStatus)) {
        whereClause.status = status as JobStatus;
      }

      if (search) {
        whereClause.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { reference: { contains: String(search), mode: 'insensitive' } },
          { department: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      // Operational manager restriction
      if (user.role === 'OPERATIONAL_MANAGER') {
        whereClause.collaborators = {
          some: { userId: user.id },
        };
      }

      const jobs = await prisma.job.findMany({
        where: whereClause,
        include: {
          requirements: true,
          createdBy: { select: { firstName: true, lastName: true, email: true } },
          collaborators: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ jobs });
    } catch (error) {
      console.error('Erreur listHrJobs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des offres RH.' });
    }
  }

  /**
   * Get single job by ID or slug
   */
  public static async getJob(req: Request, res: Response): Promise<void> {
    try {
      const { idOrSlug } = req.params;

      const job = await prisma.job.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }, { reference: idOrSlug }],
        },
        include: {
          requirements: true,
          createdBy: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { applications: true } },
        },
      });

      if (!job) {
        res.status(404).json({ error: 'Offre d\'emploi introuvable.' });
        return;
      }

      res.json({ job });
    } catch (error) {
      console.error('Erreur getJob:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du détail de l\'offre.' });
    }
  }

  /**
   * Create a new job offer with requirements (HR Only)
   */
  public static async createJob(req: Request, res: Response): Promise<void> {
    try {
      const parsed = jobSchema.parse(req.body);
      const user = req.user!;

      // Generate unique reference (e.g. REC-2026-104)
      const count = await prisma.job.count();
      const reference = `REC-2026-${String(count + 101).padStart(3, '0')}`;
      const slug = `${parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${reference.toLowerCase()}`;

      const job = await prisma.job.create({
        data: {
          reference,
          title: parsed.title,
          slug,
          department: parsed.department,
          location: parsed.location,
          isRemote: parsed.isRemote,
          contractType: parsed.contractType,
          openings: parsed.openings,
          description: parsed.description,
          responsibilities: parsed.responsibilities,
          requiredExpYears: parsed.requiredExpYears,
          availability: parsed.availability,
          salaryMin: parsed.salaryMin,
          salaryMax: parsed.salaryMax,
          status: parsed.status,
          deadline: parsed.deadline ? new Date(parsed.deadline) : null,
          createdById: user.id,
          requirements: {
            create: [
              ...parsed.requiredSkills.map((skillName) => ({
                skillName: skillName.trim(),
                isRequired: true,
                minExpYears: parsed.requiredExpYears,
              })),
              ...parsed.desiredSkills.map((skillName) => ({
                skillName: skillName.trim(),
                isRequired: false,
                minExpYears: 1,
              })),
            ],
          },
        },
        include: { requirements: true },
      });

      await AuditService.log(req, 'JOB_CREATE', 'Job', job.id, { title: job.title, reference });

      res.status(201).json({ job });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0]?.message || 'Données invalides.' });
        return;
      }
      console.error('Erreur createJob:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la création de l\'offre.' });
    }
  }

  /**
   * Update job offer (HR Only)
   */
  public static async updateJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = jobSchema.partial().parse(req.body);

      // Verify job exists
      const existing = await prisma.job.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Offre d\'emploi introuvable.' });
        return;
      }

      // Update basic fields
      const updated = await prisma.$transaction(async (tx) => {
        if (parsed.requiredSkills || parsed.desiredSkills) {
          // Replace requirements
          await tx.jobRequirement.deleteMany({ where: { jobId: id } });
          const newReqs = [
            ...(parsed.requiredSkills || []).map((skillName) => ({
              jobId: id,
              skillName: skillName.trim(),
              isRequired: true,
              minExpYears: parsed.requiredExpYears ?? existing.requiredExpYears,
            })),
            ...(parsed.desiredSkills || []).map((skillName) => ({
              jobId: id,
              skillName: skillName.trim(),
              isRequired: false,
              minExpYears: 1,
            })),
          ];
          if (newReqs.length > 0) {
            await tx.jobRequirement.createMany({ data: newReqs });
          }
        }

        return tx.job.update({
          where: { id },
          data: {
            title: parsed.title,
            department: parsed.department,
            location: parsed.location,
            isRemote: parsed.isRemote,
            contractType: parsed.contractType,
            openings: parsed.openings,
            description: parsed.description,
            responsibilities: parsed.responsibilities,
            requiredExpYears: parsed.requiredExpYears,
            availability: parsed.availability,
            salaryMin: parsed.salaryMin,
            salaryMax: parsed.salaryMax,
            status: parsed.status,
            deadline: parsed.deadline ? new Date(parsed.deadline) : undefined,
          },
          include: { requirements: true },
        });
      });

      await AuditService.log(req, 'JOB_UPDATE', 'Job', id, { updatedFields: Object.keys(req.body) });

      res.json({ job: updated });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0]?.message || 'Données invalides.' });
        return;
      }
      console.error('Erreur updateJob:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'offre.' });
    }
  }

  /**
   * Delete or archive job (HR Only)
   */
  public static async deleteJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const job = await prisma.job.findUnique({
        where: { id },
        include: { _count: { select: { applications: true } } },
      });

      if (!job) {
        res.status(404).json({ error: 'Offre introuvable.' });
        return;
      }

      // If applications exist, archive rather than hard-delete to preserve legal audit history
      if (job._count.applications > 0) {
        const archived = await prisma.job.update({
          where: { id },
          data: { status: JobStatus.ARCHIVED },
        });
        await AuditService.log(req, 'JOB_ARCHIVE', 'Job', id, { reason: 'Applications exist' });
        res.json({ message: 'L\'offre comporte des candidatures et a été archivée avec succès.', job: archived });
        return;
      }

      await prisma.job.delete({ where: { id } });
      await AuditService.log(req, 'JOB_DELETE', 'Job', id, { title: job.title });

      res.json({ message: 'Offre supprimée définitivement avec succès.' });
    } catch (error) {
      console.error('Erreur deleteJob:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'offre.' });
    }
  }
}
