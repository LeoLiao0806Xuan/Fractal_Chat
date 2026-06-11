import { useMemo, useState, useRef, useEffect } from 'react'
import { useDialogStore } from '../../stores/dialogStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { useModelStore } from '../../stores/modelStore'

interface TreeNode {
  id: string
  name: string
  children: TreeNode[]
  messageCount: number
  preview: string
  hasSubDialogs: boolean
  isSubDialog: boolean
  parentId: string | null
  isMerged: boolean
  mergeIcon: string
}

export function DialogTree() {
  const dialogs = useDialogStore(s => s.dialogs)
  const currentDialogId = useDialogStore(s => s.currentDialogId)
  const setCurrentDialog = useDialogStore(s => s.setCurrentDialog)
  const createDialog = useDialogStore(s => s.createDialog)
  const updateDialogTitle = useDialogStore(s => s.updateDialogTitle)
  const subDialogOpen = useSubDialogStore(s => s.isOpen)
  const currentSubId = useSubDialogStore(s => s.subDialogId)

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Collapse state: set of collapsed node IDs, persisted to localStorage
  const COLLAPSED_KEY = 'fractal-chat-collapsed'
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_KEY)
      if (saved) setCollapsed(new Set(JSON.parse(saved)))
    } catch { /* ignore */ }
  }, [])

  // Save collapsed state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed]))
    } catch { /* ignore */ }
  }, [collapsed])

  const toggleCollapse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Dialog order (drag-and-drop reordering) ──
  const ORDER_KEY = 'fractal-chat-order'
  const [dialogOrder, setDialogOrder] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '{}') } catch { return {} }
  })

  // Persist dialog order to localStorage
  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(dialogOrder))
  }, [dialogOrder])

  // Clean up orphaned order entries when dialogs are deleted
  useEffect(() => {
    const validIds = new Set(dialogs.map(d => d.id))
    const orphaned = Object.keys(dialogOrder).filter(id => !validIds.has(id))
    if (orphaned.length > 0) {
      const cleaned = { ...dialogOrder }
      orphaned.forEach(id => delete cleaned[id])
      setDialogOrder(cleaned)
    }
  }, [dialogs])


  // Drag-and-drop state
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after')

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    setDragId(id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id === dragId) return

    // Determine drop position (before/after based on mouse Y)
    const rect = (e.target as HTMLElement).closest('[data-node-id]')?.getBoundingClientRect()
    if (!rect) return
    const midY = rect.top + rect.height / 2
    const pos = e.clientY < midY ? 'before' : 'after'

    setDragOverId(id)
    setDropPosition(pos)
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) { setDragId(null); setDragOverId(null); return }

    // Get siblings (same parent level) for both source and target
    const source = dialogs.find(d => d.id === sourceId)
    const target = dialogs.find(d => d.id === targetId)
    if (!source || !target) { setDragId(null); setDragOverId(null); return }

    const parentId = source.parentDialogId
    if (parentId !== target.parentDialogId) { setDragId(null); setDragOverId(null); return }

    const siblings = dialogs.filter(d => d.parentDialogId === parentId)
    const sorted = [...siblings].sort((a, b) => (dialogOrder[a.id] ?? 0) - (dialogOrder[b.id] ?? 0))
    const sourceIdx = sorted.findIndex(d => d.id === sourceId)

    // Remove source from sorted list
    sorted.splice(sourceIdx, 1)
    const targetNewIdx = sorted.findIndex(d => d.id === targetId)
    const insertAt = dropPosition === 'before' ? targetNewIdx : targetNewIdx + 1
    sorted.splice(insertAt, 0, source)

    // Reassign orders
    const newOrder: Record<string, number> = { ...dialogOrder }
    sorted.forEach((d, i) => { newOrder[d.id] = i })
    setDialogOrder(newOrder)
    setDragId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDragId(null)
    setDragOverId(null)
  }

  // Order managed by dialogOrder state

  // ── Model presets ──
  const modelConfigs = useModelStore(s => s.configs)
  const activeModelId = useModelStore(s => s.activeModelId)
  const setActiveModel = useModelStore(s => s.setActiveModel)
  const activeModel = modelConfigs.find(c => c.id === activeModelId)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const modelButtonRef = useRef<HTMLButtonElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)

  // Close model dropdown on click outside
  useEffect(() => {
    if (!modelDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false)
      }
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [modelDropdownOpen])

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ id, x: e.clientX, y: e.clientY })
  }

  // Close context menu on click outside or Escape
  useEffect(() => {
    if (!contextMenu) return
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handleClick), 0)
    document.addEventListener('keydown', handleKey)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [contextMenu])

  const startRenaming = (id: string, currentName: string) => {
    setRenamingId(id)
    setRenameValue(currentName)
  }

  const confirmRename = () => {
    if (renamingId && renameValue.trim()) {
      updateDialogTitle(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  const cancelRename = () => {
    setRenamingId(null)
  }

  // Auto focus the rename input when it appears
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  // Sort helper: use stored order map, fallback to created time
  const sortNodes = (items: TreeNode[]) => {
    return [...items].sort((a, b) => (dialogOrder[a.id] ?? Number.MAX_SAFE_INTEGER) - (dialogOrder[b.id] ?? Number.MAX_SAFE_INTEGER))
  }

  // Build tree from flat dialog list (memoized)
  const tree = useMemo((): TreeNode[] => {
    const buildSubTree = (parentId: string): TreeNode[] =>
      sortNodes(
        dialogs
          .filter(d => d.parentDialogId === parentId)
          .map(child => ({
          id: child.id,
          name: child.title.replace(/^[✏️📎🌿]\s*/, ''), // strip merge status emoji from name
          messageCount: child.messages.length,
          preview: getPreview(child.messages),
          hasSubDialogs: dialogs.some(d => d.parentDialogId === child.id),
          isSubDialog: true,
          parentId,
          children: buildSubTree(child.id),
          isMerged: child.title.startsWith('✏️') || child.title.startsWith('📎') || child.title.startsWith('🌿'),
          mergeIcon: child.title.startsWith('✏️') ? '🔀' : child.title.startsWith('📎') ? '📎' : child.title.startsWith('🌿') ? '🌿' : '',
        })))

    return sortNodes(
      dialogs
        .filter(d => !d.parentDialogId)
        .map(root => ({
        id: root.id,
        name: root.title,
        messageCount: root.messages.length,
        preview: getPreview(root.messages),
        hasSubDialogs: dialogs.some(d => d.parentDialogId === root.id),
        isSubDialog: false,
        parentId: null,
        children: buildSubTree(root.id),
        isMerged: false,
        mergeIcon: '',
      })))
  }, [dialogs, dialogOrder])
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter tree by search query (keeps matching nodes + ancestor chain)
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree
    const q = searchQuery.toLowerCase()

    const filterNode = (node: TreeNode): TreeNode | null => {
      const nameMatch = node.name.toLowerCase().includes(q)
      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter((n): n is TreeNode => n !== null)
      if (nameMatch || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren }
      }
      return null
    }

    return tree.map(root => filterNode(root)).filter((n): n is TreeNode => n !== null)
  }, [tree, searchQuery])

  // Focus search on Ctrl+F / Cmd+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
        if (document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
      // Ctrl+Shift+D / Cmd+Shift+D: create sub-dialog from selection
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        // Guard: don't fire when focus is in input/textarea
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        // Guard: don't fire if sub-dialog panel is already open
        if (useSubDialogStore.getState().isOpen) return;
        e.preventDefault()
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed || !sel.toString().trim()) return
        const text = sel.toString().trim()
        const range = sel.getRangeAt(0)

        // Find the dialog containing this selection
        const msgEl = range.commonAncestorContainer?.parentElement?.closest('[data-msg-id]')
        if (!msgEl) return
        const messageId = msgEl.getAttribute('data-msg-id')
        // Find parent dialog from the closest message list
        const listEl = msgEl.closest('[data-dialog-id]')
        const dialogId = listEl?.getAttribute('data-dialog-id')

        if (messageId && dialogId) {
          // If we're in a sub-dialog, use its ID as parent
          const subDialogOpen = useSubDialogStore.getState().isOpen
          const subDialogId = useSubDialogStore.getState().subDialogId
          const parentDialogId = (subDialogOpen && subDialogId) ? subDialogId : dialogId
          useSubDialogStore.getState().open(text, 'deep-dive', messageId, parentDialogId)
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleNewDialog = () => {
    createDialog('新对话')
  }

  const handleDelete = (e: React.MouseEvent | null, id: string) => {
    e?.stopPropagation()
    useDialogStore.getState().deleteDialog(id)
  }

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isActive = node.id === currentDialogId
    const hasChildren = node.children.length > 0
    const isDragOver = dragOverId === node.id
    const showBefore = isDragOver && dropPosition === 'before'
    const showAfter = isDragOver && dropPosition === 'after'

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm
            transition-all group relative
            ${node.isSubDialog
              ? 'ml-3 border-l-2 ' + (isActive ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300')
              : ''
            }
            ${isActive && !node.isSubDialog
              ? 'bg-blue-100 text-blue-800 font-medium'
              : node.isSubDialog
                ? 'hover:bg-gray-50 text-gray-700'
                : 'hover:bg-gray-100 text-gray-800'
            }
          `}
          data-node-id={node.id}
          draggable={renamingId !== node.id}
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.id)}
          onDragEnd={handleDragEnd}
          style={{ paddingLeft: `${node.isSubDialog ? 8 : 12}px` }}
          onContextMenu={(e) => handleContextMenu(e, node.id)}
          onClick={() => {
            // Don't navigate main area to sub-dialog if the panel is already open
            if (subDialogOpen && currentSubId === node.id) return
            setCurrentDialog(node.id)
          }}
        >
          {/* Collapse toggle (only for nodes with children) */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleCollapse(e, node.id)}
              className="shrink-0 mt-0.5 text-xs w-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {collapsed.has(node.id) ? '▶' : '▼'}
            </button>
          ) : (
            <span className="shrink-0 w-4" />
          )}

          {/* Status icon */}
          <span className="shrink-0 mt-0.5 text-sm">
            {node.isSubDialog
              ? node.isMerged ? node.mergeIcon : '↳'
              : hasChildren ? '📁' : '💬'
            }
          </span>

          {/* Title + preview */}
          <div className="flex-1 min-w-0">
            <div className="truncate flex items-center gap-1" onDoubleClick={(e) => { e.stopPropagation(); startRenaming(node.id, node.name) }}>
              {renamingId === node.id ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    e.stopPropagation()
                    if (e.key === 'Enter') confirmRename()
                    else if (e.key === 'Escape') cancelRename()
                  }}
                  onBlur={confirmRename}
                  onClick={e => e.stopPropagation()}
                  className="w-full px-1 py-0.5 text-sm border border-blue-400 rounded
                             outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                />
              ) : (
                <span className="truncate cursor-pointer hover:text-blue-600">{node.name}</span>
              )}
              {node.isMerged && (
                <span className="text-xs text-green-600 shrink-0">已合并</span>
              )}
            </div>
            {node.preview && renamingId !== node.id && (
              <div className="text-xs text-gray-400 truncate mt-0.5">{node.preview}</div>
            )}
          </div>

          {/* Message count badge */}
          {node.messageCount > 0 && (
            <span className="text-xs text-gray-400 shrink-0 mt-0.5">{node.messageCount}</span>
          )}

          {/* Delete button (show on hover) */}
          <button
            onClick={(e) => handleDelete(e, node.id)}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs shrink-0 mt-0.5 transition-opacity"
            title="删除"
          >
            ✕
          </button>
        </div>

        {/* Children (sub-dialogs) */}
        {/* Drag-over indicator: line above */}
        {showBefore && <div className="h-0.5 bg-blue-400 rounded-full mx-2" />}

        {hasChildren && !collapsed.has(node.id) && (
          <div className="animate-slide-down">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}

        {/* Drag-over indicator: line below */}
        {showAfter && <div className="h-0.5 bg-blue-400 rounded-full mx-2" />}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 space-y-2">
        <button
          onClick={handleNewDialog}
          className="w-full bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium
                     hover:bg-blue-700 transition-colors"
        >
          + 新建对话
        </button>

        {/* Search input */}
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setSearchQuery(''); searchInputRef.current?.blur() } }}
            placeholder="搜索对话..."
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300
                       bg-gray-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredTree.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            {searchQuery ? '未找到匹配的对话' : '暂无对话'}
          </div>
        ) : (
          filteredTree.map(node => renderNode(node, 0))
        )}
      </div>

      {/* Model selector footer */}
      <div className="border-t border-gray-200 p-2 shrink-0 relative">
        <button
          onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs
                     hover:bg-gray-100 transition-colors text-gray-600"
        >
          <span>🤖</span>
          <span className="truncate flex-1 text-left">{activeModel?.name || '未配置模型'}</span>
          <span className="text-gray-400">{modelDropdownOpen ? '▼' : '▲'}</span>
        </button>

        {modelDropdownOpen && (
                  <div className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 animate-fade-in min-w-[180px]"
                        style={{
                              left: (modelButtonRef.current?.getBoundingClientRect().left ?? 8) + 'px',
                              top: 'auto',
                        bottom: (window.innerHeight - (modelButtonRef.current?.getBoundingClientRect().top ?? 0) + 4) + 'px',
                        }}>
            {modelConfigs.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">暂无模型配置</div>
            ) : (
              modelConfigs.map(config => (
                <button
                  key={config.id}
                  onClick={() => { setActiveModel(config.id); setModelDropdownOpen(false) }}
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2
                    ${config.id === activeModelId ? 'text-blue-600 bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <span>{config.id === activeModelId ? '●' : '○'}</span>
                  <span className="truncate">{config.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{config.modelName}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[120px] animate-fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              const dialog = dialogs.find(d => d.id === contextMenu.id)
              startRenaming(contextMenu.id, dialog?.title?.replace(/^[✏️📎🌿]\s*/, '') || '')
              setContextMenu(null)
            }}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
          >
            ✏️ 重命名
          </button>
          <button
            onClick={() => { handleDelete(null, contextMenu.id); setContextMenu(null) }}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
          >
            🗑️ 删除
          </button>
        </div>
      )}
    </div>
  )
}

/** Extract first user or assistant message as preview text */
function getPreview(messages: { role: string; content: string }[]): string {
  const first = messages.find(m => m.role === 'user' || m.role === 'assistant')
  if (!first) return ''
  const text = first.content
    .replace(/<[^>]+>/g, '')    // strip HTML
    .replace(/```[\s\S]*?```/g, '') // strip code blocks
    .replace(/#{1,6}\s/g, '')   // strip markdown headers
    .replace(/\n+/g, ' ')       // collapse newlines
    .trim()
  return text.length > 60 ? text.slice(0, 60) + '…' : text
}
