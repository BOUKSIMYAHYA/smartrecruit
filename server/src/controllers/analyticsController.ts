import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { ApplicationStatus, JobStatus } from '@prisma/client';

export class AnalyticsController {
  /**
   * Get HR Dashboard Dynamic KPIs
   */
  public static async getDashboardKpis(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalApplications,
        newApplications,
        pendingReview,
        preselected,
        interviewsScheduled,
        accepted,
        rejected,
        activeJobs,
        totalJobs,
        talentPoolCount,
      ] = await Promise.all([
        prisma.application.count(),
        prisma.application.count({ where: { status: ApplicationStatus.SUBMITTED } }),
        prisma.application.count({ where: { status: ApplicationStatus.UNDER_REVIEW } }),
        prisma.application.count({ where: { status: ApplicationStatus.PRESELECTED } }),
        prisma.interview.count({ where: { status: 'SCHEDULED' } }),
        prisma.application.count({ where: { status: ApplicationStatus.ACCEPTED } }),
        prisma.application.count({ where: { status: ApplicationStatus.REJECTED } }),
        prisma.job.count({ where: { status: JobStatus.PUBLISHED } }),
        prisma.job.count(),
        prisma.candidateProfile.count({ where: { inTalentPool: true } }),
      ]);

      // Calculate average time-to-hire (in days) for accepted applications
      const acceptedApps = await prisma.application.findMany({
        where: { status: ApplicationStatus.ACCEPTED },
        select: { createdAt: true, updatedAt: true },
      });

      let avgTimeToHireDays = 18; // Default realistic baseline
      if (acceptedApps.length > 0) {
        const totalDurationMs = acceptedApps.reduce((acc, app) => {
          return acc + (app.updatedAt.getTime() - app.createdAt.getTime());
        }, 0);
        avgTimeToHireDays = Math.max(1, Math.round(totalDurationMs / (acceptedApps.length * 86400000)));
      }

      res.json({
        kpis: {
          totalApplications,
          newApplications,
          pendingReview,
          preselected,
          interviewsScheduled,
          accepted,
          rejected,
          activeJobs,
          totalJobs,
          talentPoolCount,
          avgTimeToHireDays,
        },
      });
    } catch (error) {
      console.error('Erreur getDashboardKpis:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des KPI.' });
    }
  }

  /**
   * Get HR Dashboard Charts Data
   */
  public static async getDashboardCharts(req: Request, res: Response): Promise<void> {
    try {
      // 1. Status Distribution
      const statusCounts = await prisma.application.groupBy({
        by: ['status'],
        _count: { status: true },
      });

      const statusLabels: Record<string, string> = {
        SUBMITTED: 'Reçues',
        UNDER_REVIEW: 'En analyse',
        PRESELECTED: 'Présélectionnés',
        PHONE_INTERVIEW: 'Entretien Téléphonique',
        TECHNICAL_INTERVIEW: 'Entretien Technique',
        HR_INTERVIEW: 'Entretien RH',
        DECISION_PENDING: 'Décision en cours',
        ACCEPTED: 'Acceptés',
        REJECTED: 'Refusés',
        WITHDRAWN: 'Retirées',
      };

      const statusDistribution = statusCounts.map((sc) => ({
        name: statusLabels[sc.status] || sc.status,
        status: sc.status,
        count: sc._count.status,
      }));

      // 2. Applications by Job
      const jobsWithCounts = await prisma.job.findMany({
        where: { status: JobStatus.PUBLISHED },
        select: {
          title: true,
          reference: true,
          department: true,
          _count: { select: { applications: true } },
        },
        orderBy: { applications: { _count: 'desc' } },
        take: 6,
      });

      const applicationsByJob = jobsWithCounts.map((j) => ({
        jobTitle: j.title.length > 20 ? j.title.slice(0, 18) + '...' : j.title,
        fullTitle: j.title,
        reference: j.reference,
        department: j.department,
        applications: j._count.applications,
      }));

      // 3. AI Match Category Distribution
      const aiCategories = await prisma.aiMatchResult.groupBy({
        by: ['category'],
        _count: { category: true },
      });

      const categoryLabels: Record<string, string> = {
        HIGH_MATCH: 'Match Élevé (>= 75%)',
        PARTIAL_MATCH: 'Match Partiel (45-74%)',
        LOW_MATCH: 'Match Faible (< 45%)',
      };

      const aiDistribution = aiCategories.map((ac) => ({
        name: categoryLabels[ac.category] || ac.category,
        count: ac._count.category,
      }));

      // 4. Monthly Trend (last 6 months)
      const now = new Date();
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthlyTrend = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const count = await prisma.application.count({
          where: {
            createdAt: { gte: d, lt: nextD },
          },
        });
        monthlyTrend.push({
          month: months[d.getMonth()],
          candidatures: count,
        });
      }

      res.json({
        charts: {
          statusDistribution,
          applicationsByJob,
          aiDistribution,
          monthlyTrend,
        },
      });
    } catch (error) {
      console.error('Erreur getDashboardCharts:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des graphiques.' });
    }
  }
}
