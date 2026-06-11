import { useRef, useEffect, useMemo } from 'react'
import { useDialogStore } from '../../stores/dialogStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { MessageBubble } from './MessageBubble'

export function MessageList() {
  const dialogs = useDialogStore(s => s.dialogs)
  const currentDialogId = useDialogStore(s => s.currentDialogId)
  const currentDialog = useMemo(
    () => dialogs.find(d => d.id === currentDialogId),
    [dialogs, currentDialogId],
  )
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentDialog?.messages.length])

  if (!currentDialog) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 select-none min-h-0">
        <div className="text-center">
          <div className="text-5xl mb-3">💬</div>
          <div className="text-lg">选择一个对话或新建一个开始</div>
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
        <div className="shrink-0 px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-3 flex-wrap text-sm">
          <span className="text-amber-700 font-medium">🌿 子对话</span>
          <button
            onClick={() => {
              if (parentDialog) useDialogStore.getState().setCurrentDialog(parentDialog.id)
            }}
            className="text-amber-600 hover:text-amber-800 hover:underline flex items-center gap-1"
          >
            ↩ 返回「{parentDialog?.title || '父对话'}」
          </button>
          {!isMerged && (
            <button
              onClick={() => {
                // Try contextAnchor first (for new sub-dialogs)
                const anchor = currentDialog.contextAnchor
                // Fallback: try to find the parent message by mergedFromSubDialogId
                let parentMsgId = anchor?.messageId || ''
                if (!parentMsgId && parentDialog) {
                  const found = parentDialog.messages.find(m => m.mergedFromSubDialogId === currentDialog.id)
                  if (found) parentMsgId = found.id
                }
                useSubDialogStore.getState().reopen(
                  currentDialog.id,
                  currentDialog.parentDialogId || '',
                  parentMsgId,
                )
              }}
              className="ml-auto text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2.5 py-1 rounded-lg font-medium transition-colors"
            >
              🔀 合并回主干
            </button>
          )}
          {isMerged && (
            <span className="ml-auto text-xs text-green-600">✅ 已合并</span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0" data-dialog-id={currentDialogId}>
        {currentDialog.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">✨</div>
              <div>发送第一条消息开始对话</div>
            </div>
          </div>
        ) : (
          currentDialog.messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
