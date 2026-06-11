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
    <div className="h-screen w-screen flex overflow-hidden bg-white">
      {/* Sidebar (CSS hide to preserve mounted state) */}
      <div className={leftPanelOpen ? 'w-64 shrink-0' : 'w-0 overflow-hidden'}>
        <Sidebar />
      </div>

      {/* Toggle sidebar button (always rendered, positioned differently) */}
      <button
        onClick={() => setLeftPanel(!leftPanelOpen)}
        className={`absolute top-3 z-10 bg-white border border-gray-300 rounded-lg p-1.5
                   hover:bg-gray-100 shadow-sm transition-all duration-200
                   ${leftPanelOpen ? 'left-[248px]' : 'left-3'}`}
        title={leftPanelOpen ? '关闭侧边栏' : '打开侧边栏'}
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <MessageList />
        <ChatInput />
      </div>

      {/* Sub-dialog panel (slides in from right) */}
      {subDialogOpen && (
        <Suspense fallback={<div className="w-96 border-l border-gray-200 bg-gray-50 animate-pulse" />}>
          <SubDialogPanel />
        </Suspense>
      )}
    </div>
  )
}
