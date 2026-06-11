import { lazy, Suspense } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { Sidebar } from './Sidebar'
import { MessageList } from '../chat/MessageList'
import { ChatInput } from '../chat/ChatInput'

const SubDialogPanel = lazy(() => import('../editor/SubDialogPanel'))

export function AppLayout() {
  const leftPanelOpen = useUIStore(s => s.leftPanelOpen)
  const setLeftPanel = useUIStore(s => s.setLeftPanel)
  const subDialogOpen = useSubDialogStore(s => s.isOpen)

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <div
        className={`shrink-0 overflow-hidden border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
          leftPanelOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <div className="w-64 h-full">
          <Sidebar />
        </div>
      </div>

      {/* ── Toggle button at the seam ── */}
      <button
        onClick={() => setLeftPanel(!leftPanelOpen)}
        className="shrink-0 w-5 border-r border-gray-200 bg-white hover:bg-gray-50
                   flex items-center justify-center cursor-pointer group
                   transition-colors"
        title={leftPanelOpen ? '收起侧边栏' : '展开侧边栏'}
      >
        <svg
          className={`w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-transform duration-300 ${
            leftPanelOpen ? '' : 'rotate-180'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <MessageList />
        <ChatInput />
      </div>

      {/* ── Sub-dialog panel ── */}
      {subDialogOpen && (
        <Suspense fallback={<div className="w-96 border-l border-gray-200 bg-gray-50 animate-pulse" />}>
          <SubDialogPanel />
        </Suspense>
      )}
    </div>
  )
}
