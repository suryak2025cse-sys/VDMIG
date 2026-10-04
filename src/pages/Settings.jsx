import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import logoImg from '../assets/Logo.png';
import {
  Settings as SettingsIcon,
  Shield,
  CreditCard,
  Save,
  Check,
  QrCode,
  Upload,
} from 'lucide-react';

export default function Settings() {
  const { isSuperAdmin } = useAuth();
  const { t, isTamil } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Group Info
  const [groupNameTa, setGroupNameTa] = useState('வதம்பை இளந்தளிர் குழு');
  const [groupNameEn, setGroupNameEn] = useState('Vadambai Ilanthazhir Kuzhu');
  const [contactPhone, setContactPhone] = useState('');

  // Collector 1
  const [c1Name, setC1Name] = useState('');
  const [c1Phone, setC1Phone] = useState('');
  const [c1Upi, setC1Upi] = useState('');
  const [c1QrFile, setC1QrFile] = useState(null);
  const [c1QrPreview, setC1QrPreview] = useState('');

  // Collector 2
  const [c2Name, setC2Name] = useState('');
  const [c2Phone, setC2Phone] = useState('');
  const [c2Upi, setC2Upi] = useState('');
  const [c2QrFile, setC2QrFile] = useState(null);
  const [c2QrPreview, setC2QrPreview] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [settings, collectors] = await Promise.all([
        dataService.getSettings(),
        dataService.getCollectors(),
      ]);

      if (settings) {
        setGroupNameTa(settings.group_name_ta || 'வதம்பை இளந்தளிர் குழு');
        setGroupNameEn(settings.group_name_en || 'Vadambai Ilanthazhir Kuzhu');
        setContactPhone(settings.contact_phone || '');
      }

      if (collectors && collectors.length >= 2) {
        const c1 = collectors.find(c => c.slot_number === 1) || collectors[0];
        const c2 = collectors.find(c => c.slot_number === 2) || collectors[1];

        if (c1) {
          setC1Name(c1.name);
          setC1Phone(c1.phone);
          setC1Upi(c1.upi_id);
          setC1QrPreview(c1.qr_code_url || '');
        }

        if (c2) {
          setC2Name(c2.name);
          setC2Phone(c2.phone);
          setC2Upi(c2.upi_id);
          setC2QrPreview(c2.qr_code_url || '');
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      // 1. Save Group Settings
      await dataService.updateSettings({
        group_name_ta: groupNameTa,
        group_name_en: groupNameEn,
        contact_phone: contactPhone,
      });

      // 2. Upload and Save Collector 1
      let c1QrUrl = c1QrPreview;
      if (c1QrFile) {
        c1QrUrl = await dataService.uploadFile('payment-proofs', c1QrFile, `qr-c1-${Date.now()}`);
      }
      await dataService.updateCollector(1, {
        name: c1Name,
        phone: c1Phone,
        upi_id: c1Upi,
        qr_code_url: c1QrUrl,
      });

      // 3. Upload and Save Collector 2
      let c2QrUrl = c2QrPreview;
      if (c2QrFile) {
        c2QrUrl = await dataService.uploadFile('payment-proofs', c2QrFile, `qr-c2-${Date.now()}`);
      }
      await dataService.updateCollector(2, {
        name: c2Name,
        phone: c2Phone,
        upi_id: c2Upi,
        qr_code_url: c2QrUrl,
      });

      setMessage('அனைத்து நிர்வாக அமைப்புகளும் வெற்றிகரமாக சேமிக்கப்பட்டன!');
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="அமைப்புகள் ஏற்றப்படுகின்றன..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-red-600" />
            <span>{t('settings.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Group Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <img
                src={logoImg}
                alt="Logo"
                className="w-6 h-6 object-contain rounded-md"
              />
              <span>{t('settings.groupInfo')}</span>
            </h3>
            <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-amber-300 shadow-xs flex items-center justify-center">
              <img
                src={logoImg}
                alt="Official Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('settings.groupNameTa')} *
              </label>
              <input
                type="text"
                required
                value={groupNameTa}
                onChange={(e) => setGroupNameTa(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('settings.groupNameEn')} *
              </label>
              <input
                type="text"
                required
                value={groupNameEn}
                onChange={(e) => setGroupNameEn(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                முக்கிய தொடர்பு எண் (Contact Phone)
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Payment Collector 1 Settings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>{t('settings.collector1Settings')}</span>
            </h3>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
              Slot 1
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('settings.collectorName')} *
              </label>
              <input
                type="text"
                required
                value={c1Name}
                onChange={(e) => setC1Name(e.target.value)}
                placeholder="வசூலிப்பாளர் பெயர்"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('settings.collectorPhone')} *
              </label>
              <input
                type="tel"
                required
                value={c1Phone}
                onChange={(e) => setC1Phone(e.target.value)}
                placeholder="தொலைபேசி எண்"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('settings.collectorUpi')} *
              </label>
              <input
                type="text"
                required
                value={c1Upi}
                onChange={(e) => setC1Upi(e.target.value)}
                placeholder="upi-id@bank"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('settings.collectorQr')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) {
                      setC1QrFile(f);
                      setC1QrPreview(URL.createObjectURL(f));
                    }
                  }}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
                />
                {c1QrPreview && (
                  <img src={c1QrPreview} alt="QR 1" className="w-16 h-16 rounded-xl object-contain border p-1 bg-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Payment Collector 2 Settings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>{t('settings.collector2Settings')}</span>
            </h3>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
              Slot 2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('settings.collectorName')} *
              </label>
              <input
                type="text"
                required
                value={c2Name}
                onChange={(e) => setC2Name(e.target.value)}
                placeholder="வசூலிப்பாளர் பெயர்"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('settings.collectorPhone')} *
              </label>
              <input
                type="tel"
                required
                value={c2Phone}
                onChange={(e) => setC2Phone(e.target.value)}
                placeholder="தொலைபேசி எண்"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('settings.collectorUpi')} *
              </label>
              <input
                type="text"
                required
                value={c2Upi}
                onChange={(e) => setC2Upi(e.target.value)}
                placeholder="upi-id@bank"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('settings.collectorQr')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) {
                      setC2QrFile(f);
                      setC2QrPreview(URL.createObjectURL(f));
                    }
                  }}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
                />
                {c2QrPreview && (
                  <img src={c2QrPreview} alt="QR 2" className="w-16 h-16 rounded-xl object-contain border p-1 bg-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('common.loading') : t('settings.saveSettings')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
