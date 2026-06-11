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
      throw new Error(`API 提供方拒绝了代理请求(${proxyRes.status})。建议换用 OpenAI 或检查 API Key 是否有效。`)
    }
    throw new Error(`API 返回 ${proxyRes.status}: ${snippet}`)
  }
  return proxyRes
}

// ── Parse OpenAI-compatible SSE event stream ──
async function parseOpenAISSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk?: (full: string) => void,
): Promise<string> {
  const decoder = new TextDecoder()
  let fullText = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
    for (const line of lines) {
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content || ''
        if (content) {
          fullText += content
          onChunk?.(fullText)
        }
      } catch { /* skip malformed JSON chunks */ }
    }
  }
  return fullText
}

// ── Parse Anthropic SSE event stream ──
async function parseAnthropicSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk?: (full: string) => void,
): Promise<string> {
  const decoder = new TextDecoder()
  let fullText = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line.slice(6))
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          fullText += parsed.delta.text
          onChunk?.(fullText)
        }
      } catch { /* skip */ }
    }
  }
  return fullText
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

    const fullText = await parseOpenAISSE(reader, onChunk)
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

    const fullText = await parseAnthropicSSE(reader, onChunk)
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
