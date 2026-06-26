import { lazy, Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { Sidebar } from './Sidebar'
import { MessageList } from '../chat/MessageList'
import { ChatInput } from '../chat/ChatInput'
import { useTranslation } from '../../i18n'

const SubDialogPanel = lazy(() => import('../editor/SubDialogPanel'))

const SIDEBAR_MIN = 200
const SIDEBAR_MAX = 400
const SIDEBAR_DEFAULT = 272
const MOBILE_BREAKPOINT = 1024

export function AppLayout() {
  const { t } = useTranslation()
  const leftPanelOpen = useUIStore(s => s.leftPanelOpen)
  const setLeftPanel = useUIStore(s => s.setLeftPanel)
  const subDialogOpen = useSubDialogStore(s => s.isOpen)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('fractal-sidebar-width')
    return saved ? Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, Number(saved))) : SIDEBAR_DEFAULT
  })
  const resizing = useRef(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT)

  // Track viewport size for responsive layout
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Auto-close sidebar on mobile when opening sub-dialog
  useEffect(() => {
    if (isMobile && subDialogOpen && leftPanelOpen) {
      setLeftPanel(false)
    }
  }, [isMobile, subDialogOpen, leftPanelOpen, setLeftPanel])

  // ── Desktop resize (mouse) ──
  const handleMouseDown = useCallback(() => {
    if (isMobile) return
    resizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [isMobile])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing.current) return
    const w = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, e.clientX))
    setSidebarWidth(w)
    localStorage.setItem('fractal-sidebar-width', String(w))
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
      {/* ── Mobile sidebar backdrop ── */}
      {isMobile && leftPanelOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setLeftPanel(false)}
        />
      )}

      {/* ── Sidebar (desktop: inline; mobile: fixed drawer) ── */}
      <div
        className={`
          bg-[#faf9fe] border-r border-[#f0eff5] overflow-hidden
          ${isMobile
            ? 'fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-out'
            : 'shrink-0 transition-[width,opacity] duration-350 ease-out'
          }
          ${isMobile && !leftPanelOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
        style={isMobile ? { width: Math.min(sidebarWidth, window.innerWidth * 0.85) } : {
          width: leftPanelOpen ? sidebarWidth : 0,
          opacity: leftPanelOpen ? 1 : 0,
        }}
      >
        <div style={{ width: isMobile ? Math.min(sidebarWidth, window.innerWidth * 0.85) : sidebarWidth }} className="h-full">
          <Sidebar />
        </div>
      </div>

      {/* ── Desktop resize handle ── */}
      {!isMobile && leftPanelOpen && (
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
        className={`
          shrink-0 bg-white hover:bg-[#faf9fe] flex items-center justify-center cursor-pointer
          transition-colors z-10
          ${isMobile
            ? 'fixed top-3 left-3 w-9 h-9 rounded-xl border border-[#f0eff5] shadow-sm'
            : 'w-6 border-r border-[#f0eff5] relative'
          }
        `}
        title={leftPanelOpen ? t('layout.collapse') : t('layout.expand')}
        style={isMobile && subDialogOpen ? { display: 'none' } : {}}
      >
        {isMobile ? (
          <svg className="w-4 h-4 text-[#52525b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={leftPanelOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        ) : (
          <svg className={`w-3 h-3 text-[#a3a3a3] group-hover:text-[#6366f1]
                           transition-all duration-300 ${leftPanelOpen ? '' : 'rotate-180'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        )}
      </button>

      {/* ── Main area ── */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white ${isMobile ? 'pt-0' : ''}`}>
        {/* Mobile top spacer for hamburger */}
        {isMobile && leftPanelOpen && <div className="h-0 shrink-0" />}
        <MessageList />
        <ChatInput />
      </div>

      {/* ── Sub-dialog panel: desktop inline / mobile overlay ── */}
      {subDialogOpen && (
        <Suspense
          fallback={
            <div className={`${isMobile ? 'fixed inset-0 z-50 bg-white' : 'w-[420px] border-l border-[#f0eff5]'} bg-white/80 flex items-center justify-center`}>
              <div className="text-center space-y-3">
                <div className="w-8 h-8 mx-auto rounded-full skeleton" />
                <div className="text-xs text-[#a3a3a3]">{t('layout.loading')}</div>
              </div>
            </div>
          }
        >
          {/* Pass isMobile down so SubDialogPanel can adjust its layout */}
          <SubDialogPanelAdaptive isMobile={isMobile} />
        </Suspense>
      )}
    </div>
  )
}

/**
 * Wrapper that passes isMobile to SubDialogPanel via a custom attribute.
 * SubDialogPanel reads it from its parent's dataset.
 */
function SubDialogPanelAdaptive({ isMobile }: { isMobile: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.dataset.mobile = String(isMobile)
    }
  }, [isMobile])
  return (
    <div ref={panelRef} className={isMobile ? 'fixed inset-0 z-50 bg-white' : ''}>
      <SubDialogPanel />
    </div>
  )
}
