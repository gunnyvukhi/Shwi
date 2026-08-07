import React, { createContext, useContext, useState } from 'react';
import { translations, type Language } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'shwi_language';

const getSavedLanguage = (): Language => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') {
      return saved;
    }
  }
  return 'en';
};

const translateHelper = (
  lang: Language,
  path: string,
  params?: Record<string, string | number>
): string => {
  const keys = path.split('.');
  let current: any = translations[lang] || translations['en'];

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      let fallback: any = translations['en'];
      for (const k of keys) {
        if (fallback && typeof fallback === 'object' && k in fallback) {
          fallback = fallback[k];
        } else {
          return path;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  let result = current;
  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }

  return result;
};

// Safe default context value prevents crashes
const defaultContextValue: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (path: string, params?: Record<string, string | number>) =>
    translateHelper(getSavedLanguage(), path, params),
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getSavedLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'vi' : 'en';
    setLanguage(nextLang);
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    return translateHelper(language, path, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  return useContext(LanguageContext);
};
