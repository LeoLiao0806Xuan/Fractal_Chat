import { useTranslation } from '../../i18n'

export function AboutTab() {
  const { t } = useTranslation()

  const techStack = [
    'React 19', 'TypeScript 6', 'Vite 8', 'Zustand', 'Tiptap', 'Tailwind CSS 4',
  ]

  return (
    <div className="p-6 flex flex-col items-center text-center">
      {/* Logo */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                      flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200/40 mb-4">
        ◈
      </div>

      {/* App name */}
      <h2 className="text-xl font-bold text-gray-800">Fractal Chat</h2>
      <p className="text-sm text-gray-500 mt-1 mb-6 max-w-xs">
        {t('about.tagline')}
      </p>

      {/* Info cards */}
      <div className="w-full space-y-3 text-left">
        <InfoRow label={t('about.version')} value="v1.0" />
        <InfoRow label={t('about.license')} value="Apache 2.0" />
        <InfoRow
          label={t('about.github')}
          value={
            <a
              href="https://github.com/LeoLiao0806Xuan/Fractal_Chat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
            >
              LeoLiao0806Xuan/Fractal_Chat
            </a>
          }
        />
      </div>

      {/* Tech stack */}
      <div className="w-full mt-6 pt-5 border-t border-gray-100">
        <div className="text-xs text-gray-500 mb-2.5">{t('about.tech_stack')}</div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {techStack.map(tech => (
            <span
              key={tech}
              className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}
