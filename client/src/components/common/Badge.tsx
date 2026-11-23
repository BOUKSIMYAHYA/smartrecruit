import React from 'react';
import { ApplicationStatus, AiMatchCategory, Role, ContractType } from '../../types/index.js';

export const StatusBadge: React.FC<{ status: ApplicationStatus | string; className?: string }> = ({
  status,
  className = '',
}) => {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    SUBMITTED: { label: 'Candidature reçue', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
    UNDER_REVIEW: { label: 'En cours d\'analyse', bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
    PRESELECTED: { label: 'Présélectionné', bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
    PHONE_INTERVIEW: { label: 'Entretien téléphonique', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
    TECHNICAL_INTERVIEW: { label: 'Entretien technique', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
    HR_INTERVIEW: { label: 'Entretien RH', bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
    DECISION_PENDING: { label: 'En attente de décision', bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
    ACCEPTED: { label: 'Accepté', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
    REJECTED: { label: 'Refusé', bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300' },
    WITHDRAWN: { label: 'Candidature retirée', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  };

  const current = map[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${current.bg} ${current.text} ${className}`}
    >
      {current.label}
    </span>
  );
};

export const AiScoreBadge: React.FC<{
  score?: number | null;
  category?: AiMatchCategory | string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ score, category, size = 'sm' }) => {
  if (score === undefined || score === null) {
    return <span className="text-xs text-gray-400">Non analysé</span>;
  }

  let colorClasses = 'bg-gray-100 text-gray-700 border-gray-200';
  let catLabel = 'FAIBLE';

  if (score >= 75 || category === 'HIGH_MATCH') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    catLabel = 'MATCH ÉLEVÉ';
  } else if (score >= 45 || category === 'PARTIAL_MATCH') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    catLabel = 'MATCH PARTIEL';
  } else {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
    catLabel = 'MATCH FAIBLE';
  }

  if (size === 'lg') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold ${colorClasses}`}>
        <span className="text-xl font-bold">{score}%</span>
        <span className="text-xs uppercase tracking-wide opacity-90">{catLabel}</span>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${colorClasses}`}>
      <span>{score}%</span>
      <span className="text-[10px] opacity-80">({catLabel})</span>
    </span>
  );
};

export const RoleBadge: React.FC<{ role: Role | string }> = ({ role }) => {
  const map: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN: { label: 'SUPER ADMIN', color: 'bg-red-100 text-red-800 border-red-300' },
    HR_ADMIN: { label: 'HR ADMIN', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    HR_MANAGER: { label: 'HR MANAGER', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    OPERATIONAL_MANAGER: { label: 'RESP. OPÉRATIONNEL', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    RECRUITER: { label: 'RECRUTEUR', color: 'bg-teal-100 text-teal-800 border-teal-300' },
    CANDIDATE: { label: 'CANDIDAT', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  };

  const curr = map[role] || { label: role, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-bold tracking-wider rounded border ${curr.color}`}>
      {curr.label}
    </span>
  );
};

export const ContractBadge: React.FC<{ type: ContractType | string }> = ({ type }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      {type}
    </span>
  );
};
