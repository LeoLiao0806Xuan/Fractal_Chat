import { useState, useEffect, useRef } from 'react'
import { useDialogStore } from '../../stores/dialogStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { useModelStore } from '../../stores/modelStore'
import { getSessionKey } from '../../services/crypto'
import { callModel } from '../../services/api'
import { useUsageStore } from '../../stores/usageStore'
import { buildConclusion, formatMergeContent, type MergeMode } from '../../lib/mergeUtils'
import { TiptapRenderer } from './TiptapRenderer'
import { SelectionMenu } from './SelectionMenu'
import type { SelectionResult } from '../../services/selectionEngine'
import { getTimestamp } from '../../lib/utils'
import { useTranslation } from '../../i18n'

export default function SubDialogPanel() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [showMerge, setShowMerge] = useState(false)
  const [sending, setSending] = useState(false)
  const [subError, setSubError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [selectionResult, setSelectionResult] = useState<SelectionResult | null>(null)
  const [selectionMessageId, setSelectionMessageId] = useState<string>('')

  const handleSubDialogFromSelection = (text: string, mode: string) => {
    if (!selectionMessageId || !subDialogId) return
    setSelectionResult(null)
    useSubDialogStore.getState().open(text, mode, selectionMessageId, subDialogId)
  }

  const dialogs = useDialogStore(s => s.dialogs)
  const createDialog = useDialogStore(s => s.createDialog)
  const addMessage = useDialogStore(s => s.addMessage)
  const updateMessage = useDialogStore(s => s.updateMessage)
  const { selectedText, mode, parentMessageId, parentDialogId, subDialogId, close, setSubDialogId } = useSubDialogStore()
  const isOpen = useSubDialogStore(s => s.isOpen)

  async function sendToAI(dialogId: string, assistantId: string, signal: AbortSignal) {
    const cfg = useModelStore.getState().configs.find(c => c.id === useModelStore.getState().activeModelId)
    if (!cfg) throw new Error(t('sub.no_key'))
    const key = getSessionKey(cfg.id)
    if (!key) throw new Error(t('sub.key_expired'))
    const state = useDialogStore.getState()
    const dialog = state.dialogs.find((d: { id: string }) => d.id === dialogId)
    const ctx = dialog?.messages
      .filter((m: { id: string }) => m.id !== assistantId)
      .map((m: { role: string; content: string }) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })) || []
    await callModel({ apiUrl: cfg.apiUrl, apiKey: key, model: cfg.modelName, messages: ctx, signal,
      onChunk: (t) => state.updateMessage(dialogId, assistantId, { content: t }),
      onDone: (t) => state.updateMessage(dialogId, assistantId, { content: t, status: 'complete' }),
      onUsage: (tokens) => useUsageStore.getState().recordUsage(cfg.id, cfg.name, cfg.modelName, tokens),
    })
  }

  useEffect(() => {
    if (!isOpen || !parentDialogId || subDialogId) return
    const existing = useDialogStore.getState().dialogs.find(d => d.parentDialogId === parentDialogId)
    if (existing) { setSubDialogId(existing.id); return }
    const parentDialog = dialogs.find(d => d.id === parentDialogId)
    const rootId = parentDialog?.rootDialogId || parentDialogId
    const shortTitle = selectedText.slice(0, 22).replace(/\n/g, ' ')
    const id = createDialog(shortTitle + (selectedText.length > 22 ? '…' : ''), parentDialogId, rootId, false)
    const modeLabel: Record<string, string> = { 'deep-dive': t('sub.deep_dive'), 'debug': t('sub.code_review'), 'ask-other': t('sub.switch_model'), 'anchor': t('sub.pin') }
    addMessage(id, { role: 'system', content: t('sub.system_prompt').replace('{mode}', modeLabel[mode] || t('sub.deep_dive')).replace('{text}', selectedText), parentId: null, branchId: 'main', status: 'complete' })
    if (parentMessageId) useDialogStore.getState().updateDialog(id, { contextAnchor: { messageId: parentMessageId, selectedText } })
    setSubDialogId(id)
  }, [isOpen, subDialogId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!subDialogId || !isOpen || (mode !== 'deep-dive' && mode !== 'debug')) return
    const dialog = useDialogStore.getState().dialogs.find(d => d.id === subDialogId)
    if (!dialog || dialog.messages.length > 1) return
    const autoContent = mode === 'debug'
      ? t('sub.auto_debug') + '\n\n' + selectedText
      : t('sub.auto_deep_dive') + '\n\n' + selectedText
    const autoController = new AbortController()
    abortRef.current = autoController
    addMessage(subDialogId, { role: 'user', content: autoContent, parentId: null, branchId: 'main', status: 'complete' })
    const aid = addMessage(subDialogId, { role: 'assistant', content: '', parentId: null, branchId: 'main', status: 'streaming', model: '' })
    sendToAI(subDialogId, aid, autoController.signal).catch((err: Error) => {
      useDialogStore.getState().updateMessage(subDialogId, aid, { content: `⚠️ ${err.message}`, status: 'error' })
    })
  }, [subDialogId, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const subDialog = dialogs.find(d => d.id === subDialogId)
  const messages = subDialog?.messages || []
  const visibleMessages = messages.filter(m => m.role !== 'system')
  const hasContent = visibleMessages.length > 0

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !subDialogId || sending) return
    setSubError(null)
    const cfg = useModelStore.getState().configs.find(c => c.id === useModelStore.getState().activeModelId)
    if (!cfg) { setSubError(t('sub.no_key')); return }
    const key = getSessionKey(cfg.id)
    if (!key) { setSubError(t('sub.key_expired_short')); return }
    addMessage(subDialogId, { role: 'user', content: text, parentId: null, branchId: 'main', status: 'complete' })
    setInput('')
    const assistantId = addMessage(subDialogId, { role: 'assistant', content: '', parentId: null, branchId: 'main', status: 'streaming', model: cfg.name })
    const controller = new AbortController()
    abortRef.current = controller
    setSending(true)
    try { await sendToAI(subDialogId, assistantId, controller.signal) }
    catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') { updateMessage(subDialogId, assistantId, { content: t('sub.cancelled'), status: 'error' }); return }
      updateMessage(subDialogId, assistantId, { content: `⚠️ ${(err as Error).message}`, status: 'error' })
    } finally { setSending(false); if (abortRef.current === controller) abortRef.current = null }
  }

  const handleCancel = () => abortRef.current?.abort()

  const handleMerge = (mergeMode: MergeMode) => {
    if (!subDialog || !parentDialogId) return
    let targetMsgId = parentMessageId
    if (!targetMsgId && subDialog.contextAnchor?.messageId) targetMsgId = subDialog.contextAnchor.messageId
    if (!targetMsgId) {
      const pd = dialogs.find(d => d.id === parentDialogId)
      const ref = pd?.messages.find(m => m.mergedFromSubDialogId === subDialogId)
      if (ref) targetMsgId = ref.id
    }
    if (!targetMsgId) return
    const conclusion = buildConclusion(subDialog)
    if (mergeMode === 'replace' || mergeMode === 'footnote') {
      const parentDialog = dialogs.find(d => d.id === parentDialogId)
      const parentMsg = parentDialog?.messages.find(m => m.id === targetMsgId)
      if (parentMsg && subDialogId) {
        useDialogStore.getState().updateDialog(subDialogId, { mergeSnapshot: { parentMessageId: targetMsgId, originalContent: parentMsg.content, originalTitle: subDialog.title, mergeMode, mergedAt: getTimestamp() } })
        updateMessage(parentDialogId, targetMsgId, { content: parentMsg.content + formatMergeContent(conclusion, mergeMode), mergedFromSubDialogId: subDialogId })
      }
    } else if (targetMsgId && subDialogId) {
      const parentDialog = dialogs.find(d => d.id === parentDialogId)
      const parentMsg = parentDialog?.messages.find(m => m.id === targetMsgId)
      useDialogStore.getState().updateDialog(subDialogId, { mergeSnapshot: { parentMessageId: targetMsgId, originalContent: parentMsg?.content || '', originalTitle: subDialog.title, mergeMode, mergedAt: getTimestamp() } })
    }
    if (subDialogId) {
      const labels: Record<MergeMode, string> = { replace: t('sub.replaced'), footnote: t('sub.appended'), 'keep-child': t('sub.kept') }
      const cleanTitle = subDialog.title.replace(/^[✏️📎🌿]\s*/, '')
      useDialogStore.getState().updateDialogTitle(subDialogId, `${labels[mergeMode]}: ${cleanTitle}`)
    }
    setShowMerge(false); close()
  }

  const modeIcon: Record<string, string> = { 'deep-dive': '🔍', 'debug': '🐛', 'ask-other': '🤖', 'anchor': '📌' }
  const modeTitle: Record<string, string> = { 'deep-dive': t('sub.deep_dive'), 'debug': t('sub.code_review'), 'ask-other': t('sub.switch_model'), 'anchor': t('sub.pin') }

  if (!isOpen) return null

  return (
    <>
      <div className="w-[420px] border-l border-[#f0eff5] bg-white flex flex-col h-full animate-slide-in-right shadow-[-4px_0_16px_rgba(0,0,0,0.03)]">
        {/* Header */}
        <div className="shrink-0 px-4 py-3.5 border-b border-[#f0eff5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500
                         flex items-center justify-center text-white text-sm shadow-sm">
              {modeIcon[mode] || '💬'}
            </span>
            <div className="min-w-0">
              <span className="font-semibold text-sm text-[#171717] truncate block">{modeTitle[mode] || t('sub.title')}</span>
              <span className="text-[10px] text-[#a3a3a3] truncate block max-w-[200px]">「{selectedText.slice(0, 30)}…」</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasContent && !sending && (
              <button onClick={() => setShowMerge(true)}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700
                           px-2.5 py-1.5 rounded-lg font-medium transition-colors
                           border border-emerald-200/50 hover:border-emerald-300 shadow-sm">
                {t('sub.merge_back')}
              </button>
            )}
            <button onClick={close} className="text-[#a3a3a3] hover:text-[#52525b] p-1.5 rounded-lg hover:bg-[#f8f7fc] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Context */}
        <div className="shrink-0 px-4 py-2.5 border-b border-[#f8f7fc] bg-gradient-to-r from-amber-50/30 to-transparent">
          <div className="flex items-start gap-2">
            <span className="text-xs text-amber-400 mt-0.5 shrink-0">📎</span>
            <div className="text-xs text-[#737373] leading-relaxed line-clamp-2 min-w-0 italic">
              <span className="text-[#d4d4d8]">「</span>{selectedText}<span className="text-[#d4d4d8]">」</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {!hasContent ? (
            <div className="flex items-center justify-center h-full text-[#a3a3a3]">
              <div className="text-center">
                <div className="text-2xl mb-2 opacity-50">💬</div>
                <p className="text-xs">{t('sub.placeholder')}</p>
              </div>
            </div>
          ) : (
            visibleMessages.map(msg => (
              <div key={msg.id} data-msg-id={msg.id} data-dialog-id={subDialogId}
                   className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} message-enter`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
                                  bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 bg-white text-[#171717]
                                  border border-[#f0eff5] text-sm leading-relaxed rounded-bl-sm shadow-sm">
                    <TiptapRenderer content={msg.content || (msg.status === 'streaming' ? '...' : '')}
                      onSelection={r => { setSelectionResult(r); setSelectionMessageId(msg.id) }} />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex items-center justify-center gap-1.5 py-3 text-indigo-400 text-xs">
              {[0, 0.2, 0.4].map(d => (
                <span key={d} className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse-dot"
                      style={{ animationDelay: `${d}s` }} />
              ))}
              <span className="ml-1 text-[#a3a3a3]">{t('sub.generating')}</span>
            </div>
          )}
        </div>

        {/* Error */}
        {subError && (
          <div className="shrink-0 px-4 py-2.5 bg-red-50/90 backdrop-blur-sm border-t border-red-200/60
                          flex items-center gap-2 text-sm animate-fade-in">
            <span className="text-red-500 shrink-0">⚠️</span>
            <span className="text-red-700 text-xs flex-1">{subError}</span>
            <button onClick={() => setSubError(null)}
              className="text-red-400 hover:text-red-600 shrink-0 text-xs font-medium
                         bg-red-100/50 hover:bg-red-200/50 rounded-lg px-1.5 py-0.5 transition-colors">✕</button>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 p-4 border-t border-[#f0eff5] bg-white">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={sending ? t('sub.waiting') : t('sub.placeholder')} disabled={sending}
              className="flex-1 rounded-xl border border-[#e4e3ed] bg-[#f8f7fc] px-3.5 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-400/40
                         focus:border-indigo-400 focus:bg-white
                         disabled:bg-gray-50 disabled:cursor-not-allowed transition-all
                         placeholder:text-[#a3a3a3]" />
            {sending ? (
              <button onClick={handleCancel}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-3.5 py-2.5
                           text-sm font-medium transition-all shadow-sm shrink-0">✕</button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim()}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl
                           px-4 py-2.5 text-sm font-medium hover:from-indigo-600 hover:to-purple-700
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm
                           active:scale-[0.97] shrink-0">{t('chat.input.send')}</button>
            )}
          </div>
        </div>
      </div>

      {/* Merge dialog */}
      {showMerge && subDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm"
             onClick={() => setShowMerge(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[480px] animate-fade-in-scale"
               onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#f0eff5]">
              <h3 className="font-semibold text-base text-[#171717]">{t('sub.merge_back')}</h3>
              <p className="text-xs text-[#737373] mt-1">
                {t('sub.merge_to')}「{dialogs.find(d => d.id === parentDialogId)?.title || t('sub.parent')}」
              </p>
            </div>
            {subDialog.messages.length > 1 && (
              <div className="px-5 py-3.5 border-b border-[#f8f7fc] bg-gradient-to-r from-gray-50/50 to-transparent">
                <div className="text-[11px] text-[#737373] mb-1.5 font-medium">{t('sub.preview')}</div>
                <div className="text-xs text-[#52525b] bg-white rounded-xl p-3 border border-[#f0eff5]
                                max-h-24 overflow-y-auto leading-relaxed whitespace-pre-wrap shadow-sm">
                  {buildConclusion(subDialog)}
                </div>
              </div>
            )}
            <div className="p-5 space-y-2.5">
              {([
                { mode: 'footnote' as MergeMode, title: t('sub.footnote'), desc: t('sub.footnote_desc'), rec: true },
                { mode: 'replace' as MergeMode, title: t('sub.replace'), desc: t('sub.replace_desc'), rec: false },
                { mode: 'keep-child' as MergeMode, title: t('sub.mark'), desc: t('sub.mark_desc'), rec: false },
              ]).map(({ mode: m, title, desc, rec }) => (
                <button key={m} onClick={() => handleMerge(m)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all
                    ${rec
                      ? 'border-2 border-indigo-500 bg-indigo-50/80 shadow-sm hover:shadow-md'
                      : 'border border-[#e4e3ed] hover:border-gray-300 hover:bg-gray-50/50'
                    }`}>
                  <div className="font-medium text-sm text-[#171717]">{title} {rec && <span className="text-indigo-400 font-normal">{t('sub.recommended')}</span>}</div>
                  <div className="text-xs text-[#737373] mt-1">{desc}</div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-[#f0eff5] flex justify-end">
              <button onClick={() => setShowMerge(false)}
                className="px-4 py-2 text-sm text-[#737373] hover:text-[#171717] rounded-xl
                           hover:bg-[#f8f7fc] transition-colors font-medium">{t('chat.bubble.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {selectionResult && (
        <SelectionMenu selectionResult={selectionResult}
          onClose={() => setSelectionResult(null)}
          onSubDialog={handleSubDialogFromSelection} />
      )}
    </>
  )
}
