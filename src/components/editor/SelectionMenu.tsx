import { useEffect, useRef, useState, useMemo } from 'react'
import type { SelectionResult } from '../../services/selectionEngine'
import { selectionTypeLabel, selectionTypeIcon } from '../../services/selectionEngine'
import { useTranslation } from '../../i18n'

interface MenuItem {
  id: string
  label: string
  icon: string
  action: () => void
}

interface Props {
  selectionResult: SelectionResult
  onClose: () => void
  onSubDialog: (text: string, mode: string) => void
}

function recommendedItems(type: string): string[] {
  switch (type) {
    case 'code-block':
    case 'inline-code':
      return ['debug', 'deep-dive', 'ask-other', 'anchor']
    case 'math':
      return ['deep-dive', 'ask-other', 'anchor']
    default:
      return ['deep-dive', 'ask-other', 'anchor', 'debug']
  }
}

export function SelectionMenu({ selectionResult, onClose, onSubDialog }: Props) {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const ALL_ITEMS = useMemo<MenuItem[]>(() => [
    { id: 'deep-dive', label: t('selection.deep_dive'), icon: '🔍', action: () => {} },
    { id: 'debug', label: 'Debug', icon: '🐛', action: () => {} },
    { id: 'ask-other', label: t('selection.switch_model'), icon: '🤖', action: () => {} },
    { id: 'anchor', label: t('selection.pin'), icon: '📌', action: () => {} },
  ], [t])

  const { text, rect, type, confidence } = selectionResult
  const items = ALL_ITEMS.filter(i => recommendedItems(type).includes(i.id))

  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const mw = el.offsetWidth || 320
    const mh = el.offsetHeight || 100

    const gap = 16
    const viewH = window.innerHeight
    const viewW = window.innerWidth
    const above = rect.top - gap - mh
    const below = rect.bottom + gap
    const fitsAbove = above >= 0
    const fitsBelow = below + mh <= viewH

    const top = fitsAbove ? above : fitsBelow ? below : Math.max(gap, viewH - mh - gap)
    let left = rect.left + rect.width / 2 - mw / 2
    left = Math.max(12, Math.min(left, viewW - mw - 12))

    setPosition({ left, top })
  }, [rect])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (confidence < 0.3) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[320px] max-w-[440px] animate-fade-in"
      style={{ top: position.top, left: position.left }}
    >
      <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/40 overflow-hidden">
        {/* Type badge */}
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-50/80 to-purple-50/80
                        border-b border-[#f0eff5] flex items-center gap-2">
          <span className="text-sm">{selectionTypeIcon(type)}</span>
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
            {selectionTypeLabel(type)}
          </span>
          <span className="text-[10px] text-[#a3a3a3] ml-auto font-medium">
            {text.length} {t('selection.chars')}
          </span>
        </div>

        {/* Text preview */}
        <div className="px-3.5 py-2.5 border-b border-[#f8f7fc]">
          <p className="text-xs text-[#737373] leading-relaxed line-clamp-2">
            {text.length > 120 ? text.slice(0, 120) + '…' : text}
          </p>
        </div>

        {/* Action buttons */}
        <div className="p-2.5 flex flex-wrap gap-1.5">
          {items.map(item => (
            <button key={item.id}
              onClick={() => onSubDialog(text, item.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                         transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]
                         bg-[#f8f7fc] text-[#52525b] hover:bg-indigo-50 hover:text-indigo-700
                         hover:shadow-sm border border-transparent hover:border-indigo-100/50
                         shadow-sm"
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
