import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { ApiClient } from '../../services/api.js';
import { Notification } from '../../types/index.js';
import {
  Briefcase,
  FileText,
  User,
  Bell,
  Shield,
  LogOut,
  ChevronDown,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';

export const CandidateNavbar: React.FC = () => {
  const { user, isHR, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await ApiClient.getMyNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignore if unauthenticated
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Close menus on route change
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    try {
      if (!notif.isRead) {
        await ApiClient.markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setShowNotifications(false);
      if (notif.link) {
        navigate(notif.link);
      } else {
        navigate('/candidate/applications');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await ApiClient.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    ...(user
      ? [{ label: 'Tableau de bord', path: '/candidate/dashboard', icon: LayoutDashboard }]
      : []),
    { label: "Offres d'emploi", path: '/candidate/jobs', icon: Briefcase },
    ...(user
      ? [
          { label: 'Mes candidatures', path: '/candidate/applications', icon: FileText },
          { label: 'Créateur de CV', path: '/candidate/cv-builder', icon: Sparkles },
          { label: 'Mon profil', path: '/candidate/profile', icon: User },
        ]
      : []),
  ];

  const logoTarget = user ? '/candidate/dashboard' : '/candidate/jobs';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e2e5e7] bg-white shadow-xs">
      {/* Top micro-bar */}
      <div className="bg-[#004b82] text-white text-[11px] py-1 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-medium tracking-wide">
            École Supérieure de Technologie de Casablanca &bull; Université Hassan II
          </span>
          <span className="text-white/80 text-[10px] font-semibold">
            Portail Officiel SMARTRECRUIT ATS
          </span>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-6">
            <Link to={logoTarget} className="flex items-center gap-3 group">
              <div className="p-1 rounded-xl bg-white border border-[#e2e5e7] shadow-xs group-hover:border-[#004b82] transition-colors">
                <img
                  src="/logo-estc.png"
                  alt="ESTC Logo"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-[#004b82] block leading-tight">
                  SMARTRECRUIT
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#868889] -mt-0.5">
                  EST Casablanca &bull; Candidat
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-[#004b82] text-white shadow-xs'
                        : 'text-[#868889] hover:text-[#004b82] hover:bg-[#f0f5fa]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Area: Notifications, Profile, Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Bell */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-[#868889] hover:text-[#004b82] hover:bg-[#f0f5fa] transition-colors"
                  title="Notifications & Mises à jour RH"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#004b82] text-[10px] font-bold text-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#e2e5e7] py-3 z-50">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-[#e2e5e7]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#004b82]">
                          Mises à jour RH
                        </span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#f0f5fa] text-[#004b82] border border-[#004b82]/20">
                            {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] font-semibold text-[#004b82] hover:underline"
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#e2e5e7]">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#868889]">
                          <Bell className="w-6 h-6 mx-auto mb-1.5 text-gray-300" />
                          Aucune notification pour le moment.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            type="button"
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left p-3.5 hover:bg-[#f0f5fa] transition-colors flex items-start gap-3 ${
                              !notif.isRead ? 'bg-[#f0f5fa]/70' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#f0f5fa] border border-[#004b82]/20 text-[#004b82] flex items-center justify-center shrink-0 mt-0.5">
                              {notif.type === 'INTERVIEW_SCHEDULED' ? (
                                <Calendar className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-[#004b82] truncate">
                                  {notif.title}
                                </p>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-[#004b82] shrink-0 ml-2" />
                                )}
                              </div>
                              <p className="text-[11px] text-gray-700 line-clamp-2 mt-0.5">
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-[#868889] mt-1 block">
                                {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="px-4 pt-2 border-t border-[#e2e5e7] text-center">
                      <Link
                        to="/candidate/applications"
                        onClick={() => setShowNotifications(false)}
                        className="text-[11px] font-bold text-[#004b82] hover:underline"
                      >
                        Consulter mes étapes de recrutement
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Dropdown Pill */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#f0f5fa] border border-transparent hover:border-[#e2e5e7] transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-[#004b82] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden border border-[#004b82]/30 shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()
                    )}
                  </div>
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-bold text-gray-900 leading-tight">
                      {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
                    </p>
                    <p className="text-[10px] text-[#868889] font-medium">{user.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#868889]" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#e2e5e7] py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-[#e2e5e7]">
                      <p className="text-[11px] text-[#868889]">Connecté en tant que</p>
                      <p className="text-xs font-bold text-[#004b82] truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold bg-[#f0f5fa] text-[#004b82] border border-[#004b82]/20">
                        {user.role}
                      </span>
                    </div>

                    <div className="px-2 pt-2">
                      <Link
                        to="/candidate/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#f0f5fa] rounded-lg flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-[#004b82]" />
                        <span>Mon profil & photo</span>
                      </Link>

                      <Link
                        to="/candidate/applications"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#f0f5fa] rounded-lg flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#004b82]" />
                        <span>Mes candidatures</span>
                      </Link>
                    </div>

                    <div className="border-t border-[#e2e5e7] mt-2 pt-2 px-2">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#004b82] border-2 border-[#004b82] hover:bg-[#004b82] hover:text-white transition-all shadow-xs"
                >
                  Connexion
                </Link>
                <Link
                  to="/login?tab=register"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#004b82] hover:bg-[#003660] text-white shadow-md hover:shadow-lg transition-all"
                >
                  Créer un compte
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#868889] hover:text-[#004b82] hover:bg-[#f0f5fa] transition-colors"
              title="Menu de navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Collapsible Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#e2e5e7] py-3 space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#004b82] text-white'
                      : 'text-gray-700 hover:bg-[#f0f5fa] hover:text-[#004b82]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
