import React from 'react';
import { FolderOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function EmptyState({ icon: Icon = FolderOpen, title, description, actionButton }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-xs my-4">
      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-slate-800 mb-1">{title || t('common.noData')}</h4>
      {description && <p className="text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">{description}</p>}
      {actionButton && <div className="mt-2">{actionButton}</div>}
    </div>
  );
}
