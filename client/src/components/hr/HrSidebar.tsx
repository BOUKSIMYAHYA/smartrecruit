import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Sparkles,
  Star,
  Calendar,
  ShieldCheck,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react';

interface HrSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const HrSidebar: React.FC<HrSidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Tableau de bord', path: '/hr/dashboard', icon: LayoutDashboard },
    { label: 'Gestion des offres', path: '/hr/jobs', icon: Briefcase },
    { label: 'Candidatures & Pipeline', path: '/hr/applications', icon: Users },
    { label: 'Agent IA & Assistant RH', path: '/hr/ai-agent', icon: Sparkles },
    { label: 'Vivier de talents', path: '/hr/talent-pool', icon: Star },
    { label: 'Entretiens & Calendrier', path: '/hr/interviews', icon: Calendar },
    { label: 'Équipe RH & RBAC', path: '/hr/users', icon: ShieldCheck },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-white border-r border-[#e2e5e7] flex flex-col flex-shrink-0 text-gray-700 h-full lg:min-h-screen transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-[#e2e5e7] bg-[#f8f9fa]">
          <Link
            to="/hr/dashboard"
            onClick={handleLinkClick}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="p-1 rounded-xl bg-white border border-[#e2e5e7] shadow-sm">
              <img
                src="/logo-estc.png"
                alt="ESTC Logo"
                className="h-9 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-[#004b82] flex items-center gap-1.5">
                SMARTRECRUIT
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#868889]">
                EST Casablanca &bull; Portail RH
              </p>
            </div>
          </Link>

          {/* Close button for mobile screen */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
            title="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#868889] mb-2">
            Menu Principal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#004b82] text-white shadow-md'
                    : 'text-[#868889] hover:text-[#004b82] hover:bg-[#f0f5fa]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#868889]'}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </Link>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-[#e2e5e7] bg-[#f8f9fa]">
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#004b82] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0 border border-[#004b82]/30">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.firstName ? user.firstName[0].toUpperCase() : 'A'
                )}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                </p>
                <p className="text-[10px] font-bold text-[#004b82] truncate">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all shadow-2xs border border-rose-200 shrink-0"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
