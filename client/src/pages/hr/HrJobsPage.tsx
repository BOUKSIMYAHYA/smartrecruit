import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiClient } from '../../services/api.js';
import { Job, JobStatus, ContractType } from '../../types/index.js';
import { ContractBadge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Archive,
  Search,
  MapPin,
  Calendar,
  Building2,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Banknote,
} from 'lucide-react';

export const HrJobsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Génie Informatique');
  const [location, setLocation] = useState('Casablanca (ESTC Campus)');
  const [isRemote, setIsRemote] = useState(false);
  const [contractType, setContractType] = useState<ContractType>('CDI');
  const [openings, setOpenings] = useState(1);
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requiredExpYears, setRequiredExpYears] = useState(2);
  const [availability, setAvailability] = useState('Immédiate');
  const [salaryMin, setSalaryMin] = useState<number | undefined>(undefined);
  const [salaryMax, setSalaryMax] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<JobStatus>('PUBLISHED');
  const [deadline, setDeadline] = useState('');
  const [requiredSkillsStr, setRequiredSkillsStr] = useState('React, TypeScript, Node.js, PostgreSQL');
  const [desiredSkillsStr, setDesiredSkillsStr] = useState('Docker, AWS, Git');

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await ApiClient.getHrJobs(params);
      setJobs(res.jobs);
    } catch (err) {
      console.error('Erreur chargement offres RH:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  useEffect(() => {
    if (searchParams.get('create') === 'true' || searchParams.get('action') === 'create') {
      openCreateModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const openCreateModal = () => {
    setEditingJob(null);
    setFormError(null);
    setTitle('');
    setDepartment('Génie Informatique');
    setLocation('Casablanca (ESTC Campus)');
    setIsRemote(false);
    setContractType('CDI');
    setOpenings(1);
    setDescription('');
    setResponsibilities('');
    setRequiredExpYears(2);
    setAvailability('Immédiate');
    setSalaryMin(undefined);
    setSalaryMax(undefined);
    setStatus('PUBLISHED');
    setDeadline('');
    setRequiredSkillsStr('React, TypeScript, Node.js, PostgreSQL');
    setDesiredSkillsStr('Docker, AWS, Git');
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setFormError(null);
    setTitle(job.title);
    setDepartment(job.department);
    setLocation(job.location);
    setIsRemote(job.isRemote);
    setContractType(job.contractType);
    setOpenings(job.openings);
    setDescription(job.description);
    setResponsibilities(job.responsibilities || '');
    setRequiredExpYears(job.requiredExpYears);
    setAvailability(job.availability || 'Immédiate');
    setSalaryMin(job.salaryMin || undefined);
    setSalaryMax(job.salaryMax || undefined);
    setStatus(job.status);
    setDeadline(job.deadline ? job.deadline.slice(0, 10) : '');

    const reqs = job.requirements?.filter((r) => r.isRequired).map((r) => r.skillName).join(', ') || '';
    const des = job.requirements?.filter((r) => !r.isRequired).map((r) => r.skillName).join(', ') || '';
    setRequiredSkillsStr(reqs);
    setDesiredSkillsStr(des);

    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const requiredSkills = requiredSkillsStr.split(',').map((s) => s.trim()).filter(Boolean);
      const desiredSkills = desiredSkillsStr.split(',').map((s) => s.trim()).filter(Boolean);

      const payload = {
        title,
        department,
        location,
        isRemote,
        contractType,
        openings: Number(openings),
        description,
        responsibilities,
        requiredExpYears: Number(requiredExpYears),
        availability,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        status,
        deadline: deadline || null,
        requiredSkills,
        desiredSkills,
      };

      if (editingJob) {
        await ApiClient.updateJob(editingJob.id, payload);
      } else {
        await ApiClient.createJob(payload);
      }

      setIsModalOpen(false);
      await fetchJobs();
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la sauvegarde de l\'offre.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (job: Job) => {
    const nextStatus: JobStatus = job.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await ApiClient.updateJob(job.id, { status: nextStatus });
      await fetchJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteJob = async (job: Job) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ou archiver l'offre "${job.title}" ?`)) {
      return;
    }
    try {
      await ApiClient.deleteJob(job.id);
      await fetchJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Gestion des offres d'emploi
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Créez, modifiez, publiez et définissez les critères de matching IA pour chaque poste ouvert.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#004b82] text-white hover:bg-[#003660] shadow-md shadow-blue-900/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une nouvelle offre</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
            placeholder="Rechercher par titre, référence ou département..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-gray-900 dark:text-white"
        >
          <option value="">Tous les statuts</option>
          <option value="PUBLISHED">Publiée</option>
          <option value="DRAFT">Brouillon</option>
          <option value="ARCHIVED">Archivée</option>
        </select>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#004b82] mb-2" />
            <p className="text-xs">Chargement des offres RH...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-12 text-center text-gray-400 border border-gray-200 dark:border-navy-800">
            <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold">Aucune offre d'emploi trouvée</p>
          </div>
        ) : (
          jobs.map((job) => {
            const reqSkills = job.requirements?.filter((r) => r.isRequired) || [];
            const desSkills = job.requirements?.filter((r) => !r.isRequired) || [];

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-navy-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-gray-400">{job.reference}</span>
                    <ContractBadge type={job.contractType} />
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        job.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : job.status === 'DRAFT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {job.status === 'PUBLISHED' ? 'PUBLIÉE' : job.status === 'DRAFT' ? 'BROUILLON' : 'ARCHIVÉE'}
                    </span>
                    {job.isRemote && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Télétravail
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(job)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {job.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
                    </button>
                    <button
                      onClick={() => openEditModal(job)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
                      title="Modifier l'offre"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
                      title="Supprimer / Archiver"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">{job.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{job.department}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.openings} poste(s)</span>
                      <span>•</span>
                      <span>{job.requiredExpYears} an(s) d'exp.</span>
                      {job.salaryMin && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            {job.salaryMin.toLocaleString('fr-FR')} - {job.salaryMax ? `${job.salaryMax.toLocaleString('fr-FR')} DH` : 'DH'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <Link
                      to={`/hr/applications?jobId=${job.id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#004b82]/10 text-[#004b82] hover:bg-[#004b82] hover:text-white transition-colors font-mono flex items-center gap-1.5"
                      title="Voir les candidatures reçues pour cette offre"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{job._count?.applications ?? 0} candidature(s)</span>
                    </Link>
                  </div>
                </div>

                {/* Skills Preview */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs">
                  <span className="text-[11px] font-bold text-gray-400 mr-1">Critères IA :</span>
                  {reqSkills.map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      {r.skillName}*
                    </span>
                  ))}
                  {desSkills.map((d, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {d.skillName}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJob ? `Modifier l'offre : ${editingJob.title}` : 'Créer une nouvelle offre d\'emploi'}
        maxWidth="2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Titre de l'offre</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Développeur Full Stack Senior React / Node.js"
              className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Département</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ingénierie & Tech"
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Localisation</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Paris (Hybride)"
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Type de contrat</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="STAGE">Stage</option>
                <option value="FREELANCE">Freelance</option>
                <option value="ALTERNANCE">Alternance</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre de postes</label>
              <input
                type="number"
                min="1"
                value={openings}
                onChange={(e) => setOpenings(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Expérience minimale (ans)</label>
              <input
                type="number"
                min="0"
                value={requiredExpYears}
                onChange={(e) => setRequiredExpYears(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              />
            </div>
          </div>

          {/* Fourchette / Intervalle de salaire */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-navy-800/50 rounded-xl border border-gray-200 dark:border-navy-700">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-[#004b82]" />
                <span>Salaire minimum (DH)</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={salaryMin ?? ''}
                onChange={(e) => setSalaryMin(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="ex: 8000"
                className="w-full p-2.5 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-[#004b82]" />
                <span>Salaire maximum (DH)</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={salaryMax ?? ''}
                onChange={(e) => setSalaryMax(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="ex: 15000"
                className="w-full p-2.5 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl font-medium"
              />
            </div>
            <p className="col-span-2 text-[11px] text-gray-500">
              Intervalle salarial proposé pour ce poste (en Dirhams marocains - DH). Laissez vide si confidentiel ou à négocier.
            </p>
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Compétences obligatoires (critères majeurs de matching IA)
            </label>
            <input
              type="text"
              value={requiredSkillsStr}
              onChange={(e) => setRequiredSkillsStr(e.target.value)}
              placeholder="ex: React, TypeScript, Node.js, PostgreSQL (séparées par virgules)"
              className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Compétences souhaitées (atouts / bonus IA)
            </label>
            <input
              type="text"
              value={desiredSkillsStr}
              onChange={(e) => setDesiredSkillsStr(e.target.value)}
              placeholder="ex: Docker, AWS, Git (séparées par virgules)"
              className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Description détaillée</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Présentation du poste, missions, contexte projet..."
              className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRemote}
                onChange={(e) => setIsRemote(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="font-semibold text-gray-700 dark:text-gray-300">Télétravail autorisé</span>
            </label>

            <div className="ml-auto flex items-center gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Statut initial :</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="p-1.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg text-xs"
              >
                <option value="PUBLISHED">Publiée</option>
                <option value="DRAFT">Brouillon</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-gray-100 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-semibold text-gray-500 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingJob ? 'Enregistrer les modifications' : 'Créer et publier l\'offre'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
