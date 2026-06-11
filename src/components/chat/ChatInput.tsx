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
  const compareMode = useModelStore(s => s.compareMode)
  const selectedModelIds = useModelStore(s => s.selectedModelIds)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }, [input])

  /** Validate a model config and return decrypted API key */
  function validateAndGetKey(cfg: typeof configs[0]): string | null {
    const url = cfg.apiUrl.replace(/\/+$/, '')
    if (url.includes('platform.deepseek.com') || url.includes('chat.deepseek.com')) return null
    if (!url.match(/^https?:\/\/.+\..+/)) return null
    return getSessionKey(cfg.id) || null
  }

  /** Send to a single model and update its assistant message */
  async function callOneModel(
    dialogId: string,
    assistantId: string,
    cfg: typeof configs[0],
    apiKey: string,
    signal: AbortSignal,
  ) {
    const state = useDialogStore.getState()
    const dialog = state.dialogs.find((d: { id: string }) => d.id === dialogId)
    const ctx = dialog?.messages
      .filter((m: { id: string }) => m.id !== assistantId)
      .map((m: { role: string; content: string }) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })) || []

    await callModel({
      apiUrl: cfg.apiUrl, apiKey, model: cfg.modelName,
      messages: ctx, signal,
      onChunk: (t) => state.updateMessage(dialogId, assistantId, { content: t }),
      onDone: (t) => state.updateMessage(dialogId, assistantId, { content: t, status: 'complete' }),
    })
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !currentDialogId || sending) return
    setError(null)

    // Determine which models to use
    let targets: typeof configs = []
    if (compareMode && selectedModelIds.length > 0) {
      targets = selectedModelIds.map(id => configs.find(c => c.id === id)).filter(Boolean) as typeof configs
    } else {
      const cfg = configs.find(c => c.id === activeModelId)
      if (cfg) targets = [cfg]
    }
    if (targets.length === 0) {
      setError('请先在 ⚙️ 中配置 API Key')
      return
    }

    // Validate all targets
    const keyMap = new Map<string, string>()
    for (const cfg of targets) {
      const key = validateAndGetKey(cfg)
      if (!key) {
        setError(`${cfg.name}: API Key 无效或已过期，请在 ⚙️ 中重新配置`)
        return
      }
      keyMap.set(cfg.id, key)
    }

    // Add user message once
    addMessage(currentDialogId, {
      role: 'user', content: text,
      parentId: null, branchId: 'main', status: 'complete',
    })
    setInput('')

    // Create one assistant placeholder per model
    const assistants = targets.map(cfg => ({
      id: addMessage(currentDialogId, {
        role: 'assistant', content: '', parentId: null, branchId: 'main',
        status: 'streaming', model: cfg.name,
      }),
      cfg,
      key: keyMap.get(cfg.id)!,
    }))

    const controller = new AbortController()
    abortRef.current = controller
    setSending(true)

    try {
      await Promise.all(
        assistants.map(({ id, cfg, key }) =>
          callOneModel(currentDialogId, id, cfg, key, controller.signal)
            .catch((err: Error) => {
              if (err.name === 'AbortError') {
                updateMessage(currentDialogId, id, { content: '⚠️ 已取消', status: 'error' })
                return
              }
              updateMessage(currentDialogId, id, { content: `错误: ${err.message}`, status: 'error' })
              setError(`${cfg.name}: ${err.message}`)
            })
        ),
      )
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
              <div className="flex items-center gap-1.5 text-xs text-blue-400 mr-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse-soft" />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse-soft" style={{ animationDelay: '0.3s' }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse-soft" style={{ animationDelay: '0.6s' }} />
              </div>
            )}
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
