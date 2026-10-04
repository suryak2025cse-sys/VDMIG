import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  Bell,
  CheckCheck,
  CreditCard,
  UserCheck,
  Megaphone,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const { user } = useAuth();
  const { t, isTamil } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await dataService.getNotifications(user.id);
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await dataService.markAllNotificationsAsRead(user.id);
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkSingle = async (id) => {
    try {
      await dataService.markNotificationAsRead(id);
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'approval':
        return <UserCheck className="w-5 h-5 text-blue-600" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-amber-600" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>{t('notifications.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('notifications.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('notifications.subtitle')}
          </p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{t('notifications.markAllRead')}</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <LoadingSpinner text="அறிவிப்புகள் ஏற்றப்படுகின்றன..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('notifications.noNotifications')}
          description="தங்களுக்கு புதிய அறிவிப்புகள் எதுவும் இல்லை."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkSingle(n.id)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors hover:bg-slate-50/80 cursor-pointer ${
                !n.is_read ? 'bg-amber-50/40' : ''
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs shrink-0">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className={`text-xs sm:text-sm ${!n.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                {n.link && (
                  <Link
                    to={n.link}
                    className="inline-block text-[11px] font-bold text-amber-700 hover:underline mt-2"
                  >
                    பக்கத்திற்கு செல்க →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
