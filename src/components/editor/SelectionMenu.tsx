import { useEffect, useRef, useState } from 'react'

interface MenuItem {
  id: string
  label: string
  icon: string
  action: () => void
}

interface Props {
  selectedText: string
  rect: DOMRect
  onClose: () => void
  onSubDialog: (text: string, mode: string) => void
}

const ITEMS: MenuItem[] = [
  { id: 'deep-dive', label: '深入探讨', icon: '🔍', action: () => {} },
  { id: 'debug', label: 'Debug', icon: '🐛', action: () => {} },
  { id: 'ask-other', label: '换模型问', icon: '🤖', action: () => {} },
  { id: 'anchor', label: '锚定引用', icon: '📌', action: () => {} },
]

export function SelectionMenu({ selectedText, rect, onClose, onSubDialog }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  // Measure menu and position after mount
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const mw = el.offsetWidth || 260
    const mh = el.offsetHeight || 44

    // Vertical: prefer above, fall below if not enough room
    const gap = 16
    const viewH = window.innerHeight
    const above = rect.top - gap - mh   // menu top when placed above selection
    const below = rect.bottom + gap     // menu top when placed below selection
    const fitsAbove = above >= 0
    const fitsBelow = below + mh <= viewH

    const top = fitsAbove ? above : fitsBelow ? below : Math.max(gap, viewH - mh - gap)

    // Horizontal: center on selection, clamped to viewport
    let left = rect.left + rect.width / 2 - mw / 2
    const padding = 8
    left = Math.max(padding, Math.min(left, window.innerWidth - mw - padding))

    setPosition({ left, top })
  }, [rect])

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid the same click that triggered the menu
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 px-1 flex gap-0.5 animate-fade-in"
      style={{ top: position.top, left: position.left }}
    >
      {ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onSubDialog(selectedText, item.id)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs
                     hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          title={item.label}
        >
          <span className="text-sm">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
