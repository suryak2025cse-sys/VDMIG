import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LoadingSpinner({ text, size = 'default', fullPage = false }) {
  const { t } = useLanguage();
  const label = text || t('common.loading');

  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.default} animate-spin text-amber-600`} />
      {label && <p className="text-sm font-medium text-slate-500 animate-pulse">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center w-full">
        {content}
      </div>
    );
  }

  return content;
}
