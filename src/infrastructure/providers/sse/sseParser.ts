export interface SseParseResult {
  text: string
  usage: number | null
}

type SseDataHandler = (eventData: string) => void

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null
}

function parseJson(eventData: string): unknown {
  try {
    return JSON.parse(eventData)
  } catch {
    return null
  }
}

function readOpenAIContent(payload: unknown): string {
  if (!isObject(payload) || !('choices' in payload) || !Array.isArray(payload.choices)) {
    return ''
  }
  const choice = payload.choices[0]
  if (!isObject(choice) || !('delta' in choice) || !isObject(choice.delta)) return ''
  if (!('content' in choice.delta) || typeof choice.delta.content !== 'string') return ''
  return choice.delta.content
}

function readOpenAIUsage(payload: unknown): number | null {
  if (!isObject(payload) || !('usage' in payload) || !isObject(payload.usage)) return null
  if (!('total_tokens' in payload.usage) || typeof payload.usage.total_tokens !== 'number') {
    return null
  }
  return payload.usage.total_tokens
}

function readAnthropicContent(payload: unknown): string {
  if (!isObject(payload) || !('type' in payload) || payload.type !== 'content_block_delta') {
    return ''
  }
  if (!('delta' in payload) || !isObject(payload.delta)) return ''
  if (!('text' in payload.delta) || typeof payload.delta.text !== 'string') return ''
  return payload.delta.text
}

function readAnthropicUsage(payload: unknown): number | null {
  if (!isObject(payload) || !('type' in payload) || payload.type !== 'message_delta') {
    return null
  }
  if (!('usage' in payload) || !isObject(payload.usage)) return null
  if (!('output_tokens' in payload.usage) || typeof payload.usage.output_tokens !== 'number') {
    return null
  }
  return payload.usage.output_tokens
}

async function readSseData(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onData: SseDataHandler,
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''
  let dataLines: string[] = []

  const dispatchEvent = () => {
    if (dataLines.length === 0) return
    onData(dataLines.join('\n'))
    dataLines = []
  }

  const processLine = (rawLine: string) => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
    if (line === '') {
      dispatchEvent()
      return
    }
    if (!line.startsWith('data:')) return
    const value = line.slice(5)
    dataLines.push(value.startsWith(' ') ? value.slice(1) : value)
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let newlineIndex = buffer.indexOf('\n')
    while (newlineIndex >= 0) {
      processLine(buffer.slice(0, newlineIndex))
      buffer = buffer.slice(newlineIndex + 1)
      newlineIndex = buffer.indexOf('\n')
    }
  }

  buffer += decoder.decode()
  if (buffer) processLine(buffer)
  dispatchEvent()
}

export async function parseOpenAICompatibleSse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onText?: (fullText: string) => void,
): Promise<SseParseResult> {
  let text = ''
  let usage: number | null = null
  await readSseData(reader, eventData => {
    if (eventData === '[DONE]') return
    const payload = parseJson(eventData)
    const eventUsage = readOpenAIUsage(payload)
    if (eventUsage !== null) usage = eventUsage
    const content = readOpenAIContent(payload)
    if (!content) return
    text += content
    onText?.(text)
  })
  return { text, usage }
}

export async function parseAnthropicSse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onText?: (fullText: string) => void,
): Promise<SseParseResult> {
  let text = ''
  let usage: number | null = null
  await readSseData(reader, eventData => {
    const payload = parseJson(eventData)
    const eventUsage = readAnthropicUsage(payload)
    if (eventUsage !== null) usage = eventUsage
    const content = readAnthropicContent(payload)
    if (!content) return
    text += content
    onText?.(text)
  })
  return { text, usage }
}
