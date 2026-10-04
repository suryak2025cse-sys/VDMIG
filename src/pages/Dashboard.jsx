import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Music2,
  CalendarDays,
  Megaphone,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Clock,
  QrCode,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

export default function Dashboard() {
  const { user, profile, isSuperAdmin, isLeader, isPaymentCollector, role } = useAuth();
  const { t, isTamil } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingMembers: 0,
    totalPaidCount: 0,
    totalPendingCount: 0,
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    totalDances: 0,
  });

  const [myPayment, setMyPayment] = useState(null);
  const [myDances, setMyDances] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pendingPaymentsQueue, setPendingPaymentsQueue] = useState([]);
  const [collectors, setCollectors] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [user, role]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        profilesData,
        paymentsData,
        incomeData,
        expensesData,
        dancesData,
        eventsData,
        announcementsData,
        collectorsData,
      ] = await Promise.all([
        dataService.getProfiles(),
        dataService.getPayments(),
        dataService.getIncome(),
        dataService.getExpenses(),
        dataService.getDances(),
        dataService.getEvents(),
        dataService.getAnnouncements(),
        dataService.getCollectors(),
      ]);

      // Calculate financials
      const totalInc = (incomeData || []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      const totalExp = (expensesData || []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      const totalBal = totalInc - totalExp;

      const totalMems = (profilesData || []).length;
      const pendingMems = (profilesData || []).filter(p => p.status === 'pending').length;
      const verifiedPays = (paymentsData || []).filter(p => p.status === 'verified').length;
      const pendingPays = (paymentsData || []).filter(p => p.status === 'pending').length;

      setStats({
        totalMembers: totalMems,
        pendingMembers: pendingMems,
        totalPaidCount: verifiedPays,
        totalPendingCount: pendingPays,
        totalIncome: totalInc,
        totalExpenses: totalExp,
        balance: totalBal,
        totalDances: (dancesData || []).length,
      });

      // Member specific data
      if (user?.id) {
        const userPayments = (paymentsData || []).filter(p => p.member_id === user.id);
        setMyPayment(userPayments[0] || null);

        const userDances = (dancesData || []).filter(d =>
          d.performer_name?.toLowerCase().includes(profile?.name?.toLowerCase() || '') ||
          d.created_by === user.id
        );
        setMyDances(userDances);
      }

      setAnnouncements(announcementsData || []);
      setUpcomingEvents((eventsData || []).filter(e => e.status === 'upcoming' || e.status === 'ongoing'));
      setPendingPaymentsQueue((paymentsData || []).filter(p => p.status === 'pending'));
      setCollectors(collectorsData || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="தரவுகள் ஏற்றப்படுகின்றன..." />;
  }

  // =========================================================================
  // 1. LEADER / SUPER ADMIN DASHBOARD
  // =========================================================================
  if (isLeader || isSuperAdmin) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Greeting & Role Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-amber-600 via-amber-700 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-amber-900/10">
          <div>
            <div className="flex items-center gap-2 mb-1 text-amber-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>{isTamil ? 'தலைமை நிர்வாக பலகை' : 'Leader Operational Dashboard'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('dashboard.welcome')}, {profile?.name || 'தலைவர்'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 mt-1 max-w-xl">
              வதம்பை இளந்தளிர் குழுவின் நடப்பு நிகழ்வுகள், உறுப்பினர்கள் மற்றும் நிதி நிலை மேலாண்மை.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/finance"
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t('finance.title')}</span>
            </Link>
            <Link
              to="/members"
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-amber-50 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-amber-600" />
              <span>{t('members.title')}</span>
            </Link>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">{t('dashboard.totalIncome')}</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ₹ {stats.totalIncome.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">{t('dashboard.totalExpenses')}</p>
              <p className="text-2xl font-black text-rose-600 mt-1">
                ₹ {stats.totalExpenses.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-slate-700">
            <div>
              <p className="text-xs font-medium text-slate-300">{t('dashboard.currentBalance')}</p>
              <p className="text-2xl font-black text-amber-400 mt-1">
                ₹ {stats.balance.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Operational Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{t('dashboard.totalMembers')}</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-800">{stats.totalMembers}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{stats.pendingMembers} {t('dashboard.pendingMembers')}</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{t('dashboard.totalPaid')}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-700">{stats.totalPaidCount}</p>
            <p className="text-[11px] text-slate-400 mt-2">சரிபார்க்கப்பட்ட கட்டணங்கள்</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{t('dashboard.totalPending')}</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-700">{stats.totalPendingCount}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-2">சரிபார்ப்பு நிலுவையில்</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{t('dashboard.totalDances')}</span>
              <Music2 className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-purple-700">{stats.totalDances}</p>
            <p className="text-[11px] text-slate-400 mt-2">பதிவு செய்யப்பட்ட குழுக்கள்</p>
          </div>
        </div>

        {/* 2-Column Section: Pending Verifications & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Pending Payments & Recent Announcements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Payments Queue */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    {isTamil ? 'சரிபார்ப்பு நிலுவையில் உள்ள கட்டணங்கள்' : 'Pending Payment Submissions'}
                  </h3>
                </div>
                <Link to="/payments" className="text-xs font-bold text-amber-600 hover:text-amber-700">
                  {t('common.view')} {t('common.all')}
                </Link>
              </div>

              {pendingPaymentsQueue.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  சரிபார்ப்பு நிலுவையில் கட்டணங்கள் ஏதும் இல்லை.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingPaymentsQueue.slice(0, 4).map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{p.member_name || 'உறுப்பினர்'}</p>
                        <p className="text-[11px] text-slate-400">
                          {p.payment_date} • வசூலிப்பாளர்: {p.collector_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-slate-900">₹ {p.amount}</span>
                        <Link
                          to="/payments"
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          சரிபார்
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">{t('dashboard.upcomingEvents')}</h3>
                </div>
                <Link to="/events" className="text-xs font-bold text-amber-600 hover:text-amber-700">
                  {t('common.view')} {t('common.all')}
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  வரவிருக்கும் நிகழ்வுகள் ஏதும் இல்லை.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 3).map((e) => (
                    <div key={e.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{e.event_name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{e.venue}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-amber-800 block">{e.date}</span>
                        <span className="text-[10px] text-slate-400">{e.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Quick Actions & Announcements */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3">{t('dashboard.quickActions')}</h3>
              <div className="space-y-2">
                <Link
                  to="/members"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-xs font-semibold transition-colors border border-slate-200/60"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    உறுப்பினர்கள் அனுமதி (Approve)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/payments"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-xs font-semibold transition-colors border border-slate-200/60"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    கட்டணங்கள் சரிபார்ப்பு (Payments)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/dance"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-xs font-semibold transition-colors border border-slate-200/60"
                >
                  <span className="flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-purple-500" />
                    நடனம் & பாடல் பதிவேற்றம்
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/income"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-xs font-semibold transition-colors border border-slate-200/60"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    வருமானம் பதிவு செய்
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/expenses"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-xs font-semibold transition-colors border border-slate-200/60"
                >
                  <span className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    செலவுகள் பதிவு செய்
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Latest Announcements */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-800">{t('dashboard.latestAnnouncements')}</h3>
                </div>
                <Link to="/announcements" className="text-xs font-bold text-amber-600">
                  {t('common.all')}
                </Link>
              </div>

              <div className="space-y-2.5">
                {announcements.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/50">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{a.title}</h4>
                      <StatusBadge status={a.priority} />
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{a.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. PAYMENT COLLECTOR DASHBOARD
  // =========================================================================
  if (role === 'payment_collector') {
    const assignedCollector = collectors.find(c =>
      c.name?.toLowerCase().includes(profile?.name?.toLowerCase() || '') ||
      c.phone === profile?.phone
    ) || collectors[0];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Collector Welcome Banner */}
        <div className="bg-linear-to-r from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10">
          <div className="flex items-center gap-2 mb-1 text-emerald-200 text-xs font-bold uppercase tracking-wider">
            <CreditCard className="w-4 h-4" />
            <span>{t('dashboard.collectorDashboard')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('dashboard.welcome')}, {profile?.name || 'வசூலிப்பாளர்'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            உங்களுக்கு ஒதுக்கப்பட்ட UPI மற்றும் QR மூலம் செலுத்தப்பட்ட கிராம சந்தா மற்றும் கட்டணங்களை சரிபார்க்கவும்.
          </p>
        </div>

        {/* Assigned Collector Details & QR card */}
        {assignedCollector && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {assignedCollector.name}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                UPI ID: <span className="font-mono text-emerald-600">{assignedCollector.upi_id}</span>
              </h3>
              <p className="text-xs text-slate-500">
                தொலைபேசி எண்: <span className="font-semibold text-slate-800">{assignedCollector.phone}</span>
              </p>
            </div>

            {assignedCollector.qr_code_url && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center shrink-0">
                <img
                  src={assignedCollector.qr_code_url}
                  alt="Collector QR"
                  className="w-32 h-32 rounded-xl object-contain bg-white p-1"
                />
                <span className="text-[10px] text-slate-400 font-semibold mt-1">அங்கீகரிக்கப்பட்ட QR குறியீடு</span>
              </div>
            )}
          </div>
        )}

        {/* Pending Verifications Queue */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                சரிபார்ப்புக்கு காத்திருக்கும் கட்டணங்கள் ({pendingPaymentsQueue.length})
              </h3>
            </div>
            <Link to="/payments" className="text-xs font-bold text-amber-600 hover:text-amber-700">
              முழு கட்டண பக்கம் செல்க →
            </Link>
          </div>

          {pendingPaymentsQueue.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              நிலுவையில் எந்த கட்டணமும் இல்லை. அனைத்து கட்டணங்களும் சரிபார்க்கப்பட்டுள்ளன!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPaymentsQueue.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{p.member_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      தேதி: {p.payment_date} • UTR: {p.transaction_id || 'இல்லை'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-slate-900">₹ {p.amount}</span>
                    <Link
                      to="/payments"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      விவரம் காண்க & சரிபார்
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. MEMBER DASHBOARD
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Member Welcome Banner */}
      <div className="bg-linear-to-r from-amber-500 via-amber-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-amber-900/10">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t('dashboard.welcome')}, {profile?.name || 'உறுப்பினர்'} 👋
        </h1>
        <p className="text-xs sm:text-sm text-amber-50 mt-1 max-w-xl">
          வதம்பை இளந்தளிர் குழுவின் நிகழ்வு தகவல் பலகைக்கு தங்களை வரவேற்கிறோம்.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/payments"
            className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md hover:bg-amber-50 transition-colors flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>{t('dashboard.makePayment')}</span>
          </Link>
          <Link
            to="/events"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold backdrop-blur-xs transition-colors flex items-center gap-1.5 border border-white/20"
          >
            <CalendarDays className="w-4 h-4" />
            <span>{t('dashboard.viewSchedule')}</span>
          </Link>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: My Payment Status */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">{t('dashboard.myPaymentStatus')}</h3>
              </div>
              {myPayment && <StatusBadge status={myPayment.status} />}
            </div>

            {myPayment ? (
              <div className="space-y-2">
                <p className="text-3xl font-black text-slate-900">
                  ₹ {myPayment.amount}
                </p>
                <p className="text-xs text-slate-500">
                  செலுத்தப்பட்ட தேதி: <span className="font-semibold text-slate-700">{myPayment.payment_date}</span>
                </p>
                <p className="text-xs text-slate-500">
                  வசூலிப்பாளர்: <span className="font-semibold text-slate-700">{myPayment.collector_name}</span>
                </p>
                {myPayment.status === 'verified' && (
                  <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-xl border border-emerald-200/60 mt-2">
                    ✓ கட்டணம் சரிபார்க்கப்பட்டுவிட்டது
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 mb-3">கட்டணம் இன்னும் சமர்ப்பிக்கப்படவில்லை.</p>
                <Link
                  to="/payments"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-xs hover:bg-amber-400"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>சந்தா செலுத்தவும்</span>
                </Link>
              </div>
            )}
          </div>
          <Link
            to="/payments"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-amber-600 flex items-center justify-between hover:text-amber-700"
          >
            <span>கட்டண விவரங்கள்</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: My Dance Participation */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Music2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">{t('dashboard.myDanceStatus')}</h3>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                {myDances.length} குழுக்கள்
              </span>
            </div>

            {myDances.length > 0 ? (
              <div className="space-y-2.5">
                {myDances.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-purple-50/30 border border-purple-100">
                    <p className="text-xs font-bold text-slate-900">{d.group_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">பாடல்: {d.song_title}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">கால அளவு: {d.duration}</span>
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-xs">
                நடன நிகழ்ச்சிகள் பட்டியலில் தாங்கள் இன்னும் சேர்க்கப்படவில்லை.
              </div>
            )}
          </div>
          <Link
            to="/dance"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-purple-700 flex items-center justify-between hover:text-purple-800"
          >
            <span>நடன விவரங்கள் & பாடல்கள்</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Upcoming Event Highlight */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">{t('dashboard.upcomingEvents')}</h3>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="p-4 rounded-2xl bg-linear-to-br from-amber-50 to-orange-50/50 border border-amber-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                  அடுத்த நிகழ்வு
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-2">
                  {upcomingEvents[0].event_name}
                </h4>
                <p className="text-xs font-semibold text-amber-700 mt-1">
                  📅 {upcomingEvents[0].date} • {upcomingEvents[0].time}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  📍 {upcomingEvents[0].venue}
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                வரவிருக்கும் நிகழ்வுகள் ஏதும் இல்லை.
              </div>
            )}
          </div>
          <Link
            to="/events"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-600 flex items-center justify-between hover:text-blue-700"
          >
            <span>நிகழ்ச்சி அட்டவணை காண்க</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Announcements Section on Member Dashboard */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">{t('dashboard.latestAnnouncements')}</h3>
          </div>
          <Link to="/announcements" className="text-xs font-bold text-amber-600 hover:text-amber-700">
            {t('common.view')} {t('common.all')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.slice(0, 2).map((a) => (
            <div key={a.id} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-xs font-bold text-slate-900 truncate">{a.title}</h4>
                <StatusBadge status={a.priority} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{a.description}</p>
              <div className="text-[10px] text-slate-400 font-medium">
                வெளியிட்டவர்: {a.created_by_name} • {a.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
