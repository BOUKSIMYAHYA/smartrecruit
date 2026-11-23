import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api.js';
import { Application, ApplicationStatus } from '../../types/index.js';
import { StatusBadge, ContractBadge } from '../../components/common/Badge.js';
import {
  Briefcase,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Video,
  XCircle,
  Loader2,
  Sparkles,
  UserCheck,
  ChevronRight,
  Shield,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PIPELINE_STAGES: Array<{ status: ApplicationStatus; label: string }> = [
  { status: 'SUBMITTED', label: '1. Reçue' },
  { status: 'UNDER_REVIEW', label: '2. En analyse' },
  { status: 'PRESELECTED', label: '3. Présélectionné' },
  { status: 'PHONE_INTERVIEW', label: '4. Entretiens' },
  { status: 'ACCEPTED', label: '5. Décision finale' },
];

const getStageIndex = (status: ApplicationStatus): number => {
  switch (status) {
    case 'SUBMITTED':
      return 0;
    case 'UNDER_REVIEW':
      return 1;
    case 'PRESELECTED':
      return 2;
    case 'PHONE_INTERVIEW':
    case 'TECHNICAL_INTERVIEW':
    case 'HR_INTERVIEW':
    case 'DECISION_PENDING':
      return 3;
    case 'ACCEPTED':
    case 'REJECTED':
      return 4;
    default:
      return 0;
  }
};

export const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      const res = await ApiClient.getMyApplications();
      setApplications(res.applications);
    } catch (err) {
      console.error('Erreur chargement candidatures:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 12000); // Polling for real-time RH updates
    return () => clearInterval(interval);
  }, []);

  const handleWithdraw = async (applicationId: string) => {
    if (!window.confirm('Êtes-vous certain de vouloir retirer votre candidature ? Cette action est irréversible.')) {
      return;
    }
    setWithdrawingId(applicationId);
    try {
      await ApiClient.withdrawApplication(applicationId, 'Retirée à la demande du candidat');
      await fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du retrait de la candidature.');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Mises à jour RH en direct
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-1">
            Mes candidatures & Étapes de recrutement
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Chaque action effectuée par l'équipe RH sur votre candidature est immédiatement mise à jour ici en temps réel.
          </p>
        </div>

        <Link
          to="/candidate/jobs"
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#004b82] text-white hover:bg-[#003660] shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Briefcase className="w-4 h-4" />
          <span>Découvrir de nouvelles offres</span>
        </Link>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#004b82] mb-2" />
            <p className="text-xs">Chargement de vos candidatures...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-[#e2e5e7]">
            <Briefcase className="w-12 h-12 mx-auto text-[#868889] mb-3" />
            <h3 className="text-sm font-bold text-gray-900">Aucune candidature enregistrée</h3>
            <p className="text-xs text-[#868889] mt-1 max-w-sm mx-auto">
              Vous n'avez pas encore postulé à une offre d'emploi. Consultez les opportunités ouvertes et transmettez votre CV.
            </p>
            <Link
              to="/candidate/jobs"
              className="mt-4 inline-block px-5 py-2.5 bg-[#004b82] text-white rounded-xl text-xs font-bold hover:bg-[#003660] transition-colors shadow-sm"
            >
              Consulter les offres d'emploi
            </Link>
          </div>
        ) : (
          applications.map((app) => {
            const currentStageIdx = getStageIndex(app.status);
            const isRejected = app.status === 'REJECTED';
            const isAccepted = app.status === 'ACCEPTED';

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 space-y-6"
              >
                {/* Job Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-navy-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-400 font-bold">
                        {app.applicationNumber}
                      </span>
                      <ContractBadge type={app.job?.contractType || 'CDI'} />
                      <span className="text-xs text-gray-400">Réf : {app.job?.reference}</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                      {app.job?.title}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {app.job?.department} • {app.job?.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} className="text-xs px-3 py-1 font-bold" />
                    {app.status !== 'WITHDRAWN' && app.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        disabled={withdrawingId === app.id}
                        className="text-xs text-gray-400 hover:text-rose-600 font-semibold transition-colors"
                      >
                        {withdrawingId === app.id ? 'Retrait...' : 'Retirer'}
                      </button>
                    )}
                  </div>
                </div>

                {/* VISUAL RECRUITMENT JOURNEY STEPPER */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    <span>Parcours de sélection</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px]">
                      Étape actuelle : {app.currentStage || app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 sm:gap-2">
                    {PIPELINE_STAGES.map((stg, sIdx) => {
                      const isCompleted = sIdx < currentStageIdx || (sIdx === 4 && isAccepted);
                      const isCurrent = sIdx === currentStageIdx;

                      let stepColor = 'bg-gray-200 dark:bg-navy-700 text-gray-400';
                      if (isCompleted) {
                        stepColor = 'bg-emerald-500 text-white';
                      } else if (isCurrent) {
                        stepColor = isRejected ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white animate-pulse';
                      }

                      return (
                        <div key={sIdx} className="space-y-1">
                          <div className={`h-1.5 sm:h-2 rounded-full transition-all ${stepColor}`} />
                          <p
                            className={`text-[8px] sm:text-[10px] truncate font-medium ${isCurrent ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-400'
                              }`}
                          >
                            {stg.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scheduled Interviews Box if any */}
                {app.interviews && app.interviews.length > 0 && (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>Convocation(s) à un entretien</span>
                    </div>
                    {app.interviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="p-3 bg-white dark:bg-navy-900 rounded-lg border border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{interview.title}</p>
                          <p className="text-gray-500 mt-0.5 inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-estc-blue inline" />
                            <span>
                              {new Intl.DateTimeFormat('fr-FR', {
                                dateStyle: 'full',
                                timeStyle: 'short',
                              }).format(new Date(interview.scheduledAt))}{' '}
                              ({interview.durationMinutes} min)
                            </span>
                          </p>
                        </div>
                        {interview.meetingLink && (
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm self-start sm:self-auto"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Rejoindre la visio</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Chronological Status History Timeline */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Historique des actions RH
                    </p>
                  </div>

                  <div className="relative pl-6 space-y-4 border-l-2 border-blue-100 dark:border-navy-800">
                    {app.statusHistory && app.statusHistory.length > 0 ? (
                      app.statusHistory.map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white dark:border-navy-900 shadow-sm" />
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={step.toStatus} className="text-[10px] px-2 py-0.5" />
                              {step.reason && (
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {step.reason}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {new Date(step.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white dark:border-navy-900 shadow-sm" />
                        <div className="flex items-baseline justify-between">
                          <StatusBadge status="SUBMITTED" className="text-[10px] px-2 py-0.5" />
                          <span className="text-[10px] text-gray-400">
                            {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resume Used Details */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-400 border-t border-gray-100 dark:border-navy-800/80 gap-2">
                  <span>
                    CV associé : <strong className="text-gray-700 dark:text-gray-300">{app.resume?.title}</strong> ({app.resume?.type === 'PLATFORM_BUILDER' ? 'Créé sur l\'ATS' : 'Fichier PDF'})
                  </span>
                  <span>Date de dépôt initial : {new Date(app.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
