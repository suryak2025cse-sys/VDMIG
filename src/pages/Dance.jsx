import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import AudioPlayer from '../components/AudioPlayer';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import {
  Music2,
  PlusCircle,
  Edit2,
  Trash2,
  Clock,
  Users,
  Music,
  Upload,
  Search,
  Filter,
} from 'lucide-react';

export default function Dance() {
  const { user, isLeader, isSuperAdmin } = useAuth();
  const { t, isTamil } = useLanguage();

  const [dances, setDances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDance, setEditingDance] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields (ONLY 5 fields as specified)
  const [groupName, setGroupName] = useState('');
  const [performerName, setPerformerName] = useState('');
  const [duration, setDuration] = useState('5:00');
  const [songTitle, setSongTitle] = useState('');
  const [status, setStatus] = useState('pending');
  const [songFile, setSongFile] = useState(null);
  const [existingSongUrl, setExistingSongUrl] = useState('');

  // Delete Dialog State
  const [danceToDelete, setDanceToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManage = isLeader || isSuperAdmin;

  useEffect(() => {
    loadDances();
  }, []);

  const loadDances = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDances();
      setDances(data || []);
    } catch (err) {
      console.error('Error fetching dances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingDance(null);
    setGroupName('');
    setPerformerName('');
    setDuration('5:00');
    setSongTitle('');
    setStatus('pending');
    setSongFile(null);
    setExistingSongUrl('');
    setShowModal(true);
  };

  const handleOpenEdit = (dance) => {
    setEditingDance(dance);
    setGroupName(dance.group_name);
    setPerformerName(dance.performer_name);
    setDuration(dance.duration);
    setSongTitle(dance.song_title);
    setStatus(dance.status);
    setSongFile(null);
    setExistingSongUrl(dance.song_url || '');
    setShowModal(true);
  };

  const handleSongFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSongFile(file);
      if (!songTitle) {
        setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSaveDance = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let songUrl = existingSongUrl;
      if (songFile) {
        songUrl = await dataService.uploadFile('songs', songFile, `song-${Date.now()}`);
      }

      const dancePayload = {
        group_name: groupName,
        performer_name: performerName,
        duration: duration || '5:00',
        song_title: songTitle || 'Audio Track',
        song_url: songUrl,
        status: status,
      };

      if (editingDance) {
        await dataService.updateDance(editingDance.id, dancePayload);
      } else {
        await dataService.createDance({
          ...dancePayload,
          created_by: user?.id,
        });
      }

      setShowModal(false);
      await loadDances();
    } catch (err) {
      alert('Failed to save dance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!danceToDelete) return;
    setDeleting(true);
    try {
      await dataService.deleteDance(danceToDelete.id);
      setIsDeleteOpen(false);
      await loadDances();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredDances = dances.filter((d) => {
    const matchesSearch =
      d.group_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.performer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.song_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-purple-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Music2 className="w-4 h-4" />
            <span>{t('dance.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('dance.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('dance.subtitle')}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('dance.addPerformance')}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="குழு பெயர் அல்லது கலைஞர் தேடுக..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-purple-500 cursor-pointer w-full sm:w-auto"
        >
          <option value="all">{t('members.filterStatus')}: {t('common.all')}</option>
          <option value="pending">{t('status.pending')}</option>
          <option value="confirmed">{t('status.confirmed')}</option>
          <option value="completed">{t('status.completed')}</option>
        </select>
      </div>

      {/* Dance List */}
      {loading ? (
        <LoadingSpinner text="நடன நிகழ்ச்சிகள் விவரங்கள் ஏற்றப்படுகின்றன..." />
      ) : filteredDances.length === 0 ? (
        <EmptyState
          icon={Music2}
          title={t('dance.noDances')}
          description="புதிய நடன நிகழ்ச்சிகள் மற்றும் பாடல்களை சேர்க்கவும்."
          actionButton={
            canManage && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
              >
                {t('dance.addPerformance')}
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDances.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 transition-colors"
            >
              <div className="space-y-3">
                {/* Header: Group Name & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                      {t('dance.groupName')}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      {d.group_name}
                    </h3>
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                {/* Performer Name & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('dance.performerName')}</span>
                    <span className="font-semibold text-slate-800">{d.performer_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('dance.duration')}</span>
                    <span className="font-mono font-bold text-purple-700">{d.duration}</span>
                  </div>
                </div>

                {/* Song Player */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('dance.song')}
                  </span>
                  <AudioPlayer src={d.song_url} title={d.song_title} />
                </div>
              </div>

              {/* Actions for Leaders */}
              {canManage && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(d)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition-colors cursor-pointer"
                    title={t('common.edit')}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDanceToDelete(d);
                      setIsDeleteOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dance Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingDance ? 'நடன நிகழ்ச்சி திருத்து' : t('dance.addPerformance')}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveDance} className="space-y-4">
            {/* 1. Group Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. {t('dance.groupName')} *
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="எ.கா: வதம்பை இளந்தளிர் இளைஞர் அணி"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
              />
            </div>

            {/* 2. Performer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. {t('dance.performerName')} *
              </label>
              <input
                type="text"
                required
                value={performerName}
                onChange={(e) => setPerformerName(e.target.value)}
                placeholder="நடனக் கலைஞர்(கள்) பெயர் / Performer Name(s)"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
              />
            </div>

            {/* 3. Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. {t('dance.duration')} *
              </label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="5:30"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 bg-slate-50/50 font-mono"
              />
            </div>

            {/* 4. Song Upload / Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. {t('dance.song')} (MP3, WAV, M4A)
              </label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="பாடலின் தலைப்பு (Song Title)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 bg-slate-50/50 mb-2"
              />
              <input
                type="file"
                accept="audio/mp3,audio/wav,audio/m4a,audio/*"
                onChange={handleSongFileChange}
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {existingSongUrl && !songFile && (
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  ✓ ஏற்கனவே பாடல் பதிவேற்றப்பட்டுள்ளது. மாற்ற விரும்பினால் புதிய கோப்பைத் தேர்ந்தெடுக்கவும்.
                </p>
              )}
            </div>

            {/* 5. Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5. {t('dance.status')} *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
              >
                <option value="pending">{t('status.pending')}</option>
                <option value="confirmed">{t('status.confirmed')}</option>
                <option value="completed">{t('status.completed')}</option>
              </select>
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
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs cursor-pointer"
              >
                {saving ? t('common.loading') : t('common.save')}
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
        message={t('dance.confirmDelete')}
        isDestructive={true}
      />
    </div>
  );
}
