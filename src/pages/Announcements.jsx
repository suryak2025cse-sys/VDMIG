import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import {
  Megaphone,
  PlusCircle,
  Trash2,
  Calendar,
  User,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function Announcements() {
  const { user, profile, isLeader, isSuperAdmin } = useAuth();
  const { t, isTamil } = useLanguage();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');

  // Delete State
  const [annToDelete, setAnnToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManage = isLeader || isSuperAdmin;

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAnnouncements();
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dataService.createAnnouncement({
        title,
        description,
        priority,
        date: new Date().toISOString().split('T')[0],
        created_by_name: profile?.name || 'தலைமை நிர்வாகம்',
        created_by: user?.id,
      });

      // Broadcast notification to members
      await dataService.createNotification({
        title: `புதிய அறிவிப்பு: ${title}`,
        message: description.substring(0, 100),
        type: 'announcement',
        link: '/announcements',
      });

      setShowModal(false);
      setTitle('');
      setDescription('');
      setPriority('normal');
      await loadAnnouncements();
    } catch (err) {
      alert('Failed to publish announcement: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!annToDelete) return;
    setDeleting(true);
    try {
      await dataService.deleteAnnouncement(annToDelete.id);
      setIsDeleteOpen(false);
      await loadAnnouncements();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" />
            <span>{t('announcements.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('announcements.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('announcements.subtitle')}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('announcements.newAnnouncement')}</span>
          </button>
        )}
      </div>

      {/* Announcements Feed */}
      {loading ? (
        <LoadingSpinner text="அறிவிப்புகள் ஏற்றப்படுகின்றன..." />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={t('announcements.noAnnouncements')}
          description="புதிய முக்கிய அறிவிப்புகள் ஏதும் வெளியிடப்படவில்லை."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-3xl border p-6 shadow-xs transition-all space-y-3 ${
                a.priority === 'urgent'
                  ? 'border-red-300 ring-2 ring-red-500/10 bg-linear-to-br from-red-50/20 to-white'
                  : a.priority === 'important'
                  ? 'border-amber-300 ring-2 ring-amber-500/10 bg-linear-to-br from-amber-50/20 to-white'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <StatusBadge status={a.priority} />
                    <span className="text-[11px] text-slate-400 font-medium">
                      📅 {a.date}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 pt-1">
                    {a.title}
                  </h3>
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnnToDelete(a);
                      setIsDeleteOpen(true);
                    }}
                    className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {a.description}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>வெளியிட்டவர்: <span className="font-semibold text-slate-700">{a.created_by_name}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Announcement Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={t('announcements.newAnnouncement')}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                அறிவிப்பு தலைப்பு (Title) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="எ.கா: விழா சந்தா செலுத்தும் விவரம்"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('announcements.priority')} *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              >
                <option value="normal">{t('status.normal')} (Normal)</option>
                <option value="important">{t('status.important')} (Important)</option>
                <option value="urgent">{t('status.urgent')} (Urgent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                முழு விவரம் (Description) *
              </label>
              <textarea
                rows="4"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="அறிவிப்பின் முழுமையான விவரங்களை இங்கே உள்ளிடவும்..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs cursor-pointer"
              >
                {saving ? t('common.loading') : t('common.submit')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title={t('common.delete')}
        message="இந்த அறிவிப்பை நிச்சயமாக நீக்க விரும்புகிறீர்களா?"
        isDestructive={true}
      />
    </div>
  );
}
