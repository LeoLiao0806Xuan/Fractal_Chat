// ── Example plugin: Character / token counter ──
// Adds a small token count estimate below each assistant message.

import type { Plugin } from '../lib/types'

const charCounterPlugin: Plugin = {
  id: 'char-counter',
  name: 'Char Counter',
  version: '1.0.0',
  description: 'Shows estimated token count below each assistant message.',
  author: 'Fractal Chat',

  hooks: {
    onMessageRender: (content) => {
      // Simple token estimate: ~4 chars per token
      const charCount = content.length
      const estimatedTokens = Math.ceil(charCount / 4)
      return content + `\n\n---\n*📝 ~${estimatedTokens.toLocaleString()} tokens (${charCount.toLocaleString()} chars)*`
    },
  },
}

export default charCounterPlugin
