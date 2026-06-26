import { useState } from 'react'
import { useModelStore } from '../../stores/modelStore'
import { useDialogStore } from '../../stores/dialogStore'
import { SettingsPanel } from '../settings/SettingsPanel'
import { OnboardingWizard } from '../onboarding/OnboardingWizard'
import { generateSampleDialogs } from '../../lib/sampleData'
import { saveAllDialogs } from '../../lib/db'
import { useTranslation } from '../../i18n'

export function ModelSelector() {
  const { t } = useTranslation()
  const configs = useModelStore(s => s.configs)
  const activeModelId = useModelStore(s => s.activeModelId)
  const setActiveModel = useModelStore(s => s.setActiveModel)
  const compareMode = useModelStore(s => s.compareMode)
  const setCompareMode = useModelStore(s => s.setCompareMode)
  const selectedModelIds = useModelStore(s => s.selectedModelIds)
  const toggleModelSelection = useModelStore(s => s.toggleModelSelection)
  const [showPanel, setShowPanel] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const mockMode = configs.length === 0

  return (
    <>
      <div className="flex items-center gap-1.5">
        {compareMode ? (
          /* ── Multi-select compare mode ── */
          <div className="flex items-center gap-1 text-xs text-[#52525b]">
            <span className="text-indigo-500 font-medium shrink-0">{t('selector.compare_btn')}</span>
            {mockMode ? (
              <span className="text-[#a3a3a3] text-amber-600">💬 Mock</span>
            ) : (
              <div className="flex items-center gap-1 flex-wrap">
                {configs.map(c => (
                  <label key={c.id}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition-all ${
                      selectedModelIds.includes(c.id)
                        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                        : 'hover:bg-[#f0eff5] text-[#52525b]'
                    }`}
                  >
                    <input type="checkbox" checked={selectedModelIds.includes(c.id)}
                      onChange={() => toggleModelSelection(c.id)} className="w-3 h-3 accent-indigo-500" />
                    <span className="whitespace-nowrap">{c.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : mockMode ? (
          /* ── Mock mode badge → click to setup ── */
          <button onClick={() => setShowOnboarding(true)}
            className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50
                       px-3 py-1.5 rounded-lg border border-emerald-200/60 font-medium
                       hover:bg-emerald-100 hover:border-emerald-300 transition-all"
          >
            🚀 {t('selector.setup_free')}
          </button>
        ) : (
          /* ── Single-select dropdown ── */
          <select value={activeModelId || ''}
            onChange={e => setActiveModel(e.target.value || null)}
            className="text-xs border border-[#e4e3ed] rounded-lg px-2 py-1.5 bg-white text-[#52525b]
                       focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400
                       transition-all"
          >
            {configs.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.modelName})</option>
            ))}
          </select>
        )}

        {/* Compare mode toggle (visible when ≥2 models configured) */}
        {configs.length >= 2 && (
          <button onClick={() => setCompareMode(!compareMode)}
            className={`text-xs px-2 py-1.5 rounded-lg transition-all ${
              compareMode
                ? 'bg-indigo-100 text-indigo-600 font-medium shadow-sm'
                : 'text-[#a3a3a3] hover:text-[#6366f1] hover:bg-[#f8f7fc]'
            }`}
            title={compareMode ? t('selector.exit_compare') : t('selector.compare')}
          >
            {compareMode ? t('selector.exit') : t('selector.compare_btn')}
          </button>
        )}

        <button onClick={() => setShowPanel(true)}
          className="text-xs text-[#a3a3a3] hover:text-[#6366f1] hover:bg-[#f8f7fc] px-1.5 py-1.5 rounded-lg transition-colors"
          title={t('selector.manage')}
        >
          ⚙️
        </button>
      </div>

      {showPanel && <SettingsPanel onClose={() => setShowPanel(false)} />}
      {showOnboarding && <OnboardingWizard onComplete={(action) => { setShowOnboarding(false); if (action === 'skipped') { const loc = navigator.language.startsWith('zh') ? 'zh-CN' as const : 'en' as const; const samples = generateSampleDialogs(loc); useDialogStore.setState({ dialogs: samples, currentDialogId: samples[0].id }); saveAllDialogs(samples) } }} />}
    </>
  )
}
