import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Shield,
  Camera,
  Check,
  Save,
  AlertCircle,
  Ban,
  ShieldCheck,
  UserX,
} from 'lucide-react';

export default function Profile() {
  const { user, profile, updateProfile, refreshProfile, role, status, isLeader, isSuperAdmin } = useAuth();
  const { t, isTamil } = useLanguage();

  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(profile?.profile_photo_url || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Blocked Users State
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [userToUnblock, setUserToUnblock] = useState(null);
  const [isUnblockConfirmOpen, setIsUnblockConfirmOpen] = useState(false);
  const [unblocking, setUnblocking] = useState(false);

  useEffect(() => {
    loadBlockedUsers();
  }, [user]);

  const loadBlockedUsers = async () => {
    if (!user) return;
    setLoadingBlocked(true);
    try {
      const data = await dataService.getBlockedUsers(user.id, isLeader || isSuperAdmin);
      setBlockedUsers(data || []);
    } catch (err) {
      console.warn('Failed to load blocked users:', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleOpenUnblock = (blockedUser) => {
    setUserToUnblock(blockedUser);
    setIsUnblockConfirmOpen(true);
  };

  const handleConfirmUnblock = async () => {
    if (!userToUnblock) return;
    setUnblocking(true);
    try {
      await dataService.unblockUser(userToUnblock.id, user?.id);
      // Update UI immediately without refresh
      setBlockedUsers(prev => prev.filter(u => u.id !== userToUnblock.id));
      setIsUnblockConfirmOpen(false);
      setMessage(`${userToUnblock.name} என்ற பயனரின் கணக்கு வெற்றிகரமாக மீளமைக்கப்பட்டது!`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError('Unblock failed: ' + err.message);
    } finally {
      setUnblocking(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      let photoUrl = profile?.profile_photo_url || '';
      if (photoFile) {
        photoUrl = await dataService.uploadFile('avatars', photoFile, `profile-${Date.now()}`);
      }

      await updateProfile({
        name,
        phone,
        profile_photo_url: photoUrl,
      });

      await refreshProfile();
      setMessage('சுயவிவர தகவல்கள் வெற்றிகரமாக சேமிக்கப்பட்டன!');
    } catch (err) {
      setError('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
          <User className="w-4 h-4" />
          <span>{t('profile.title')}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {t('profile.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {t('profile.subtitle')}
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Card Header with Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-amber-300 overflow-hidden flex items-center justify-center shadow-md">
              {photoPreview ? (
                <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-amber-700">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <label className="absolute inset-0 bg-slate-900/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </label>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-lg font-extrabold text-slate-900">{profile?.name}</h2>
            <p className="text-xs text-slate-400">{profile?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {t(`roles.${role}`, role)}
              </span>
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('auth.fullName')} *
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('auth.phone')} *
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('auth.email')} (Read-Only)
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? t('common.loading') : t('profile.saveProfile')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Dedicated Blocked Users Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {t('members.blockedUsers')} (Blocked Users)
              </h2>
              <p className="text-xs text-slate-500">
                நீங்கள் அல்லது நிர்வாகிகளால் முடக்கப்பட்ட பயனர்களின் பட்டியல்
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
            {blockedUsers.length} {t('members.blockedUsers')}
          </span>
        </div>

        {loadingBlocked ? (
          <p className="text-xs text-slate-400 py-3 text-center">ஏற்றப்படுகிறது...</p>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500/50 mb-2" />
            <p className="text-xs font-medium text-slate-500">{t('members.noBlockedUsers')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((bu) => (
              <div
                key={bu.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {bu.profile_photo_url ? (
                    <img
                      src={bu.profile_photo_url}
                      alt={bu.name}
                      className="w-10 h-10 rounded-full object-cover border border-amber-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-linear-to-tr from-rose-500 to-amber-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {bu.name ? bu.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{bu.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                      <span className="font-mono">{bu.phone}</span>
                      <span>•</span>
                      <span>{t(`roles.${bu.role}`, bu.role)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-700">
                    {t('status.blocked')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenUnblock(bu)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t('members.unblock')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unblock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isUnblockConfirmOpen}
        onClose={() => setIsUnblockConfirmOpen(false)}
        onConfirm={handleConfirmUnblock}
        isLoading={unblocking}
        title={t('members.unblock')}
        message={
          userToUnblock
            ? `${userToUnblock.name} என்ற பயனரின் கணக்கு முடக்கத்தை நீக்கி மீண்டும் செயல்படுத்த விரும்புகிறீர்களா?`
            : 'பயனரை செயல்படுத்த விரும்புகிறீர்களா?'
        }
        confirmText={t('members.unblock')}
        isDestructive={false}
      />
    </div>
  );
}
