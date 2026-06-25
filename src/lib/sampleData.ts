// ── Demo sample data for first-time users without API keys ──
import type { Dialog } from './types'
import { generateId } from './utils'

function id(seed: string): string {
  // Deterministic IDs so the demo tree stays stable across refreshes
  return `demo-${seed}`
}

export function generateSampleDialogs(): Dialog[] {
  const now = Date.now()

  const root: Dialog = {
    id: id('welcome'),
    title: '🎬 Welcome to Fractal Chat',
    createdAt: new Date(now - 3600000).toISOString(),
    updatedAt: new Date(now - 1800000).toISOString(),
    messages: [
      {
        id: generateId(), role: 'user', content: 'What can Fractal Chat do?',
        createdAt: new Date(now - 3600000).toISOString(), parentId: null, branchId: 'main', status: 'complete',
      },
      {
        id: generateId(), role: 'assistant', content: `Fractal Chat is a **recursive conversation tree** — think of it as an IDE for talking to AI.

**What makes it special:**

🧬 **Branching conversations** — Select any piece of a response and branch it into a focused sub-dialogue. Your main conversation stays clean while you explore tangents.

🔄 **Multi-model comparison** — Send the same prompt to GPT-4.1, Claude, DeepSeek simultaneously. Watch them respond side by side in real time.

🌲 **Visual dialog tree** — Navigate your entire conversation history as an interactive tree. Fold, expand, search, drag to reorder.

🏷️ **Organize** — Tag conversations, archive old ones, export as Markdown/JSON.

✏️ **Edit & version** — Edit messages with full version history. Undo merges with one click.

> ⚡ **All data stays local** in your browser (IndexedDB). No backend, no accounts, no data leaves your machine unless you send it to an LLM.`,
        createdAt: new Date(now - 3590000).toISOString(),
        parentId: null, branchId: 'main', status: 'complete',
      },
      {
        id: generateId(), role: 'user', content: 'Show me how the sub-dialogue branching works',
        createdAt: new Date(now - 3500000).toISOString(), parentId: null, branchId: 'main', status: 'complete',
      },
      {
        id: generateId(), role: 'assistant', content: `It's simple:

1. **Select any text** in an AI response
2. A popup menu appears: *Deep dive* / *Code review* / *Switch model*
3. A **side panel** opens with a fresh conversation — focused on your selection
4. Chat independently in the sub-dialogue
5. Click **Merge back** to bring the conclusion into the main conversation

👉 **Try it yourself:** Configure an API Key via the ⚙️ button, then select any text in a response to create your first sub-dialogue!

> 💡 *This demo shows sample conversations so you can explore the UI. Add an API Key to start chatting for real.*`,
        createdAt: new Date(now - 3490000).toISOString(),
        parentId: null, branchId: 'main', status: 'complete',
        previousVersions: [
          { content: 'It\'s simple: select text → popup → sub-dialogue panel → chat → merge back.', editedAt: new Date(now - 3485000).toISOString() },
        ],
        editedAt: new Date(now - 3480000).toISOString(),
      },
    ],
    status: 'active',
    tags: ['demo', 'welcome'],
    parentDialogId: null,
    rootDialogId: id('welcome'),
  }

  // —— Sub-dialogue created from selecting "recursive conversation tree" ——
  const sub1: Dialog = {
    id: id('sub-deepdive'),
    title: '📎 Why recursive trees beat linear chat',
    createdAt: new Date(now - 3000000).toISOString(),
    updatedAt: new Date(now - 2400000).toISOString(),
    messages: [
      {
        id: generateId(), role: 'system',
        content: 'Deep dive into: "recursive conversation tree" in the context of AI chat interfaces.',
        createdAt: new Date(now - 3000000).toISOString(), parentId: null, branchId: 'main', status: 'complete',
      },
      {
        id: generateId(), role: 'user', content: 'Why would I want recursive branching instead of a linear chat?',
        createdAt: new Date(now - 2990000).toISOString(), parentId: null, branchId: 'main', status: 'complete',
      },
      {
        id: generateId(), role: 'assistant', content: `Great question! Here's why recursive trees are powerful:

**Linear chat problems:**
- Lose context as conversation grows
- Can't explore tangents without derailing the main topic
- Hard to compare different approaches
- No way to organize related discussions

**With recursive branching:**
- Each tangent gets its own focused space 🎯
- Main conversation stays clean and on-track
- Merge insights back when you're done
- Visually see how ideas are connected

Think of it like a **Git branch for conversations** — you branch, experiment, and merge back when ready.`,
        createdAt: new Date(now - 2980000).toISOString(),
        parentId: null, branchId: 'main', status: 'complete',
      },
    ],
    status: 'active',
    tags: ['demo', 'concept'],
    parentDialogId: id('welcome'),
    rootDialogId: id('welcome'),
    contextAnchor: {
      messageId: root.messages[1].id,
      selectedText: 'recursive conversation tree',
    },
  }

  // —— Multi-model comparison ——
  const compare: Dialog = {
    id: id('compare'),
    title: '🔄 Compare: What is an LLM?',
    createdAt: new Date(now - 7200000).toISOString(),
    updatedAt: new Date(now - 7000000).toISOString(),
    messages: [
      {
        id: generateId(), role: 'user', content: 'Explain what a Large Language Model is in simple terms',
        createdAt: new Date(now - 7200000).toISOString(), parentId: null, branchId: 'main', status: 'complete', model: 'multi',
      },
      {
        id: generateId(), role: 'assistant', content: `**🤖 Claude:** A large language model is like a super-powered autocomplete. It's been trained on a vast amount of text from the internet, books, and more — learning patterns of language. When you give it a prompt, it predicts what words should come next based on everything it learned. Think of it as a **statistical parrot** with an incredible memory.

**🧠 GPT-4:** An LLM is a neural network with billions of parameters trained on terabytes of text. It learns not just grammar and facts, but reasoning patterns, coding styles, and creative writing. It doesn't "think" like humans, but it can generate remarkably coherent and context-aware responses by modeling the probability distribution of language.

**🎯 DeepSeek:** LLMs work by processing your input through multiple layers of neural networks (transformers), each layer extracting increasingly abstract patterns. They use a mechanism called "attention" to weigh which parts of your input matter most. The result is a system that can answer questions, write code, analyze data, and even reason — without being explicitly programmed for each task.`,
        createdAt: new Date(now - 7190000).toISOString(),
        parentId: null, branchId: 'main', status: 'complete', model: 'Claude + GPT-4 + DeepSeek',
      },
    ],
    status: 'archived',
    tags: ['demo', 'comparison', 'ai'],
    parentDialogId: null,
    rootDialogId: id('compare'),
  }

  // —— Sub-dialogue from comparison ——
  const subCompare: Dialog = {
    id: id('sub-compare'),
    title: '🌿 "attention" mechanism deep dive',
    createdAt: new Date(now - 7100000).toISOString(),
    updatedAt: new Date(now - 6900000).toISOString(),
    messages: [
      {
        id: generateId(), role: 'system',
        content: 'Deep dive into: "attention" mechanism in neural networks.',
        createdAt: new Date(now - 7100000).toISOString(), parentId: null, branchId: 'main', status: 'complete',
      },
      {
        id: generateId(), role: 'assistant', content: `The **attention mechanism** is the key innovation behind modern LLMs.

**Simple analogy:** When you read a sentence, you don't process every word equally. You "pay attention" to certain words to understand meaning. For example:

> "The cat sat on the **mat** because it was tired."

To understand what "it" refers to, your brain pays attention to "cat." That's attention.

**How it works technically:**
1. Each word gets processed into Query (Q), Key (K), and Value (V) vectors
2. Q asks: "What should I pay attention to?"
3. K says: "Here's what I contain"
4. The model computes a similarity score between Q and K
5. High similarity → more attention → that word's information flows through

This is why LLMs can handle **long-range dependencies** — a verb at the start of a paragraph can influence a word at the end, even with hundreds of tokens in between.`,
        createdAt: new Date(now - 7090000).toISOString(),
        parentId: null, branchId: 'main', status: 'complete',
      },
    ],
    status: 'active',
    tags: ['demo', 'deeper'],
    parentDialogId: id('compare'),
    rootDialogId: id('compare'),
    contextAnchor: {
      messageId: compare.messages[1].id,
      selectedText: 'attention',
    },
  }

  // —— Tag showcase: a conversation with multiple tags ——
  const tagged: Dialog = {
    id: id('tagged'),
    title: '📝 Project ideas for Fractal Chat',
    createdAt: new Date(now - 86400000).toISOString(),
    updatedAt: new Date(now - 85000000).toISOString(),
    messages: [
      {
        id: generateId(), role: 'user', content: 'What could I build on top of Fractal Chat?',
        createdAt: new Date(now - 86400000).toISOString(), parentId: null, branchId: 'main', status: 'complete',
      },
      {
        id: generateId(), role: 'assistant', content: `Great question! Here are some ideas:

**🔌 Plugin ideas:**
1. **Research assistant** — Auto-tag messages by topic, generate summaries of branches
2. **Code review tool** — Auto-run static analysis on selected code, inline suggestions
3. **Writing workshop** — Branch alternative versions, compare them side by side
4. **Learning companion** — Create flashcards from conversation branches
5. **Meeting notes** — Branch action items, auto-assign based on discussion

**🔧 Integration ideas:**
- **Obsidian plugin** — Export conversation trees as markdown notes
- **VS Code extension** — Bring sub-dialogue branching to code comments
- **Discord bot** — Collaborative branching conversations for teams

Which one interests you most?`,
        createdAt: new Date(now - 86300000).toISOString(),
        parentId: null, branchId: 'main', status: 'complete',
      },
      {
        id: generateId(), role: 'user', content: 'The research assistant idea sounds cool!',
        createdAt: new Date(now - 86200000).toISOString(), parentId: null, branchId: 'main', status: 'complete',
      },
    ],
    status: 'active',
    tags: ['demo', 'ideas', 'roadmap'],
    parentDialogId: null,
    rootDialogId: id('tagged'),
  }

  return [root, sub1, compare, subCompare, tagged]
}
