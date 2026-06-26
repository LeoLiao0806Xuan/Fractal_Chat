import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import enDict from './locales/en.json';
import zhDict from './locales/zh.json';

export type Locale = 'en' | 'zh-CN';

interface Translations {
  [key: string]: string;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}

const allDicts: Record<Locale, Translations> = { en: enDict, 'zh-CN': zhDict };

function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language || '';
  if (lang.startsWith('zh')) return 'zh-CN';
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem('fractal-locale');
    if (stored === 'en' || stored === 'zh-CN') return stored;
    return detectLocale();
  });

  useEffect(() => {
    localStorage.setItem('fractal-locale', locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  // Compute dict directly from locale — no separate state, no stale closure
  // Supports {param} template interpolation
  const t = useCallback((key: string, params?: Record<string, string | number>, fallback?: string): string => {
    const dict = allDicts[locale];
    const value = dict[key as keyof typeof dict] ?? fallback ?? key;
    if (params && value) {
      return value.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
    }
    return value;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
