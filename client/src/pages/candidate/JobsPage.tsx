import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiClient } from '../../services/api.js';
import { Job, ContractType, Resume } from '../../types/index.js';
import { ContractBadge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  Banknote,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Users,
  ArrowRight,
} from 'lucide-react';

export const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [contractType, setContractType] = useState('');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);

  // Apply Modal state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cvOption, setCvOption] = useState<'upload' | 'platform'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [platformResumes, setPlatformResumes] = useState<Resume[]>([]);
  const [selectedPlatformResumeId, setSelectedPlatformResumeId] = useState<string>('');
  const [coverLetterText, setCoverLetterText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState<{ applicationNumber: string } | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (department) params.department = department;
      if (contractType) params.contractType = contractType;
      if (location) params.location = location;
      if (isRemote) params.isRemote = 'true';

      const res = await ApiClient.getPublicJobs(params);
      setJobs(res.jobs);
    } catch (err) {
      console.error('Erreur chargement des offres:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [department, contractType, isRemote]);

  const openApplyModal = async (job: Job) => {
    setSelectedJob(job);
    setApplySuccess(null);
    setApplyError(null);
    setSelectedFile(null);
    setCoverLetterText('');
    setIsApplyModalOpen(true);

    // Fetch candidate resumes for platform builder option
    try {
      const profRes = await ApiClient.getProfile();
      if (profRes.profile.resumes && profRes.profile.resumes.length > 0) {
        setPlatformResumes(profRes.profile.resumes);
        setSelectedPlatformResumeId(profRes.profile.resumes[0].id);
      }
    } catch {
      // Ignored if unauthenticated
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

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
      formData.append('jobId', selectedJob.id);

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

  return (
    <div className="space-y-6">
      {/* Title & Search Header */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Offres d'emploi disponibles
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Recherchez parmi nos opportunités par métier, compétences et localisation. Postulez en quelques clics grâce à l'analyse intelligente des CV.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
              placeholder="Poste, compétence (ex: React, Node)..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les départements</option>
              <option value="Ingénierie & Tech">Ingénierie & Tech</option>
              <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
              <option value="Design & Produit">Design & Produit</option>
              <option value="Data & IA">Data & IA</option>
              <option value="Ressources Humaines">Ressources Humaines</option>
            </select>
          </div>

          <div>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous contrats</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
              <option value="FREELANCE">Freelance</option>
              <option value="ALTERNANCE">Alternance</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRemote}
                onChange={(e) => setIsRemote(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Télétravail autorisé</span>
            </label>
            <button
              onClick={fetchJobs}
              className="ml-auto px-4 py-2 bg-estc-blue hover:bg-[#003660] text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs">Chargement des offres en cours...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-12 text-center text-gray-400 border border-gray-200 dark:border-navy-800">
            <Briefcase className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Aucune offre ne correspond à vos filtres</p>
            <p className="text-xs text-gray-400 mt-1">Essayez d'élargir votre recherche ou réinitialisez les filtres.</p>
          </div>
        ) : (
          jobs.map((job) => {
            const reqSkills = job.requirements?.filter((r) => r.isRequired) || [];
            const desSkills = job.requirements?.filter((r) => !r.isRequired) || [];

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ContractBadge type={job.contractType} />
                    {job.isRemote && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Télétravail possible
                      </span>
                    )}
                    <span className="text-xs font-mono text-gray-400">{job.reference}</span>
                  </div>

                  <div>
                    <Link to={`/candidate/jobs/${job.slug || job.id}`}>
                      <h2 className="text-lg font-bold text-gray-900 hover:text-[#004b82] transition-colors">
                        {job.title}
                      </h2>
                    </Link>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {job.description}
                    </p>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-gray-400 mr-1">Requis :</span>
                    {reqSkills.map((req, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        {req.skillName}
                      </span>
                    ))}
                    {desSkills.length > 0 && (
                      <>
                        <span className="text-[11px] font-semibold text-gray-400 ml-2 mr-1">Souhaité :</span>
                        {desSkills.map((des, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-600 dark:bg-navy-800 dark:text-gray-400"
                          >
                            {des.skillName}
                          </span>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Meta Details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-navy-800/60">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      {job.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {job.location}
                    </span>
                    {job.salaryMin && (
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        {job.salaryMin.toLocaleString('fr-FR')} - {job.salaryMax ? `${job.salaryMax.toLocaleString('fr-FR')} DH` : 'DH'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                  <button
                    onClick={() => openApplyModal(job)}
                    className="w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#004b82] hover:bg-[#003660] text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>Postuler maintenant</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Postuler */}
      {selectedJob && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title={`Postuler à l'offre : ${selectedJob.title}`}
          maxWidth="xl"
        >
          {!user ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-[#004b82] rounded-full flex items-center justify-center mx-auto border border-blue-200">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Connexion requise pour postuler</h4>
              <p className="text-xs text-[#868889] max-w-sm mx-auto leading-relaxed">
                Pour déposer votre dossier de candidature pour le poste de <strong>{selectedJob.title}</strong>, veuillez vous identifier ou créer votre compte candidat en 1 minute.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/login"
                  state={{ returnUrl: `/candidate/jobs/${selectedJob.slug || selectedJob.id}` }}
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
              <h4 className="text-lg font-bold text-gray-900">Candidature transmise avec succès !</h4>
              <p className="text-xs text-gray-600 max-w-md mx-auto">
                Votre dossier a été enregistré sous la référence unique :
              </p>
              <div className="inline-block px-4 py-2 bg-blue-50 text-[#004b82] font-mono font-bold text-sm rounded-lg border border-blue-200">
                {applySuccess.applicationNumber}
              </div>
              <p className="text-[11px] text-[#868889]">
                La commission de recrutement a été notifiée par e-mail et vous recevrez les alertes d'avancement directement sur votre espace.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link
                  to="/candidate/applications"
                  className="px-5 py-2.5 bg-[#004b82] hover:bg-[#003660] text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <span>Suivre mes candidatures</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2.5 bg-[#f8f9fa] text-gray-700 rounded-xl text-xs font-bold border border-[#e2e5e7]"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleApplySubmit} className="space-y-5">
              {applyError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}

              {/* CV Option Chooser */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Dépôt du Curriculum Vitae (Obligatoire)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCvOption('upload')}
                    className={`p-3 rounded-xl border text-left transition-all ${cvOption === 'upload'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-gray-200 dark:border-navy-700 hover:bg-gray-50 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Upload className="w-4 h-4" />
                      <span>OPTION 1 : Importer un CV PDF</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Fichier PDF existant (max 10 Mo)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCvOption('platform')}
                    className={`p-3 rounded-xl border text-left transition-all ${cvOption === 'platform'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-gray-200 dark:border-navy-700 hover:bg-gray-50 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <FileText className="w-4 h-4" />
                      <span>OPTION 2 : CV de la plateforme</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Utiliser votre CV rédigé en ligne</p>
                  </button>
                </div>
              </div>

              {/* File upload input or Platform selector */}
              {cvOption === 'upload' ? (
                <div>
                  <div className="border-2 border-dashed border-gray-300 dark:border-navy-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <label className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">
                      <span>Cliquez pour choisir un fichier</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-gray-400 mt-1">Seuls les fichiers PDF réels sont acceptés (signature vérifiée)</p>
                    {selectedFile && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} Mo)</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {platformResumes.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
                      Vous n'avez pas encore créé de CV sur la plateforme ATS.
                      <div className="mt-2">
                        <a
                          href="/candidate/cv-builder"
                          target="_blank"
                          className="font-bold underline hover:text-amber-900"
                        >
                          Ouvrir le créateur de CV en ligne →
                        </a>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={selectedPlatformResumeId}
                      onChange={(e) => setSelectedPlatformResumeId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white"
                    >
                      {platformResumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.type === 'PLATFORM_BUILDER' ? 'Créé en ligne' : 'Importé'}) - {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Cover letter section */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Lettre de motivation (Optionnelle)
                </label>
                <textarea
                  rows={4}
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  placeholder="Rédigez quelques lignes pour expliquer votre motivation pour ce poste..."
                  className="w-full p-3 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-navy-800">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmer et envoyer ma candidature</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
