import type { Dialog } from './types'

export type MergeMode = 'replace' | 'footnote' | 'keep-child'

/**
 * Build the conclusion text from a sub-dialog's messages.
 * Skips system messages, formats user/assistant exchange.
 */
export function buildConclusion(subDialog: Dialog): string {
  const msgs = subDialog.messages.filter(m => m.role !== 'system')
  if (msgs.length === 0) return '*(子对话无内容)*'

  return msgs
    .map(m =>
      m.role === 'user'
        ? `**提问**: ${m.content}`
        : `**结论**: ${m.content}`
    )
    .join('\n\n')
}

/**
 * Apply the merge result to produce the final inserted text.
 */
export function formatMergeContent(conclusion: string, mode: MergeMode): string {
  switch (mode) {
    case 'replace':
      return `\n\n${conclusion}`
    case 'footnote':
      return `\n\n---\n> 📎 **子对话结论**\n${conclusion
        .split('\n')
        .map(l => `> ${l}`)
        .join('\n')}`
    case 'keep-child':
      return ''  // No text change, just structural
  }
}
