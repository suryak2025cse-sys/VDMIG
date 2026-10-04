import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckCircle2, Clock, XCircle, AlertCircle, Calendar, PlayCircle } from 'lucide-react';

export default function StatusBadge({ status, type = 'status' }) {
  const { t } = useLanguage();

  const getBadgeConfig = () => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'verified':
      case 'confirmed':
      case 'completed':
      case 'present':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          dot: 'bg-emerald-500',
        };
      case 'pending':
      case 'upcoming':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          dot: 'bg-amber-500',
        };
      case 'ongoing':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: PlayCircle,
          dot: 'bg-blue-500',
        };
      case 'rejected':
      case 'absent':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
          dot: 'bg-rose-500',
        };
      case 'blocked':
      case 'urgent':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: AlertCircle,
          dot: 'bg-red-500',
        };
      case 'important':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: AlertCircle,
          dot: 'bg-orange-500',
        };
      case 'normal':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Calendar,
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  const label = t(`status.${status?.toLowerCase()}`, status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </span>
  );
}
