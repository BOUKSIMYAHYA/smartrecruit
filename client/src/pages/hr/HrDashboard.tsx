import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClient } from '../../services/api.js';
import { StatusBadge, AiScoreBadge } from '../../components/common/Badge.js';
import {
  Users,
  Briefcase,
  UserCheck,
  Calendar,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Plus,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Bot,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const HrDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [kpiRes, chartRes, appsRes] = await Promise.all([
          ApiClient.getDashboardKpis().catch(() => ({ kpis: {} })),
          ApiClient.getDashboardCharts().catch(() => ({ charts: {} })),
          ApiClient.getHrApplications({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }).catch(() => ({ applications: [] })),
        ]);
        setKpis(kpiRes.kpis || {});
        setCharts(chartRes.charts || {});
        setRecentApps(appsRes.applications || []);
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const COLORS = ['#004b82', '#868889', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await ApiClient.downloadApplicationsCsv();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'exportation CSV');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-24 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#004b82] mb-2" />
        <p className="text-xs">Chargement du tableau de bord exécutif RH...</p>
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Candidatures', value: kpis?.totalApplications ?? 0, icon: Users, color: 'text-[#004b82]', bg: 'bg-blue-50', path: '/hr/applications' },
    { label: 'Nouvelles Reçues', value: kpis?.newApplications ?? 0, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/hr/applications' },
    { label: 'Présélectionnés', value: kpis?.preselected ?? 0, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50', path: '/hr/applications' },
    { label: 'Entretiens Planifiés', value: kpis?.interviewsScheduled ?? 0, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', path: '/hr/interviews' },
    { label: 'Candidats Retenus', value: kpis?.accepted ?? 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/hr/applications' },
    { label: 'Offres Actives', value: kpis?.activeJobs ?? 0, icon: Briefcase, color: 'text-[#004b82]', bg: 'bg-blue-50', path: '/hr/jobs' },
    { label: 'Vivier de Talents', value: kpis?.talentPoolCount ?? 0, icon: Sparkles, color: 'text-teal-600', bg: 'bg-teal-50', path: '/hr/talent-pool' },
    { label: 'Délai Moyen d\'Embauche', value: `${kpis?.avgTimeToHireDays ?? 18} jours`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', path: '/hr/dashboard' },
  ];

  return (
    <div className="space-y-8">
      {/* Executive Header & Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e5e7] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#004b82]">
              Système Opérationnel Connecté à PostgreSQL
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
            Tableau de bord RH – Performance & Recrutement
          </h1>
          <p className="text-xs text-[#868889]">
            École Supérieure de Technologie de Casablanca &bull; Pilotage du pipeline et matching IA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/hr/jobs?action=create"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#004b82] hover:bg-[#003660] text-white shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Créer une offre</span>
          </Link>
          <Link
            to="/hr/ai-agent"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[#004b82] border-2 border-[#004b82] hover:bg-[#004b82] hover:text-white shadow-2xs hover:shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4" />
            <span>Assistant IA RH</span>
          </Link>
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-[#f0f5fa] text-gray-800 border border-[#e2e5e7] hover:border-[#004b82] shadow-2xs hover:shadow-sm transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-[#004b82]" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Clickable) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={idx}
              to={kpi.path}
              className="bg-white rounded-xl p-5 shadow-xs border border-[#e2e5e7] hover:border-[#004b82] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#868889] group-hover:text-[#004b82] transition-colors">{kpi.label}</span>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
                <ArrowUpRight className="w-4 h-4 text-[#868889] opacity-0 group-hover:opacity-100 transition-opacity text-[#004b82]" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dynamic Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Applications by Month */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            Évolution des candidatures (6 derniers mois)
          </h2>
          <p className="text-xs text-gray-400 mb-6">Volume mensuel des candidatures enregistrées</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="candidatures" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Applications by Job */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            Répartition par offre d'emploi active
          </h2>
          <p className="text-xs text-gray-400 mb-6">Nombre de candidatures reçues par poste</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.applicationsByJob || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis type="number" stroke="#9CA3AF" fontSize={11} />
                <YAxis dataKey="jobTitle" type="category" stroke="#9CA3AF" fontSize={11} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="applications" fill="#7C3AED" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Status Breakdown Pie */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            Pipeline de recrutement (Répartition par statut)
          </h2>
          <p className="text-xs text-gray-400 mb-4">État actuel des dossiers en cours</p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.statusDistribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {(charts?.statusDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: AI Match Categories */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            Performance du matching IA des CV
          </h2>
          <p className="text-xs text-gray-400 mb-6">Distribution selon le score de correspondance IA</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.aiDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Applications Quick Table */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Dernières candidatures reçues</h2>
            <p className="text-xs text-gray-400">Accès direct aux dossiers récemment soumis</p>
          </div>
          <Link
            to="/hr/applications"
            className="text-xs font-bold text-[#004b82] hover:text-[#003660] flex items-center gap-1"
          >
            <span>Voir toutes les candidatures</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto mobile-touch-scroll -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300 min-w-[620px]">
            <thead className="bg-gray-50 dark:bg-navy-800 text-[11px] uppercase font-bold text-gray-400 border-b border-gray-200 dark:border-navy-700">
              <tr>
                <th className="py-3 px-4">Candidat</th>
                <th className="py-3 px-4">Poste visé</th>
                <th className="py-3 px-4">Score IA</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800 font-medium">
              {recentApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 italic">
                    Aucune candidature récente
                  </td>
                </tr>
              ) : (
                recentApps.map((app) => {
                  const candUser = app.candidateProfile?.user;
                  const candName = candUser
                    ? `${candUser.firstName || ''} ${candUser.lastName || ''}`.trim() || candUser.email
                    : 'Candidat';

                  return (
                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                        {candName}
                      </td>
                      <td className="py-3.5 px-4">{app.job?.title}</td>
                      <td className="py-3.5 px-4">
                        <AiScoreBadge
                          score={app.aiMatchResult?.overallScore}
                          category={app.aiMatchResult?.category}
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/hr/applications/${app.id}`}
                          className="px-2.5 py-1 rounded-lg bg-[#004b82]/10 text-[#004b82] font-semibold hover:bg-[#004b82] hover:text-white transition-colors"
                        >
                          Dossier
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};