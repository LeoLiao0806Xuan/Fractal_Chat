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
      <div className="flex items-center gap-2">
        {compareMode ? (
          /* ── Multi-select mode ── */
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="text-blue-500 font-medium">对比</span>
            {configs.length === 0 ? (
              <span className="text-gray-400">未配置模型</span>
            ) : (
              configs.map(c => (
                <label
                  key={c.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors ${
                    selectedModelIds.includes(c.id)
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModelIds.includes(c.id)}
                    onChange={() => toggleModelSelection(c.id)}
                    className="w-3 h-3 accent-blue-500"
                  />
                  <span className="whitespace-nowrap">{c.name}</span>
                </label>
              ))
            )}
          </div>
        ) : (
          /* ── Single-select mode ── */
          <select
            value={activeModelId || ''}
            onChange={e => setActiveModel(e.target.value || null)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {configs.length === 0 && (
              <option value="">未配置模型</option>
            )}
            {configs.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.modelName})
              </option>
            ))}
          </select>
        )}

        {/* Compare mode toggle */}
        {configs.length >= 2 && (
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`text-xs px-2 py-1.5 rounded-lg transition-colors ${
              compareMode
                ? 'bg-blue-100 text-blue-600 font-medium'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={compareMode ? '退出对比模式' : '多模型对比'}
          >
            {compareMode ? '✕ 退出对比' : '⊕ 对比'}
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={() => setShowPanel(true)}
          className="text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-1.5 py-1.5 rounded-lg transition-colors"
          title="管理模型配置"
        >
          ⚙️
        </button>
      </div>

      {showPanel && <ModelConfigPanel onClose={() => setShowPanel(false)} />}
    </>
  )
}
