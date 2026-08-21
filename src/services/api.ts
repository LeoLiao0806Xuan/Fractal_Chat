import {
  parseAnthropicSse,
  parseOpenAICompatibleSse,
} from '../infrastructure/providers/sse'

// ── Unified API layer for Fractal Chat ──
// Supports OpenAI-compatible and Anthropic APIs with CORS-safe proxy fallback.

export interface ModelCallOptions {
  apiUrl: string
  apiKey: string
  model: string
  messages: { role: string; content: string }[]
  onChunk?: (text: string) => void
  onDone?: (fullText: string) => void
  onError?: (error: Error) => void
  /** Called when token usage is available from the API response */
  onUsage?: (totalTokens: number) => void
  signal?: AbortSignal
}

// ── CORS-safe fetch: try direct → fallback to local Vite proxy ──
async function smartFetch(
  targetUrl: string,
  extraHeaders: Record<string, string>,
  bodyStr: string,
  signal?: AbortSignal,
): Promise<Response> {
  // Try 1: Direct browser fetch
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: bodyStr,
      signal,
    })
    return res // any status — caller handles non-ok
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    console.warn('[api] Direct fetch failed (CORS?), trying proxy:', (err as Error)?.message)
  }

  // Try 2: Local Vite dev-server proxy
  const proxyRes = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetUrl,
      extraHeaders, // proxy will forward these directly
      payload: JSON.parse(bodyStr),
    }),
    signal,
  })
  if (!proxyRes.ok) {
    const text = await proxyRes.text().catch(() => '')
    const snippet = text
      ? text.slice(0, 300).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : '(empty body)'
    if (proxyRes.status === 429 || proxyRes.status === 403) {
      throw new Error(`API returned ${proxyRes.status}: ${snippet}`)
    }
    throw new Error(`API 返回 ${proxyRes.status}: ${snippet}`)
  }
  return proxyRes
}

// ── OpenAI-compatible API streaming ──
export async function callOpenAICompatible(options: ModelCallOptions): Promise<string> {
  const { apiUrl, apiKey, model, messages, onChunk, onDone, onError, signal } = options
  try {
    const baseUrl = apiUrl.replace(/\/+$/, '')
    // Avoid double /v1 if user already included it
    const url = baseUrl.match(/\/v1$/) ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`
    const body = JSON.stringify({ model, messages, stream: true })

    const response = await smartFetch(
      url,
      { 'Authorization': `Bearer ${apiKey}` },
      body,
      signal,
    )
    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      throw new Error(`API error ${response.status}: ${errBody || response.statusText}`)
    }
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Response body not readable')

    const { text: fullText, usage } = await parseOpenAICompatibleSse(reader, onChunk)
    if (usage != null) options.onUsage?.(usage)
    onDone?.(fullText)
    return fullText
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    onError?.(error)
    throw error
  }
}

// ── Anthropic API streaming ──
export async function callAnthropic(options: ModelCallOptions): Promise<string> {
  const { apiUrl, apiKey, model, messages, onChunk, onDone, onError, signal } = options
  try {
    const baseUrl = apiUrl.replace(/\/+$/, '')
    const url = baseUrl.match(/\/v1$/) ? `${baseUrl}/messages` : `${baseUrl}/v1/messages`

    // Convert messages to Anthropic format (system separate)
    const systemMessages = messages.filter(m => m.role === 'system')
    const conversationMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }))

    const bodyObj: Record<string, unknown> = {
      model,
      messages: conversationMessages,
      max_tokens: 4096,
      stream: true,
    }
    if (systemMessages.length > 0) {
      bodyObj.system = systemMessages.map(m => m.content).join('\n')
    }

    const response = await smartFetch(
      url,
      { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      JSON.stringify(bodyObj),
      signal,
    )
    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      throw new Error(`Anthropic API error ${response.status}: ${errBody || response.statusText}`)
    }
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Response body not readable')

    const { text: fullText, usage } = await parseAnthropicSse(reader, onChunk)
    if (usage != null) options.onUsage?.(usage)
    onDone?.(fullText)
    return fullText
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    onError?.(error)
    throw error
  }
}

// ── Auto-detect provider and call ──
export function callModel(options: ModelCallOptions): Promise<string> {
  const url = options.apiUrl.toLowerCase()
  // Anthropic API detection
  if (url.includes('anthropic') || url.includes('claude')) {
    return callAnthropic(options)
  }
  // Default: OpenAI-compatible (works for OpenAI, DeepSeek, Gemini, etc.)
  return callOpenAICompatible(options)
}
