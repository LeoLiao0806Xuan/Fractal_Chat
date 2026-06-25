import { useMemo, useState, useRef, useEffect } from 'react'
import { useDialogStore } from '../../stores/dialogStore'
import { useSubDialogStore } from '../../stores/subDialogStore'
import { exportDialogToMarkdown, exportDialogToJSON } from '../../lib/exporter'
import { generateSampleDialogs } from '../../lib/sampleData'
import { saveAllDialogs } from '../../lib/db'
import { useTranslation } from '../../i18n'

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
  const { t } = useTranslation()
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

  const applySortMode = (items: TreeNode[]) => {
    if (sortMode === 'newest') {
      return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } else if (sortMode === 'oldest') {
      return [...items].sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
    }
    return sortNodes(items, false)
  }

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
  const [showFilter, setShowFilter] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [sortMode, setSortMode] = useState<'custom' | 'newest' | 'oldest'>('custom')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    dialogs.forEach(d => d.tags?.forEach(t => set.add(t)))
    return [...set].sort()
  }, [dialogs])

  const toggleTag = (tag: string) => {
    setFilterTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setFilterStatus('all')
    setFilterTags([])
    setSortMode('custom')
    setShowArchived(false)
  }

  const hasActiveFilters = filterStatus !== 'all' || filterTags.length > 0 || sortMode !== 'custom'

  const hasDemoDialogs = useMemo(() => dialogs.some(d => d.tags?.includes('demo')), [dialogs])

  const filteredTree = useMemo(() => {
    // 1. Status & tag pre-filter
    let dialogsInView = [...dialogs]
    if (!showArchived || filterStatus === 'active') {
      dialogsInView = dialogsInView.filter(d => d.status !== 'archived')
    } else if (filterStatus === 'archived') {
      dialogsInView = dialogsInView.filter(d => d.status === 'archived')
    }
    if (filterTags.length > 0) {
      dialogsInView = dialogsInView.filter(d =>
        filterTags.every(tag => d.tags?.includes(tag))
      )
    }

    // 2. Build tree from filtered dialogs
    const build = (pid: string): TreeNode[] =>
      applySortMode(dialogsInView.filter(d => d.parentDialogId === pid).map(c => ({
        id: c.id,
        name: c.title.replace(/^[✏️📎🌿]\s*/, ''),
        messageCount: c.messages.length,
        preview: getPreview(c.messages),
        hasSubDialogs: dialogsInView.some(d => d.parentDialogId === c.id),
        isSubDialog: true, parentId: pid,
        children: build(c.id),
        isMerged: /^[✏️📎🌿]/.test(c.title),
        mergeIcon: c.title.startsWith('✏️') ? '🔀' : c.title.startsWith('📎') ? '📎' : '🌿',
        status: c.status, updatedAt: c.updatedAt, tags: c.tags || [],
      })))

    let nodes = applySortMode(dialogsInView.filter(d => !d.parentDialogId).map(r => ({
      id: r.id, name: r.title, messageCount: r.messages.length,
      preview: getPreview(r.messages), hasSubDialogs: dialogsInView.some(d => d.parentDialogId === r.id),
      isSubDialog: false, parentId: null, children: build(r.id),
      isMerged: false, mergeIcon: '', status: r.status, updatedAt: r.updatedAt, tags: r.tags || [],
    })))

    // 3. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const searchFilter = (n: TreeNode): TreeNode | null => {
        const nameM = n.name.toLowerCase().includes(q)
        const prevM = n.preview.toLowerCase().includes(q)
        const dialog = dialogs.find(d => d.id === n.id)
        const contM = dialog?.messages.some(m => m.content.toLowerCase().includes(q))
        const children = n.children.map(searchFilter).filter((x): x is TreeNode => x !== null)
        return (nameM || prevM || contM || children.length > 0) ? { ...n, children } : null
      }
      nodes = nodes.map(r => searchFilter(r)).filter((x): x is TreeNode => x !== null)
    }

    return nodes
  }, [tree, searchQuery, dialogs, showArchived, filterStatus, filterTags, sortMode])

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

  const handleNew = () => createDialog(t('tree.new'))
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
              {node.isMerged && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium shrink-0">{t('tree.merged')}</span>}
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
            title={t('tree.delete')}>✕</button>
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
        <div className="relative">
          <button onClick={handleNew}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl
                       px-3 py-2.5 text-sm font-medium hover:from-indigo-600 hover:to-purple-700
                       transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
            + {t('tree.new')}
          </button>
          {hasDemoDialogs && (
            <span className="absolute -top-1 -right-1 text-[9px] bg-amber-400 text-white font-bold
                           px-1.5 py-0.5 rounded-full shadow-sm leading-none">
              🎬 DEMO
            </span>
          )}
        </div>

        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a3a3a3] text-xs leading-none">🔍</span>
            <input ref={searchInputRef} type="text" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setSearchQuery(''); searchInputRef.current?.blur() } }}
              placeholder={t('tree.search')}
              className="w-full pl-8 pr-7 py-1.5 text-xs border border-[#e4e3ed] rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300
                         bg-[#f8f7fc] focus:bg-white transition-all placeholder:text-[#a3a3a3]" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-gray-600 text-xs">✕</button>
            )}
          </div>
          <button onClick={() => setShowFilter(!showFilter)}
            className={`shrink-0 px-2 py-1.5 text-xs rounded-lg border transition-all
              ${showFilter || hasActiveFilters
                ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                : 'border-[#e4e3ed] text-[#a3a3a3] hover:border-indigo-200 hover:text-indigo-500'}`}>
            {hasActiveFilters ? '🔽' : '⏬'}
          </button>
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div className="bg-[#f8f7fc] rounded-xl p-2.5 space-y-2.5 border border-[#e4e3ed] animate-fade-in">
            {/* Status filter */}
            <div className="flex gap-1">
              {(['all', 'active', 'archived'] as const).map(st => (
                <button key={st} onClick={() => { setFilterStatus(st); if (st === 'all') setShowArchived(false); else if (st === 'active') setShowArchived(false); else setShowArchived(true) }}
                  className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium transition-colors
                    ${filterStatus === st
                      ? 'bg-white text-indigo-600 shadow-sm border border-indigo-200'
                      : 'text-[#a3a3a3] hover:text-gray-600 hover:bg-white/50'}`}>
                  {st === 'all' ? t('tree.filter_status') : st === 'active' ? t('tree.filter_active') : t('tree.filter_archived')}
                </button>
              ))}
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <div>
                <div className="text-[10px] text-[#a3a3a3] mb-1 font-medium">{t('tree.filter_tag')}</div>
                <div className="flex flex-wrap gap-1">
                  {allTags.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-full transition-colors border
                        ${filterTags.includes(tag)
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-300 font-medium'
                          : 'bg-white text-[#737373] border-[#e4e3ed] hover:border-indigo-200 hover:text-indigo-500'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#a3a3a3] font-medium shrink-0">↕</span>
              {(['custom', 'newest', 'oldest'] as const).map(sm => (
                <button key={sm} onClick={() => setSortMode(sm)}
                  className={`text-[10px] px-2 py-1 rounded-md transition-colors
                    ${sortMode === sm
                      ? 'bg-white text-indigo-600 shadow-sm border border-indigo-200'
                      : 'text-[#a3a3a3] hover:text-gray-600'}`}>
                  {sm === 'custom' ? t('tree.sort_custom') : sm === 'newest' ? t('tree.sort_newest') : t('tree.sort_oldest')}
                </button>
              ))}
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="ml-auto text-[10px] text-red-400 hover:text-red-600 transition-colors">
                  ✕ {t('tree.clear_filters')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-0.5">
        {filteredTree.length === 0 ? (
          <div className="text-center text-[#a3a3a3] text-sm py-12 px-4">
            <div className="text-2xl mb-2 opacity-50">{searchQuery ? '🔍' : '💬'}</div>
            <p>{searchQuery ? t('tree.no_match') : t('tree.empty')}</p>
            {!searchQuery && hasDemoDialogs && (
              <button onClick={() => {
                const samples = generateSampleDialogs();
                useDialogStore.setState({ dialogs: samples, currentDialogId: samples[0].id });
                saveAllDialogs(samples);
              }}
              className="mt-4 text-xs text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100
                         px-3 py-1.5 rounded-lg transition-colors font-medium">
                📖 Reload demo data
              </button>
            )}
          </div>
        ) : filteredTree.map(n => renderNode(n, 0))}
        {/* Demo link at bottom of tree */}
        {!hasDemoDialogs && filteredTree.length > 0 && (
          <div className="sticky bottom-0 px-3 pt-1 pb-2 bg-gradient-to-t from-[#faf9fe] via-[#faf9fe] to-transparent">
            <button onClick={() => {
              const samples = generateSampleDialogs();
              useDialogStore.setState({ dialogs: samples, currentDialogId: samples[0].id });
              saveAllDialogs(samples);
            }}
              className="w-full text-[10px] text-[#a3a3a3] hover:text-indigo-500 py-1
                         transition-colors text-center">
              📖 Load demo data
            </button>
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div ref={contextMenuRef}
          className="fixed z-[9999] bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl
                     border border-[#f0eff5]/80 py-1.5 min-w-[160px] animate-fade-in overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}>
          {[
            { label: t('tree.rename'), action: () => {
              const d = dialogs.find(x => x.id === contextMenu.id)
              startRenaming(contextMenu.id, d?.title?.replace(/^[✏️📎🌿]\s*/, '') || '')
              setContextMenu(null)
            }, hover: 'hover:bg-indigo-50 hover:text-indigo-700' },
            ...(dialogs.find(d => d.id === contextMenu.id)?.mergeSnapshot
              ? [{ label: t('tree.undo_merge'), action: () => { useDialogStore.getState().undoMerge(contextMenu.id); setContextMenu(null) }, hover: 'hover:bg-amber-50 hover:text-amber-700' }] : []),
            { label: t('tree.copy_ref'), action: () => {
              const d = dialogs.find(x => x.id === contextMenu.id)
              if (d) navigator.clipboard.writeText(`→[${d.title.replace(/^[✏️📎🌿]\s*/, '')}](fc-dialog://${d.id})`).catch(() => {})
              setContextMenu(null)
            }, hover: 'hover:bg-purple-50 hover:text-purple-700' },
            null,
            { label: t('tree.export_md'), action: () => { const d = dialogs.find(x => x.id === contextMenu.id); if (d) exportDialogToMarkdown(d, dialogs); setContextMenu(null) }, hover: 'hover:bg-gray-50 text-gray-600', muted: true },
            { label: t('tree.export_json'), action: () => { const d = dialogs.find(x => x.id === contextMenu.id); if (d) exportDialogToJSON(d, dialogs); setContextMenu(null) }, hover: 'hover:bg-gray-50 text-gray-600', muted: true },
            null,
            { label: t('tree.add_tag'), action: () => { const tag = prompt(t('tree.tag_placeholder')); if (tag?.trim()) useDialogStore.getState().tagDialog(contextMenu.id, tag.trim()); setContextMenu(null) }, hover: 'hover:bg-gray-50 text-gray-600', muted: true },
            ...(dialogs.find(d => d.id === contextMenu.id)?.tags?.length
              ? [{ tags: dialogs.find(d => d.id === contextMenu.id)?.tags || [] }] : []),
            null,
            (dialogs.find(d => d.id === contextMenu.id)?.status === 'archived'
              ? { label: t('tree.unarchive'), action: () => { useDialogStore.getState().archiveDialog(contextMenu.id); setContextMenu(null) }, hover: 'hover:bg-gray-50 text-gray-600', muted: true }
              : { label: t('tree.archive'), action: () => { useDialogStore.getState().archiveDialog(contextMenu.id); setContextMenu(null) }, hover: 'hover:bg-gray-50 text-gray-600', muted: true }),
            null,
            { label: t('tree.delete'), action: () => { handleDelete(null, contextMenu.id); setContextMenu(null) }, hover: 'hover:bg-red-50 hover:text-red-700', danger: true },
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
