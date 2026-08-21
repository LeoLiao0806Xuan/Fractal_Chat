import { useState, useEffect, useCallback, type ReactNode } from 'react'
import enDict from './locales/en.json'
import zhDict from './locales/zh.json'
import { I18nContext, type Locale } from './context'

interface Translations {
  [key: string]: string
}

const allDicts: Record<Locale, Translations> = { en: enDict, 'zh-CN': zhDict }

function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language || ''
  if (lang.startsWith('zh')) return 'zh-CN'
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem('fractal-locale')
    if (stored === 'en' || stored === 'zh-CN') return stored
    return detectLocale()
  })

  useEffect(() => {
    localStorage.setItem('fractal-locale', locale)
  }, [locale])

  const setLocale = useCallback((nextLocale: Locale) => setLocaleState(nextLocale), [])

  // Compute dict directly from locale — no separate state, no stale closure
  // Supports {param} template interpolation
  const t = useCallback((key: string, params?: Record<string, string | number>, fallback?: string): string => {
    const dict = allDicts[locale]
    const value = dict[key as keyof typeof dict] ?? fallback ?? key
    if (params && value) {
      return value.replace(/\{(\w+)\}/g, (_, parameterName: string) => (
        String(params[parameterName] ?? `{${parameterName}}`)
      ))
    }
    return value
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}
