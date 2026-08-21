import { createContext, useContext } from 'react'

export type Locale = 'en' | 'zh-CN'

export interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useTranslation must be used within I18nProvider')
  return context
}
