import { useState } from 'react'
import { useModelStore } from '../../stores/modelStore'
import { ModelConfigPanel } from './ModelConfigPanel'

export function ModelSelector() {
  const configs = useModelStore(s => s.configs)
  const activeModelId = useModelStore(s => s.activeModelId)
  const setActiveModel = useModelStore(s => s.setActiveModel)
  const [showPanel, setShowPanel] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
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
        <button
          onClick={() => setShowPanel(true)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
          title="管理模型配置"
        >
          ⚙️
        </button>
      </div>

      {showPanel && <ModelConfigPanel onClose={() => setShowPanel(false)} />}
    </>
  )
}
