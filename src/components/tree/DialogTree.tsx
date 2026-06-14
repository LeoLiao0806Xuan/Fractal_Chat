import { useMemo, useState, useRef, useEffect } from 'react'
import { useDialogStore } from '../../stores/dialogStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { exportDialogToMarkdown, exportDialogToJSON } from '../../lib/exporter'

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
  status: string
  updatedAt: string
  tags: string[]
}

export function DialogTree() {
  const dialogs = useDialogStore(s => s.dialogs)
  const currentDialogId = useDialogStore(s => s.currentDialogId)
  const setCurrentDialog = useDialogStore(s => s.setCurrentDialog)
  const createDialog = useDialogStore(s => s.createDialog)
  const updateDialogTitle = useDialogStore(s => s.updateDialogTitle)
  const subDialogOpen = useSubDialogStore(s => s.isOpen)
  const currentSubId = useSubDialogStore(s => s.subDialogId)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const COLLAPSED_KEY = 'fractal-chat-collapsed'
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  useEffect(() => {
    try { const s = localStorage.getItem(COLLAPSED_KEY); if (s) setCollapsed(new Set(JSON.parse(s))) } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed])) } catch {}
  }, [collapsed])

  const toggleCollapse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const ORDER_KEY = 'fractal-chat-order'
  const [dialogOrder, setDialogOrder] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '{}') } catch { return {} }
  })

  useEffect(() => { localStorage.setItem(ORDER_KEY, JSON.stringify(dialogOrder)) }, [dialogOrder])

  useEffect(() => {
    const validIds = new Set(dialogs.map(d => d.id))
    const orphaned = Object.keys(dialogOrder).filter(id => !validIds.has(id))
    if (orphaned.length > 0) {
      const cleaned = { ...dialogOrder }
      orphaned.forEach(id => delete cleaned[id])
      setDialogOrder(cleaned)
    }
  }, [dialogs])

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
    const rect = (e.target as HTMLElement).closest('[data-node-id]')?.getBoundingClientRect()
    if (!rect) return
    setDropPosition(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after')
    setDragOverId(id)
  }

  const handleDragLeave = () => setDragOverId(null)

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) { setDragId(null); setDragOverId(null); return }
    const source = dialogs.find(d => d.id === sourceId)
    const target = dialogs.find(d => d.id === targetId)
    if (!source || !target || source.parentDialogId !== target.parentDialogId) { setDragId(null); setDragOverId(null); return }

    const siblings = dialogs.filter(d => d.parentDialogId === source.parentDialogId)
    const sorted = [...siblings].sort((a, b) => (dialogOrder[a.id] ?? 0) - (dialogOrder[b.id] ?? 0))
    const sourceIdx = sorted.findIndex(d => d.id === sourceId)
    sorted.splice(sourceIdx, 1)
    const insertAt = sorted.findIndex(d => d.id === targetId) + (dropPosition === 'after' ? 1 : 0)
    sorted.splice(insertAt, 0, source)

    const newOrder: Record<string, number> = {}
    sorted.forEach((d, i) => { newOrder[d.id] = i })
    setDialogOrder(newOrder)
    setDragId(null); setDragOverId(null)
  }

  const handleDragEnd = () => setDragId(null)

  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    setContextMenu({ id, x: e.clientX, y: e.clientY })
  }

  useEffect(() => {
    if (!contextMenu) return
    const h = (e: MouseEvent) => { if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) setContextMenu(null) }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null) }
    const id = setTimeout(() => document.addEventListener('mousedown', h), 0)
    document.addEventListener('keydown', k)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [contextMenu])

  const startRenaming = (id: string, name: string) => { setRenamingId(id); setRenameValue(name) }
  const confirmRename = () => { if (renamingId && renameValue.trim()) updateDialogTitle(renamingId, renameValue.trim()); setRenamingId(null) }
  const cancelRename = () => setRenamingId(null)

  useEffect(() => {
    if (renamingId && renameInputRef.current) { renameInputRef.current.focus(); renameInputRef.current.select() }
  }, [renamingId])

  const sortNodes = (items: TreeNode[], byDate = false) =>
    [...items].sort((a, b) => byDate
      ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      : (dialogOrder[a.id] ?? Number.MAX_SAFE_INTEGER) - (dialogOrder[b.id] ?? Number.MAX_SAFE_INTEGER))

  const tree = useMemo((): TreeNode[] => {
    const build = (pid: string): TreeNode[] =>
      sortNodes(dialogs.filter(d => d.parentDialogId === pid).map(c => ({
        id: c.id,
        name: c.title.replace(/^[✏️📎🌿]\s*/, ''),
        messageCount: c.messages.length,
        preview: getPreview(c.messages),
        hasSubDialogs: dialogs.some(d => d.parentDialogId === c.id),
        isSubDialog: true, parentId: pid,
        children: build(c.id),
        isMerged: /^[✏️📎🌿]/.test(c.title),
        mergeIcon: c.title.startsWith('✏️') ? '🔀' : c.title.startsWith('📎') ? '📎' : '🌿',
        status: c.status, updatedAt: c.updatedAt, tags: c.tags || [],
      })))

    return sortNodes(dialogs.filter(d => !d.parentDialogId).map(r => ({
      id: r.id, name: r.title, messageCount: r.messages.length,
      preview: getPreview(r.messages), hasSubDialogs: dialogs.some(d => d.parentDialogId === r.id),
      isSubDialog: false, parentId: null, children: build(r.id),
      isMerged: false, mergeIcon: '', status: r.status, updatedAt: r.updatedAt, tags: r.tags || [],
    })))
  }, [dialogs, dialogOrder])

  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredTree = useMemo(() => {
    let nodes = tree
    if (!showArchived) {
      const hide = (n: TreeNode): TreeNode | null => {
        if (n.status === 'archived') return null
        const children = n.children.map(hide).filter((x): x is TreeNode => x !== null)
        return { ...n, children }
      }
      nodes = tree.map(hide).filter((x): x is TreeNode => x !== null)
    }
    if (!searchQuery.trim()) return nodes
    const q = searchQuery.toLowerCase()
    const filter = (n: TreeNode): TreeNode | null => {
      const nameM = n.name.toLowerCase().includes(q)
      const prevM = n.preview.toLowerCase().includes(q)
      const dialog = dialogs.find(d => d.id === n.id)
      const contM = dialog?.messages.some(m => m.content.toLowerCase().includes(q))
      const children = n.children.map(filter).filter((x): x is TreeNode => x !== null)
      return (nameM || prevM || contM || children.length > 0) ? { ...n, children } : null
    }
    return tree.map(r => filter(r)).filter((x): x is TreeNode => x !== null)
  }, [tree, searchQuery, dialogs, showArchived])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
        if (document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); searchInputRef.current?.focus() }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
        if (useSubDialogStore.getState().isOpen) return
        e.preventDefault()
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed || !sel.toString().trim()) return
        const text = sel.toString().trim()
        const range = sel.getRangeAt(0)
        const msgEl = range.commonAncestorContainer?.parentElement?.closest('[data-msg-id]')
        if (!msgEl) return
        const mid = msgEl.getAttribute('data-msg-id')
        const did = msgEl.closest('[data-dialog-id]')?.getAttribute('data-dialog-id')
        if (mid && did) useSubDialogStore.getState().open(text, 'deep-dive', mid, did)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleNew = () => createDialog('新对话')
  const handleDelete = (e: React.MouseEvent | null, id: string) => { e?.stopPropagation(); useDialogStore.getState().deleteDialog(id) }

  const renderNode = (node: TreeNode, depth = 0) => {
    const active = node.id === currentDialogId
    const hasKids = node.children.length > 0
    const expanded = !collapsed.has(node.id)
    const isOver = dragOverId === node.id
    const indent = node.isSubDialog ? `${Math.min(depth, 8) * 14 + 8}px` : '12px'

    return (
      <div key={node.id}>
        {isOver && dropPosition === 'before' && <div className="h-0.5 bg-indigo-400 rounded-full mx-3" />}
        <div data-node-id={node.id}
          draggable={renamingId !== node.id}
          onDragStart={e => handleDragStart(e, node.id)}
          onDragOver={e => handleDragOver(e, node.id)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, node.id)}
          onDragEnd={handleDragEnd}
          onContextMenu={e => handleContextMenu(e, node.id)}
          onClick={() => { if (!(subDialogOpen && currentSubId === node.id)) setCurrentDialog(node.id) }}
          className={`flex items-start gap-1.5 px-3 py-2 rounded-lg cursor-pointer text-sm
                      transition-all duration-150 group relative select-none
                      ${active
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50/50 text-indigo-700 font-medium shadow-sm'
                        : 'text-[#52525b] hover:bg-[#f1f0ff]'
                      }
                      ${node.isSubDialog ? 'border-l-[2.5px] border-l-[#e4e3ed]' : ''}
                      ${active && node.isSubDialog ? '!border-l-indigo-400' : ''}
                      ${isOver ? 'ring-2 ring-indigo-300 ring-inset' : ''}`}
          style={{ paddingLeft: indent }}>
          {hasKids ? (
            <button onClick={e => toggleCollapse(e, node.id)}
              className="shrink-0 mt-0.5 w-4 text-[10px] text-[#a3a3a3] hover:text-[#6366f1] transition-colors">
              {expanded ? '▼' : '▶'}
            </button>
          ) : <span className="shrink-0 w-4" />}
          <span className="shrink-0 mt-0.5 text-sm">
            {node.isSubDialog
              ? node.isMerged
                ? <span className="text-emerald-500">{node.mergeIcon}</span>
                : <span className="text-[#a3a3a3]">↳</span>
              : hasKids
                ? <span className="text-amber-500">📁</span>
                : <span className="text-indigo-400">💬</span>
            }
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1" onDoubleClick={e => { e.stopPropagation(); startRenaming(node.id, node.name) }}>
              {renamingId === node.id ? (
                <input ref={renameInputRef} type="text" value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') confirmRename(); else if (e.key === 'Escape') cancelRename() }}
                  onBlur={confirmRename} onClick={e => e.stopPropagation()}
                  className="w-full px-1.5 py-0.5 text-sm border border-indigo-400 rounded-md
                             outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm"
                  autoFocus />
              ) : (
                <span className={`truncate ${active ? 'text-indigo-700' : ''}`}>{node.name}</span>
              )}
              {node.isMerged && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium shrink-0">已合并</span>}
              {node.status === 'archived' && <span className="text-[10px] text-[#a3a3a3] shrink-0">📦</span>}
            </div>
            {node.preview && renamingId !== node.id && (
              <div className={`text-xs truncate mt-0.5 ${active ? 'text-indigo-400/70' : 'text-[#a3a3a3]'}`}>{node.preview}</div>
            )}
          </div>
          {node.messageCount > 0 && (
            <span className={`text-[10px] shrink-0 mt-0.5 ${active ? 'text-indigo-400' : 'text-[#a3a3a3]'}`}>
              {node.messageCount}
            </span>
          )}
          <button onClick={e => handleDelete(e, node.id)}
            className="opacity-0 group-hover:opacity-100 text-[#a3a3a3] hover:text-red-500
                       text-xs shrink-0 mt-0.5 transition-all"
            title="删除">✕</button>
        </div>
        {hasKids && expanded && (
          <div className="animate-slide-down">{node.children.map(c => renderNode(c, depth + 1))}</div>
        )}
        {isOver && dropPosition === 'after' && <div className="h-0.5 bg-indigo-400 rounded-full mx-3" />}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-[#f0eff5] space-y-2">
        <button onClick={handleNew}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl
                     px-3 py-2.5 text-sm font-medium hover:from-indigo-600 hover:to-purple-700
                     transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
          + 新建对话
        </button>

        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a3a3a3] text-xs leading-none">🔍</span>
          <input ref={searchInputRef} type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setSearchQuery(''); searchInputRef.current?.blur() } }}
            placeholder="搜索对话..."
            className="w-full pl-8 pr-7 py-1.5 text-xs border border-[#e4e3ed] rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300
                       bg-[#f8f7fc] focus:bg-white transition-all placeholder:text-[#a3a3a3]" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-gray-600 text-xs">✕</button>
          )}
        </div>

        <button onClick={() => setShowArchived(!showArchived)}
          className={`text-xs w-full text-left px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5
            ${showArchived ? 'bg-[#f1f0ff] text-indigo-600' : 'text-[#a3a3a3] hover:text-gray-500 hover:bg-gray-50'}`}>
          {showArchived ? '📂 显示全部' : '📦 隐藏已归档'}
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-0.5">
        {filteredTree.length === 0 ? (
          <div className="text-center text-[#a3a3a3] text-sm py-12 px-4">
            <div className="text-2xl mb-2 opacity-50">{searchQuery ? '🔍' : '💬'}</div>
            <p>{searchQuery ? '未找到匹配的对话' : '暂无对话'}</p>
          </div>
        ) : filteredTree.map(n => renderNode(n, 0))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div ref={contextMenuRef}
          className="fixed z-[9999] bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl
                     border border-[#f0eff5]/80 py-1.5 min-w-[160px] animate-fade-in overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}>
          {[
            { label: '✏️ 重命名', action: () => {
              const d = dialogs.find(x => x.id === contextMenu.id)
              startRenaming(contextMenu.id, d?.title?.replace(/^[✏️📎🌿]\s*/, '') || '')
              setContextMenu(null)
            }, hover: 'hover:bg-indigo-50 hover:text-indigo-700' },
            ...(dialogs.find(d => d.id === contextMenu.id)?.mergeSnapshot
              ? [{ label: '↩️ 撤销合并', action: () => { useDialogStore.getState().undoMerge(contextMenu.id); setContextMenu(null) }, hover: 'hover:bg-amber-50 hover:text-amber-700' }] : []),
            { label: '🔗 复制引用', action: () => {
              const d = dialogs.find(x => x.id === contextMenu.id)
              if (d) navigator.clipboard.writeText(`→[${d.title.replace(/^[✏️📎🌿]\s*/, '')}](fc-dialog://${d.id})`).catch(() => {})
              setContextMenu(null)
            }, hover: 'hover:bg-purple-50 hover:text-purple-700' },
            null,
            { label: '📥 导出 MD', action: () => { const d = dialogs.find(x => x.id === contextMenu.id); if (d) exportDialogToMarkdown(d, dialogs); setContextMenu(null) }, hover: 'hover:bg-gray-50 text-gray-600', muted: true },
            { label: '📥 导出 JSON', action: () => { const d = dialogs.find(x => x.id === contextMenu.id); if (d) exportDialogToJSON(d, dialogs); setContextMenu(null) }, hover: 'hover:bg-gray-50 text-gray-600', muted: true },
            null,
            { label: '🏷️ 添加标签', action: () => { const tag = prompt('输入标签：'); if (tag?.trim()) useDialogStore.getState().tagDialog(contextMenu.id, tag.trim()); setContextMenu(null) }, hover: 'hover:bg-gray-50 text-gray-600', muted: true },
            ...(dialogs.find(d => d.id === contextMenu.id)?.tags?.length
              ? [{ tags: dialogs.find(d => d.id === contextMenu.id)?.tags || [] }] : []),
            null,
            (dialogs.find(d => d.id === contextMenu.id)?.status === 'archived'
              ? { label: '📂 取消归档', action: () => { useDialogStore.getState().archiveDialog(contextMenu.id); setContextMenu(null) }, hover: 'hover:bg-gray-50 text-gray-600', muted: true }
              : { label: '📦 归档', action: () => { useDialogStore.getState().archiveDialog(contextMenu.id); setContextMenu(null) }, hover: 'hover:bg-gray-50 text-gray-600', muted: true }),
            null,
            { label: '🗑️ 删除', action: () => { handleDelete(null, contextMenu.id); setContextMenu(null) }, hover: 'hover:bg-red-50 hover:text-red-700', danger: true },
          ].filter(Boolean).map((item: any, i) =>
            item === null ? <div key={i} className="border-t border-[#f0eff5] my-1" /> :
            item.tags ? (
              <div key={i} className="flex flex-wrap gap-1 px-3 py-1.5">
                {item.tags.map((t: string) => (
                  <span key={t} className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">
                    {t}
                    <button onClick={() => { useDialogStore.getState().untagDialog(contextMenu.id, t); setContextMenu(null) }}
                      className="text-indigo-400 hover:text-red-500 ml-0.5">✕</button>
                  </span>
                ))}
              </div>
            ) : (
              <button key={i} onClick={item.action}
                className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${item.hover || 'hover:bg-gray-50'}`}>
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

function getPreview(messages: { role: string; content: string }[]): string {
  const first = messages.find(m => m.role === 'user' || m.role === 'assistant')
  if (!first) return ''
  const text = first.content.replace(/<[^>]+>/g, '').replace(/```[\s\S]*?```/g, '').replace(/#{1,6}\s/g, '').replace(/\n+/g, ' ').trim()
  return text.length > 60 ? text.slice(0, 60) + '…' : text
}
