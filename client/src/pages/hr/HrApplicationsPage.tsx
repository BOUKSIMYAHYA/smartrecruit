import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiClient } from '../../services/api.js';
import { Application, ApplicationStatus, Job } from '../../types/index.js';
import { StatusBadge, AiScoreBadge } from '../../components/common/Badge.js';
import { KanbanBoard } from '../../components/hr/KanbanBoard.js';
import { Modal } from '../../components/common/Modal.js';
import {
  Users,
  Search,
  Filter,
  FileSpreadsheet,
  Upload,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const HrApplicationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [applications, setApplications] = useState<Application[]>([]);
  const [kanbanData, setKanbanData] = useState<Record<string, Application[]>>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get('jobId') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Batch Upload Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTargetJobId, setBatchTargetJobId] = useState('');
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      if (viewMode === 'table') {
        const params: any = { page, limit: 15 };
        if (search) params.search = search;
        if (selectedJobId) params.jobId = selectedJobId;
        if (statusFilter) params.status = statusFilter;
        if (categoryFilter) params.category = categoryFilter;

        const res = await ApiClient.getHrApplications(params);
        setApplications(res.applications);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      } else {
        const res = await ApiClient.getKanban(selectedJobId || undefined);
        setKanbanData(res.kanban);
      }
    } catch (err) {
      console.error('Erreur chargement candidatures RH:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    ApiClient.getHrJobs()
      .then((res) => {
        setJobs(res.jobs);
        if (res.jobs.length > 0 && !batchTargetJobId) {
          setBatchTargetJobId(res.jobs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [viewMode, page, selectedJobId, statusFilter, categoryFilter]);

  const handleKanbanMoveStage = async (applicationId: string, targetStatus: ApplicationStatus) => {
    try {
      await ApiClient.updateApplicationStatus(applicationId, targetStatus, `Déplacé via le Kanban vers ${targetStatus}`);
      await fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du déplacement d\'étape.');
    }
  };

  const handleQuickStatusChange = async (appId: string, newStatus: string) => {
    try {
      await ApiClient.updateApplicationStatus(appId, newStatus, `Statut mis à jour directement depuis le tableau`);
      await fetchApplications();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTargetJobId || batchFiles.length === 0) return;
    setIsBatchUploading(true);
    setBatchResult(null);
    try {
      const res = await ApiClient.batchUploadCv(batchTargetJobId, batchFiles);
      setBatchResult(res);
      await fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du traitement par lot.');
    } finally {
      setIsBatchUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Gestion centralisée des candidatures
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Visualisez, filtrez, classez et faites progresser les candidats à travers le pipeline de recrutement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-navy-800 p-1 rounded-xl border border-gray-200 dark:border-navy-700">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-navy-900 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tableau</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-navy-900 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            onClick={() => {
              setBatchFiles([]);
              setBatchResult(null);
              setIsBatchModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-navy-900 text-white hover:bg-navy-800 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Importation de CV par lot</span>
          </button>

          <button
            onClick={async () => {
              try {
                await ApiClient.downloadApplicationsCsv();
              } catch (err: any) {
                alert(err.message || 'Erreur lors de l\'exportation CSV');
              }
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f8f9fa] hover:bg-[#e2e5e7] text-gray-700 transition-all flex items-center gap-1.5 border border-[#e2e5e7]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-navy-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchApplications()}
            placeholder="Rechercher par nom, e-mail, réf..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white"
          >
            <option value="">Tous les postes</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.reference})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            <option value="SUBMITTED">Candidature reçue</option>
            <option value="UNDER_REVIEW">En cours d'analyse</option>
            <option value="PRESELECTED">Présélectionné</option>
            <option value="PHONE_INTERVIEW">Entretien téléphonique</option>
            <option value="TECHNICAL_INTERVIEW">Entretien technique</option>
            <option value="HR_INTERVIEW">Entretien RH</option>
            <option value="DECISION_PENDING">En attente de décision</option>
            <option value="ACCEPTED">Accepté</option>
            <option value="REJECTED">Refusé</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white"
          >
            <option value="">Toutes catégories IA</option>
            <option value="HIGH_MATCH">MATCH ÉLEVÉ (&gt;= 75%)</option>
            <option value="PARTIAL_MATCH">MATCH PARTIEL (45-74%)</option>
            <option value="LOW_MATCH">MATCH FAIBLE (&lt; 45%)</option>
          </select>
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {viewMode === 'kanban' ? (
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-200 dark:border-navy-800">
          <KanbanBoard kanbanData={kanbanData} onMoveStage={handleKanbanMoveStage} />
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-gray-200 dark:border-navy-800 overflow-hidden">
          <div className="overflow-x-auto mobile-touch-scroll">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300 min-w-[850px]">
              <thead className="bg-gray-50 dark:bg-navy-800 text-[11px] uppercase font-bold text-gray-400 border-b border-gray-200 dark:border-navy-700">
                <tr>
                  <th className="py-3.5 px-4">Candidat</th>
                  <th className="py-3.5 px-4">Poste ciblé</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Compétences clés</th>
                  <th className="py-3.5 px-4">Exp.</th>
                  <th className="py-3.5 px-4">Score IA</th>
                  <th className="py-3.5 px-4">Statut étape</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-800 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                      <span>Chargement des candidatures...</span>
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-gray-400 italic">
                      Aucune candidature ne correspond à vos filtres.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => {
                    const candUser = app.candidateProfile?.user;
                    const candName = candUser
                      ? `${candUser.firstName || ''} ${candUser.lastName || ''}`.trim() || candUser.email
                      : 'Candidat';
                    const skillsList = app.candidateProfile?.skills?.map((s) => s.skill.name) || [];

                    return (
                      <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/hr/applications/${app.id}`}
                            className="font-bold text-gray-900 dark:text-white hover:text-blue-600 transition-colors"
                          >
                            {candName}
                          </Link>
                          <div className="font-mono text-[10px] text-gray-400 mt-0.5">{app.applicationNumber}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{app.job?.title}</span>
                          <span className="block text-[10px] text-gray-400">{app.job?.reference}</span>
                        </td>

                        <td className="py-3.5 px-4 text-[11px]">
                          <div>{candUser?.email}</div>
                          <div className="text-gray-400">{app.candidateProfile?.phone || 'Non renseigné'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {skillsList.slice(0, 3).map((sk, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300">
                                {sk}
                              </span>
                            ))}
                            {skillsList.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{skillsList.length - 3}</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold">
                          {app.candidateProfile?.yearsOfExp !== undefined ? `${app.candidateProfile.yearsOfExp}a` : '-'}
                        </td>

                        <td className="py-3.5 px-4">
                          <AiScoreBadge
                            score={app.aiMatchResult?.overallScore}
                            category={app.aiMatchResult?.category}
                          />
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={app.status}
                            onChange={(e) => handleQuickStatusChange(app.id, e.target.value)}
                            className="text-[11px] font-semibold p-1 rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-gray-800 dark:text-gray-200"
                          >
                            <option value="SUBMITTED">Reçue</option>
                            <option value="UNDER_REVIEW">En analyse</option>
                            <option value="PRESELECTED">Présélectionné</option>
                            <option value="PHONE_INTERVIEW">Entretien Tél</option>
                            <option value="TECHNICAL_INTERVIEW">Entretien Tech</option>
                            <option value="HR_INTERVIEW">Entretien RH</option>
                            <option value="ACCEPTED">Accepté</option>
                            <option value="REJECTED">Refusé</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                          {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/hr/applications/${app.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Dossier</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-gray-200 dark:border-navy-700 flex items-center justify-between text-xs text-gray-500">
            <span>
              Total : <strong>{totalCount}</strong> candidature(s) • Page {page} sur {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-navy-700 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-navy-700 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Upload Modal */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Importation et analyse IA de plusieurs CV en lot"
        maxWidth="xl"
      >
        <form onSubmit={handleBatchSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Poste cible pour l'analyse IA de correspondance
            </label>
            <select
              value={batchTargetJobId}
              onChange={(e) => setBatchTargetJobId(e.target.value)}
              required
              className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl font-medium"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.reference})
                </option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-navy-700 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <label className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">
              <span>Sélectionner jusqu'à 10 fichiers PDF</span>
              <input
                type="file"
                multiple
                accept="application/pdf"
                onChange={(e) => setBatchFiles(Array.from(e.target.files || []))}
                className="hidden"
              />
            </label>
            <p className="text-[10px] text-gray-400 mt-1">Extraction de texte et calcul de score IA immédiat pour chaque CV</p>
            {batchFiles.length > 0 && (
              <div className="mt-3 space-y-1">
                <span className="font-bold text-emerald-600">{batchFiles.length} fichier(s) sélectionné(s) :</span>
                <div className="text-[11px] text-gray-500 max-h-24 overflow-y-auto">
                  {batchFiles.map((f, i) => (
                    <div key={i}>{f.name} ({(f.size / 1024).toFixed(0)} Ko)</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {batchResult && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <p className="font-bold">{batchResult.message}</p>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-gray-100 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="px-4 py-2 font-semibold text-gray-500"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={isBatchUploading || batchFiles.length === 0}
              className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isBatchUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Lancer l'import et le matching IA</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
