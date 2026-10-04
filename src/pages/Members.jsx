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
  Users,
  Search,
  Filter,
  Check,
  X,
  Ban,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Shield,
  MoreVertical,
  Trash2,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';

export default function Members() {
  const { isSuperAdmin, isLeader, user } = useAuth();
  const { t, isTamil } = useLanguage();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Action dialog states
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'block', 'unblock', 'role'
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedNewRole, setSelectedNewRole] = useState('member');
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('member');
  const [addStatus, setAddStatus] = useState('approved');
  const [addError, setAddError] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await dataService.getProfiles();
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAction = (member, action) => {
    setSelectedMember(member);
    setActionType(action);
    setRejectionReason('');
    setIsConfirmOpen(true);
  };

  const handleOpenRoleModal = (member) => {
    setSelectedMember(member);
    setSelectedNewRole(member.role || 'member');
    setShowRoleModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedMember) return;
    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        await dataService.updateProfileStatus(selectedMember.id, 'approved');
        await dataService.createNotification({
          user_id: selectedMember.id,
          title: 'உறுப்பினர் சேர்க்கை அங்கீகரிக்கப்பட்டது',
          message: 'தங்களின் வதம்பை இளந்தளிர் குழு உறுப்பினர் கோரிக்கை அங்கீகரிக்கப்பட்டது.',
          type: 'approval',
          link: '/dashboard',
        });
      } else if (actionType === 'reject') {
        await dataService.updateProfileStatus(selectedMember.id, 'rejected', rejectionReason);
      } else if (actionType === 'block') {
        await dataService.updateProfileStatus(selectedMember.id, 'blocked');
      } else if (actionType === 'unblock') {
        await dataService.updateProfileStatus(selectedMember.id, 'approved');
      } else if (actionType === 'delete') {
        await dataService.deleteProfile(selectedMember.id);
      } else if (actionType === 'deleteAll') {
        await dataService.deleteAllProfiles();
      }
      await loadMembers();
      setIsConfirmOpen(false);
    } catch (err) {
      alert('Action failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedMember) return;
    setActionLoading(true);
    try {
      await dataService.updateProfileRole(selectedMember.id, selectedNewRole);
      await loadMembers();
      setShowRoleModal(false);
    } catch (err) {
      alert('Role update failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!addName.trim() || !addPhone.trim()) {
      setAddError('பெயர் மற்றும் அலைபேசி எண் கட்டாயம் (Name & Phone required)');
      return;
    }

    setActionLoading(true);
    try {
      await dataService.createProfile({
        name: addName.trim(),
        phone: addPhone.trim(),
        email: addEmail.trim() || `${addPhone.trim()}@vadambai.org`,
        role: addRole,
        status: addStatus,
      });

      await loadMembers();
      setShowAddModal(false);
      setAddName('');
      setAddPhone('');
      setAddEmail('');
      setAddRole('member');
      setAddStatus('approved');
    } catch (err) {
      setAddError(err.message || 'Failed to add member');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Search logic
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone?.includes(searchQuery) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>{t('members.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('members.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('members.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            {members.length} {t('dashboard.totalMembers')}
          </span>

          {(isSuperAdmin || isLeader) && (
            <button
              type="button"
              onClick={() => {
                setAddError('');
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>உறுப்பினர் சேர்க்கை (Add Member)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">{t('members.filterStatus')}: {t('common.all')}</option>
            <option value="pending">{t('status.pending')}</option>
            <option value="approved">{t('status.approved')}</option>
            <option value="rejected">{t('status.rejected')}</option>
            <option value="blocked">{t('status.blocked')}</option>
          </select>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">{t('members.filterRole')}: {t('common.all')}</option>
            <option value="super_admin">{t('roles.super_admin')}</option>
            <option value="leader">{t('roles.leader')}</option>
            <option value="payment_collector">{t('roles.payment_collector')}</option>
            <option value="member">{t('roles.member')}</option>
          </select>
        </div>
      </div>

      {/* Loading & Empty State */}
      {loading ? (
        <LoadingSpinner text="உறுப்பினர்கள் பட்டியல் ஏற்றப்படுகிறது..." />
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('members.noMembers')}
          description=""
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[820px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-4 whitespace-nowrap">{t('members.name')}</th>
                    <th className="px-5 py-4 whitespace-nowrap">{t('members.phone')}</th>
                    <th className="px-5 py-4 whitespace-nowrap">{t('members.role')}</th>
                    <th className="px-5 py-4 whitespace-nowrap">{t('members.status')}</th>
                    <th className="px-5 py-4 whitespace-nowrap">{t('members.registeredDate')}</th>
                    <th className="px-5 py-4 text-right whitespace-nowrap">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {m.profile_photo_url ? (
                            <img
                              src={m.profile_photo_url}
                              alt={m.name}
                              className="w-9 h-9 rounded-full object-cover border border-amber-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-amber-600 to-amber-400 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{m.name}</p>
                            <p className="text-[11px] text-slate-400">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {m.phone}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {t(`roles.${m.role}`, m.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          {m.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenAction(m, 'approve')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                                title="ஒப்புதல் அளிக்கவும்"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{t('members.approve')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAction(m, 'reject')}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                                title="நிராகரிக்கவும்"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>{t('members.reject')}</span>
                              </button>
                            </>
                          )}

                          {m.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(m, 'block')}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors shrink-0"
                              title={t('members.block')}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {m.status === 'blocked' && (
                            <button
                              type="button"
                              onClick={() => handleOpenAction(m, 'unblock')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs shrink-0 whitespace-nowrap"
                              title={t('members.unblock')}
                            >
                              {t('members.unblock')}
                            </button>
                          )}

                          {isSuperAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenRoleModal(m)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                                title={t('members.changeRole')}
                              >
                                <Shield className="w-3 h-3 text-amber-600" />
                                <span>{t('members.changeRole')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAction(m, 'delete')}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                                title="உறுப்பினரை நீக்கு (Delete)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredMembers.map((m) => (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {m.profile_photo_url ? (
                      <img
                        src={m.profile_photo_url}
                        alt={m.name}
                        className="w-10 h-10 rounded-full object-cover border border-amber-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-tr from-amber-600 to-amber-400 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('members.phone')}</span>
                    <span className="font-mono font-semibold">{m.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('members.role')}</span>
                    <span className="font-semibold text-slate-800">{t(`roles.${m.role}`, m.role)}</span>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {m.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenAction(m, 'approve')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('members.approve')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAction(m, 'reject')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-1 border border-rose-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{t('members.reject')}</span>
                      </button>
                    </>
                  )}

                  {m.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAction(m, 'block')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-semibold cursor-pointer"
                    >
                      {t('members.block')}
                    </button>
                  )}

                  {isSuperAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenRoleModal(m)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200 cursor-pointer"
                      >
                        {t('members.changeRole')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAction(m, 'delete')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>நீக்கு</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        isLoading={actionLoading}
        title={
          actionType === 'approve'
            ? t('members.approve')
            : actionType === 'reject'
            ? t('members.reject')
            : actionType === 'block'
            ? t('members.block')
            : actionType === 'unblock'
            ? t('members.unblock')
            : actionType === 'delete'
            ? 'உறுப்பினரை நீக்கு (Delete Member)'
            : 'அனைத்து உறுப்பினர்களையும் நீக்கு (Delete All)'
        }
        message={
          actionType === 'approve'
            ? `${selectedMember?.name} என்ற உறுப்பினரை வதம்பை இளந்தளிர் குழுவில் இணைத்து ஒப்புதல் அளிக்க விரும்புகிறீர்களா?`
            : actionType === 'reject'
            ? `${selectedMember?.name} என்ற பயனரின் உறுப்பினர் சேர்க்கை கோரிக்கையை நிராகரிக்க விரும்புகிறீர்களா?`
            : actionType === 'block'
            ? `${selectedMember?.name} என்ற உறுப்பினரின் கணக்கை முடக்க (Block) விரும்புகிறீர்களா?`
            : actionType === 'unblock'
            ? `${selectedMember?.name} என்ற உறுப்பினரின் கணக்கை மீண்டும் செயல்படுத்த விரும்புகிறீர்களா?`
            : actionType === 'delete'
            ? `${selectedMember?.name} என்ற உறுப்பினரின் சுயவிவரம் மற்றும் அனைத்து தகவல்களையும் நிரந்தரமாக நீக்க விரும்புகிறீர்களா?`
            : `அனைத்து ${members.length} உறுப்பினர்களின் சுயவிவரங்களையும் நிரந்தரமாக நீக்க விரும்புகிறீர்களா?`
        }
        isDestructive={actionType === 'reject' || actionType === 'block' || actionType === 'delete' || actionType === 'deleteAll'}
      />

      {/* Super Admin Change Role Modal */}
      {showRoleModal && (
        <Modal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          title={`${t('members.changeRole')} - ${selectedMember?.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              இந்த உறுப்பினருக்கான பொறுப்பை (User Role) மாற்றவும்:
            </p>

            <div className="space-y-2">
              {[
                { id: 'super_admin', label: t('roles.super_admin'), desc: 'முழு நிர்வாக அணுகல் (Full Admin)' },
                { id: 'leader', label: t('roles.leader'), desc: 'செயல்பாட்டு தலைவர் (6 Leaders)' },
                { id: 'payment_collector', label: t('roles.payment_collector'), desc: 'கட்டண வசூலிப்பாளர் (2 Collectors)' },
                { id: 'member', label: t('roles.member'), desc: 'சாதாரண உறுப்பினர் (Normal Member)' },
              ].map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedNewRole === r.id
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="userRole"
                    value={r.id}
                    checked={selectedNewRole === r.id}
                    onChange={(e) => setSelectedNewRole(e.target.value)}
                    className="mt-1 accent-amber-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{r.label}</span>
                    <span className="text-[11px] text-slate-500">{r.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs"
              >
                {actionLoading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Member Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="புதிய உறுப்பினர் சேர்க்கை (Add Member)"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleAddMember} className="space-y-4">
            {addError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                முழு பெயர் (Full Name) *
              </label>
              <input
                type="text"
                required
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="எ.கா: சு. அருண் குமார்"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50 font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  அலைபேசி எண் (Phone Number) *
                </label>
                <input
                  type="tel"
                  required
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  மின்னஞ்சல் (Email - விருப்பத்தேர்வு)
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="arun@vadambai.org"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  பொறுப்பு (Role)
                </label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="member">{t('roles.member')}</option>
                  <option value="leader">{t('roles.leader')}</option>
                  <option value="payment_collector">{t('roles.payment_collector')}</option>
                  {isSuperAdmin && <option value="super_admin">{t('roles.super_admin')}</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  நிலை (Status)
                </label>
                <select
                  value={addStatus}
                  onChange={(e) => setAddStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="approved">{t('status.approved')}</option>
                  <option value="pending">{t('status.pending')}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md shadow-amber-500/20"
              >
                {actionLoading ? t('common.loading') : '+ சேர்க்க (Add Member)'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
