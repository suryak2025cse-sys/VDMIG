import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import { exportExpensesToExcel } from '../utils/exportUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import {
  TrendingDown,
  PlusCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Search,
  Calendar,
  DollarSign,
  Tag,
} from 'lucide-react';

export default function Expenses() {
  const { user, isLeader, isSuperAdmin } = useAuth();
  const { t, isTamil, language } = useLanguage();

  const [expenseList, setExpenseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [notes, setNotes] = useState('');

  // Delete State
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const categories = [
    'Food',
    'Decoration',
    'Sound System',
    'Transportation',
    'Printing',
    'Event Materials',
    'Other',
  ];

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await dataService.getExpenses();
      setExpenseList(data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Food');
    setDescription('');
    setAmount('');
    setPaidBy(user?.name || '');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setDate(item.date);
    setCategory(item.category);
    setDescription(item.description);
    setAmount(String(item.amount));
    setPaidBy(item.paid_by);
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
        category,
        description,
        amount: Number(amount),
        paid_by: paidBy,
        notes,
      };

      if (editingItem) {
        await dataService.updateExpense(editingItem.id, payload);
      } else {
        await dataService.createExpense({
          ...payload,
          created_by: user?.id,
        });
      }

      setShowModal(false);
      await loadExpenses();
    } catch (err) {
      alert('Failed to save expense: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await dataService.deleteExpense(itemToDelete.id);
      setIsDeleteOpen(false);
      await loadExpenses();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const totalExpenses = expenseList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const filteredExpenses = expenseList.filter((item) => {
    const matchesSearch =
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.paid_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingDown className="w-4 h-4" />
            <span>{t('expenses.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('expenses.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('expenses.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => exportExpensesToExcel(expenseList, language)}
            className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs sm:text-sm border border-rose-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-rose-700" />
            <span>{t('common.exportExcel')}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('expenses.addExpense')}</span>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-linear-to-r from-rose-600 to-pink-700 rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-rose-100 uppercase tracking-wider">
            {t('finance.totalExpenses')}
          </p>
          <p className="text-3xl font-black mt-1">
            ₹ {totalExpenses.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
          <TrendingDown className="w-6 h-6 text-white" />
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
            placeholder="விளக்கம் அல்லது செலவு செய்தவர் தேடுக..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-rose-500 cursor-pointer w-full sm:w-auto"
        >
          <option value="all">செலவு பிரிவு: அனைத்தும்</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {t(`expenses.categories.${c}`, c)}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Records List */}
      {loading ? (
        <LoadingSpinner text="செலவுப் பதிவுகள் ஏற்றப்படுகின்றன..." />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title={t('expenses.noExpenses')}
          description="புதிய விழா அல்லது குழு செலவுகளைப் பதிவு செய்யவும்."
          actionButton={
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
            >
              {t('expenses.addExpense')}
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 text-xs">
            {filteredExpenses.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {item.description}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {t(`expenses.categories.${item.category}`, item.category)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    தேதி: <span className="font-semibold text-slate-700">{item.date}</span> •
                    செலவு செய்தவர்: <span className="font-semibold text-slate-700">{item.paid_by}</span>
                    {item.notes ? ` • ${item.notes}` : ''}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-base font-black text-rose-600">
                    - ₹ {Number(item.amount).toLocaleString('en-IN')}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer"
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
          title={editingItem ? 'செலவு பதிவு திருத்து' : t('expenses.addExpense')}
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('expenses.category')} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {t(`expenses.categories.${c}`, c)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('common.description')} *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="எ.கா: ஒலி & ஒளி அமைப்பு முன்பணம்"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
              />
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
                placeholder="2500"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 bg-slate-50/50 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('expenses.paidBy')} *
              </label>
              <input
                type="text"
                required
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                placeholder="பெயர்"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
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
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
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
        message="இந்த செலவுப் பதிவை நிச்சயமாக நீக்க விரும்புகிறீர்களா?"
        isDestructive={true}
      />
    </div>
  );
}
