import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import {
  exportIncomeToExcel,
  exportExpensesToExcel,
  exportFinancialStatementToExcel,
} from '../utils/exportUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  Calendar,
  PieChart,
  BarChart3,
  Printer,
  Sparkles,
} from 'lucide-react';

export default function Finance() {
  const { isLeader, isSuperAdmin } = useAuth();
  const { t, isTamil, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);

  useEffect(() => {
    loadFinances();
  }, []);

  const loadFinances = async () => {
    setLoading(true);
    try {
      const [inc, exp] = await Promise.all([
        dataService.getIncome(),
        dataService.getExpenses(),
      ]);
      setIncomeList(inc || []);
      setExpenseList(exp || []);
    } catch (err) {
      console.error('Error fetching financial records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic calculations
  const totalIncome = incomeList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpenses = expenseList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const currentBalance = totalIncome - totalExpenses;

  // Category breakdown for expenses
  const categoryMap = {};
  expenseList.forEach((e) => {
    const cat = e.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount || 0);
  });

  const categoryEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  // Source breakdown for income
  const sourceMap = {};
  incomeList.forEach((i) => {
    const src = i.source || 'Other';
    sourceMap[src] = (sourceMap[src] || 0) + Number(i.amount || 0);
  });

  const sourceEntries = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner fullPage text="நிதி அறிக்கைகள் கணக்கிடப்படுகின்றன..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('finance.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('finance.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('finance.subtitle')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="அறிக்கையை அச்சிடுக"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => exportFinancialStatementToExcel(incomeList, expenseList, language)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('finance.exportStatement')}</span>
          </button>
        </div>
      </div>

      {/* Main Balance Calculation Cards (Section 16) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('finance.totalIncome')} (+)
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              ₹ {totalIncome.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {incomeList.length} வரவுப் பதிவுகள்
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('finance.totalExpenses')} (-)
            </span>
            <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
              ₹ {totalExpenses.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {expenseList.length} செலவுப் பதிவுகள்
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-7 h-7" />
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md border border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {t('finance.netBalance')} (=)
            </span>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              ₹ {currentBalance.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {isTamil ? 'தானாக கணக்கிடப்பட்ட இருப்பு' : 'Calculated Net Balance'}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center shrink-0">
            <Wallet className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Visual Analytics / Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Bar Comparison */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800">{t('finance.incomeVsExpense')}</h3>
          </div>

          {totalIncome === 0 && totalExpenses === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {t('finance.noData')}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Income Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-emerald-700">{t('finance.totalIncome')}</span>
                  <span className="text-emerald-700">₹ {totalIncome.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${totalIncome + totalExpenses > 0 ? (totalIncome / (totalIncome + totalExpenses)) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Expenses Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-rose-700">{t('finance.totalExpenses')}</span>
                  <span className="text-rose-700">₹ {totalExpenses.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${totalIncome + totalExpenses > 0 ? (totalExpenses / (totalIncome + totalExpenses)) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block mb-0.5">நிதி விகித பகுப்பாய்வு:</span>
                மொத்த வருமானத்தில் <span className="font-bold text-rose-700">{totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}%</span> செலவிடப்பட்டுள்ளது.
                மீதமுள்ள <span className="font-bold text-emerald-700">₹ {currentBalance.toLocaleString('en-IN')}</span> கிராம குழுவின் கையிருப்பில் உள்ளது.
              </div>
            </div>
          )}
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-800">{t('finance.expenseBreakdown')}</h3>
          </div>

          <div className="space-y-3">
            {categoryEntries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">செலவு பதிவுகள் இல்லை.</p>
            ) : (
              categoryEntries.map(([catName, catAmount]) => {
                const percentage = totalExpenses > 0 ? Math.round((catAmount / totalExpenses) * 100) : 0;
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        {t(`expenses.categories.${catName}`, catName)}
                      </span>
                      <span className="font-mono text-slate-600">
                        ₹ {catAmount.toLocaleString('en-IN')} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-purple-500 to-indigo-600 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Individual Excel Download Cards (Section 17) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800">{t('finance.exportIncome')}</h4>
            <p className="text-xs text-slate-400 mt-0.5">வருமானப் பதிவுகள் தனி எக்செல் கோப்பு</p>
          </div>
          <button
            type="button"
            onClick={() => exportIncomeToExcel(incomeList, language)}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800">{t('finance.exportExpenses')}</h4>
            <p className="text-xs text-slate-400 mt-0.5">செலவுப் பதிவுகள் தனி எக்செல் கோப்பு</p>
          </div>
          <button
            type="button"
            onClick={() => exportExpensesToExcel(expenseList, language)}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
