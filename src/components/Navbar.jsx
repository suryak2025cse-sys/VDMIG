import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { dataService } from '../services/dataService';
import {
  Bell,
  LogOut,
  User,
  Shield,
  Menu,
  ChevronDown,
} from 'lucide-react';

export default function Navbar({ onToggleMobileSidebar }) {
  const { user, profile, logout, role, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await dataService.getNotifications(user.id);
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleDisplayName = (r) => {
    return t(`roles.${r}`, r);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left: Mobile Menu & Village Logo/Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-linear-to-br from-amber-500 via-amber-600 to-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0 border border-amber-400/40">
                <span className="text-xl sm:text-2xl">🌱</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight tracking-tight group-hover:text-amber-700 transition-colors">
                  வதம்பை இளந்தளிர் குழு
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-slate-500 hidden xs:inline">
                  Vadambai Ilanthazhir Kuzhu
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Language Switcher, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notifications Dropdown */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title={t('nav.notifications')}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800">{t('notifications.title')}</h4>
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifMenu(false)}
                        className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                      >
                        {t('common.view')} {t('common.all')}
                      </Link>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-center text-slate-400 py-6">
                          {t('notifications.noNotifications')}
                        </p>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <Link
                            key={n.id}
                            to={n.link || '/notifications'}
                            onClick={() => setShowNotifMenu(false)}
                            className={`block px-4 py-2.5 hover:bg-slate-50 transition-colors ${
                              !n.is_read ? 'bg-amber-50/40' : ''
                            }`}
                          >
                            <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Avatar / Menu */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifMenu(false);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {profile?.profile_photo_url ? (
                    <img
                      src={profile.profile_photo_url}
                      alt={profile.name}
                      className="w-8 h-8 rounded-full object-cover border border-amber-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-600 to-amber-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {profile?.name || 'Member'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {getRoleDisplayName(role)}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800 truncate">{profile?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{profile?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      {t('nav.profile')}
                    </Link>
                    {isSuperAdmin && (
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Shield className="w-4 h-4 text-amber-600" />
                        {t('nav.settings')}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100 mt-1 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
