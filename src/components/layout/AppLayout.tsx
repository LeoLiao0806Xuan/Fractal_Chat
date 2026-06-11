import { lazy, Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { Sidebar } from './Sidebar'
import { MessageList } from '../chat/MessageList'
import { ChatInput } from '../chat/ChatInput'

const SubDialogPanel = lazy(() => import('../editor/SubDialogPanel'))

const SIDEBAR_MIN = 180
const SIDEBAR_MAX = 400
const SIDEBAR_DEFAULT = 256

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
    const w = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, e.clientX))
    setSidebarWidth(w)
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
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <div
        className="shrink-0 overflow-hidden border-r border-gray-200 bg-white transition-[width,opacity] duration-300 ease-in-out"
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
          className="shrink-0 w-1 cursor-col-resize bg-transparent hover:bg-blue-300 active:bg-blue-400 transition-colors"
          title="拖拽调整宽度"
        />
      )}

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
