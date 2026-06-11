import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { marked } from 'marked'
import { useDialogStore } from '../../stores/dialogStore'

interface Props {
  content: string
  className?: string
  onSelection?: (text: string, rect: DOMRect) => void
  editable?: boolean
}

// ── Marked config (one-time init) ──
let markedInitialized = false
function ensureMarkedExtensions() {
  if (markedInitialized) return
  markedInitialized = true

  marked.setOptions({ breaks: true, gfm: true })
  marked.use({
    gfm: true,
    breaks: true,
    extensions: [
      {
        name: 'blockMath',
        level: 'block',
        start(src: string) { return src.indexOf('$$'); },
        tokenizer(src: string) {
          const match = src.match(/^\$\$([\s\S]*?)\$\$/);
          if (match) {
            return { type: 'blockMath', raw: match[0], text: match[1].trim() };
          }
        },
        renderer(token: any) {
          return `<div class="math-block bg-gray-50 rounded-lg p-3 my-2 text-xs font-mono border border-gray-200 overflow-x-auto">${token.text}</div>`;
        },
      },
      {
        name: 'inlineMath',
        level: 'inline',
        start(src: string) { return src.indexOf('$'); },
        tokenizer(src: string) {
          const match = src.match(/^\$([^\n$]+?)\$/);
          if (match) {
            return { type: 'inlineMath', raw: match[0], text: match[1] };
          }
        },
        renderer(token: any) {
          return `<code class="math-inline bg-gray-100 text-purple-700 px-1 rounded text-xs font-mono">${token.text}</code>`;
        },
      },
    ],
  })
}

export function TiptapRenderer({ content, className, onSelection, editable = false }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Convert markdown to HTML
  const html = useMemo(() => {
    if (!content) return '<p></p>'
    ensureMarkedExtensions()
    try {
      const result = marked.parse(content)
      return typeof result === 'string' ? result : result.toString()
    } catch {
      return content
    }
  }, [content])

  const editor = useEditor({
    extensions: [StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false,
    })],
    content: html,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && !editable) {
      const currentHtml = editor.getHTML()
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()
      const normalizedCurrent = normalize(currentHtml)
      const normalizedNew = normalize(html)
      if (normalizedCurrent !== normalizedNew && normalizedCurrent !== `<p>${normalizedNew}</p>`) {
        editor.commands.setContent(html)
      }
    }
  }, [html, editor, editable])

  // Handle mouseup to detect text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return

    const container = editorRef.current
    if (container && container.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      onSelection?.(selection.toString().trim(), rect)
    }
  }, [onSelection])

  // Handle click on fc-dialog:// links → navigate to dialog
  const handleRefClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const link = target.closest('a[href^="fc-dialog://"]')
    if (!link) return
    e.preventDefault()
    e.stopPropagation()
    const href = link.getAttribute('href')
    if (!href) return
    const dialogId = href.replace('fc-dialog://', '')
    useDialogStore.getState().setCurrentDialog(dialogId)
  }, [])

  if (!editor) return null

  return (
    <div ref={editorRef} onMouseUp={handleMouseUp} onClick={handleRefClick} className={className}>
      <EditorContent editor={editor} />
    </div>
  )
}
