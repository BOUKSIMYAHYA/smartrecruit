import React, { useState, useEffect } from 'react';
import { Application, ApplicationStatus } from '../../types/index.js';
import { AiScoreBadge } from '../common/Badge.js';
import {
  ChevronRight,
  User,
  Calendar,
  ExternalLink,
  GripVertical,
  ArrowRightLeft,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface KanbanBoardProps {
  kanbanData: Record<string, Application[]>;
  onMoveStage: (applicationId: string, targetStatus: ApplicationStatus) => void;
}

const COLUMNS: Array<{
  id: ApplicationStatus;
  title: string;
  badgeBg: string;
  badgeText: string;
  borderTop: string;
}> = [
  {
    id: 'SUBMITTED',
    title: 'Reçues',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-[#004b82] dark:text-blue-300',
    borderTop: 'border-t-[#004b82]',
  },
  {
    id: 'UNDER_REVIEW',
    title: 'En analyse',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    borderTop: 'border-t-indigo-600',
  },
  {
    id: 'PRESELECTED',
    title: 'Présélectionnés',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    borderTop: 'border-t-purple-600',
  },
  {
    id: 'PHONE_INTERVIEW',
    title: 'Entretien Tél.',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
    borderTop: 'border-t-amber-500',
  },
  {
    id: 'TECHNICAL_INTERVIEW',
    title: 'Entretien Tech.',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/40',
    badgeText: 'text-orange-800 dark:text-orange-300',
    borderTop: 'border-t-orange-500',
  },
  {
    id: 'HR_INTERVIEW',
    title: 'Entretien RH',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/40',
    badgeText: 'text-teal-800 dark:text-teal-300',
    borderTop: 'border-t-teal-600',
  },
  {
    id: 'ACCEPTED',
    title: 'Acceptés',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    borderTop: 'border-t-emerald-600',
  },
  {
    id: 'REJECTED',
    title: 'Non retenus',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/40',
    badgeText: 'text-rose-800 dark:text-rose-300',
    borderTop: 'border-t-rose-600',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ kanbanData, onMoveStage }) => {
  // Local state for instant optimistic drag & drop responsiveness
  const [localData, setLocalData] = useState<Record<string, Application[]>>(kanbanData);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);

  useEffect(() => {
    setLocalData(kanbanData);
  }, [kanbanData]);

  const handleDropCard = (applicationId: string, targetStatus: ApplicationStatus) => {
    // Find where the card is currently located
    let sourceCol: string | null = null;
    let targetApp: Application | null = null;

    for (const [colId, apps] of Object.entries(localData)) {
      const found = apps.find((a) => a.id === applicationId);
      if (found) {
        sourceCol = colId;
        targetApp = found;
        break;
      }
    }

    if (!targetApp || sourceCol === targetStatus) {
      setDraggedAppId(null);
      setDragOverColumn(null);
      return;
    }

    // Optimistically move card in UI immediately
    const updated = { ...localData };
    if (sourceCol && updated[sourceCol]) {
      updated[sourceCol] = updated[sourceCol].filter((a) => a.id !== applicationId);
    }

    const updatedApp: Application = { ...targetApp, status: targetStatus };
    updated[targetStatus] = [updatedApp, ...(updated[targetStatus] || [])];
    setLocalData(updated);

    setDraggedAppId(null);
    setDragOverColumn(null);

    // Call parent handler to update backend & send email notifications
    onMoveStage(applicationId, targetStatus);
  };

  return (
    <div className="space-y-3">
      {/* Helper guide banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-white dark:bg-navy-900 border border-[#e2e5e7] dark:border-navy-800 text-xs text-[#868889]">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-[#004b82] shrink-0" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            Glisser-Déposer actif :
          </span>
          <span className="truncate">
            Déplacez une candidature pour changer son étape.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] font-bold text-[#004b82] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg shrink-0">
          Mises à jour automatiques en direct
        </span>
      </div>

      {/* Kanban Columns Grid */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 pt-1 select-none min-h-[500px] mobile-touch-scroll snap-x snap-mandatory">
        {COLUMNS.map((col) => {
          const apps = localData[col.id] || [];
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== col.id) {
                  setDragOverColumn(col.id);
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOverColumn(col.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  if (dragOverColumn === col.id) setDragOverColumn(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
                if (appId) {
                  handleDropCard(appId, col.id);
                }
              }}
              className={`flex-shrink-0 w-[84vw] sm:w-80 snap-center bg-[#f8f9fa] dark:bg-navy-900/60 rounded-2xl border transition-all flex flex-col max-h-[760px] ${
                col.borderTop
              } border-t-4 ${
                isOver
                  ? 'border-2 border-[#004b82] bg-blue-50/70 dark:bg-blue-950/40 shadow-lg ring-2 ring-[#004b82]/20'
                  : 'border-[#e2e5e7] dark:border-navy-800'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-[#e2e5e7] dark:border-navy-800 flex items-center justify-between bg-white dark:bg-navy-900 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
                    {col.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${col.badgeBg} ${col.badgeText} shadow-2xs`}
                  >
                    {apps.length}
                  </span>
                </div>
              </div>

              {/* Cards List / Drop Target */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 transition-colors">
                {/* Visual drop indicator when hovering */}
                {isOver && (
                  <div className="border-2 border-dashed border-[#004b82] rounded-xl p-3 text-center text-xs font-bold text-[#004b82] bg-blue-50/80 dark:bg-blue-950/50 animate-pulse flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Déposer la candidature ici</span>
                  </div>
                )}

                {apps.length === 0 && !isOver ? (
                  <div className="text-center py-12 text-xs text-[#868889] italic">
                    Aucun candidat à cette étape
                  </div>
                ) : (
                  apps.map((app) => {
                    const candUser = app.candidateProfile?.user;
                    const candName = candUser
                      ? `${candUser.firstName || ''} ${candUser.lastName || ''}`.trim() || candUser.email
                      : 'Candidat';
                    const isBeingDragged = draggedAppId === app.id;

                    return (
                      <div
                        key={app.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', app.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedAppId(app.id);
                        }}
                        onDragEnd={() => {
                          setDraggedAppId(null);
                          setDragOverColumn(null);
                        }}
                        className={`bg-white dark:bg-navy-800 rounded-xl p-3.5 shadow-xs border transition-all cursor-grab active:cursor-grabbing group ${
                          isBeingDragged
                            ? 'opacity-40 scale-95 border-dashed border-[#004b82] ring-2 ring-[#004b82]/40'
                            : 'border-[#e2e5e7] dark:border-navy-700 hover:border-[#004b82] hover:shadow-md'
                        }`}
                        title="Glissez et déposez cette candidature dans la colonne de votre choix"
                      >
                        {/* Drag Grip Handle & Candidate Info */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-[#004b82] shrink-0 transition-colors" />
                            <div className="w-7 h-7 rounded-full bg-[#004b82] text-white flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden shadow-2xs">
                              {candUser?.avatarUrl ? (
                                <img
                                  src={candUser.avatarUrl}
                                  alt={candName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                candUser?.firstName ? candUser.firstName[0].toUpperCase() : 'C'
                              )}
                            </div>
                            <Link
                              to={`/hr/applications/${app.id}`}
                              className="font-bold text-xs text-gray-900 dark:text-white hover:text-[#004b82] line-clamp-1 transition-colors"
                              title="Voir le dossier détaillé"
                            >
                              {candName}
                            </Link>
                          </div>

                          <AiScoreBadge
                            score={app.aiMatchResult?.overallScore}
                            category={app.aiMatchResult?.category}
                          />
                        </div>

                        {/* Job Position Title */}
                        <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mt-2 line-clamp-1 pl-6">
                          {app.job?.title}
                        </p>

                        {/* Footer details: Reference & Quick Move Picker */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-navy-700/60 text-[10px]">
                          <span className="font-mono text-[9px] bg-gray-100 dark:bg-navy-900 text-gray-500 px-1.5 py-0.5 rounded font-bold">
                            {app.applicationNumber}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Quick Stage Picker dropdown for 1-click move */}
                            <select
                              value={app.status}
                              onChange={(e) =>
                                handleDropCard(app.id, e.target.value as ApplicationStatus)
                              }
                              className="text-[10px] font-bold py-0.5 px-1.5 rounded-lg border border-[#e2e5e7] dark:border-navy-700 bg-[#f8f9fa] dark:bg-navy-900 text-[#004b82] hover:border-[#004b82] transition-colors cursor-pointer"
                              title="Déplacer directement vers une étape"
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.title}
                                </option>
                              ))}
                            </select>

                            <Link
                              to={`/hr/applications/${app.id}`}
                              className="p-1 text-[#868889] hover:text-[#004b82] rounded transition-colors"
                              title="Consulter le dossier"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
