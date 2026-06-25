// ── Mock AI responses for demo/try-out mode (bilingual) ──

import type { Locale } from '../i18n'

const MOCK_RESPONSES_EN = [
  `That's an interesting point! Let me share my thoughts on this.

**Key considerations:**
1. **Context matters** — The way we frame questions significantly impacts the quality of responses
2. **Iteration is key** — Refining your prompts leads to dramatically better results
3. **Multiple perspectives** — Different models excel at different types of tasks

> 💡 *This is a simulated response in demo mode. Configure an API Key in ⚙️ for real AI responses.*

Want to try the **core feature**? Select any part of this response → click *Deep dive* to create a sub-dialogue!`,

  `Great question! Here's what I think:

\`\`\`
The best way to learn is by doing.
Start small, iterate fast, and don't
be afraid to experiment with new
approaches along the way.
\`\`\`

**Why this matters:**
- Hands-on experience beats theory every time
- Making mistakes is part of the learning process
- Every expert was once a beginner

👉 **Pro tip:** Try selecting the code block above — you can create a focused sub-dialogue to discuss it further!`,

  `Let me analyze this from a few angles:

**🔍 Perspective 1: Simplicity**
Sometimes the simplest answer is the best one. Don't overcomplicate things.

**🔍 Perspective 2: Depth**
But simple doesn't mean shallow — there's often more beneath the surface worth exploring.

**🔍 Perspective 3: Action**
The real value comes from applying ideas, not just discussing them.

---

**Here's a quick summary:**

| Approach | Best For |
|----------|----------|
| Simple & direct | Quick wins |
| Deep analysis | Complex problems |
| Action-oriented | Getting things done |

*This is a demo response — no API key needed. Configure one in ⚙️ to use real AI models!*`,

  `I'd be happy to help with that! Here are my thoughts:

**First,** let's break this down into manageable pieces:
1. Define the core question clearly
2. Gather relevant context
3. Explore possible approaches
4. Synthesize the best solution

**Second,** remember that good conversations build on each other. Each response adds to a richer understanding.

**Third,** don't hesitate to **branch out** — select any text and create a sub-dialogue to explore side topics without losing your place in the main conversation.

> 🎯 **Try it now:** Select the text above that interests you most and create your first sub-dialogue!`,

  `Here's an interesting perspective to consider:

> "The best way to predict the future is to create it." — Peter Drucker

**What this means for AI conversations:**
- You're not just getting answers — you're **co-creating** knowledge
- Each conversation branch opens new possibilities
- The value compounds as you connect ideas across dialogues

**Suggested next steps:**
1. ✏️ **Edit** any response to refine it
2. 🔗 **Create a sub-dialogue** from selected text
3. 🏷️ **Tag** conversations to organize your work
4. 📤 **Export** your best conversations as Markdown

*Ready to see this in action? Select any text above to get started!*`,
]

const MOCK_RESPONSES_ZH = [
  `这个问题很有意思！我来分享一下想法。

**关键考虑因素：**
1. **上下文很重要** — 问题表述方式对回答质量影响很大
2. **迭代是关键** — 不断优化提示词能带来显著更好的结果
3. **多角度视角** — 不同模型擅长不同类型的任务

> 💡 *这是演示模式的模拟回复。在 ⚙️ 中配置 API Key 获取真实 AI 回复。*

想试试**核心功能**吗？选中这段回复中的任意文字 → 点击"深入探讨"创建一个子对话！`,

  `好问题！以下是我的想法：

\`\`\`
实践是最好的学习方法。
从小处着手，快速迭代，
过程中不要害怕尝试新方法。
\`\`\`

**为什么这很重要：**
- 动手经验永远胜过纸上谈兵
- 犯错是学习过程的一部分
- 每位专家都曾是初学者

👉 **小提示：** 试试选中上面的代码块——你可以创建一个专门的子对话来深入讨论！`,

  `让我从几个角度来分析：

**🔍 角度一：简洁**
有时候最简单的答案就是最好的答案。不要过度复杂化。

**🔍 角度二：深度**
但简单不意味着肤浅——表面之下往往有值得探索的深度。

**🔍 角度三：行动**
真正的价值来自于应用想法，而不仅仅是讨论它们。

---

**快速总结：**

| 方式 | 最适合 |
|------|--------|
| 简洁直接 | 快速解决问题 |
| 深度分析 | 复杂问题 |
| 行动导向 | 完成任务 |

*这是演示回复——无需 API Key。在 ⚙️ 中配置即可使用真实 AI 模型！*`,

  `很高兴帮您解答！以下是我的想法：

**首先，** 让我们把问题分解为可管理的部分：
1. 清晰地定义核心问题
2. 收集相关上下文信息
3. 探索可能的解决方案
4. 综合出最佳答案

**其次，** 好的对话是层层递进的。每次回复都在丰富理解。

**第三，** 别忘了**创建分支**——选中任意文字创建子对话，在不脱离主对话的情况下探索相关话题。

> 🎯 **现在就试试：** 选中上面你感兴趣的文字，创建第一个子对话！`,

  `这里有一个值得思考的角度：

> "预测未来的最好方式就是创造它。" — 彼得·德鲁克

**这对 AI 对话意味着什么：**
- 你不仅仅在获取答案——你在**共同创造**知识
- 每个对话分支都开启新的可能性
- 随着你在对话之间连接想法，价值会不断累积

**建议下一步：**
1. ✏️ **编辑**任何回复来优化它
2. 🔗 **创建子对话** 从选中文字
3. 🏷️ **标签**管理对话
4. 📤 **导出** Markdown 格式的最佳对话

*准备好了吗？选中上面的任意文字开始体验！*`,
]

let counter = 0

export function generateMockResponse(userMessage: string, locale: Locale = 'en'): string {
  const pool = locale === 'en' ? MOCK_RESPONSES_EN : MOCK_RESPONSES_ZH

  if (locale === 'zh-CN') {
    const prefix = userMessage.length < 20
      ? `关于"${userMessage}"，我来分享一些想法：\n\n`
      : `感谢你的消息！以下是我的回复：\n\n`
    const body = pool[counter % pool.length]
    counter++
    return prefix + body
  }

  const prefix = userMessage.length < 20
    ? `Thanks for asking about "${userMessage}"!\n\n`
    : `Thanks for your message! Here's my response:\n\n`
  const body = pool[counter % pool.length]
  counter++
  return prefix + body
}

export async function* streamMockResponse(userMessage: string, locale: Locale = 'en'): AsyncGenerator<string> {
  const full = generateMockResponse(userMessage, locale)
  const sentences = full.split(/(?<=[。！？.!?])\s*/)
  for (const sentence of sentences) {
    yield sentence
    await new Promise(r => setTimeout(r, 60 + Math.random() * 100))
  }
}
