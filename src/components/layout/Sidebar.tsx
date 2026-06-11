import { useUIStore } from '../../stores/uiStore'
import { DialogTree } from '../tree/DialogTree'

export function Sidebar() {
  const setLeftPanel = useUIStore(s => s.setLeftPanel)

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Top bar */}
      <div className="p-2 border-b border-gray-200 flex items-center justify-between bg-white">
        <span className="text-sm font-semibold text-gray-700 px-1">💬 Fractal Chat</span>
        <button
          onClick={() => setLeftPanel(false)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
          title="关闭侧边栏"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Dialog Tree */}
      <DialogTree />
    </aside>
  )
}
