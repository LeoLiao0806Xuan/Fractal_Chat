import { useRef, useEffect, useMemo } from 'react'
import { useDialogStore } from '../../stores/dialogStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { MessageBubble } from './MessageBubble'
import { useTranslation } from '../../i18n'

export function MessageList() {
  const { t } = useTranslation()
  const dialogs = useDialogStore(s => s.dialogs)
  const currentDialogId = useDialogStore(s => s.currentDialogId)
  const currentDialog = useMemo(
    () => dialogs.find(d => d.id === currentDialogId),
    [dialogs, currentDialogId],
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only auto-scroll if user was already near the bottom
    const el = scrollRef.current
    if (!el) return
    const threshold = 100 // px from bottom
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentDialog?.messages.length])

  // Empty state — no dialog selected
  if (!currentDialog) {
    return (
      <div className="flex-1 flex items-center justify-center select-none min-h-0">
        <div className="text-center px-8 max-w-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50
                          flex items-center justify-center text-3xl shadow-sm animate-float">
            💬
          </div>
          <h2 className="text-lg font-semibold text-[#52525b] mb-1.5">{t('chat.list.select')}</h2>
          <p className="text-sm text-[#a3a3a3] leading-relaxed">
            {t('chat.list.select_hint')}
            <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md
                           bg-indigo-50 text-indigo-600 text-xs font-medium">
              + {t('tree.new')}
            </span>
            {t('chat.list.select_hint2')}
          </p>
        </div>
      </div>
    )
  }

  const isSubDialog = !!currentDialog.parentDialogId
  const parentDialog = isSubDialog ? dialogs.find(d => d.id === currentDialog.parentDialogId) : null
  const isMerged = currentDialog.title.startsWith('✏️') || currentDialog.title.startsWith('📎') || currentDialog.title.startsWith('🌿')

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Sub-dialog banner */}
      {isSubDialog && (
        <div className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50/50
                        border-b border-amber-200/60 flex items-center gap-2 flex-wrap text-sm">
          <span className="text-amber-700 font-medium flex items-center gap-1.5">
            <span className="text-base">🌿</span>
            <span>{t('chat.list.sub')}</span>
          </span>
          <button onClick={() => {
            if (parentDialog) useDialogStore.getState().setCurrentDialog(parentDialog.id)
          }} className="text-amber-600 hover:text-amber-800 hover:bg-amber-100/50
                       flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors text-xs font-medium">
            ↩ {t('chat.list.back_to')}「{parentDialog?.title || t('chat.list.parent')}」
          </button>
          <button onClick={() => useSubDialogStore.getState().reopen(currentDialog.id, currentDialog.parentDialogId || '', '')}
            className="text-xs bg-amber-100/80 hover:bg-amber-200 text-amber-700
                       px-2.5 py-1 rounded-lg font-medium transition-colors">{t('chat.list.open_panel')}</button>
          {!isMerged && (
            <button onClick={() => {
              const anchor = currentDialog.contextAnchor
              let pm = anchor?.messageId || ''
              if (!pm && parentDialog) {
                const found = parentDialog.messages.find(m => m.mergedFromSubDialogId === currentDialog.id)
                if (found) pm = found.id
              }
              useSubDialogStore.getState().reopen(currentDialog.id, currentDialog.parentDialogId || '', pm)
            }} className="ml-auto text-xs bg-emerald-100/80 hover:bg-emerald-200 text-emerald-700
                         px-2.5 py-1 rounded-lg font-medium transition-colors shadow-sm">{t('chat.list.merge')}</button>
          )}
          {isMerged && <span className="ml-auto text-xs text-emerald-600 font-medium">{t('chat.list.merged')}</span>}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 min-h-0" data-dialog-id={currentDialogId}>
        {currentDialog.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#a3a3a3]">
            <div className="text-center px-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100
                              flex items-center justify-center text-2xl shadow-sm">✍️</div>
              <p className="text-sm text-[#a3a3a3]">{t('chat.list.start')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-base font-semibold text-[#52525b]">
                {currentDialog.title.replace(/^[✏️📎🌿]\s*/, '')}
              </h2>
              <p className="text-[11px] text-[#a3a3a3] mt-0.5">
                {currentDialog.messages.length} {t('chat.list.messages')}
                {currentDialog.messages.some(m => m.model) && t('chat.list.ai_reply')}
              </p>
            </div>
            {currentDialog.messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
