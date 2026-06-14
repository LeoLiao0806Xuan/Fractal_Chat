import { lazy, Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { Sidebar } from './Sidebar'
import { MessageList } from '../chat/MessageList'
import { ChatInput } from '../chat/ChatInput'

const SubDialogPanel = lazy(() => import('../editor/SubDialogPanel'))

const SIDEBAR_MIN = 200
const SIDEBAR_MAX = 400
const SIDEBAR_DEFAULT = 272

export function AppLayout() {
  const leftPanelOpen = useUIStore(s => s.leftPanelOpen)
  const setLeftPanel = useUIStore(s => s.setLeftPanel)
  const subDialogOpen = useSubDialogStore(s => s.isOpen)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const resizing = useRef(false)

  const handleMouseDown = useCallback(() => {
    resizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing.current) return
    setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, e.clientX)))
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!resizing.current) return
    resizing.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#f8f7fc]">
      {/* ── Sidebar ── */}
      <div
        className="shrink-0 overflow-hidden border-r border-[#f0eff5] bg-[#faf9fe]
                   transition-[width,opacity] duration-350 ease-out"
        style={{
          width: leftPanelOpen ? sidebarWidth : 0,
          opacity: leftPanelOpen ? 1 : 0,
        }}
      >
        <div style={{ width: sidebarWidth }} className="h-full">
          <Sidebar />
        </div>
      </div>

      {/* ── Resize handle ── */}
      {leftPanelOpen && (
        <div
          onMouseDown={handleMouseDown}
          className="shrink-0 w-[3px] cursor-col-resize bg-transparent
                     hover:bg-indigo-300/40 active:bg-indigo-400/50
                     transition-colors relative z-10"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      {/* ── Sidebar toggle ── */}
      <button
        onClick={() => setLeftPanel(!leftPanelOpen)}
        className="shrink-0 w-6 border-r border-[#f0eff5] bg-white hover:bg-[#faf9fe]
                   flex items-center justify-center cursor-pointer group
                   transition-colors relative z-10"
        title={leftPanelOpen ? '收起侧边栏' : '展开侧边栏'}
      >
        <svg className={`w-3 h-3 text-[#a3a3a3] group-hover:text-[#6366f1]
                         transition-all duration-300 ${leftPanelOpen ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <Suspense
          fallback={
            <div className="w-[420px] border-l border-[#f0eff5] bg-white/80 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 mx-auto rounded-full skeleton" />
                <div className="text-xs text-[#a3a3a3]">加载中...</div>
              </div>
            </div>
          }
        >
          <SubDialogPanel />
        </Suspense>
      )}
    </div>
  )
}
