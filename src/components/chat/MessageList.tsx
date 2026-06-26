import { useRef, useMemo } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
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
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const dialogLenRef = useRef(0)

  // Track message count changes for auto-scroll on new messages
  const msgLen = currentDialog?.messages.length ?? 0
  if (msgLen !== dialogLenRef.current) {
    const prev = dialogLenRef.current
    dialogLenRef.current = msgLen
    // If a new message was added (not just streaming update), scroll to bottom
    if (prev > 0 && msgLen > prev) {
      setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: msgLen - 1, behavior: 'smooth' }), 50)
    }
  }

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
  const messages = currentDialog.messages

  // Empty messages state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {isSubDialog && <SubDialogBanner />}
        <div className="flex-1 flex items-center justify-center text-[#a3a3a3]">
          <div className="text-center px-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100
                            flex items-center justify-center text-2xl shadow-sm">✍️</div>
            <p className="text-sm text-[#a3a3a3]">{t('chat.list.start')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Sub-dialog banner — fixed above the virtual list */}
      {isSubDialog && (
        <SubDialogBanner
          parentDialog={parentDialog}
          currentDialog={currentDialog}
          isMerged={isMerged}
          t={t}
        />
      )}

      {/* Virtual-scrolled message list */}
      <div className="flex-1 min-h-0">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          itemContent={(index, msg) => (
            <div className="px-4">
              <MessageBubble key={msg.id} message={msg} />
            </div>
          )}
          components={{
            Header: () => (
              <div className="text-center pt-5 pb-2 px-4">
                <h2 className="text-base font-semibold text-[#52525b]">
                  {currentDialog.title.replace(/^[✏️📎🌿]\s*/, '')}
                </h2>
                <p className="text-[11px] text-[#a3a3a3] mt-0.5">
                  {messages.length} {t('chat.list.messages')}
                  {messages.some(m => m.model) && t('chat.list.ai_reply')}
                </p>
              </div>
            ),
            Footer: () => <div className="h-4" />,
          }}
          followOutput="smooth"
          atBottomThreshold={100}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}

// ── Sub-dialog banner sub-component ──

function SubDialogBanner({
  parentDialog,
  currentDialog,
  isMerged,
  t,
}: {
  parentDialog?: ReturnType<typeof useDialogStore.getState>['dialogs'][0] | null
  currentDialog?: ReturnType<typeof useDialogStore.getState>['dialogs'][0]
  isMerged: boolean
  t: (key: string) => string
}) {
  return (
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
      <button onClick={() => useSubDialogStore.getState().reopen(currentDialog?.id || '', currentDialog?.parentDialogId || '', '')}
        className="text-xs bg-amber-100/80 hover:bg-amber-200 text-amber-700
                   px-2.5 py-1 rounded-lg font-medium transition-colors">{t('chat.list.open_panel')}</button>
      {!isMerged && (
        <button onClick={() => {
          const anchor = currentDialog?.contextAnchor
          let pm = anchor?.messageId || ''
          if (!pm && parentDialog) {
            const found = parentDialog.messages.find(m => m.mergedFromSubDialogId === currentDialog?.id)
            if (found) pm = found.id
          }
          useSubDialogStore.getState().reopen(currentDialog?.id || '', currentDialog?.parentDialogId || '', pm)
        }} className="ml-auto text-xs bg-emerald-100/80 hover:bg-emerald-200 text-emerald-700
                     px-2.5 py-1 rounded-lg font-medium transition-colors shadow-sm">{t('chat.list.merge')}</button>
      )}
      {isMerged && <span className="ml-auto text-xs text-emerald-600 font-medium">{t('chat.list.merged')}</span>}
    </div>
  )
}
