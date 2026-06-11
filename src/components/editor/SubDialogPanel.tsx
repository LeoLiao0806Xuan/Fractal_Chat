import { useState, useEffect, useRef } from 'react'
import { useDialogStore } from '../../stores/dialogStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { useModelStore } from '../../stores/modelStore'
import { getSessionKey } from '../../services/crypto'
import { callModel } from '../../services/api'
import { buildConclusion, formatMergeContent, type MergeMode } from '../../lib/mergeUtils'
import { TiptapRenderer } from './TiptapRenderer'
import { SelectionMenu } from './SelectionMenu'
import { getTimestamp } from '../../lib/utils'

export default function SubDialogPanel() {
  const [input, setInput] = useState('')
  const [showMerge, setShowMerge] = useState(false)
  const [sending, setSending] = useState(false)
  const [subError, setSubError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Selection → nested sub-dialog
  const [selectionInfo, setSelectionInfo] = useState<{ text: string; rect: DOMRect; messageId: string } | null>(null)

  const handleSubDialogFromSelection = (text: string, mode: string) => {
    if (!selectionInfo || !subDialogId) return
    setSelectionInfo(null)
    // Open a nested sub-dialog under the current sub-dialog
    useSubDialogStore.getState().open(text, mode, selectionInfo.messageId, subDialogId)
  }

  const dialogs = useDialogStore(s => s.dialogs)
  const createDialog = useDialogStore(s => s.createDialog)
  const addMessage = useDialogStore(s => s.addMessage)
  const updateMessage = useDialogStore(s => s.updateMessage)
  const configs = useModelStore(s => s.configs)
  const activeModelId = useModelStore(s => s.activeModelId)

  const { selectedText, mode, parentMessageId, parentDialogId, subDialogId, close, setSubDialogId } = useSubDialogStore()
  const isOpen = useSubDialogStore(s => s.isOpen)

  // Create sub-dialog when panel opens
  useEffect(() => {
    if (!isOpen || !parentDialogId || subDialogId) return

    // Guard: check if a dialog for this parent already exists (handles StrictMode)
    const existing = useDialogStore.getState().dialogs.find((d: { parentDialogId: string | null; messages: { role: string }[] }) =>
      d.parentDialogId === parentDialogId &&
      !d.messages.some((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
    )
    if (existing) {
      setSubDialogId(existing.id)
      return
    }

    const parentDialog = dialogs.find(d => d.id === parentDialogId)
    const rootId = parentDialog?.rootDialogId || parentDialogId
    const modeLabels: Record<string, string> = {
      'deep-dive': '深入探讨',
      'debug': '代码调试',
      'ask-other': '换模型追问',
      'anchor': '锚定引用',
    }
    const modeLabel = modeLabels[mode] || '深入探讨'
    const shortTitle = selectedText.slice(0, 22).replace(/\n/g, ' ')
    const id = createDialog(
      shortTitle + (selectedText.length > 22 ? '…' : ''),
      parentDialogId,
      rootId,
      false,
    )
    addMessage(id, {
      role: 'system',
      content: `基于选中内容${modeLabel}：「${selectedText}」`,
      parentId: null,
      branchId: 'main',
      status: 'complete',
    })
    // Store anchor info so merge works from main area too
    if (parentMessageId) {
      useDialogStore.getState().updateDialog(id, {
        contextAnchor: { messageId: parentMessageId, selectedText },
      })
    }
    setSubDialogId(id)
  }, [isOpen, subDialogId]) // eslint-disable-line react-hooks/exhaustive-deps

  const subDialog = dialogs.find(d => d.id === subDialogId)
  const messages = subDialog?.messages || []
  const visibleMessages = messages.filter(m => m.role !== 'system')
  const hasContent = visibleMessages.length > 0

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !subDialogId || sending) return
    setSubError(null)

    const activeConfig = configs.find(c => c.id === activeModelId)
    if (!activeConfig) {
      setSubError('请先在 ⚙️ 中配置 API Key')
      return
    }

    const apiKey = getSessionKey(activeConfig.id)
    if (!apiKey) {
      setSubError('API Key 已过期，请在 ⚙️ 中重新配置')
      return
    }

    // Add user message
    addMessage(subDialogId, {
      role: 'user', content: text,
      parentId: null, branchId: 'main', status: 'complete',
    })
    setInput('')

    // Create placeholder
    const assistantId = addMessage(subDialogId, {
      role: 'assistant', content: '',
      parentId: null, branchId: 'main', status: 'streaming',
      model: activeConfig.name,
    })

    const controller = new AbortController()
    abortRef.current = controller
    setSending(true)

    try {
      const freshState = useDialogStore.getState()
      const dialog = freshState.dialogs.find((d: { id: string | null }) => d.id === subDialogId)
      const contextMessages = dialog?.messages
        .filter((m: { id: string }) => m.id !== assistantId)
        .map((m: { role: string; content: string }) => ({
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
        })) || []

      await callModel({
        apiUrl: activeConfig.apiUrl,
        apiKey,
        model: activeConfig.modelName,
        messages: contextMessages,
        signal: controller.signal,
        onChunk: (fullText) => {
          updateMessage(subDialogId, assistantId, { content: fullText })
        },
        onDone: (fullText) => {
          updateMessage(subDialogId, assistantId, { content: fullText, status: 'complete' })
        },
      })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        updateMessage(subDialogId, assistantId, { content: '⚠️ 已取消', status: 'error' })
        return
      }
      const msg = err instanceof Error ? err.message : '调用失败'
      updateMessage(subDialogId, assistantId, { content: `错误: ${msg}`, status: 'error' })
    } finally {
      setSending(false)
      if (abortRef.current === controller) abortRef.current = null
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
  }

  const handleMerge = (mergeMode: MergeMode) => {
    if (!subDialog || !parentDialogId) return

    // Find parentMessageId: from store, contextAnchor, or parent dialog references
    let targetMsgId = parentMessageId
    if (!targetMsgId && subDialog.contextAnchor?.messageId) {
      targetMsgId = subDialog.contextAnchor.messageId
    }
    if (!targetMsgId) {
      const pd = dialogs.find(d => d.id === parentDialogId)
      const ref = pd?.messages.find(m => m.mergedFromSubDialogId === subDialogId)
      if (ref) targetMsgId = ref.id
    }
    if (!targetMsgId) return // can't find parent message

    const conclusion = buildConclusion(subDialog)

    if (mergeMode === 'replace' || mergeMode === 'footnote') {
      const parentDialog = dialogs.find(d => d.id === parentDialogId)
      const parentMsg = parentDialog?.messages.find(m => m.id === targetMsgId)
      if (parentMsg && subDialogId) {
        // Save snapshot for undo BEFORE modifying
        useDialogStore.getState().updateDialog(subDialogId, {
          mergeSnapshot: {
            parentMessageId: targetMsgId,
            originalContent: parentMsg.content,
            originalTitle: subDialog.title,
            mergeMode,
            mergedAt: getTimestamp(),
          },
        })
        updateMessage(parentDialogId, targetMsgId, {
          content: parentMsg.content + formatMergeContent(conclusion, mergeMode),
          mergedFromSubDialogId: subDialogId,
        })
      }
    } else if (targetMsgId) {
      // keep-child: save snapshot with no content change
      if (subDialogId) {
        useDialogStore.getState().updateDialog(subDialogId, {
          mergeSnapshot: {
            parentMessageId: targetMsgId,
            originalContent: '',
            originalTitle: subDialog.title,
            mergeMode,
            mergedAt: getTimestamp(),
          },
        })
      }
    }

    if (subDialogId) {
      const labels: Record<MergeMode, string> = {
        replace: '✏️ 已替换',
        footnote: '📎 已追加',
        'keep-child': '🌿 已保留',
      }
      useDialogStore.getState().updateDialogTitle(subDialogId, `${labels[mergeMode]}: ${subDialog.title}`)
    }

    setShowMerge(false)
    close()
  }

  const modeIcon: Record<string, string> = {
    'deep-dive': '🔍', 'debug': '🐛', 'ask-other': '🤖', 'anchor': '📌',
  }
  const modeTitle: Record<string, string> = {
    'deep-dive': '深入探讨', 'debug': 'Code Debug',
    'ask-other': '追问其他模型', 'anchor': '锚定引用',
  }

  if (!isOpen) return null

  return (
    <>
      <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col h-full animate-slide-in-right">
        {/* Header */}
        <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span>{modeIcon[mode] || '💬'}</span>
            <span className="font-medium text-sm truncate">{modeTitle[mode] || '子对话'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasContent && !sending && (
              <button onClick={() => setShowMerge(true)}
                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                🔀 合并回主干
              </button>
            )}
            <button onClick={close} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Breadcrumb: parent → sub-dialog */}
        {parentDialogId && (() => {
          const parent = dialogs.find(d => d.id === parentDialogId)
          return parent ? (
            <div className="px-3 py-1.5 border-b border-gray-200 bg-gray-50 text-xs text-gray-500 shrink-0 flex items-center gap-1">
              <span className="truncate max-w-[120px]">{parent.title}</span>
              <span className="text-gray-300">→</span>
              <span className="text-blue-600 font-medium truncate">{modeTitle[mode] || '子对话'}</span>
            </div>
          ) : null
        })()}

        {/* Context reference */}
        <div className="px-3 py-2 border-b border-gray-100 shrink-0">
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 mt-0.5 shrink-0">📎</span>
            <div className="text-xs text-gray-500 leading-relaxed line-clamp-3 min-w-0">
              <span className="text-gray-400">「</span>{selectedText}<span className="text-gray-400">」</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {!hasContent ? (
            <div className="text-center text-gray-400 text-sm py-8">在下方输入开始子对话</div>
          ) : (
            visibleMessages.map(msg => (
              <div key={msg.id} data-msg-id={msg.id} data-dialog-id={subDialogId} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap bg-blue-600 text-white">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-xl px-3 py-2 bg-white text-gray-900 border border-gray-200 text-sm">
                    <TiptapRenderer
                      content={msg.content || (msg.status === 'streaming' ? '...' : '')}
                      onSelection={(text, rect) => setSelectionInfo({ text, rect, messageId: msg.id })}
                    />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && <div className="text-xs text-blue-500 text-center animate-pulse">AI 回复中...</div>}
        </div>

        {/* Error banner */}
        {subError && (
          <div className="shrink-0 px-3 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2 text-sm">
            <span className="text-red-500 shrink-0">⚠️</span>
            <span className="text-red-700 text-xs flex-1">{subError}</span>
            <button onClick={() => setSubError(null)} className="text-red-400 hover:text-red-600 shrink-0 text-xs">✕</button>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-200 bg-white shrink-0">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={sending ? '等待回复...' : '输入消息...'}
              disabled={sending}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
            {sending ? (
              <button onClick={handleCancel}
                className="bg-red-500 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-red-600 transition-colors shrink-0">
                取消
              </button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim()}
                className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0">
                发送
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Merge Dialog */}
      {showMerge && subDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowMerge(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[460px]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-base">🔀 合并回主干</h3>
              <p className="text-xs text-gray-500 mt-1">
                将子对话的结论合并到「{dialogs.find(d => d.id === parentDialogId)?.title || '父对话'}」中
              </p>
            </div>

            {/* Preview of the conclusion text */}
            {(subDialog.messages.length > 1) && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-500 mb-1.5">📝 结论预览：</div>
                <div className="text-xs text-gray-700 bg-white rounded-lg p-2.5 border border-gray-200 max-h-24 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {buildConclusion(subDialog)}
                </div>
              </div>
            )}

            <div className="p-4 space-y-2">
              <button onClick={() => handleMerge('footnote')}
                className="w-full text-left p-3 rounded-xl border border-blue-500 bg-blue-50 ring-2 ring-blue-200">
                <div className="font-medium text-sm">📎 追加脚注 <span className="text-gray-400 font-normal">(推荐)</span></div>
                <div className="text-xs text-gray-500 mt-1">子对话结论以引用块追加到原文末尾</div>
              </button>
              <button onClick={() => handleMerge('replace')}
                className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-gray-300">
                <div className="font-medium text-sm">✏️ 替换原文</div>
                <div className="text-xs text-gray-500 mt-1">用讨论的结论替换你选中的那段文本</div>
              </button>
              <button onClick={() => handleMerge('keep-child')}
                className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-gray-300">
                <div className="font-medium text-sm">🌿 仅标记合并</div>
                <div className="text-xs text-gray-500 mt-1">不修改内容，只在对话树标记「已合并」</div>
              </button>
            </div>
            <div className="p-3 border-t border-gray-200 flex justify-end">
              <button onClick={() => setShowMerge(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection menu for nested sub-dialog creation */}
      {selectionInfo && (
        <SelectionMenu
          selectedText={selectionInfo.text}
          rect={selectionInfo.rect}
          onClose={() => setSelectionInfo(null)}
          onSubDialog={handleSubDialogFromSelection}
        />
      )}
    </>
  )
}
