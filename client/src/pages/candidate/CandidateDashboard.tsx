import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { ApiClient } from '../../services/api.js';
import { Application, Job, Notification } from '../../types/index.js';
import { StatusBadge, ContractBadge } from '../../components/common/Badge.js';
import {
  Send,
  Clock,
  CheckCircle2,
  Calendar,
  XCircle,
  Briefcase,
  ArrowRight,
  FileText,
  UserCheck,
  Sparkles,
  Bell,
  ChevronRight,
} from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, jobsRes, notifRes] = await Promise.all([
          ApiClient.getMyApplications().catch(() => ({ applications: [] })),
          ApiClient.getPublicJobs().catch(() => ({ jobs: [] })),
          ApiClient.getMyNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
        ]);
        setApplications(appsRes.applications);
        setLatestJobs(jobsRes.jobs.slice(0, 4));
        setNotifications(notifRes.notifications);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = {
    total: applications.length,
    underReview: applications.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED').length,
    preselected: applications.filter((a) => a.status === 'PRESELECTED').length,
    interviews: applications.reduce((acc, a) => acc + (a.interviews?.length || 0), 0),
    accepted: applications.filter((a) => a.status === 'ACCEPTED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  const statCards = [
    { label: 'Candidatures envoyées', value: stats.total, icon: Send, color: 'text-[#004b82]', bg: 'bg-blue-50', path: '/candidate/applications' },
    { label: 'En cours d\'analyse', value: stats.underReview, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/candidate/applications' },
    { label: 'Profils présélectionnés', value: stats.preselected, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50', path: '/candidate/applications' },
    { label: 'Entretiens programmés', value: stats.interviews, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', path: '/candidate/applications' },
    { label: 'Candidatures retenues', value: stats.accepted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/candidate/applications' },
    { label: 'Non retenues', value: stats.rejected, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', path: '/candidate/applications' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-estc-blue to-[#003660] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-[#004b82]/30">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 mb-3 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Portail Candidat – EST Casablanca
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bonjour, {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Candidat'} !
            </h1>
            <p className="mt-2 text-sm text-blue-50 leading-relaxed">
              Bienvenue sur votre espace personnel SmartRecruit ATS. Suivez vos candidatures en direct, préparez votre CV avec notre créateur interactif et explorez les opportunités professionnelles.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/candidate/jobs"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-estc-blue hover:bg-gray-100 shadow-md transition-all"
              >
                <Briefcase className="w-4 h-4" />
                <span>Consulter les offres disponibles</span>
              </Link>
              <Link
                to="/candidate/cv-builder"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/30 transition-all backdrop-blur-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Créer mon CV en ligne</span>
              </Link>
            </div>
          </div>

          <Link
            to="/candidate/profile"
            className="hidden md:flex flex-col items-center p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-center shrink-0 group"
            title="Accéder à mon profil, photo et mot de passe"
          >
            <div className="w-16 h-16 rounded-full bg-white text-[#004b82] flex items-center justify-center font-bold text-xl overflow-hidden shadow-md border-2 border-white/80">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.firstName ? user.firstName[0].toUpperCase() : 'C'}</span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-2 text-white group-hover:underline">Mon Profil</span>
          </Link>
        </div>
      </div>

      {/* LATEST RH NOTIFICATION ALERT (IF ANY) */}
      {notifications.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-[#004b82]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-estc-blue text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  Dernière mise à jour RH : {notifications[0].title}
                </span>
                <span className="text-[10px] text-estc-gray">
                  {new Date(notifications[0].createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-estc-gray mt-0.5 line-clamp-1">
                {notifications[0].message}
              </p>
            </div>
          </div>

          <Link
            to="/candidate/applications"
            className="text-xs font-bold text-estc-blue hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
          >
            <span>Voir le suivi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              to={stat.path}
              className="bg-white rounded-xl p-4 shadow-xs border border-[#e2e5e7] hover:border-[#004b82] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#868889] group-hover:text-[#004b82] transition-colors line-clamp-1">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-3">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Two Columns: Recent Applications & Latest Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Mes dernières candidatures</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Suivi en direct des étapes de recrutement</p>
            </div>
            <Link
              to="/candidate/applications"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-gray-100 dark:divide-navy-800">
            {applications.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Vous n'avez pas encore postulé à une offre.</p>
                <Link to="/candidate/jobs" className="text-[#004b82] font-semibold hover:underline mt-1 inline-block">
                  Explorer les opportunités
                </Link>
              </div>
            ) : (
              applications.slice(0, 4).map((app) => (
                <div key={app.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">{app.job?.title}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Réf: {app.job?.reference} • Postulé le {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Available Jobs */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Dernières opportunités</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Postes récemment ouverts au recrutement</p>
            </div>
            <Link
              to="/candidate/jobs"
              className="text-xs font-semibold text-[#004b82] hover:text-[#003660] flex items-center gap-1"
            >
              <span>Toutes les offres</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {latestJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                Aucune offre publiée pour le moment.
              </div>
            ) : (
              latestJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl border border-gray-100 dark:border-navy-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/20 dark:hover:bg-navy-800/40 transition-all flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{job.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <span>{job.department}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ContractBadge type={job.contractType} />
                    <Link
                      to={`/candidate/jobs/${job.slug || job.id}`}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#004b82]/10 text-[#004b82] hover:bg-[#004b82] hover:text-white transition-colors"
                    >
                      Détails
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
