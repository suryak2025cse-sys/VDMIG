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
  CalendarDays,
  PlusCircle,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';

export default function Events() {
  const { user, isLeader, isSuperAdmin } = useAuth();
  const { t, isTamil } = useLanguage();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [status, setStatus] = useState('upcoming');

  // Delete State
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManage = isLeader || isSuperAdmin;

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await dataService.getEvents();
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setEventName('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('');
    setVenue('');
    setStatus('upcoming');
    setShowModal(true);
  };

  const handleOpenEdit = (evt) => {
    setEditingEvent(evt);
    setEventName(evt.event_name);
    setDescription(evt.description || '');
    setDate(evt.date);
    setTime(evt.time || '');
    setVenue(evt.venue || '');
    setStatus(evt.status || 'upcoming');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        event_name: eventName,
        description,
        date,
        time,
        venue,
        status,
      };

      if (editingEvent) {
        await dataService.updateEvent(editingEvent.id, payload);
      } else {
        await dataService.createEvent({
          ...payload,
          created_by: user?.id,
        });
      }

      setShowModal(false);
      await loadEvents();
    } catch (err) {
      alert('Failed to save event: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    setDeleting(true);
    try {
      await dataService.deleteEvent(eventToDelete.id);
      setIsDeleteOpen(false);
      await loadEvents();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>{t('events.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('events.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('events.subtitle')}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('events.addEvent')}</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="நிகழ்வு அல்லது இடம் தேடுக..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Event Cards */}
      {loading ? (
        <LoadingSpinner text="நிகழ்வுகள் ஏற்றப்படுகின்றன..." />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t('events.noEvents')}
          description="வரவிருக்கும் நிகழ்வுகள் மற்றும் திருவிழாக்களை சேர்க்கவும்."
          actionButton={
            canManage && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                {t('events.addEvent')}
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {t(`status.${e.status}`, e.status)}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5">
                      {e.event_name}
                    </h3>
                  </div>
                  <StatusBadge status={e.status} />
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{e.date}</span>
                    {e.time && <span className="text-slate-400">• {e.time}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-slate-700">{e.venue}</span>
                  </div>
                </div>

                {e.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {e.description}
                  </p>
                )}
              </div>

              {canManage && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(e)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEventToDelete(e);
                      setIsDeleteOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingEvent ? 'நிகழ்வு திருத்து' : t('events.addEvent')}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('events.eventName')} *
              </label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="எ.கா: கிராமிய கலை விழா 2026"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50/50 font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('common.date')} *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('common.time')}
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="06:00 PM"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('events.venue')} *
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="எ.கா: கிராம சமுதாய கூடம், வதம்பை"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.status')} *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              >
                <option value="upcoming">{t('status.upcoming')}</option>
                <option value="ongoing">{t('status.ongoing')}</option>
                <option value="completed">{t('status.completed')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.description')}
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="நிகழ்ச்சி பற்றிய கூடுதல் விவரங்கள்..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
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
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
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
        message="இந்த நிகழ்வை நிச்சயமாக நீக்க விரும்புகிறீர்களா?"
        isDestructive={true}
      />
    </div>
  );
}
