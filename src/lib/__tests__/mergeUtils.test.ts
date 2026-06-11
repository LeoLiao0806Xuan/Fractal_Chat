import { describe, it, expect } from 'vitest'
import { buildConclusion, formatMergeContent } from '../mergeUtils'
import type { Dialog } from '../types'

function makeSub(msgs: { role: string; content: string }[]): Dialog {
  return {
    id: 'sub-1',
    title: '子对话',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    messages: msgs.map((m, i) => ({
      id: `msg-${i}`,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      createdAt: '2024-01-01',
      parentId: null,
      branchId: 'main',
    })),
    status: 'active',
    parentDialogId: 'parent-1',
    rootDialogId: 'root-1',
  }
}

describe('buildConclusion', () => {
  it('returns fallback for empty sub-dialog', () => {
    const sub = makeSub([])
    expect(buildConclusion(sub)).toBe('*(子对话无内容)*')
  })

  it('builds from user + assistant messages', () => {
    const sub = makeSub([
      { role: 'user', content: 'What is React?' },
      { role: 'assistant', content: 'A UI library.' },
    ])
    const result = buildConclusion(sub)
    expect(result).toContain('**提问**')
    expect(result).toContain('What is React?')
    expect(result).toContain('**结论**')
    expect(result).toContain('A UI library.')
  })

  it('skips system messages', () => {
    const sub = makeSub([
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'hello' },
    ])
    const result = buildConclusion(sub)
    expect(result).not.toContain('system prompt')
    expect(result).toContain('hello')
  })

  it('handles only assistant response', () => {
    const sub = makeSub([
      { role: 'assistant', content: 'Direct answer' },
    ])
    const result = buildConclusion(sub)
    expect(result).toContain('**结论**')
    expect(result).toContain('Direct answer')
  })
})

describe('formatMergeContent', () => {
  const conclusion = '**提问**: test\n\n**结论**: answer'

  it('replace mode appends conclusion', () => {
    const result = formatMergeContent(conclusion, 'replace')
    expect(result).toBe('\n\n' + conclusion)
  })

  it('footnote mode wraps in blockquote', () => {
    const result = formatMergeContent(conclusion, 'footnote')
    expect(result).toContain('---')
    expect(result).toContain('> **提问**')
    expect(result).toContain('> **结论**')
  })

  it('keep-child mode returns empty string', () => {
    const result = formatMergeContent(conclusion, 'keep-child')
    expect(result).toBe('')
  })
})
