import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { ApiClient } from '../../services/api.js';
import { Job } from '../../types/index.js';
import { ContractBadge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import {
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';

export const JobDetailPage: React.FC = () => {
  const { user } = useAuth();
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cvOption, setCvOption] = useState<'upload' | 'platform'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [platformResumes, setPlatformResumes] = useState<any[]>([]);
  const [selectedPlatformResumeId, setSelectedPlatformResumeId] = useState<string>('');
  const [coverLetterText, setCoverLetterText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState<{ applicationNumber: string } | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (!idOrSlug) return;
      try {
        const res = await ApiClient.getJob(idOrSlug);
        setJob(res.job);
      } catch (err) {
        console.error('Erreur getJob:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [idOrSlug]);

  const openApplyModal = async () => {
    setApplySuccess(null);
    setApplyError(null);
    setSelectedFile(null);
    setCoverLetterText('');
    setIsApplyModalOpen(true);

    try {
      const profRes = await ApiClient.getProfile();
      if (profRes.profile.resumes && profRes.profile.resumes.length > 0) {
        setPlatformResumes(profRes.profile.resumes);
        setSelectedPlatformResumeId(profRes.profile.resumes[0].id);
      }
    } catch {}
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    if (cvOption === 'upload' && !selectedFile) {
      setApplyError('Veuillez sélectionner un fichier CV au format PDF.');
      return;
    }

    if (cvOption === 'platform' && !selectedPlatformResumeId) {
      setApplyError('Aucun CV enregistré sur la plateforme. Veuillez en importer un ou utiliser le créateur de CV.');
      return;
    }

    setIsSubmitting(true);
    setApplyError(null);

    try {
      const formData = new FormData();
      formData.append('jobId', job.id);

      if (cvOption === 'upload' && selectedFile) {
        formData.append('resumeFile', selectedFile);
      } else if (cvOption === 'platform') {
        formData.append('resumeId', selectedPlatformResumeId);
      }

      if (coverLetterText) {
        formData.append('coverLetterText', coverLetterText);
      }

      const res = await ApiClient.apply(formData);
      setApplySuccess({ applicationNumber: res.application.applicationNumber });
    } catch (err: any) {
      setApplyError(err.message || 'Erreur lors de la transmission de la candidature.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
        <p className="text-xs">Chargement du détail de l'offre...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-12 text-center text-gray-400 border border-gray-200 dark:border-navy-800">
        <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Offre d'emploi introuvable</h2>
        <p className="text-xs text-gray-500 mt-1">L'offre a peut-être été retirée ou pourvue.</p>
        <Link to="/candidate/jobs" className="mt-4 inline-block text-xs font-bold text-blue-600">
          Retour aux offres
        </Link>
      </div>
    );
  }

  const reqSkills = job.requirements?.filter((r) => r.isRequired) || [];
  const desSkills = job.requirements?.filter((r) => !r.isRequired) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/candidate/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux offres d'emploi</span>
      </Link>

      {/* Main Job Card */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-navy-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-navy-800 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ContractBadge type={job.contractType} />
              <span className="font-mono text-xs text-gray-400">{job.reference}</span>
              {job.isRemote && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                  Télétravail autorisé
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                {job.department}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {job.location}
              </span>
              {job.salaryMin && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  {job.salaryMin.toLocaleString('fr-FR')} - {job.salaryMax ? `${job.salaryMax.toLocaleString('fr-FR')} €` : '€'}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                {job.openings} poste(s) ouvert(s)
              </span>
            </div>
          </div>

          <button
            onClick={openApplyModal}
            className="px-6 py-3 rounded-xl text-xs font-bold bg-[#004b82] hover:bg-[#003660] text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Postuler à cette offre</span>
          </button>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 dark:text-white">
            Description du poste
          </h2>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        {/* Responsibilities */}
        {job.responsibilities && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 dark:text-white">
              Responsabilités principales
            </h2>
            <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {job.responsibilities}
            </div>
          </div>
        )}

        {/* Skills Requirements */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-navy-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 dark:text-white">
            Profil recherché & Compétences
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                Compétences obligatoires :
              </p>
              <div className="flex flex-wrap gap-2">
                {reqSkills.map((req, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    {req.skillName} {req.minExpYears ? `(${req.minExpYears} ans+)` : ''}
                  </span>
                ))}
              </div>
            </div>

            {desSkills.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Compétences souhaitées (atouts) :
                </p>
                <div className="flex flex-wrap gap-2">
                  {desSkills.map((des, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 dark:bg-navy-800 dark:text-gray-300 border border-gray-200 dark:border-navy-700"
                    >
                      {des.skillName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Postuler : ${job.title}`}
        maxWidth="xl"
      >
        {!user ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-blue-50 text-[#004b82] rounded-full flex items-center justify-center mx-auto border border-blue-200">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Connexion requise pour postuler</h4>
            <p className="text-xs text-[#868889] max-w-sm mx-auto leading-relaxed">
              Pour déposer votre dossier de candidature pour le poste de <strong>{job.title}</strong>, veuillez vous identifier ou créer votre compte candidat en 1 minute.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login"
                state={{ returnUrl: `/candidate/jobs/${job.slug || job.id}` }}
                className="px-5 py-2.5 bg-[#004b82] hover:bg-[#003660] text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5"
              >
                <span>Se connecter / S'inscrire</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2.5 bg-[#f8f9fa] hover:bg-[#e2e5e7] text-gray-700 rounded-xl text-xs font-semibold border border-[#e2e5e7]"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : applySuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Candidature transmise avec succès !</h4>
            <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 font-mono font-bold text-sm rounded-lg border border-blue-200">
              {applySuccess.applicationNumber}
            </div>
            <p className="text-xs text-gray-500">
              Votre dossier a été transmis à la commission de recrutement. Vous recevrez une notification par e-mail et pourrez suivre son évolution sur votre espace.
            </p>
            <div className="pt-3 flex items-center justify-center gap-3">
              <Link
                to="/candidate/applications"
                className="px-5 py-2.5 bg-[#004b82] text-white hover:bg-[#003660] rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-1.5"
              >
                <span>Suivre mes candidatures</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleApplySubmit} className="space-y-4">
            {applyError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{applyError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                Curriculum Vitae
              </label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setCvOption('upload')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold ${
                    cvOption === 'upload' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200'
                  }`}
                >
                  <Upload className="w-4 h-4 mb-1" />
                  <span>Importer un CV PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCvOption('platform')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold ${
                    cvOption === 'platform' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200'
                  }`}
                >
                  <FileText className="w-4 h-4 mb-1" />
                  <span>CV de la plateforme</span>
                </button>
              </div>

              {cvOption === 'upload' ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center">
                  <label className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">
                    <span>Choisir un fichier PDF</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {selectedFile && (
                    <p className="mt-2 text-xs font-medium text-gray-700">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} Mo)
                    </p>
                  )}
                </div>
              ) : (
                <select
                  value={selectedPlatformResumeId}
                  onChange={(e) => setSelectedPlatformResumeId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                >
                  {platformResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Lettre de motivation (Optionnelle)
              </label>
              <textarea
                rows={4}
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                placeholder="Exprimez votre motivation pour cette opportunité..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 text-xs text-gray-500 font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmer ma candidature</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
