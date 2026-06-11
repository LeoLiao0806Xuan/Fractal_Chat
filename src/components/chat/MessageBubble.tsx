import { useState } from 'react'
import type { Message } from '../../lib/types'
import { TiptapRenderer } from '../editor/TiptapRenderer'
import { SelectionMenu } from '../editor/SelectionMenu'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { useDialogStore } from '../../stores/dialogStore'

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const [selectionInfo, setSelectionInfo] = useState<{ text: string; rect: DOMRect } | null>(null)
  const openSubDialog = useSubDialogStore(s => s.open)
  const currentDialogId = useDialogStore(s => s.currentDialogId)
  const dialogs = useDialogStore(s => s.dialogs)

  const handleSelection = (text: string, rect: DOMRect) => {
    if (isUser) return
    setSelectionInfo({ text, rect })
  }

  const handleSubDialog = (text: string, mode: string) => {
    setSelectionInfo(null)
    if (currentDialogId) {
      openSubDialog(text, mode, message.id, currentDialogId)
    }
  }

  const handleJumpToSubDialog = () => {
    if (message.mergedFromSubDialogId && currentDialogId) {
      useSubDialogStore.getState().reopen(
        message.mergedFromSubDialogId,
        currentDialogId,
        message.id,
      )
    }
  }

  return (
    <>
      <div data-msg-id={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 relative`}>
        <div
          className={`
            max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
            ${isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }
            ${message.status === 'streaming' ? 'animate-pulse' : ''}
          `}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <TiptapRenderer
              content={message.content}
              onSelection={handleSelection}
            />
          )}
          {message.model && !isUser && (
            <div className="mt-1.5 flex items-center gap-1.5 select-none">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 leading-tight">
                {message.model}
              </span>
            </div>
          )}
          {message.mergedFromSubDialogId && !isUser && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <button
                onClick={handleJumpToSubDialog}
                className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors"
              >
                ↩ 跳转子对话
              </button>
              {dialogs.find(d => d.id === message.mergedFromSubDialogId)?.mergeSnapshot && (
                <button
                  onClick={() => {
                    const subId = message.mergedFromSubDialogId
                    if (subId) useDialogStore.getState().undoMerge(subId)
                  }}
                  className="text-xs text-orange-500 hover:text-orange-700 hover:underline flex items-center gap-1 transition-colors"
                >
                  ↩️ 撤销合并
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {selectionInfo && !isUser && (
        <SelectionMenu
          selectedText={selectionInfo.text}
          rect={selectionInfo.rect}
          onClose={() => setSelectionInfo(null)}
          onSubDialog={handleSubDialog}
        />
      )}
    </>
  )
}
