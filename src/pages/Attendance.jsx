import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import {
  UserCheck,
  PlusCircle,
  Calendar,
  Check,
  X,
  Users,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function Attendance() {
  const { user, profile, isLeader, isSuperAdmin } = useAuth();
  const { t, isTamil } = useLanguage();

  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Session Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [attendanceMap, setAttendanceMap] = useState({});
  const [saving, setSaving] = useState(false);

  // View / Edit Records Modal
  const [selectedSession, setSelectedSession] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const canManage = isLeader || isSuperAdmin;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessData, memsData] = await Promise.all([
        dataService.getAttendanceSessions(),
        dataService.getProfiles(),
      ]);
      setSessions(sessData || []);
      const approvedMems = (memsData || []).filter(m => m.status === 'approved');
      setMembers(approvedMems);

      // Initialize default attendance map
      const initialMap = {};
      approvedMems.forEach(m => {
        initialMap[m.id] = 'present';
      });
      setAttendanceMap(initialMap);
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewSession = () => {
    setSessionTitle('');
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSessionNotes('');
    const initialMap = {};
    members.forEach(m => {
      initialMap[m.id] = 'present';
    });
    setAttendanceMap(initialMap);
    setShowNewModal(true);
  };

  const toggleStatus = (memberId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [memberId]: prev[memberId] === 'present' ? 'absent' : 'present',
    }));
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const records = members.map(m => ({
        member_id: m.id,
        member_name: m.name,
        status: attendanceMap[m.id] || 'present',
      }));

      await dataService.createAttendanceSession(
        {
          title: sessionTitle,
          date: sessionDate,
          notes: sessionNotes,
          created_by: user?.id,
        },
        records
      );

      setShowNewModal(false);
      await loadData();
    } catch (err) {
      alert('Failed to save attendance session: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Member's personal attendance
  const myAttendanceRecords = sessions.map(s => {
    const rec = (s.records || []).find(r => r.member_id === user?.id);
    return {
      sessionTitle: s.title,
      date: s.date,
      status: rec ? rec.status : 'absent',
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>{t('attendance.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('attendance.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('attendance.subtitle')}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenNewSession}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('attendance.newSession')}</span>
          </button>
        )}
      </div>

      {/* Member Personal Attendance View if not Leader */}
      {!canManage && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            எனது வருகைப் பதிவுகள் (My Attendance Record)
          </h3>
          {myAttendanceRecords.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">வருகைப் பதிவுகள் ஏதும் இல்லை.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {myAttendanceRecords.map((r, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{r.sessionTitle}</p>
                    <p className="text-[11px] text-slate-400">📅 {r.date}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaders Sessions View */}
      {canManage && (
        <>
          {loading ? (
            <LoadingSpinner text="வருகைப் பதிவுகள் ஏற்றப்படுகின்றன..." />
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title={t('attendance.noSessions')}
              description="நடன ஒத்திகை அல்லது கூட்டங்களுக்கான வருகைப் பதிவு அரங்கத்தை உருவாக்கவும்."
              actionButton={
                <button
                  type="button"
                  onClick={handleOpenNewSession}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  {t('attendance.newSession')}
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((s) => {
                const presentCount = (s.records || []).filter(r => r.status === 'present').length;
                const totalCount = (s.records || []).length;
                const absentCount = totalCount - presentCount;

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-indigo-300 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase">
                            வருகைப் பதிவு
                          </span>
                          <h3 className="text-base font-extrabold text-slate-900 mt-1.5">
                            {s.title}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          📅 {s.date}
                        </span>
                      </div>

                      {s.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                          {s.notes}
                        </p>
                      )}

                      {/* Attendance Stats Pills */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
                          <span>{t('attendance.presentCount')}:</span>
                          <span className="font-extrabold">{presentCount}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center justify-between">
                          <span>{t('attendance.absentCount')}:</span>
                          <span className="font-extrabold">{absentCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSession(s);
                          setShowViewModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        உறுப்பினர் பட்டியல் காண்க →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* New Session Modal */}
      {showNewModal && (
        <Modal
          isOpen={showNewModal}
          onClose={() => setShowNewModal(false)}
          title={t('attendance.newSession')}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('attendance.sessionTitle')} *
                </label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="எ.கா: நடன ஒத்திகை பயிற்சி 1"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('common.date')} *
                </label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.notes')}
              </label>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="ஒத்திகை நேரம், இடம் அல்லது குறிப்புகள்"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>

            {/* Member Checklist */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                உறுப்பினர்கள் வருகைப் பதிவு (Click to toggle Present/Absent):
              </label>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50 p-1">
                {members.map((m) => {
                  const isPresent = attendanceMap[m.id] === 'present';
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleStatus(m.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer rounded-xl transition-all ${
                        isPresent ? 'bg-emerald-50/60 text-emerald-900' : 'bg-rose-50/40 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold">{m.name}</span>
                        <span className="text-[10px] text-slate-400">({m.phone})</span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          isPresent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isPresent ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{isPresent ? t('status.present') : t('status.absent')}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
              >
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Session Members Modal */}
      {showViewModal && selectedSession && (
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={`வருகைப் பதிவு: ${selectedSession.title} (${selectedSession.date})`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-3">
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
              {(selectedSession.records || []).map((r, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{r.member_name || r.member_id}</span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
