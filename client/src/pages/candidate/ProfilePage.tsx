import React, { useState, useEffect, useRef } from 'react';
import { ApiClient } from '../../services/api.js';
import { CandidateProfile } from '../../types/index.js';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Briefcase,
  GraduationCap,
  Save,
  Check,
  Loader2,
  FileText,
  Upload,
  Camera,
  Trash2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Avatar states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Maroc');
  const [currentTitle, setCurrentTitle] = useState('');
  const [yearsOfExp, setYearsOfExp] = useState(0);
  const [availability, setAvailability] = useState('Immédiate');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [skillsStr, setSkillsStr] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await ApiClient.getProfile();
        setProfile(res.profile);
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setPhone(res.profile.phone || '');
        setCity(res.profile.city || '');
        setCountry(res.profile.country || 'Maroc');
        setCurrentTitle(res.profile.currentTitle || '');
        setYearsOfExp(res.profile.yearsOfExp || 0);
        setAvailability(res.profile.availability || 'Immédiate');
        setLinkedInUrl(res.profile.linkedInUrl || '');
        setPortfolioUrl(res.profile.portfolioUrl || '');
        setSummary(res.profile.summary || '');

        if (res.profile.skills) {
          setSkillsStr(res.profile.skills.map((s) => s.skill.name).join(', '));
        }
      } catch (err) {
        console.error('Erreur getProfile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Handle Avatar Upload
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/i)) {
      setAvatarMessage({ type: 'error', text: 'Seuls les formats JPEG, PNG et WEBP sont acceptés.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', text: 'L\'image dépasse la taille maximale autorisée (5 Mo).' });
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarMessage(null);

    try {
      const res = await ApiClient.uploadAvatar(file);
      updateUser({ avatarUrl: res.avatarUrl });
      setAvatarMessage({ type: 'success', text: 'Photo de profil mise à jour avec succès !' });
      setTimeout(() => setAvatarMessage(null), 4000);
    } catch (err: any) {
      setAvatarMessage({ type: 'error', text: err.message || 'Erreur lors du téléchargement de l\'image.' });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Avatar Delete
  const handleAvatarDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment retirer votre photo de profil ?')) return;

    setIsUploadingAvatar(true);
    setAvatarMessage(null);

    try {
      await ApiClient.deleteAvatar();
      updateUser({ avatarUrl: null });
      setAvatarMessage({ type: 'success', text: 'Photo de profil supprimée.' });
      setTimeout(() => setAvatarMessage(null), 4000);
    } catch (err: any) {
      setAvatarMessage({ type: 'error', text: err.message || 'Erreur lors de la suppression de la photo.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle Profile Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const skillsArray = skillsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await ApiClient.updateProfile({
        firstName,
        lastName,
        phone,
        city,
        country,
        currentTitle,
        yearsOfExp: Number(yearsOfExp),
        availability,
        linkedInUrl,
        portfolioUrl,
        summary,
        skills: skillsArray,
      });

      updateUser({ firstName, lastName });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'La confirmation du mot de passe ne correspond pas.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await ApiClient.changePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
        confirmPassword,
      });
      setPasswordMessage({ type: 'success', text: res.message || 'Mot de passe modifié avec succès !' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 5000);
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Erreur lors du changement de mot de passe.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#004b82] mb-2" />
        <p className="text-xs">Chargement de votre profil...</p>
      </div>
    );
  }

  const userInitial = user?.firstName
    ? user.firstName[0].toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : 'C';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header Card with Profile Picture (Avatar) Management */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e5e7]">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#e2e5e7]">
          {/* Avatar preview */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full bg-[#004b82] text-white flex items-center justify-center font-extrabold text-3xl shadow-md overflow-hidden border-4 border-white ring-2 ring-[#004b82]/20">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar candidat"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>

            {/* Quick Upload Overlay Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Changer la photo"
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold">Changer</span>
            </button>
          </div>

          {/* Details & Actions */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Profil Candidat'}
              </h1>
              <p className="text-xs text-[#868889] font-mono mt-0.5">
                {user?.email} • {phone || user?.phone || 'Téléphone non renseigné'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleAvatarSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#004b82] text-white hover:bg-[#003660] transition-colors shadow-sm disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{user?.avatarUrl ? 'Remplacer la photo' : 'Ajouter une photo'}</span>
              </button>

              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleAvatarDelete}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-[#868889]">
              Formats recommandés : JPEG, PNG ou WEBP (carré, max. 5 Mo).
            </p>

            {/* Avatar Feedback Message */}
            {avatarMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  avatarMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {avatarMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{avatarMessage.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Professional Profile Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Identity */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#004b82] border-b border-[#e2e5e7] pb-2">
              Identité & Coordonnées
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Votre prénom"
                  className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Votre nom de famille"
                  className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 6 ..."
                  className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Casablanca, Rabat..."
                  className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pays</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Maroc"
                  className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
              </div>
            </div>
          </div>

          {/* Professional Status */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#004b82] border-b border-[#e2e5e7] pb-2">
              Position & Disponibilité
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Titre actuel / visé</label>
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  placeholder="Développeur Full Stack, Ingénieur..."
                  className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Années d'expérience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsOfExp}
                  onChange={(e) => setYearsOfExp(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Disponibilité</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                >
                  <option value="Immédiate">Immédiate</option>
                  <option value="1 mois">1 mois</option>
                  <option value="2 mois">2 mois</option>
                  <option value="3 mois (Préavis)">3 mois (Préavis)</option>
                  <option value="À convenir">À convenir</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Compétences clés (séparées par des virgules)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="React, TypeScript, Node.js, PostgreSQL, Docker, Java, Python..."
                className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Résumé de votre profil & motivation générale
              </label>
              <textarea
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Décrivez votre parcours, vos réalisations et ce qui vous motive..."
                className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#004b82]"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#004b82] border-b border-[#e2e5e7] pb-2">
              Liens & Références
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Profil LinkedIn</label>
                <input
                  type="text"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/votre-nom"
                  className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Portfolio / GitHub</label>
                <input
                  type="text"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/votre-compte"
                  className="w-full p-2.5 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#e2e5e7]">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#004b82] hover:bg-[#003660] text-white shadow-md disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saveSuccess ? 'Profil mis à jour !' : 'Enregistrer mon profil'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Dedicated Security & Password Change Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e5e7]">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#e2e5e7]">
          <div className="p-2 rounded-xl bg-[#004b82]/10 text-[#004b82]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900">
              Sécurité & Changement de mot de passe
            </h2>
            <p className="text-xs text-[#868889]">
              Mettez à jour votre mot de passe pour sécuriser l'accès à votre espace candidat ESTC.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
          {/* Feedback Banner */}
          {passwordMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 pr-9 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  className="w-full p-2.5 pr-9 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirmer le nouveau
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez"
                  className="w-full p-2.5 pr-9 bg-gray-50 border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b82]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-[#e2e5e7]">
            <p className="text-[11px] text-[#868889] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cryptage sécurisé avec hachage salé standard bcrypt.</span>
            </p>

            <button
              type="submit"
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#004b82] hover:bg-[#003660] text-white shadow-sm disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {isChangingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Mettre à jour le mot de passe</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
