import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../translations/en';
import { ta } from '../translations/ta';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('vdmig_language') || 'ta'; // Tamil default
  });

  useEffect(() => {
    localStorage.setItem('vdmig_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'ta' ? 'en' : 'ta'));
  };

  const currentDict = language === 'ta' ? ta : en;

  // Translation helper: t('nav.dashboard') or t('dashboard.welcome')
  const t = (path, fallback = '') => {
    if (!path) return fallback;
    const keys = path.split('.');
    let current = currentDict;
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Try fallback to english if missing in current
        let enCurrent = en;
        for (const k of keys) {
          if (enCurrent && enCurrent[k] !== undefined) {
            enCurrent = enCurrent[k];
          } else {
            return fallback || path;
          }
        }
        return enCurrent;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isTamil: language === 'ta' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
