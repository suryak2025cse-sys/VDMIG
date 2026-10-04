import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import {
  CreditCard,
  QrCode,
  Copy,
  Check,
  Upload,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Eye,
  PlusCircle,
  AlertCircle,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

export default function Payments() {
  const { user, profile, isLeader, isSuperAdmin, isPaymentCollector, role } = useAuth();
  const { t, isTamil } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [collectors, setCollectors] = useState([]);

  // Submission Form State (for Members & Leaders)
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [amount, setAmount] = useState('500');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');

  // Verification & Detail Modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search (for Leaders/Collectors)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collectorFilter, setCollectorFilter] = useState('all');
  const [copiedUpi, setCopiedUpi] = useState('');

  const isVerifier = isLeader || isSuperAdmin || isPaymentCollector;

  useEffect(() => {
    loadData();
  }, [user, role]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [colls, pays] = await Promise.all([
        dataService.getCollectors(),
        dataService.getPayments(isVerifier ? {} : { member_id: user?.id }),
      ]);
      setCollectors(colls || []);
      setPayments(pays || []);
      if (colls && colls.length > 0) {
        setSelectedCollectorId(colls[0].id);
      }
    } catch (err) {
      console.error('Error loading payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = (upi) => {
    navigator.clipboard.writeText(upi);
    setCopiedUpi(upi);
    setTimeout(() => setCopiedUpi(''), 2000);
  };

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setSubmitError('Screenshot must be less than 10MB');
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!amount || Number(amount) <= 0) {
      setSubmitError('Please enter a valid amount');
      return;
    }

    const chosenCollector = collectors.find(c => c.id === selectedCollectorId) || collectors[0];

    setSubmitting(true);
    try {
      let screenshotUrl = '';
      if (proofFile) {
        screenshotUrl = await dataService.uploadFile('payment-proofs', proofFile, `pay-proof-${Date.now()}`);
      }

      const newPay = await dataService.submitPayment({
        member_id: user.id,
        member_name: profile?.name || 'Member',
        collector_id: chosenCollector.id,
        collector_name: chosenCollector.name,
        amount: Number(amount),
        payment_date: paymentDate,
        transaction_id: transactionId,
        screenshot_url: screenshotUrl,
        notes,
      });

      // Notify collectors & leaders
      await dataService.createNotification({
        user_id: 'usr-collector-1',
        title: 'புதிய கட்டண சமர்ப்பிப்பு (New Payment)',
        message: `${profile?.name || 'உறுப்பினர்'} ₹${amount} கட்டண விவரத்தை சமர்ப்பித்துள்ளார்.`,
        type: 'payment',
        link: '/payments',
      });

      setShowSubmitModal(false);
      resetForm();
      await loadData();
      alert(t('payments.submitSuccess'));
    } catch (err) {
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount('500');
    setTransactionId('');
    setNotes('');
    setProofFile(null);
    setProofPreview('');
    setSubmitError('');
  };

  const handleVerify = async (payment) => {
    setActionLoading(true);
    try {
      await dataService.verifyPayment(payment.id, user.id, profile?.name || 'Verifier');
      // Notify member
      await dataService.createNotification({
        user_id: payment.member_id,
        title: 'கட்டணம் சரிபார்க்கப்பட்டது (Payment Verified)',
        message: `தாங்கள் செலுத்திய ₹${payment.amount} கட்டணம் வெற்றிகரமாக சரிபார்க்கப்பட்டது.`,
        type: 'payment',
        link: '/payments',
      });
      setShowDetailModal(false);
      await loadData();
    } catch (err) {
      alert('Verification failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (payment) => {
    setActionLoading(true);
    try {
      await dataService.rejectPayment(payment.id, user.id, profile?.name || 'Verifier', rejectionNote);
      // Notify member
      await dataService.createNotification({
        user_id: payment.member_id,
        title: 'கட்டணம் நிராகரிக்கப்பட்டது (Payment Rejected)',
        message: `தாங்கள் சமர்ப்பித்த ₹${payment.amount} கட்டணம் நிராகரிக்கப்பட்டது. காரணம்: ${rejectionNote || 'தவறான ரசீது அல்லது UTR'}`,
        type: 'payment',
        link: '/payments',
      });
      setShowDetailModal(false);
      await loadData();
    } catch (err) {
      alert('Rejection failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('இந்த கட்டண பதிவை நிரந்தரமாக நீக்க விரும்புகிறீர்களா? (Delete payment record?)')) {
      return;
    }
    setActionLoading(true);
    try {
      await dataService.deletePayment(paymentId);
      setShowDetailModal(false);
      await loadData();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & search
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCollector = collectorFilter === 'all' || p.collector_id === collectorFilter;
    return matchesSearch && matchesStatus && matchesCollector;
  });

  // Calculate totals
  const totalCollected = payments.filter(p => p.status === 'verified').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const verifiedCount = payments.filter(p => p.status === 'verified').length;
  const rejectedCount = payments.filter(p => p.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>{t('payments.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('payments.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('payments.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('payments.submitPayment')}</span>
        </button>
      </div>

      {/* 2 Assigned Payment Collectors Cards (Section 9) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {t('payments.chooseCollector')}
        </h2>
        {collectors.length === 0 || !collectors.some(c => c.name && c.upi_id) ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center shadow-xs">
            <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {t('payments.notConfigured')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collectors.filter(c => c.name && c.upi_id).map((c) => (
              <div
                key={c.id || c.slot_number}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-emerald-300 transition-colors"
              >
                <div className="space-y-2 text-center sm:text-left">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {isTamil ? `வசூலிப்பாளர் ${c.slot_number}` : `Collector ${c.slot_number}`}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500">
                    {t('members.phone')}: <span className="font-semibold text-slate-700">{c.phone}</span>
                  </p>

                  {/* UPI ID & Copy button */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {c.upi_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyUpi(c.upi_id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title={t('payments.copyUpi')}
                    >
                      {copiedUpi === c.upi_id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`upi://pay?pa=${c.upi_id}&pn=${encodeURIComponent(c.name)}&cu=INR`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('payments.openUpiApp')}</span>
                    </a>
                  </div>
                </div>

                {/* QR Code */}
                {c.qr_code_url ? (
                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center shrink-0">
                    <img
                      src={c.qr_code_url}
                      alt={`${c.name} QR`}
                      className="w-28 h-28 rounded-xl object-contain bg-white p-1"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">Scan to Pay</span>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <QrCode className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">QR Code</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verifier Metrics Dashboard (Leaders/Collectors) */}
      {isVerifier && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">{t('payments.totalCollected')}</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
              ₹ {totalCollected.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">{t('payments.pendingCount')}</span>
            <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">{t('payments.verifiedCount')}</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{verifiedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">{t('payments.rejectedCount')}</span>
            <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">{rejectedCount}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar for Payments */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="உறுப்பினர் அல்லது UTR தேடுக..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">{t('members.filterStatus')}: {t('common.all')}</option>
            <option value="pending">{t('status.pending')}</option>
            <option value="verified">{t('status.verified')}</option>
            <option value="rejected">{t('status.rejected')}</option>
          </select>

          {isVerifier && (
            <select
              value={collectorFilter}
              onChange={(e) => setCollectorFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">{t('payments.filterCollector')}: {t('common.all')}</option>
              {collectors.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Payment Submissions List */}
      {loading ? (
        <LoadingSpinner text="கட்டண விவரங்கள் ஏற்றப்படுகின்றன..." />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t('payments.noPayments')}
          description="கட்டண சமர்ப்பிப்புகள் எதுவும் இல்லை."
          actionButton={
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
            >
              {t('payments.submitPayment')}
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              {isVerifier ? 'அனைத்து கட்டணப் பதிவுகள்' : t('payments.myPayments')} ({filteredPayments.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {filteredPayments.map((p) => (
              <div
                key={p.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{p.member_name}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-slate-500 text-xs">
                    தேதி: <span className="font-semibold text-slate-700">{p.payment_date}</span> •
                    வசூலிப்பாளர்: <span className="font-semibold text-slate-700">{p.collector_name}</span>
                  </p>
                  {p.transaction_id && (
                    <p className="text-[11px] font-mono text-slate-400">
                      UTR: {p.transaction_id}
                    </p>
                  )}
                  {p.verified_by_name && (
                    <p className="text-[11px] text-emerald-700">
                      சரிபார்த்தவர்: {p.verified_by_name} ({p.verified_at ? new Date(p.verified_at).toLocaleDateString() : ''})
                    </p>
                  )}
                  {p.rejection_note && (
                    <p className="text-[11px] text-rose-600">
                      நிராகரிப்பு காரணம்: {p.rejection_note}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  <span className="text-lg font-black text-slate-900">
                    ₹ {Number(p.amount).toLocaleString('en-IN')}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayment(p);
                      setShowDetailModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('common.view')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Payment Submission Modal */}
      {showSubmitModal && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          title={t('payments.submitPayment')}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Select Collector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('payments.selectCollector')} *
              </label>
              <select
                value={selectedCollectorId}
                onChange={(e) => setSelectedCollectorId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              >
                {collectors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.upi_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('payments.enterAmount')} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50 font-bold text-slate-900"
              />
            </div>

            {/* Payment Date & Transaction ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('payments.paymentDate')} *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('payments.transactionId')}
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="UPI Ref / UTR No"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50 font-mono"
                />
              </div>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('payments.uploadProof')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofChange}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
              </div>
              {proofPreview && (
                <div className="mt-2 relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden">
                  <img src={proofPreview} alt="Screenshot preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('payments.optionalNote')}
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="எ.கா: மாதாந்திர சந்தா & நன்கொடை"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs cursor-pointer"
              >
                {submitting ? t('common.loading') : t('common.submit')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Detail & Verification Modal */}
      {showDetailModal && selectedPayment && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="கட்டண விவரங்கள் (Payment Details)"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="text-xs text-slate-500">உறுப்பினர் பெயர்</p>
                <p className="text-sm font-extrabold text-slate-900">{selectedPayment.member_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">தொகை</p>
                <p className="text-lg font-black text-emerald-600">₹ {selectedPayment.amount}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">செலுத்தப்பட்ட தேதி</span>
                <span className="font-semibold text-slate-700">{selectedPayment.payment_date}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">வசூலிப்பாளர்</span>
                <span className="font-semibold text-slate-700">{selectedPayment.collector_name}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl col-span-2">
                <span className="text-slate-400 block">பரிவர்த்தனை எண் (UTR)</span>
                <span className="font-mono font-bold text-slate-800">{selectedPayment.transaction_id || 'இல்லை'}</span>
              </div>
            </div>

            {selectedPayment.notes && (
              <div className="p-2.5 bg-slate-50 rounded-xl text-xs">
                <span className="text-slate-400 block mb-0.5">குறிப்பு</span>
                <p className="text-slate-700">{selectedPayment.notes}</p>
              </div>
            )}

            {/* Payment Screenshot */}
            {selectedPayment.screenshot_url ? (
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">பணப்பரிவர்த்தனை ரசீது (Screenshot):</span>
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-64">
                  <img
                    src={selectedPayment.screenshot_url}
                    alt="Payment Screenshot"
                    className="max-h-64 object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center">
                ரசீது படம் பதிவேற்றப்படவில்லை.
              </div>
            )}

            {/* Status & Verification info */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">தற்போதைய நிலை:</span>
              <StatusBadge status={selectedPayment.status} />
            </div>

            {/* Verification Actions (Only for Leaders / Collectors) */}
            {isVerifier && selectedPayment.status === 'pending' && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    நிராகரிப்புக்கான காரணம் (நிராகரிக்க விரும்பினால் மட்டும்):
                  </label>
                  <input
                    type="text"
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="எ.கா: தவறான UTR எண் அல்லது தொகை பொருந்தவில்லை"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  {(isSuperAdmin || isLeader) && (
                    <button
                      type="button"
                      onClick={() => handleDeletePayment(selectedPayment.id)}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>நீக்கு</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleReject(selectedPayment)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 cursor-pointer"
                    >
                      {t('payments.rejectPayment')}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVerify(selectedPayment)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                    >
                      {actionLoading ? t('common.loading') : t('payments.verifyPayment')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* If not pending, Super Admin/Leader can still delete the record */}
            {(!isVerifier || selectedPayment.status !== 'pending') && (isSuperAdmin || isLeader) && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeletePayment(selectedPayment.id)}
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>பதிவை நீக்கு (Delete Payment)</span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
