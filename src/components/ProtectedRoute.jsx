import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { ShieldAlert } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, profile, loading, isApproved, isPending, isBlocked, isRejected, role } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <LoadingSpinner fullPage text="உள்நுழைவு தகவல்கள் சரிபார்க்கப்படுகின்றன..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is pending approval and route is not allowed for pending
  if (isPending) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (isBlocked || isRejected) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-2xl border border-red-200 shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {isBlocked ? 'கணக்கு முடக்கப்பட்டுள்ளது' : 'பதிவு நிராகரிக்கப்பட்டது'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {profile?.rejection_reason || 'தயவுசெய்து கிராம நிர்வாகிகளை நேரடியாக தொடர்பு கொள்ளவும்.'}
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-2xl border border-amber-200 shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            அணுகல் அனுமதி இல்லை (Access Denied)
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            இந்த பக்கத்தை அணுக உங்கள் பயனர் பொறுப்பிற்கு (Role: {role}) அனுமதி இல்லை.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
