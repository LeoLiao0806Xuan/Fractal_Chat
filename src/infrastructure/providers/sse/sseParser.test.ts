import { describe, expect, it, vi } from 'vitest'
import {
  parseAnthropicSse,
  parseOpenAICompatibleSse,
} from './index'

function readerFromChunks(chunks: string[]): ReadableStreamDefaultReader<Uint8Array> {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return stream.getReader()
}

describe('parseOpenAICompatibleSse', () => {
  it('preserves events split across arbitrary network chunks', async () => {
    const onText = vi.fn()
    const reader = readerFromChunks([
      'data: {"choices":[{"delta":{"con',
      'tent":"Hel"}}]}\r\n\r',
      '\ndata: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
      'data: {"choices":[],"usage":{"total_tokens":12}}\n\n',
      'data: [DO',
      'NE]\n\n',
    ])

    const result = await parseOpenAICompatibleSse(reader, onText)

    expect(result).toEqual({ text: 'Hello', usage: 12 })
    expect(onText).toHaveBeenNthCalledWith(1, 'Hel')
    expect(onText).toHaveBeenNthCalledWith(2, 'Hello')
  })

  it('skips a malformed event without losing the following valid event', async () => {
    const reader = readerFromChunks([
      'data: {not-json}\n\n',
      'data: {"choices":[{"delta":{"content":"kept"}}]}',
    ])

    await expect(parseOpenAICompatibleSse(reader)).resolves.toEqual({
      text: 'kept',
      usage: null,
    })
  })
})

describe('parseAnthropicSse', () => {
  it('preserves text and usage when JSON is split across chunks', async () => {
    const reader = readerFromChunks([
      'event: content_block_delta\ndata: {"type":"content_block_',
      'delta","delta":{"text":"A"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"text":"B"}}\n\n',
      'data: {"type":"message_delta","usage":{"output_tokens":7}}\n\n',
    ])

    await expect(parseAnthropicSse(reader)).resolves.toEqual({
      text: 'AB',
      usage: 7,
    })
  })
})
