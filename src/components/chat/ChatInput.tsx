import { useState, useRef, useEffect } from 'react'
import { useDialogStore } from '../../stores/dialogStore'
import { useModelStore } from '../../stores/modelStore'
import { getSessionKey } from '../../services/crypto'
import { callModel } from '../../services/api'
import { ModelSelector } from '../model/ModelSelector'

export function ChatInput() {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const currentDialogId = useDialogStore(s => s.currentDialogId)
  const addMessage = useDialogStore(s => s.addMessage)
  const updateMessage = useDialogStore(s => s.updateMessage)
  const configs = useModelStore(s => s.configs)
  const activeModelId = useModelStore(s => s.activeModelId)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !currentDialogId || sending) return
    setError(null)

    const activeConfig = configs.find(c => c.id === activeModelId)
    if (!activeConfig || !activeConfig.apiKey) {
      setError('请先在 ⚙️ 中配置 API Key')
      return
    }

    // Validate API URL
    const apiUrl = activeConfig.apiUrl.replace(/\/+$/, '')
    if (apiUrl.includes('platform.deepseek.com') || apiUrl.includes('chat.deepseek.com')) {
      setError('API URL 填的是网站地址，应该填 api.deepseek.com（API 接口地址）')
      return
    }
    if (!apiUrl.match(/^https?:\/\/.+\..+/)) {
      setError('API URL 格式不正确，应以 https:// 开头')
      return
    }

    // 1. Add user message
    addMessage(currentDialogId, {
      role: 'user',
      content: text,
      parentId: null,
      branchId: 'main',
      status: 'complete',
    })
    setInput('')

    // 2. Create placeholder assistant message
    const assistantId = addMessage(currentDialogId, {
      role: 'assistant',
      content: '',
      parentId: null,
      branchId: 'main',
      status: 'streaming',
      model: activeConfig.name,
    })

    abortRef.current = new AbortController()
    setSending(true)

    try {
      // 3. Get decrypted API key from session memory
      const apiKey = getSessionKey(activeConfig.id)
      if (!apiKey) {
        throw new Error('API Key 已从会话中过期，请在 ⚙️ 中重新配置')
      }

      // 4. Build message context — use getState() for fresh data
      const freshState = useDialogStore.getState()
      const dialog = freshState.dialogs.find(d => d.id === currentDialogId)
      const contextMessages = dialog?.messages
        .filter(m => m.id !== assistantId)
        .map(m => ({
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
        })) || []

      if (contextMessages.length === 0) {
        throw new Error('没有消息可发送，请检查对话框状态')
      }

      // 5. Call API via unified layer (auto-detects provider, CORS-safe)
      await callModel({
        apiUrl: activeConfig.apiUrl,
        apiKey,
        model: activeConfig.modelName,
        messages: contextMessages,
        signal: abortRef.current.signal,
        onChunk: (fullText) => {
          updateMessage(currentDialogId, assistantId, { content: fullText })
        },
        onDone: (fullText) => {
          updateMessage(currentDialogId, assistantId, { content: fullText, status: 'complete' })
        },
      })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        updateMessage(currentDialogId, assistantId, {
          content: '⚠️ 已取消发送',
          status: 'error',
        })
        return
      }
      const msg = err instanceof Error ? err.message : '调用失败'
      updateMessage(currentDialogId, assistantId, {
        content: `错误: ${msg}`,
        status: 'error',
      })
      setError(msg)
    } finally {
      setSending(false)
      abortRef.current = null
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!currentDialogId) return null

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Model selector bar */}
        <div className="flex items-center justify-between">
          <ModelSelector />
          <div className="flex items-center gap-2">
            {sending && (
              <button onClick={handleCancel}
                className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors">
                取消
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm">
            <span className="text-red-500 shrink-0">⚠️</span>
            <span className="text-red-700 flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">✕</button>
          </div>
        )}

        {/* Input area */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium
                       hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors"
          >
            {sending ? '...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  )
}
