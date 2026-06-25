// ── Demo sample data for first-time users without API keys ──
import type { Dialog } from './types'
import { generateId } from './utils'
import type { Locale } from '../i18n'

function id(seed: string): string {
  return `demo-${seed}`
}

// ── Bilingual content ──
const CONTENT = {
  rootTitle: { en: '🎬 Welcome to Fractal Chat', 'zh-CN': '🎬 欢迎使用 Fractal Chat' },
  rootQ1: { en: 'What can Fractal Chat do?', 'zh-CN': 'Fractal Chat 能做什么？' },
  rootA1: {
    en: `Fractal Chat is a **recursive conversation tree** — think of it as an IDE for talking to AI.

**What makes it special:**

🧬 **Branching conversations** — Select any piece of a response and branch it into a focused sub-dialogue. Your main conversation stays clean while you explore tangents.

🔄 **Multi-model comparison** — Send the same prompt to GPT-4.1, Claude, DeepSeek simultaneously. Watch them respond side by side in real time.

🌲 **Visual dialog tree** — Navigate your entire conversation history as an interactive tree. Fold, expand, search, drag to reorder.

🏷️ **Organize** — Tag conversations, archive old ones, export as Markdown/JSON.

✏️ **Edit & version** — Edit messages with full version history. Undo merges with one click.

> ⚡ **All data stays local** in your browser (IndexedDB). No backend, no accounts, no data leaves your machine unless you send it to an LLM.`,
    'zh-CN': `Fractal Chat 是一个**递归对话树**——可以把它想象成 AI 对话的 IDE。

**核心特性：**

🧬 **分支对话** — 选中回复中的任意内容，创建聚焦的子对话。主对话保持整洁，同时你可以自由探索分支。

🔄 **多模型并行对比** — 将同一问题同时发送给 GPT-4.1、Claude、DeepSeek，并排观看实时流式回复。

🌲 **可视化对话树** — 以交互式树状图浏览整个对话历史。折叠、展开、搜索、拖拽排序。

🏷️ **整理** — 标签管理、归档旧对话、导出 Markdown/JSON。

✏️ **编辑与版本** — 编辑消息附带完整版本历史。一键撤销合并。

> ⚡ **所有数据仅保存在本地浏览器**（IndexedDB）。无后端、无账户、无数据离开你的设备——除非发送到你配置的 LLM API。`,
  },
  rootQ2: { en: 'Show me how the sub-dialogue branching works', 'zh-CN': '演示一下子对话分支怎么用' },
  rootA2: {
    en: `It's simple:

1. **Select any text** in an AI response
2. A popup menu appears: *Deep dive* / *Code review* / *Switch model*
3. A **side panel** opens with a fresh conversation — focused on your selection
4. Chat independently in the sub-dialogue
5. Click **Merge back** to bring the conclusion into the main conversation

👉 **Try it yourself:** Configure an API Key via the ⚙️ button, then select any text in a response to create your first sub-dialogue!

> 💡 *This demo shows sample conversations so you can explore the UI. Add an API Key to start chatting for real.*`,
    'zh-CN': `很简单：

1. **选中 AI 回复中的任意一段文字**
2. 弹出菜单出现：*深入探讨* / *代码审查* / *换模型问*
3. **侧面板**打开一个新的对话——聚焦于你的选择
4. 在子对话中独立交流
5. 点击 **合并回主干** 将结论带回主对话

👉 **试试看：** 通过 ⚙️ 按钮配置 API Key，然后选中回复中的文字创建你的第一个子对话！

> 💡 *此 Demo 展示示例对话供你探索 UI。配置 API Key 后即可开始真正的对话。*`,
  },
  rootA2Old: {
    en: 'It\'s simple: select text → popup → sub-dialogue panel → chat → merge back.',
    'zh-CN': '很简单：选中文字 → 弹出菜单 → 子对话面板 → 聊天 → 合并回主干。',
  },
  sub1Title: { en: '📎 Why recursive trees beat linear chat', 'zh-CN': '📎 为什么递归树比线性聊天更好' },
  sub1System: { en: 'Deep dive into: "recursive conversation tree" in the context of AI chat interfaces.', 'zh-CN': '深入探讨：AI 对话界面中的"递归对话树"概念。' },
  sub1Q: { en: 'Why would I want recursive branching instead of a linear chat?', 'zh-CN': '为什么我需要递归分支而不是线性聊天？' },
  sub1A: {
    en: `Great question! Here's why recursive trees are powerful:

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
    'zh-CN': `好问题！以下是递归树的强大之处：

**线性聊天的问题：**
- 随着对话增长，上下文丢失
- 无法在不偏离主线的情况下探索分支
- 难以比较不同的方法
- 无法组织相关的讨论

**使用递归分支：**
- 每个分支都有自己的专注空间 🎯
- 主对话保持整洁、不偏离主题
- 完成后将见解合并回来
- 直观地看到想法的关联

把它想象成 **对话的 Git 分支** —— 你创建分支、实验、准备好后合并回来。`,
  },
  compareTitle: { en: '🔄 Compare: What is an LLM?', 'zh-CN': '🔄 对比：什么是大语言模型？' },
  compareQ: { en: 'Explain what a Large Language Model is in simple terms', 'zh-CN': '用简单的语言解释什么是大语言模型' },
  compareA: {
    en: `**🤖 Claude:** A large language model is like a super-powered autocomplete. It's been trained on a vast amount of text from the internet, books, and more — learning patterns of language. When you give it a prompt, it predicts what words should come next based on everything it learned. Think of it as a **statistical parrot** with an incredible memory.

**🧠 GPT-4:** An LLM is a neural network with billions of parameters trained on terabytes of text. It learns not just grammar and facts, but reasoning patterns, coding styles, and creative writing. It doesn't "think" like humans, but it can generate remarkably coherent and context-aware responses by modeling the probability distribution of language.

**🎯 DeepSeek:** LLMs work by processing your input through multiple layers of neural networks (transformers), each layer extracting increasingly abstract patterns. They use a mechanism called "attention" to weigh which parts of your input matter most. The result is a system that can answer questions, write code, analyze data, and even reason — without being explicitly programmed for each task.`,
    'zh-CN': `**🤖 Claude：** 大语言模型就像一个超强的自动补全工具。它在互联网、书籍等海量文本上训练过——学习语言模式。当你给它提示时，它会根据学到的所有知识预测接下来应该出现什么词。可以把它想象成一个有惊人记忆力的**统计鹦鹉**。

**🧠 GPT-4：** 大语言模型是一个拥有数十亿参数的神经网络，在 TB 级别的文本上训练。它学到的不仅是语法和事实，还有推理模式、编码风格和创意写作。它不像人类那样"思考"，但通过建模语言的概率分布，它能生成非常连贯且上下文感知的回复。

**🎯 DeepSeek：** 大语言模型通过多层神经网络（Transformer）处理你的输入，每一层提取越来越抽象的模式。它们使用一种称为"注意力"的机制来衡量输入的哪些部分最重要。结果是一个系统可以回答问题、编写代码、分析数据甚至推理——无需为每个任务显式编程。`,
  },
  subCompareTitle: { en: '🌿 "attention" mechanism deep dive', 'zh-CN': '🌿 深入理解"注意力"机制' },
  subCompareSystem: { en: 'Deep dive into: "attention" mechanism in neural networks.', 'zh-CN': '深入探讨：神经网络中的"注意力"机制。' },
  subCompareA: {
    en: `The **attention mechanism** is the key innovation behind modern LLMs.

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
    'zh-CN': `**注意力机制**是现代大语言模型背后的关键创新。

**简单类比：** 当你读一个句子时，你不会平等地处理每个词。你会"注意"某些词来理解含义。例如：

> "那只猫坐在**垫子**上，因为它累了。"

要理解"它"指的是什么，你的大脑会注意"猫"。这就是注意力。

**技术原理：**
1. 每个词被处理成 Query(Q)、Key(K) 和 Value(V) 向量
2. Q 问："我应该注意什么？"
3. K 说："我包含什么"
4. 模型计算 Q 和 K 之间的相似度分数
5. 相似度高 → 更多注意力 → 那个词的信息流过

这就是为什么大语言模型能处理**长距离依赖**——段落开头的动词可以影响结尾的词，即使中间有几百个 token。`,
  },
  taggedTitle: { en: '📝 Project ideas for Fractal Chat', 'zh-CN': '📝 Fractal Chat 的项目创意' },
  taggedQ: { en: 'What could I build on top of Fractal Chat?', 'zh-CN': '我可以在 Fractal Chat 之上构建什么？' },
  taggedA: {
    en: `Great question! Here are some ideas:

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
    'zh-CN': `好问题！以下是一些创意：

**🔌 插件创意：**
1. **研究助手** — 按主题自动标签消息，生成分支摘要
2. **代码审查工具** — 对选中代码自动运行静态分析，内联建议
3. **写作工坊** — 分支出不同版本，并排比较
4. **学习伴侣** — 从对话分支创建闪卡
5. **会议记录** — 分支行动项，基于讨论自动分配

**🔧 集成创意：**
- **Obsidian 插件** — 将对话树导出为 Markdown 笔记
- **VS Code 扩展** — 将子对话分支带入代码注释
- **Discord 机器人** — 团队协作的分支对话

哪个最让你感兴趣？`,
  },
  taggedQ2: { en: 'The research assistant idea sounds cool!', 'zh-CN': '研究助手的想法听起来很酷！' },
}

export function generateSampleDialogs(locale: Locale = 'en'): Dialog[] {
  const now = Date.now()
  const L = locale

  const root: Dialog = {
    id: id('welcome'),
    title: CONTENT.rootTitle[L],
    createdAt: new Date(now - 3600000).toISOString(),
    updatedAt: new Date(now - 1800000).toISOString(),
    messages: [
      { id: generateId(), role: 'user', content: CONTENT.rootQ1[L],
        createdAt: new Date(now - 3600000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
      { id: generateId(), role: 'assistant', content: CONTENT.rootA1[L],
        createdAt: new Date(now - 3590000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
      { id: generateId(), role: 'user', content: CONTENT.rootQ2[L],
        createdAt: new Date(now - 3500000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
      { id: generateId(), role: 'assistant', content: CONTENT.rootA2[L],
        createdAt: new Date(now - 3490000).toISOString(), parentId: null, branchId: 'main', status: 'complete',
        previousVersions: [{ content: CONTENT.rootA2Old[L], editedAt: new Date(now - 3485000).toISOString() }],
        editedAt: new Date(now - 3480000).toISOString() },
    ],
    status: 'active',
    tags: ['demo', 'welcome'],
    parentDialogId: null,
    rootDialogId: id('welcome'),
  }

  const sub1: Dialog = {
    id: id('sub-deepdive'),
    title: CONTENT.sub1Title[L],
    createdAt: new Date(now - 3000000).toISOString(),
    updatedAt: new Date(now - 2400000).toISOString(),
    messages: [
      { id: generateId(), role: 'system', content: CONTENT.sub1System[L],
        createdAt: new Date(now - 3000000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
      { id: generateId(), role: 'user', content: CONTENT.sub1Q[L],
        createdAt: new Date(now - 2990000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
      { id: generateId(), role: 'assistant', content: CONTENT.sub1A[L],
        createdAt: new Date(now - 2980000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
    ],
    status: 'active',
    tags: ['demo', 'concept'],
    parentDialogId: id('welcome'),
    rootDialogId: id('welcome'),
    contextAnchor: { messageId: root.messages[1].id, selectedText: locale === 'en' ? 'recursive conversation tree' : '递归对话树' },
  }

  const compare: Dialog = {
    id: id('compare'),
    title: CONTENT.compareTitle[L],
    createdAt: new Date(now - 7200000).toISOString(),
    updatedAt: new Date(now - 7000000).toISOString(),
    messages: [
      { id: generateId(), role: 'user', content: CONTENT.compareQ[L],
        createdAt: new Date(now - 7200000).toISOString(), parentId: null, branchId: 'main', status: 'complete', model: 'multi' },
      { id: generateId(), role: 'assistant', content: CONTENT.compareA[L],
        createdAt: new Date(now - 7190000).toISOString(), parentId: null, branchId: 'main', status: 'complete', model: 'Claude + GPT-4 + DeepSeek' },
    ],
    status: 'archived',
    tags: ['demo', 'comparison', 'ai'],
    parentDialogId: null,
    rootDialogId: id('compare'),
  }

  const subCompare: Dialog = {
    id: id('sub-compare'),
    title: CONTENT.subCompareTitle[L],
    createdAt: new Date(now - 7100000).toISOString(),
    updatedAt: new Date(now - 6900000).toISOString(),
    messages: [
      { id: generateId(), role: 'system', content: CONTENT.subCompareSystem[L],
        createdAt: new Date(now - 7100000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
      { id: generateId(), role: 'assistant', content: CONTENT.subCompareA[L],
        createdAt: new Date(now - 7090000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
    ],
    status: 'active',
    tags: ['demo', 'deeper'],
    parentDialogId: id('compare'),
    rootDialogId: id('compare'),
    contextAnchor: { messageId: compare.messages[1].id, selectedText: locale === 'en' ? 'attention' : '注意力' },
  }

  const tagged: Dialog = {
    id: id('tagged'),
    title: CONTENT.taggedTitle[L],
    createdAt: new Date(now - 86400000).toISOString(),
    updatedAt: new Date(now - 85000000).toISOString(),
    messages: [
      { id: generateId(), role: 'user', content: CONTENT.taggedQ[L],
        createdAt: new Date(now - 86400000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
      { id: generateId(), role: 'assistant', content: CONTENT.taggedA[L],
        createdAt: new Date(now - 86300000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
      { id: generateId(), role: 'user', content: CONTENT.taggedQ2[L],
        createdAt: new Date(now - 86200000).toISOString(), parentId: null, branchId: 'main', status: 'complete' },
    ],
    status: 'active',
    tags: ['demo', 'ideas', 'roadmap'],
    parentDialogId: null,
    rootDialogId: id('tagged'),
  }

  return [root, sub1, compare, subCompare, tagged]
}
