import { useState, useRef, useEffect } from 'react'
import type { Message } from '../../lib/types'
import { TiptapRenderer } from '../editor/TiptapRenderer'
import { SelectionMenu } from '../editor/SelectionMenu'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { useDialogStore } from '../../stores/dialogStore'
import { getTimestamp } from '../../lib/utils'

interface Props {
  message: Message
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const [selectionInfo, setSelectionInfo] = useState<{ text: string; rect: DOMRect } | null>(null)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const editRef = useRef<HTMLTextAreaElement>(null)
  const openSubDialog = useSubDialogStore(s => s.open)
  const currentDialogId = useDialogStore(s => s.currentDialogId)
  const dialogs = useDialogStore(s => s.dialogs)

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.setSelectionRange(editText.length, editText.length)
    }
  }, [editing])

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
      useSubDialogStore.getState().reopen(message.mergedFromSubDialogId, currentDialogId, message.id)
    }
  }

  const startEdit = () => {
    setEditText(message.content)
    setEditing(true)
  }

  const saveEdit = () => {
    if (currentDialogId && editText.trim() && editText !== message.content) {
      useDialogStore.getState().updateMessage(currentDialogId, message.id, {
        content: editText.trim(),
        editedAt: getTimestamp(),
      })
    }
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditing(false)
  }

  return (
    <>
      <div data-msg-id={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 relative group`}>
        <div
          className={`
            max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed relative
            ${isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }
            ${message.status === 'streaming' ? 'animate-pulse' : ''}
          `}
        >
          {/* Edit button (user messages only, on hover) */}
          {isUser && !editing && message.status === 'complete' && (
            <button
              onClick={startEdit}
              className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all text-xs p-1"
              title="编辑消息"
            >
              ✏️
            </button>
          )}

          {editing ? (
            <div className="space-y-2">
              <textarea
                ref={editRef}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); saveEdit() }
                  if (e.key === 'Escape') cancelEdit()
                }}
                className="w-full bg-white text-gray-900 rounded-lg border border-blue-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={cancelEdit}
                  className="text-xs px-2.5 py-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                  取消
                </button>
                <button onClick={saveEdit}
                  className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  保存
                </button>
              </div>
            </div>
          ) : isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <TiptapRenderer
              content={message.content}
              onSelection={handleSelection}
            />
          )}

          {/* Model badge */}
          {message.model && !isUser && (
            <div className="mt-1.5 flex items-center gap-1.5 select-none">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 leading-tight">
                {message.model}
              </span>
            </div>
          )}

          {/* Timestamp + edited indicator */}
          <div className={`flex items-center gap-2 mt-1 select-none ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] opacity-50 text-inherit">
              {formatTime(message.createdAt)}
              {message.editedAt && ' · 已编辑'}
            </span>
          </div>

          {/* Merge navigation */}
          {message.mergedFromSubDialogId && !isUser && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <button onClick={handleJumpToSubDialog}
                className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors">
                ↩ 跳转子对话
              </button>
              {dialogs.find(d => d.id === message.mergedFromSubDialogId)?.mergeSnapshot && (
                <button onClick={() => {
                  const subId = message.mergedFromSubDialogId
                  if (subId) useDialogStore.getState().undoMerge(subId)
                }}
                  className="text-xs text-orange-500 hover:text-orange-700 hover:underline flex items-center gap-1 transition-colors">
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
