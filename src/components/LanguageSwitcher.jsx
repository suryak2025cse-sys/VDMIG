import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
          language === 'ta'
            ? 'bg-amber-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title="தமிழ் மொழிக்கு மாற்றவும்"
      >
        தமிழ்
      </button>
      <span className="text-slate-300 text-xs select-none">|</span>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
          language === 'en'
            ? 'bg-amber-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title="Switch to English"
      >
        English
      </button>
    </div>
  );
}
