import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Music2,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Megaphone,
  UserCheck,
  Image as GalleryIcon,
  Settings,
  User,
  X,
  ShieldCheck,
} from 'lucide-react';
import logoImg from '../assets/Logo.png';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { isSuperAdmin, isLeader, isPaymentCollector, isApproved, role } = useAuth();
  const { t } = useLanguage();

  const getNavItems = () => {
    const items = [
      {
        to: '/',
        label: t('nav.dashboard'),
        icon: LayoutDashboard,
        show: true,
      },
      {
        to: '/members',
        label: t('nav.members'),
        icon: Users,
        show: isLeader || isSuperAdmin,
      },
      {
        to: '/payments',
        label: t('nav.payments'),
        icon: CreditCard,
        show: isApproved,
      },
      {
        to: '/dance',
        label: t('nav.dance'),
        icon: Music2,
        show: isApproved,
      },
      {
        to: '/income',
        label: t('nav.income'),
        icon: TrendingUp,
        show: isLeader || isSuperAdmin,
      },
      {
        to: '/expenses',
        label: t('nav.expenses'),
        icon: TrendingDown,
        show: isLeader || isSuperAdmin,
      },
      {
        to: '/finance',
        label: t('nav.finance'),
        icon: FileSpreadsheet,
        show: isLeader || isSuperAdmin,
      },
      {
        to: '/events',
        label: t('nav.events'),
        icon: CalendarDays,
        show: isApproved,
      },
      {
        to: '/announcements',
        label: t('nav.announcements'),
        icon: Megaphone,
        show: isApproved,
      },
      {
        to: '/attendance',
        label: t('nav.attendance'),
        icon: UserCheck,
        show: isApproved,
      },
      {
        to: '/gallery',
        label: t('nav.gallery'),
        icon: GalleryIcon,
        show: isApproved,
      },
      {
        to: '/profile',
        label: t('nav.profile'),
        icon: User,
        show: true,
      },
      {
        to: '/settings',
        label: t('nav.settings'),
        icon: Settings,
        show: isSuperAdmin,
      },
    ];

    return items.filter(item => item.show);
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Village Group Header in Sidebar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white p-0.5 border border-amber-400/80 shadow-xs flex items-center justify-center shrink-0">
            <img
              src={logoImg}
              alt="லோகோ"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-slate-800 leading-snug">
              வதம்பை இளந்தளிர்
            </h2>
            <p className="text-[10px] text-amber-700 font-semibold tracking-wider uppercase">
              {t(`roles.${role}`, role)}
            </p>
          </div>
        </div>
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`
              }
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Security notice footer */}
      <div className="p-3 m-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900/80 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
        <span className="leading-tight">
          தனியார் கிராம தளம் • Private Village Portal
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
