import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
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
    <div className="min-h-screen bg-linear-to-b from-amber-50/50 via-white to-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-10 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-inner border border-amber-200">
            <Clock className="w-8 h-8 animate-pulse" />
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
