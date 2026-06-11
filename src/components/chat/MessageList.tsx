import { useRef, useEffect, useMemo } from 'react'
import { useDialogStore } from '../../stores/dialogStore'
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

  return (
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
  )
}
