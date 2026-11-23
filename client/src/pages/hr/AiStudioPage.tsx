import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api.js';
import { Application } from '../../types/index.js';
import { AiChatWidget } from '../../components/hr/AiChatWidget.js';
import { AiScoreBadge } from '../../components/common/Badge.js';
import {
  Sparkles,
  Bot,
  Layers,
  Scale,
  Users,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export const AiStudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'compare'>('assistant');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    ApiClient.getHrApplications({ limit: 50 })
      .then((res) => {
        setApplications(res.applications);
        if (res.applications.length >= 2) {
          setSelectedAppIds([res.applications[0].id, res.applications[1].id]);
        }
      })
      .catch(() => {});
  }, []);

  const handleRunComparison = async () => {
    if (selectedAppIds.length < 2) {
      alert('Veuillez sélectionner au moins 2 candidats à comparer.');
      return;
    }
    setIsComparing(true);
    try {
      const res = await ApiClient.compareCandidates(selectedAppIds);
      setComparisonResults(res.comparison);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la comparaison.');
    } finally {
      setIsComparing(false);
    }
  };

  const toggleSelectApp = (id: string) => {
    if (selectedAppIds.includes(id)) {
      setSelectedAppIds(selectedAppIds.filter((item) => item !== id));
    } else {
      if (selectedAppIds.length >= 4) {
        alert('Vous pouvez comparer jusqu\'à 4 candidats simultanément.');
        return;
      }
      setSelectedAppIds([...selectedAppIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Agent IA de Recrutement & Comparateur
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-1">
            Studio IA – Analyse Sémantique & Assistant RH
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Interrogez la base de données en langage naturel ou comparez plusieurs candidats côte à côte.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-gray-100 dark:bg-navy-800 p-1 rounded-xl border border-gray-200 dark:border-navy-700">
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'assistant'
                ? 'bg-white dark:bg-navy-900 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Assistant Conversationnel RH</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'compare'
                ? 'bg-white dark:bg-navy-900 text-purple-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Comparateur de Candidats</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'assistant' ? (
        <AiChatWidget />
      ) : (
        <div className="space-y-6">
          {/* Candidate Selection Box */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Sélectionnez les candidats à comparer (2 à 4 profils)
                </h2>
                <p className="text-xs text-gray-400">
                  {selectedAppIds.length} candidat(s) sélectionné(s)
                </p>
              </div>

              <button
                onClick={handleRunComparison}
                disabled={selectedAppIds.length < 2 || isComparing}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
              >
                {isComparing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Générer la matrice comparative IA</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {applications.map((app) => {
                const candUser = app.candidateProfile?.user;
                const candName = candUser
                  ? `${candUser.firstName || ''} ${candUser.lastName || ''}`.trim() || candUser.email
                  : 'Candidat';
                const isSelected = selectedAppIds.includes(app.id);

                return (
                  <div
                    key={app.id}
                    onClick={() => toggleSelectApp(app.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 text-purple-950 dark:text-purple-200 font-semibold'
                        : 'border-gray-200 dark:border-navy-700 hover:border-gray-300 dark:hover:border-navy-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold line-clamp-1">{candName}</span>
                      <AiScoreBadge
                        score={app.aiMatchResult?.overallScore}
                        category={app.aiMatchResult?.category}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{app.job?.title}</p>
                    <div className="mt-2 text-[10px] text-gray-400">
                      {isSelected ? '[Sélectionné]' : '+ Cliquer pour ajouter'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          {comparisonResults.length > 0 && (
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-gray-200 dark:border-navy-800 overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Matrice Comparative Détaillée
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-navy-700 bg-gray-50/50 dark:bg-navy-900">
                      <th className="p-4 w-44 font-bold text-gray-400 uppercase text-[10px]">Critère</th>
                      {comparisonResults.map((c, i) => (
                        <th key={i} className="p-4 font-bold text-gray-900 dark:text-white border-l border-gray-100 dark:border-navy-800">
                          <div>{c.candidateName}</div>
                          <div className="text-[10px] text-gray-400 font-normal">{c.email}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50/30">Score de Matching IA</td>
                      {comparisonResults.map((c, i) => (
                        <td key={i} className="p-4 border-l border-gray-100 dark:border-navy-800">
                          <AiScoreBadge score={c.aiScore} category={c.aiCategory} size="md" />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50/30">Recommandation IA</td>
                      {comparisonResults.map((c, i) => (
                        <td key={i} className="p-4 border-l border-gray-100 dark:border-navy-800 font-semibold">
                          {c.aiRecommendation === 'APPROVED_FOR_SHORTLIST' ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Présélection validée</span>
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>À vérifier</span>
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50/30">Années d'expérience</td>
                      {comparisonResults.map((c, i) => (
                        <td key={i} className="p-4 border-l border-gray-100 dark:border-navy-800 font-bold">
                          {c.yearsOfExp} an(s)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50/30">Disponibilité</td>
                      {comparisonResults.map((c, i) => (
                        <td key={i} className="p-4 border-l border-gray-100 dark:border-navy-800">
                          {c.availability}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50/30">Compétences maîtrisées</td>
                      {comparisonResults.map((c, i) => (
                        <td key={i} className="p-4 border-l border-gray-100 dark:border-navy-800">
                          <div className="flex flex-wrap gap-1">
                            {c.skills.slice(0, 6).map((sk: string, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50/30">Points forts</td>
                      {comparisonResults.map((c, i) => (
                        <td key={i} className="p-4 border-l border-gray-100 dark:border-navy-800 text-emerald-700 text-[11px]">
                          <ul className="list-disc list-inside space-y-0.5">
                            {c.strengths.slice(0, 3).map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50/30">Points de vigilance</td>
                      {comparisonResults.map((c, i) => (
                        <td key={i} className="p-4 border-l border-gray-100 dark:border-navy-800 text-amber-700 text-[11px]">
                          <ul className="list-disc list-inside space-y-0.5">
                            {c.pointsToVerify.slice(0, 3).map((p: string, idx: number) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
