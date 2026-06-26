import { useState } from 'react'
import { DialogTree } from '../tree/DialogTree'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { SettingsPanel } from '../settings/SettingsPanel'
import { useTranslation } from '../../i18n'

export function Sidebar() {
  const { t } = useTranslation()
  const [showSettings, setShowSettings] = useState(false)
  return (
    <aside className="bg-[#faf9fe] flex flex-col h-full">
      {/* Brand header */}
      <div className="px-4 py-4 border-b border-[#f0eff5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center text-white text-xs font-bold shadow-sm
                          shadow-indigo-200/30">
            ◈
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#171717] tracking-tight">Fractal Chat</h1>
            <p className="text-[10px] text-[#a3a3a3] font-medium">{t('sidebar.title')}</p>
          </div>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Dialog Tree — takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <DialogTree />
      </div>

      {/* Footer — Settings */}
      <div className="border-t border-[#f0eff5] px-3 py-2 shrink-0">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-colors"
        >
          <span className="text-base">⚙️</span>
          <span>{t('settings.title')}</span>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </aside>
  )
}
