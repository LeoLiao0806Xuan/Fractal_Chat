// ── Mock AI responses for demo/try-out mode ──
// Generates plausible-looking responses without calling any external API.

const MOCK_RESPONSES = [
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

let counter = 0

export function generateMockResponse(userMessage: string): string {
  const prefix = userMessage.length < 20
    ? `Thanks for asking about "${userMessage}"!\n\n`
    : `Thanks for your message! Here's my response:\n\n`

  const body = MOCK_RESPONSES[counter % MOCK_RESPONSES.length]
  counter++

  return prefix + body
}

/** Simulate streaming by returning chunks */
export async function* streamMockResponse(userMessage: string): AsyncGenerator<string> {
  const full = generateMockResponse(userMessage)
  // Yield in chunks to simulate streaming
  const sentences = full.split(/(?<=[.!?])\s+/)
  for (const sentence of sentences) {
    yield sentence + ' '
    await new Promise(r => setTimeout(r, 80 + Math.random() * 120))
  }
}
