import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiClient } from '../../services/api.js';
import { Application, ApplicationStatus, InterviewType } from '../../types/index.js';
import { StatusBadge, AiScoreBadge, RoleBadge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Star,
  Download,
  FileText,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Clock,
  MessageSquare,
  Video,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Human Validation State
  const [validationDecision, setValidationDecision] = useState('');
  const [validationNotes, setValidationNotes] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Interview Modal
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewType, setInterviewType] = useState<InterviewType>('PHONE');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('10:00');
  const [interviewDuration, setInterviewDuration] = useState(45);
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/rec-interview');
  const [isScheduling, setIsScheduling] = useState(false);

  // Note state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Talent Pool & Favorite State
  const [isInTalentPool, setIsInTalentPool] = useState(false);

  const fetchApplication = async () => {
    if (!id) return;
    try {
      const res = await ApiClient.getApplicationDetail(id);
      setApplication(res.application);
      setIsInTalentPool(Boolean(res.application.candidateProfile?.inTalentPool));
    } catch (err) {
      console.error('Erreur getApplicationDetail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleDownloadCv = async () => {
    if (!application?.resume?.id) return;
    try {
      const res = await ApiClient.getResumeDownloadUrl(application.resume.id);
      window.open(res.downloadUrl, '_blank');
    } catch (err: any) {
      alert(err.message || 'Impossible de télécharger le CV.');
    }
  };

  const handleHumanValidation = async (decision: string) => {
    if (!application) return;
    setIsValidating(true);
    try {
      await ApiClient.humanValidation(application.id, decision, validationNotes);
      await fetchApplication();
      alert('Validation humaine enregistrée avec succès dans le registre d\'audit !');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la validation.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !interviewDate) return;
    setIsScheduling(true);
    try {
      const scheduledAt = new Date(`${interviewDate}T${interviewTime}:00`);
      await ApiClient.scheduleInterview({
        applicationId: application.id,
        type: interviewType,
        title: `Entretien ${interviewType} - ${application.job.title}`,
        scheduledAt,
        durationMinutes: Number(interviewDuration),
        meetingLink,
      });
      setIsInterviewModalOpen(false);
      await fetchApplication();
      alert('Entretien planifié et convocation par e-mail envoyée au candidat !');
    } catch (err: any) {
      alert(err.message || 'Erreur planification entretien.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !newNoteContent.trim()) return;
    setIsSubmittingNote(true);
    try {
      await ApiClient.addRecruitmentNote(application.id, newNoteContent);
      setNewNoteContent('');
      await fetchApplication();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleToggleTalentPool = async () => {
    if (!application?.candidateProfile?.id) return;
    try {
      const res = await ApiClient.toggleTalentPool(application.candidateProfile.id);
      setIsInTalentPool(res.profile.inTalentPool);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleFavorite = async () => {
    if (!application?.candidateProfile?.id) return;
    try {
      await ApiClient.toggleFavorite(application.candidateProfile.id);
      alert('Statut favori mis à jour.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-24 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#004b82] mb-2" />
        <p className="text-xs">Chargement du dossier candidat...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-12 text-center text-gray-400 border border-gray-200 dark:border-navy-800">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-2" />
        <p className="text-sm font-semibold">Candidature introuvable</p>
        <Link to="/hr/applications" className="text-xs text-[#004b82] font-bold mt-2 inline-block hover:underline">
          Retour aux candidatures
        </Link>
      </div>
    );
  }

  const candUser = application.candidateProfile?.user;
  const candName = candUser
    ? `${candUser.firstName || ''} ${candUser.lastName || ''}`.trim() || candUser.email
    : 'Candidat';

  const aiResult = application.aiMatchResult;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/hr/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#868889] hover:text-[#004b82] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des candidatures</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className="p-2 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-amber-500 hover:bg-amber-50 transition-colors"
            title="Favori recruteur"
          >
            <Star className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleTalentPool}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${isInTalentPool
              ? 'bg-teal-50 text-teal-700 border-teal-300'
              : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-navy-700 hover:bg-gray-50'
              }`}
          >
            <Star className={`w-3.5 h-3.5 ${isInTalentPool ? 'fill-teal-600 text-teal-600' : ''}`} />
            <span>{isInTalentPool ? 'Dans le vivier' : 'Ajouter au vivier'}</span>
          </button>

          <button
            onClick={() => setIsInterviewModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#004b82] hover:bg-[#003660] text-white shadow-md shadow-blue-900/20 transition-all flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Planifier un entretien</span>
          </button>

          <button
            onClick={handleDownloadCv}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#004b82] border-2 border-[#004b82] hover:bg-[#004b82] hover:text-white transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger le CV</span>
          </button>
        </div>
      </div>

      {/* Main Dossier Header Card */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-navy-800">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#004b82] to-[#002f52] flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-900/20 flex-shrink-0 overflow-hidden border-2 border-white ring-2 ring-[#004b82]/20">
              {candUser?.avatarUrl ? (
                <img src={candUser.avatarUrl} alt={candName} className="w-full h-full object-cover" />
              ) : (
                candUser?.firstName ? candUser.firstName[0].toUpperCase() : candUser?.email[0].toUpperCase()
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{candName}</h1>
                <StatusBadge status={application.status} />
              </div>

              <p className="text-xs font-semibold text-[#004b82]">
                Candidature pour : {application.job?.title} (Réf : {application.job?.reference})
              </p>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {candUser?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {application.candidateProfile?.phone || 'Non renseigné'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {application.candidateProfile?.city || 'France'}
                </span>
                <span className="font-mono text-[10px] text-gray-400">
                  N° {application.applicationNumber}
                </span>
              </div>
            </div>
          </div>

          {/* AI Score Badge in Header */}
          <div className="bg-gray-50 dark:bg-navy-800 p-4 rounded-xl border border-gray-200 dark:border-navy-700 flex flex-col items-center justify-center w-full md:w-auto md:min-w-[160px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Score IA Global
            </span>
            <AiScoreBadge
              score={aiResult?.overallScore}
              category={aiResult?.category}
              size="lg"
            />
            <span className="text-[10px] text-gray-400 mt-1 font-semibold">
              {aiResult?.recommendation === 'APPROVED_FOR_SHORTLIST' ? '✓ Présélection recommandée' : '⚠ Lacunes détectées'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (AI Matching Report + Human Validation), Right Column (CV & Cover Letter & Notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: AI Matching Agent Report (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI CV Matching Analysis Panel */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Rapport de l'Agent IA – Matching CV
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Hybrid NLP + LLM
              </span>
            </div>

            {aiResult ? (
              <div className="space-y-4 text-xs">
                {/* Explanation / Justification */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-navy-800/80 border border-gray-200 dark:border-navy-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Grille de notation & Synthèse d'évaluation :</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line font-mono text-[11px]">{aiResult.justification}</p>
                </div>

                {/* Required Skills Analysis */}
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Compétences obligatoires du poste :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(aiResult.foundRequiredSkills as string[] || []).map((sk, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        <span>{sk}</span>
                      </span>
                    ))}
                    {(aiResult.missingRequiredSkills as string[] || []).map((sk, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{sk} (Manquant)</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Desired Skills */}
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Compétences souhaitées (Bonus) :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(aiResult.foundDesiredSkills as string[] || []).map((sk, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        + {sk}
                      </span>
                    ))}
                    {(aiResult.missingDesiredSkills as string[] || []).map((sk, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg font-medium bg-gray-100 text-gray-500">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Strengths & Points to Verify */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1.5">Points forts détectés :</p>
                    <ul className="space-y-1 list-disc list-inside text-emerald-900 dark:text-emerald-200 text-[11px]">
                      {(aiResult.strengths as string[] || []).map((str, i) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60">
                    <p className="font-bold text-amber-800 dark:text-amber-300 mb-1.5">Points à vérifier :</p>
                    <ul className="space-y-1 list-disc list-inside text-amber-900 dark:text-amber-200 text-[11px]">
                      {(aiResult.pointsToVerify as string[] || []).map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Aucune analyse IA disponible pour cette candidature.</p>
            )}
          </div>

          {/* STRICT HUMAN VALIDATION PANEL (Requirement 6.4) */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border-2 border-indigo-200 dark:border-indigo-900/60 space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Contrôle Humain Obligatoire (Gouvernance & Éthique)
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Conformément à la politique de sécurité et de conformité légale, <strong>l'IA ne prend jamais de décision définitive seule</strong>. Le recruteur examine le dossier, valide ou déroge manuellement aux recommandations algorithmiques.
            </p>

            {aiResult?.humanValidated ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Dossier validé par validation humaine</span>
                </div>
                <p>Décision : <strong>{aiResult.humanDecision}</strong></p>
                {aiResult.humanNotes && <p>Observations : {aiResult.humanNotes}</p>}
                <p className="text-[10px] text-gray-500 pt-1">
                  Validé par {aiResult.humanValidator?.firstName || aiResult.humanValidator?.email || 'Recruteur'} le{' '}
                  {aiResult.humanValidatedAt ? new Date(aiResult.humanValidatedAt).toLocaleString('fr-FR') : ''}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <textarea
                  rows={2}
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="Notes de validation humaine (justification du recruteur)..."
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleHumanValidation('CONFIRMED_PRESELECTION')}
                    disabled={isValidating}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmer la présélection (RH)</span>
                  </button>

                  <button
                    onClick={() => handleHumanValidation('OVERRIDDEN_MANUAL_REVIEW')}
                    disabled={isValidating}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white shadow-sm flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Valider manuellement avec réserve</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: CV Preview, Cover Letter, Notes (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* CV Information & Actions */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Curriculum Vitae ({application.resume?.type === 'PLATFORM_BUILDER' ? 'Créé sur ATS' : 'PDF'})
                </h3>
              </div>
              <button
                onClick={handleDownloadCv}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Ouvrir</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-navy-800 rounded-xl text-xs space-y-1">
              <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{application.resume?.title}</p>
              <p className="text-[11px] text-gray-400">
                Taille : {application.resume?.fileSize ? `${(application.resume.fileSize / 1024).toFixed(0)} Ko` : 'N/A'} • Déposé le {new Date(application.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>

            {application.resume?.extractedText && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Extrait de texte indexé par l'ATS :
                </p>
                <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-navy-950 rounded-xl text-[11px] font-mono text-gray-600 dark:text-gray-400 leading-relaxed border border-gray-100 dark:border-navy-800 whitespace-pre-wrap">
                  {application.resume.extractedText}
                </div>
              </div>
            )}
          </div>

          {/* Cover Letter */}
          {application.coverLetter?.content && (
            <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Lettre de motivation
              </h3>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-navy-700">
                {application.coverLetter.content}
              </p>
            </div>
          )}

          {/* Internal Recruitment Notes */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Notes internes & Commentaires RH ({application.recruitmentNotes?.length || 0})</span>
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto">
              {(application.recruitmentNotes || []).map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 dark:bg-navy-800 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                    <span>{note.author?.firstName || note.author?.email} ({note.author?.role})</span>
                    <span>{new Date(note.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200">{note.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-gray-100 dark:border-navy-800">
              <input
                type="text"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Ajouter une observation confidentielle..."
                className="flex-1 p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !newNoteContent.trim()}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        title={`Planifier un entretien : ${candName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleScheduleInterview} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Type d'entretien</label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value as InterviewType)}
              className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
            >
              <option value="PHONE">Entretien téléphonique (Screening)</option>
              <option value="TECHNICAL">Entretien technique (Live coding / Cas)</option>
              <option value="HR">Entretien RH approfondi</option>
              <option value="FINAL">Entretien final avec direction</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Heure</label>
              <input
                type="time"
                required
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Durée (minutes)</label>
              <input
                type="number"
                value={interviewDuration}
                onChange={(e) => setInterviewDuration(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Lien Visioconférence</label>
              <input
                type="text"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={() => setIsInterviewModalOpen(false)}
              className="px-4 py-2 font-semibold text-gray-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isScheduling}
              className="px-5 py-2.5 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isScheduling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirmer & Envoyer convocation e-mail</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
