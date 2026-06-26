import { useState, useRef, useEffect, useMemo } from 'react'
import type { Message } from '../../lib/types'
import { TiptapRenderer } from '../editor/TiptapRenderer'
import { SelectionMenu } from '../editor/SelectionMenu'
import type { SelectionResult } from '../../services/selectionEngine'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { useDialogStore } from '../../stores/dialogStore'
import { usePluginStore } from '../../stores/pluginStore'
import { useModelStore } from '../../stores/modelStore'
import { getTimestamp } from '../../lib/utils'
import { useTranslation } from '../../i18n'

interface Props {
  message: Message
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const locale = typeof navigator !== 'undefined' ? (navigator.language || 'en') : 'en'
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const { t } = useTranslation()
  const [selectionResult, setSelectionResult] = useState<SelectionResult | null>(null)
  const [editing, setEditing] = useState(false)
  const dialogs = useDialogStore(s => s.dialogs)
  const configs = useModelStore(s => s.configs)
  const enabledPlugins = usePluginStore(s => s.plugins.filter(p => s.enabled.has(p.id)))

  // Apply plugin onMessageRender hooks
  const renderedContent = useMemo(() => {
    if (!enabledPlugins.length) return message.content
    const ctx = { dialogs, configs }
    return enabledPlugins.reduce((text, p) => {
      if (p.hooks?.onMessageRender) return p.hooks.onMessageRender(text, ctx)
      return text
    }, message.content)
  }, [message.content, enabledPlugins, dialogs])
  const [editText, setEditText] = useState('')
  const editRef = useRef<HTMLTextAreaElement>(null)
  const openSubDialog = useSubDialogStore(s => s.open)
  const currentDialogId = useDialogStore(s => s.currentDialogId)

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.setSelectionRange(editText.length, editText.length)
    }
  }, [editing])

  const handleSelection = (result: SelectionResult) => {
    if (isUser) return
    setSelectionResult(result)
  }

  const handleSubDialog = (text: string, mode: string) => {
    setSelectionResult(null)
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

  const cancelEdit = () => setEditing(false)

  const showStreaming = message.status === 'streaming'
  const hasMerge = message.mergedFromSubDialogId && !isUser
  const mergedDialog = hasMerge ? dialogs.find(d => d.id === message.mergedFromSubDialogId) : null

  return (
    <>
      <div
        data-msg-id={message.id}
        className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'} mb-5 group message-enter`}
      >
        {/* Assistant avatar */}
        {!isUser && (
          <div className="shrink-0 mr-2.5 mb-0.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              AI
            </div>
          </div>
        )}

        <div className={`${isUser ? '' : ''} max-w-[90%] min-w-0`}>
          {/* Bubble */}
          <div
            className={`
              relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed
              ${isUser
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm shadow-md'
                : 'bg-white text-[#171717] rounded-bl-sm border border-[#f0eff5] shadow-sm'
              }
              ${showStreaming ? 'shadow-indigo-200/30' : ''}
              transition-shadow hover:shadow-md
            `}
          >
            {/* Edit button (user messages, hover) */}
            {isUser && !editing && message.status === 'complete' && (
              <button
                onClick={startEdit}
                className="absolute -left-9 top-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100
                           text-gray-400 hover:text-indigo-500 transition-all text-xs p-1
                           bg-white rounded-lg shadow-sm border border-gray-100
                           hover:border-indigo-200 hover:shadow-md"
                title={t('chat.bubble.edit')}
              >
                ✏️
              </button>
            )}

            {editing ? (
              <div className="space-y-2 min-w-[300px]">
                <textarea
                  ref={editRef}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); saveEdit() }
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  className="w-full bg-white text-gray-900 rounded-xl border border-indigo-200
                             px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2
                             focus:ring-indigo-400 focus:border-transparent shadow-sm"
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelEdit}
                    className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-700
                               hover:bg-gray-100 transition-colors font-medium">
                    {t('chat.bubble.cancel')}
                  </button>
                  <button onClick={saveEdit}
                    className="text-xs px-3 py-1.5 rounded-lg text-white font-medium shadow-sm
                               bg-gradient-to-r from-indigo-500 to-purple-600
                               hover:from-indigo-600 hover:to-purple-700 transition-all">
                    {t('chat.bubble.save')} <span className="opacity-70">⌘⏎</span>
                  </button>
                </div>
              </div>
            ) : isUser ? (
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/95">{message.content}</div>
            ) : (
              <div>
                <TiptapRenderer content={renderedContent} onSelection={handleSelection} />
              </div>
            )}

            {/* Bottom bar */}
            {!editing && (
              <div className={`flex items-center gap-2 mt-1.5 select-none flex-wrap ${
                isUser ? 'justify-end' : 'justify-start'
              }`}>
                {message.model && !isUser && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                   text-[10px] font-medium bg-indigo-50 text-indigo-600
                                   leading-tight border border-indigo-100/50">
                    {message.model}
                  </span>
                )}
                <span className={`text-[10px] ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
                  {formatTime(message.createdAt)}
                  {message.editedAt && t('chat.bubble.edited')}
                </span>
                {showStreaming && (
                  <span className="inline-flex items-center gap-[3px] px-1">
                    {[0, 0.2, 0.4].map(delay => (
                      <span key={delay}
                        className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse-dot"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Merge navigation link */}
          {hasMerge && (
            <div className="flex items-center gap-2 mt-1.5 px-1">
              <button onClick={handleJumpToSubDialog}
                className="text-[11px] text-indigo-500 hover:text-indigo-700 hover:underline
                           flex items-center gap-1 transition-colors font-medium">
                <span className="text-xs">↩</span> {t('chat.bubble.view_sub')}
              </button>
              {mergedDialog?.mergeSnapshot && (
                <button onClick={() => useDialogStore.getState().undoMerge(message.mergedFromSubDialogId!)}
                  className="text-[11px] text-amber-600 hover:text-amber-700 hover:underline
                             flex items-center gap-1 transition-colors font-medium">
                  <span className="text-xs">↩️</span> {t('chat.bubble.undo_merge')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* User avatar */}
        {isUser && (
          <div className="shrink-0 ml-2.5 mb-0.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700
                            flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              U
            </div>
          </div>
        )}
      </div>

      {selectionResult && !isUser && (
        <SelectionMenu
          selectionResult={selectionResult}
          onClose={() => setSelectionResult(null)}
          onSubDialog={handleSubDialog}
        />
      )}
    </>
  )
}
