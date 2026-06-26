import { useState } from 'react'
import { useTranslation } from '../../i18n'
import { GeneralTab } from './GeneralTab'
import { UsageTab } from './UsageTab'
import { AboutTab } from './AboutTab'

interface Props {
  onClose: () => void
}

type TabId = 'general' | 'usage' | 'about'

export function SettingsPanel({ onClose }: Props) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>('general')

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'general', label: t('settings.general'), icon: '⚙️' },
    { id: 'usage', label: t('settings.usage'), icon: '📊' },
    { id: 'about', label: t('settings.about'), icon: 'ℹ️' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[540px] max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold">{t('settings.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 px-4 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'usage' && <UsageTab />}
          {activeTab === 'about' && <AboutTab />}
        </div>
      </div>
    </div>
  )
}
