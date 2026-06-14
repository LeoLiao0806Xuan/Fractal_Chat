import { useState } from 'react'
import { useModelStore } from '../../stores/modelStore'
import { ModelConfigPanel } from './ModelConfigPanel'

export function ModelSelector() {
  const configs = useModelStore(s => s.configs)
  const activeModelId = useModelStore(s => s.activeModelId)
  const setActiveModel = useModelStore(s => s.setActiveModel)
  const compareMode = useModelStore(s => s.compareMode)
  const setCompareMode = useModelStore(s => s.setCompareMode)
  const selectedModelIds = useModelStore(s => s.selectedModelIds)
  const toggleModelSelection = useModelStore(s => s.toggleModelSelection)
  const [showPanel, setShowPanel] = useState(false)

  return (
    <>
      <div className="flex items-center gap-1.5">
        {compareMode ? (
          /* ── Multi-select compare mode ── */
          <div className="flex items-center gap-1 text-xs text-[#52525b]">
            <span className="text-indigo-500 font-medium shrink-0">对比</span>
            {configs.length === 0 ? (
              <span className="text-[#a3a3a3]">未配置模型</span>
            ) : (
              <div className="flex items-center gap-1 flex-wrap">
                {configs.map(c => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition-all ${
                      selectedModelIds.includes(c.id)
                        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                        : 'hover:bg-[#f0eff5] text-[#52525b]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModelIds.includes(c.id)}
                      onChange={() => toggleModelSelection(c.id)}
                      className="w-3 h-3 accent-indigo-500"
                    />
                    <span className="whitespace-nowrap">{c.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Single-select mode ── */
          <select
            value={activeModelId || ''}
            onChange={e => setActiveModel(e.target.value || null)}
            className="text-xs border border-[#e4e3ed] rounded-lg px-2 py-1.5 bg-white text-[#52525b]
                       focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400
                       transition-all"
          >
            {configs.length === 0 && <option value="">未配置模型</option>}
            {configs.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.modelName})</option>
            ))}
          </select>
        )}

        {/* Compare mode toggle (visible when ≥2 models configured) */}
        {configs.length >= 2 && (
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`text-xs px-2 py-1.5 rounded-lg transition-all ${
              compareMode
                ? 'bg-indigo-100 text-indigo-600 font-medium shadow-sm'
                : 'text-[#a3a3a3] hover:text-[#6366f1] hover:bg-[#f8f7fc]'
            }`}
            title={compareMode ? '退出对比模式' : '多模型对比'}
          >
            {compareMode ? '✕ 退出' : '⊕ 对比'}
          </button>
        )}

        <button
          onClick={() => setShowPanel(true)}
          className="text-xs text-[#a3a3a3] hover:text-[#6366f1] hover:bg-[#f8f7fc] px-1.5 py-1.5 rounded-lg transition-colors"
          title="管理模型配置"
        >
          ⚙️
        </button>
      </div>

      {showPanel && <ModelConfigPanel onClose={() => setShowPanel(false)} />}
    </>
  )
}
