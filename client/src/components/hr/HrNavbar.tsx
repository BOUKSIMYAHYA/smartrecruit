import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { ApiClient } from '../../services/api.js';
import { Notification } from '../../types/index.js';
import {
  Bell,
  ChevronDown,
  Globe,
  ExternalLink,
  LogOut,
  User,
  Shield,
  Clock,
  Calendar,
  Search,
  Menu,
} from 'lucide-react';

interface HrNavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const HrNavbar: React.FC<HrNavbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Derive breadcrumb / section title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/hr/dashboard')) return 'Tableau de bord exécutif';
    if (path.includes('/hr/jobs')) return 'Gestion des offres de recrutement';
    if (path.includes('/hr/applications')) return 'Candidatures & Pipeline';
    if (path.includes('/hr/ai-agent') || path.includes('/hr/ai-studio')) return 'Assistant IA & Studio Recrutement';
    if (path.includes('/hr/talent-pool')) return 'Vivier de talents (Talent Pool)';
    if (path.includes('/hr/interviews')) return 'Planning & Gestion des entretiens';
    if (path.includes('/hr/users')) return 'Équipe RH & Contrôle d\'accès (RBAC)';
    return 'Portail Administration RH';
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await ApiClient.getMyNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignored if unauthenticated
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

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

  const handleMarkAllAsRead = async () => {
    try {
      await ApiClient.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/95 backdrop-blur-md border-b border-[#e2e5e7] px-3 sm:px-6 flex items-center justify-between">
      {/* Left: Hamburger (mobile) + Breadcrumbs + Current Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 -ml-1 rounded-xl text-[#004b82] hover:bg-[#f0f5fa] transition-colors shrink-0"
          title="Ouvrir le menu"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#868889] shrink-0">
          <Link
            to="/hr/dashboard"
            className="font-bold text-[#004b82] hover:underline"
            title="Administration EST Casablanca"
          >
            EST Casablanca
          </Link>
          <span>/</span>
          <Link to="/hr/dashboard" className="hover:text-[#004b82] hover:underline">
            Portail RH
          </Link>
          <span>/</span>
        </div>
        <h2 className="text-xs sm:text-sm font-extrabold text-gray-900 tracking-tight truncate">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-[#868889] hover:text-[#004b82] hover:bg-[#f0f5fa] transition-colors"
            title="Notifications & alertes"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#004b82] text-[10px] font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-xl border border-[#e2e5e7] py-3 z-50">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-[#e2e5e7]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#004b82]">
                    Notifications Système & RH
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
                    Aucune notification non lue.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 hover:bg-[#f0f5fa] transition-colors flex items-start gap-3 ${
                        !notif.isRead ? 'bg-[#f0f5fa]/60' : ''
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#004b82]/10 text-[#004b82] flex items-center justify-center shrink-0 mt-0.5">
                        {notif.type === 'INTERVIEW_SCHEDULED' ? (
                          <Calendar className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
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
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Pill */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#f0f5fa] border border-transparent hover:border-[#e2e5e7] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-[#004b82] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden border border-[#004b82]/30">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()
                )}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-bold text-gray-900 leading-tight">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
                </p>
                <span className="inline-block text-[10px] font-bold text-[#004b82] uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#868889]" />
            </button>

            {/* User Menu Modal */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#e2e5e7] py-2 z-50">
                <div className="px-4 py-2.5 border-b border-[#e2e5e7]">
                  <p className="text-[11px] text-[#868889]">Session active</p>
                  <p className="text-xs font-bold text-[#004b82] truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold bg-[#004b82]/10 text-[#004b82]">
                    {user.role}
                  </span>
                </div>

                <div className="px-2 pt-2">
                  <Link
                    to="/hr/users"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-[#f0f5fa] hover:text-[#004b82] rounded-lg flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#004b82]" />
                    <span>Équipe RH & Rôles</span>
                  </Link>

                  <Link
                    to="/hr/jobs"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-[#f0f5fa] hover:text-[#004b82] rounded-lg flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-[#004b82]" />
                    <span>Gestion des offres</span>
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
        )}
      </div>
    </header>
  );
};
