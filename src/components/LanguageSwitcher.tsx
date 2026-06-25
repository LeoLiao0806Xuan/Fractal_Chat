import { useTranslation, type Locale } from '../i18n';

const FLAGS: Record<Locale, string> = { en: '🇺🇸', 'zh-CN': '🇨🇳' };
const LABELS: Record<Locale, string> = { en: 'EN', 'zh-CN': '中文' };

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  const toggle = () => {
    setLocale(locale === 'en' ? 'zh-CN' : 'en');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      title={locale === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <span>{FLAGS[locale]}</span>
      <span>{LABELS[locale]}</span>
    </button>
  );
}
