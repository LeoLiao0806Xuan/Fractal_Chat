/**
 * Selection Engine — 选区类型检测 + 上下文提取 + 防抖
 *
 * Whitepaper spec: Rust → WASM, <50ms latency
 * Current: pure TS implementation, optimised for readability & debounce
 *
 * TODO(wasm): compile Rust → wasm-pack when the engine stabilises
 */

export type SelectionType =
  | 'code-block'
  | 'inline-code'
  | 'text'
  | 'list'
  | 'heading'
  | 'table'
  | 'math'
  | 'mixed'

export interface SelectionResult {
  /** Raw selected text */
  text: string
  /** Bounding rect of the selection (for menu positioning) */
  rect: DOMRect
  /** Detected content type */
  type: SelectionType
  /** Surrounding context (previous + next N paragraphs) */
  context: { before: string; after: string }
  /** The DOM element that contains the selection */
  container: Node | null
  /** Confidence score 0-1 */
  confidence: number
}

const CONTEXT_PARAGRAPHS = 2

/**
 * Detect what kind of content was selected by inspecting the DOM around the
 * selection range.
 */
export function detectSelectionType(range: Range): SelectionType {
  const container = range.commonAncestorContainer
  if (!container) return 'text'

  // Walk up to find the nearest block-level element
  let block = container.nodeType === Node.TEXT_NODE
    ? container.parentElement
    : container as Element

  // Check up to 5 levels up for known block types
  for (let i = 0; i < 5 && block; i++) {
    const tag = block.tagName?.toLowerCase()
    const cls = block.className?.toLowerCase() || ''

    // Code block
    if (tag === 'pre' || cls.includes('code-block') || cls.includes('language-')) {
      return 'code-block'
    }
    // Inline code
    if (tag === 'code' && !block.querySelector('pre')) {
      return 'inline-code'
    }
    // Math ($$ ... $$ blocks)
    if (cls.includes('math-block')) return 'math'
    if (cls.includes('math-inline')) return 'math'
    // Heading
    if (/^h[1-6]$/.test(tag)) return 'heading'
    // List
    if (['ul', 'ol', 'li'].includes(tag)) return 'list'
    // Table
    if (tag === 'table' || ['thead', 'tbody', 'tr', 'td', 'th'].includes(tag)) {
      return 'table'
    }

    block = block.parentElement
  }

  return 'text'
}

/**
 * Extract surrounding context (N paragraphs before & after the selection).
 */
export function extractContext(range: Range): { before: string; after: string } {
  const container = range.commonAncestorContainer
  const root = container?.nodeType === Node.TEXT_NODE
    ? container.parentElement?.closest('[data-msg-id]') || container.parentElement
    : (container as Element)?.closest('[data-msg-id]') || container as Element

  if (!root || !root.parentElement) return { before: '', after: '' }

  // Collect all text nodes or paragraph-like siblings
  const allBlocks = Array.from(root.parentElement.querySelectorAll(
    'p, pre, blockquote, ul, ol, li, h1, h2, h3, h4, h5, h6, div.math-block'
  ))
  const targetBlock = container.nodeType === Node.TEXT_NODE
    ? container.parentElement?.closest('p, pre, blockquote, ul, ol, li, h1, h2, h3, h4, h5, h6, div.math-block')
    : (container as Element)?.closest('p, pre, blockquote, ul, ol, li, h1, h2, h3, h4, h5, h6, div.math-block')

  if (!targetBlock) return { before: '', after: '' }

  const idx = allBlocks.indexOf(targetBlock as Element)
  if (idx === -1) return { before: '', after: '' }

  const before = allBlocks
    .slice(Math.max(0, idx - CONTEXT_PARAGRAPHS), idx)
    .map(el => (el.textContent || '').trim())
    .filter(Boolean)
    .join('\n')

  const after = allBlocks
    .slice(idx + 1, idx + 1 + CONTEXT_PARAGRAPHS)
    .map(el => (el.textContent || '').trim())
    .filter(Boolean)
    .join('\n')

  return { before, after }
}

/**
 * Score how "intentional" a selection looks — range-based heuristics
 * that help distinguish a deliberate swipe from an accidental click.
 */
export function scoreSelection(text: string, _range: Range): number {
  let score = 0.5 // base

  const trimmed = text.trim()
  if (!trimmed) return 0

  // Longer selections are more intentional
  if (trimmed.length > 10) score += 0.15
  if (trimmed.length > 30) score += 0.1
  if (trimmed.length > 100) score += 0.05

  // Selections spanning multiple lines are more intentional
  if (trimmed.includes('\n')) score += 0.1

  // Selections that start/end at word boundaries are more intentional
  if (/^\w/.test(trimmed) && /\w$/.test(trimmed)) score += 0.05

  // Code-like selections (contains operators, brackets)
  if (/[{}()\[\]=><\+\-\*\/]/.test(trimmed)) score += 0.05

  // Selection that starts with a capital letter (sentence boundary)
  if (/^[A-Z一-鿿]/.test(trimmed)) score += 0.05

  return Math.min(score, 1)
}

/**
 * Main entry-point: given a Selection object, produce a structured result.
 *
 * This is designed to be called from a debounced mouseup / keyup handler.
 */
export function analyzeSelection(
  selection: Selection | null,
): SelectionResult | null {
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    return null
  }

  const text = selection.toString().trim()
  const rangeCount = selection.rangeCount
  if (rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const type = detectSelectionType(range)
  const context = extractContext(range)
  const confidence = scoreSelection(text, range)

  return {
    text,
    rect,
    type,
    context,
    container: range.commonAncestorContainer,
    confidence,
  }
}

/**
 * Get a human-readable label for a selection type (for UI display).
 */
export function selectionTypeLabel(type: SelectionType): string {
  const labels: Record<SelectionType, string> = {
    'code-block': '代码',
    'inline-code': '代码片段',
    text: '文本',
    list: '列表',
    heading: '标题',
    table: '表格',
    math: '数学公式',
    mixed: '混合内容',
  }
  return labels[type] || '文本'
}

/**
 * Get the icon emoji for a selection type.
 */
export function selectionTypeIcon(type: SelectionType): string {
  const icons: Record<SelectionType, string> = {
    'code-block': '📄',
    'inline-code': '💻',
    text: '📝',
    list: '📋',
    heading: '📌',
    table: '📊',
    math: '🔢',
    mixed: '🔀',
  }
  return icons[type] || '📝'
}
