import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth, HR_ROLES } from '../../contexts/AuthContext.js';
import { ApiClient } from '../../services/api.js';
import {
  Shield,
  User,
  Lock,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  AlertCircle,
  UserPlus,
  Briefcase,
} from 'lucide-react';

type AuthMode = 'LOGIN' | 'REGISTER' | 'VERIFY';

export const LoginPage: React.FC = () => {
  const { user, isHR, loginWithPassword, registerCandidate, verifyCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const returnUrl = (location.state as any)?.returnUrl as string | undefined;

  const defaultMode: AuthMode = searchParams.get('tab') === 'register' ? 'REGISTER' : 'LOGIN';
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // If already logged in, redirect logically
  useEffect(() => {
    if (user) {
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
      } else if (isHR) {
        navigate('/hr/dashboard', { replace: true });
      } else {
        navigate('/candidate/dashboard', { replace: true });
      }
    }
  }, [user, isHR, returnUrl, navigate]);

  // Register fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Verification fields
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const user = await loginWithPassword(identifier.trim(), password);
      if (HR_ROLES.includes(user.role)) {
        navigate(returnUrl && returnUrl.startsWith('/hr') ? returnUrl : '/hr/dashboard');
      } else {
        navigate(returnUrl || '/candidate/dashboard');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('code à 6 chiffres')) {
        setVerificationEmail(identifier.trim());
        setMode('VERIFY');
      }
      setError(err.message || 'Identifiant ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Candidate Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail.trim() || !registerPassword) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await registerCandidate({
        email: registerEmail.trim(),
        password: registerPassword,
        phone: registerPhone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      setVerificationEmail(res.email);
      if (res.devCode) {
        setDevCode(res.devCode);
        setOtpCode(res.devCode);
      }
      setSuccessMessage(res.message);
      setMode('VERIFY');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationEmail || !otpCode.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const user = await verifyCode(verificationEmail, otpCode.trim());
      if (HR_ROLES.includes(user.role)) {
        navigate(returnUrl && returnUrl.startsWith('/hr') ? returnUrl : '/hr/dashboard');
      } else {
        navigate(returnUrl || '/candidate/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Code de vérification invalide ou expiré.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendCode = async () => {
    if (!verificationEmail) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.resendCode(verificationEmail);
      if (res.devCode) {
        setDevCode(res.devCode);
        setOtpCode(res.devCode);
      }
      setSuccessMessage('Un nouveau code vous a été envoyé par e-mail.');
    } catch (err: any) {
      setError(err.message || 'Impossible de renvoyer le code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col items-center justify-center p-4">
      {/* Link to public jobs */}
      <div className="max-w-md w-full mb-4 flex items-center justify-between">
        <Link
          to="/candidate/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#868889] hover:text-[#004b82] transition-colors"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Consulter les offres d'emploi ESTC</span>
        </Link>
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-block p-3 rounded-2xl bg-white border border-[#e2e5e7] shadow-sm">
            <img
              src="/logo-estc.png"
              alt="Logo ESTC - Ecole Supérieure de Technologie de Casablanca"
              className="h-16 w-auto object-contain mx-auto"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#004b82] tracking-tight">
              SMARTRECRUIT ATS
            </h1>
            <p className="text-xs font-semibold text-[#868889] mt-1">
              École Supérieure de Technologie de Casablanca &bull; Université Hassan II
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-7 shadow-lg border border-[#e2e5e7] space-y-5">
          {/* Tabs */}
          {mode !== 'VERIFY' && (
            <div className="grid grid-cols-2 p-1 bg-[#f8f9fa] rounded-xl text-xs font-bold border border-[#e2e5e7]">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'LOGIN'
                    ? 'bg-[#004b82] text-white shadow-sm'
                    : 'text-[#868889] hover:text-[#004b82]'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'REGISTER'
                    ? 'bg-[#004b82] text-white shadow-sm'
                    : 'text-[#868889] hover:text-[#004b82]'
                }`}
              >
                Inscription Candidat
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#004b82] mb-1">
                  E-mail ou Téléphone
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#868889]" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="yhykk8899@gmail.com ou 0612345678"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:border-[#004b82] focus:bg-white outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#004b82] mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#868889]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:border-[#004b82] focus:bg-white outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#004b82] hover:bg-[#003a66] text-white font-bold text-xs shadow-md shadow-[#004b82]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* MODE 2: CANDIDATE REGISTRATION */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#004b82] mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Youssef"
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:border-[#004b82] focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#004b82] mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Alami"
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:border-[#004b82] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#004b82] mb-1">
                  Adresse e-mail (reçoit le code de vérification)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#868889]" />
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="candidat@email.com"
                    className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:border-[#004b82] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#004b82] mb-1">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#868889]" />
                  <input
                    type="tel"
                    required
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="0612345678"
                    className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:border-[#004b82] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#004b82] mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#868889]" />
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#e2e5e7] rounded-xl text-xs text-gray-900 focus:border-[#004b82] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#004b82] hover:bg-[#003a66] text-white font-bold text-xs shadow-md shadow-[#004b82]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <UserPlus className="w-4 h-4" />
                <span>Créer mon compte & envoyer le code</span>
              </button>
            </form>
          )}

          {/* MODE 3: EMAIL VERIFICATION CODE (OTP) */}
          {mode === 'VERIFY' && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-[#f0f5fa] text-[#004b82] flex items-center justify-center mx-auto border border-[#e2e5e7]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#004b82]">
                  Vérification de l'adresse e-mail
                </h3>
                <p className="text-[11px] text-[#868889]">
                  Un code à 6 chiffres a été envoyé à :<br />
                  <strong className="text-gray-900">{verificationEmail}</strong>
                </p>
                {devCode && (
                  <div className="p-2.5 bg-[#f0f5fa] border border-[#c2dcf0] rounded-xl text-center text-xs text-[#004b82] font-semibold mt-2">
                    Code de confirmation : <span className="font-mono tracking-widest text-base font-extrabold text-[#004b82]">{devCode}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#004b82] mb-1 text-center">
                  Saisissez le code de vérification à 6 chiffres
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full text-center text-xl tracking-[0.5em] font-mono py-2.5 bg-[#f8f9fa] border-2 border-[#004b82] rounded-xl text-gray-900 focus:ring-2 focus:ring-[#004b82] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-3 rounded-xl bg-[#004b82] hover:bg-[#003a66] text-white font-bold text-xs shadow-md shadow-[#004b82]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <CheckCircle2 className="w-4 h-4" />
                <span>Vérifier et accéder à l'espace candidat</span>
              </button>

              <div className="flex items-center justify-between pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-[#004b82] hover:underline font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Renvoyer le code</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[#868889] hover:text-gray-900"
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
