import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import { exportIncomeToExcel } from '../utils/exportUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import {
  TrendingUp,
  PlusCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Search,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';

export default function Income() {
  const { user, isLeader, isSuperAdmin } = useAuth();
  const { t, isTamil, language } = useLanguage();

  const [incomeList, setIncomeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('Member Contribution');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [collectedBy, setCollectedBy] = useState('');
  const [notes, setNotes] = useState('');

  // Delete State
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadIncome();
  }, []);

  const loadIncome = async () => {
    setLoading(true);
    try {
      const data = await dataService.getIncome();
      setIncomeList(data || []);
    } catch (err) {
      console.error('Error fetching income:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setDate(new Date().toISOString().split('T')[0]);
    setSource('Member Contribution');
    setDescription('');
    setAmount('');
    setCollectedBy(user?.name || '');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setDate(item.date);
    setSource(item.source);
    setDescription(item.description || '');
    setAmount(String(item.amount));
    setCollectedBy(item.collected_by || '');
    setNotes(item.notes || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date,
        source,
        description,
        amount: Number(amount),
        collected_by: collectedBy,
        notes,
      };

      if (editingItem) {
        await dataService.updateIncome(editingItem.id, payload);
      } else {
        await dataService.createIncome({
          ...payload,
          created_by: user?.id,
        });
      }

      setShowModal(false);
      await loadIncome();
    } catch (err) {
      alert('Failed to save income: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await dataService.deleteIncome(itemToDelete.id);
      setIsDeleteOpen(false);
      await loadIncome();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const totalIncome = incomeList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const filteredIncome = incomeList.filter((item) => {
    const matchesSearch =
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.collected_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>{t('income.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('income.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('income.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => exportIncomeToExcel(incomeList, language)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm border border-emerald-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>{t('common.exportExcel')}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('income.addIncome')}</span>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-linear-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
            {t('finance.totalIncome')}
          </p>
          <p className="text-3xl font-black mt-1">
            ₹ {totalIncome.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="விளக்கம் அல்லது வசூலித்தவர் தேடுக..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 cursor-pointer w-full sm:w-auto"
        >
          <option value="all">வருமான மூலம்: அனைத்தும்</option>
          <option value="Member Contribution">உறுப்பினர் சந்தா</option>
          <option value="Village Donation">கிராம நன்கொடை</option>
          <option value="Sponsorship">ஸ்பான்சர்ஷிப்</option>
          <option value="Other">இதர வருமானம்</option>
        </select>
      </div>

      {/* Income Records List */}
      {loading ? (
        <LoadingSpinner text="வருமான பதிவுகள் ஏற்றப்படுகின்றன..." />
      ) : filteredIncome.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={t('income.noIncome')}
          description="புதிய வருமானம் மற்றும் சந்தா பதிவுகளைச் சேர்க்கவும்."
          actionButton={
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              {t('income.addIncome')}
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 text-xs">
            {filteredIncome.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {item.source}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      📅 {item.date}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-slate-600 text-xs">{item.description}</p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    பெற்றுக் கொண்டவர்: <span className="font-semibold text-slate-700">{item.collected_by}</span>
                    {item.notes ? ` • ${item.notes}` : ''}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-base font-black text-emerald-600">
                    + ₹ {Number(item.amount).toLocaleString('en-IN')}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setItemToDelete(item);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingItem ? 'வருமான பதிவு திருத்து' : t('income.addIncome')}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.date')} *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('income.source')} *
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              >
                <option value="Member Contribution">உறுப்பினர் சந்தா (Member Contribution)</option>
                <option value="Village Donation">கிராம நன்கொடை (Village Donation)</option>
                <option value="Sponsorship">ஸ்பான்சர்ஷிப் (Sponsorship)</option>
                <option value="Other">இதர வருமானம் (Other)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.amount')} (₹) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('income.collectedBy')} *
              </label>
              <input
                type="text"
                required
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                placeholder="பெயர்"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.description')}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="விவரம்"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.notes')}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="கூடுதல் குறிப்பு"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
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
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
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
        message="இந்த வருமான பதிவை நிச்சயமாக நீக்க விரும்புகிறீர்களா?"
        isDestructive={true}
      />
    </div>
  );
}
