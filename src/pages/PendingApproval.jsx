import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import loginBg from '../assets/Login_page.jpeg';
import logoImg from '../assets/Logo.png';
import { Clock, RefreshCw, LogOut, Phone, ShieldCheck } from 'lucide-react';

export default function PendingApproval() {
  const { profile, refreshProfile, logout, isApproved } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
    if (isApproved) {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]"></div>

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white/95 backdrop-blur-md py-10 px-6 shadow-2xl rounded-3xl sm:px-10 border border-white/60 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white p-1.5 shadow-md border border-amber-300 mx-auto mb-4 flex items-center justify-center">
            <img
              src={logoImg}
              alt="Logo"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 mb-2">
            {t('auth.pendingTitle')}
          </h2>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 leading-relaxed mb-6 text-left">
            <p className="font-semibold mb-1">
              வணக்கம், {profile?.name || 'உறுப்பினர்'}!
            </p>
            <p>
              {t('auth.pendingDesc')}
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{t('auth.checkStatus')}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>கிராம நிர்வாகிகள் தொடர்பு:</span>
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              அவசர அங்கீகாரத்திற்கு கிராம நிர்வாகிகளைத் தொடர்பு கொள்ளவும்.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
