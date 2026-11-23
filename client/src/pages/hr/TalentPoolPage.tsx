import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api.js';
import { Star, Search, Mail, Phone, MapPin, Briefcase, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TalentPoolPage: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  const fetchTalentPool = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (skillFilter) params.skill = skillFilter;
      const res = await ApiClient.getTalentPool(params);
      setCandidates(res.talentPool);
    } catch (err) {
      console.error('Erreur chargement vivier:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTalentPool();
  }, [skillFilter]);

  const handleRemove = async (profileId: string) => {
    if (!window.confirm('Retirer ce candidat du vivier de talents ?')) return;
    try {
      await ApiClient.toggleTalentPool(profileId);
      await fetchTalentPool();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Vivier de Talents (Talent Pool)
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Profils qualifiés conservés pour de futures opportunités et campagnes de recrutement.
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200 self-start sm:self-auto">
          {candidates.length} profil(s) en réserve
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTalentPool()}
            placeholder="Rechercher par nom ou e-mail..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs"
          />
        </div>

        <input
          type="text"
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          placeholder="Filtrer par compétence (ex: React)..."
          className="px-3 py-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-xs sm:w-64"
        />
      </div>

      {/* Candidates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#004b82] mb-2" />
            <p className="text-xs">Chargement du vivier...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-navy-900 rounded-2xl p-12 text-center text-gray-400 border border-gray-200 dark:border-navy-800">
            <Star className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Aucun candidat dans le vivier de talents pour le moment</p>
            <p className="text-xs text-gray-500 mt-1">Vous pouvez ajouter des candidats au vivier depuis le détail de chaque candidature.</p>
            <div className="mt-4">
              <Link
                to="/hr/applications"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#004b82] text-white hover:bg-[#003660] transition-colors"
              >
                Parcourir les candidatures
              </Link>
            </div>
          </div>
        ) : (
          candidates.map((cand) => {
            const user = cand.user;
            const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Candidat';

            return (
              <div
                key={cand.id}
                className="bg-white dark:bg-navy-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-navy-800 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#004b82] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-[#004b82]/30">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          user?.firstName ? user.firstName[0].toUpperCase() : 'C'
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">{name}</h3>
                        <p className="text-xs font-semibold text-[#004b82]">{cand.currentTitle || 'Candidat'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(cand.id)}
                      className="text-gray-400 hover:text-rose-500 p-1"
                      title="Retirer du vivier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1 mt-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{user?.email}</span>
                    </div>
                    {cand.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{cand.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{cand.city || 'Maroc'} • {cand.yearsOfExp || 0} an(s) d'exp</span>
                    </div>
                  </div>

                  {cand.skills && cand.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {cand.skills.slice(0, 5).map((s: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-[#004b82]/10 text-[#004b82] font-semibold">
                          {s.skill.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {cand.talentPoolNotes && (
                    <div className="mt-3 p-2.5 rounded-lg bg-gray-50 dark:bg-navy-800 text-[11px] text-gray-600 dark:text-gray-400 italic">
                      "{cand.talentPoolNotes}"
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-navy-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-400">Dispo : {cand.availability || 'Immédiate'}</span>
                  <a
                    href={`mailto:${user?.email}`}
                    className="font-bold text-[#004b82] hover:underline flex items-center gap-1"
                  >
                    <span>Contacter</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
