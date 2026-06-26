import { create } from 'zustand'
import type { Dialog, Message } from '../lib/types'
import { generateId, getTimestamp } from '../lib/utils'

interface DialogState {
  // Data
  dialogs: Dialog[]
  currentDialogId: string | null

  // Computed
  currentDialog: () => Dialog | undefined

  // Actions
  createDialog: (title?: string, parentDialogId?: string, rootDialogId?: string, activate?: boolean) => string
  setCurrentDialog: (id: string) => void
  deleteDialog: (id: string) => void
  updateDialogTitle: (id: string, title: string) => void
  updateDialog: (id: string, updates: Partial<Dialog>) => void

  // Messages
  addMessage: (dialogId: string, msg: Omit<Message, 'id' | 'createdAt'>) => string
  updateMessage: (dialogId: string, msgId: string, updates: Partial<Message>) => void
  clearMessages: (dialogId: string) => void

  // Status
  archiveDialog: (id: string) => void
  tagDialog: (id: string, tag: string) => void
  untagDialog: (id: string, tag: string) => void

  // Merge
  undoMerge: (subDialogId: string) => void
}

export const useDialogStore = create<DialogState>((set, get) => ({
  dialogs: [],
  currentDialogId: null,

  currentDialog: () => {
    const { dialogs, currentDialogId } = get()
    return dialogs.find(d => d.id === currentDialogId)
  },

  createDialog: (title = '新对话', parentDialogId?: string, rootDialogId?: string, activate = true) => {
    const id = generateId()
    const now = getTimestamp()
    const dialog: Dialog = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
      messages: [],
      status: 'active',
      parentDialogId: parentDialogId ?? null,
      rootDialogId: rootDialogId ?? id,
    }
    set(state => ({
      dialogs: [...state.dialogs, dialog],
      ...(activate ? { currentDialogId: id } : {}),
    }))
    return id
  },

  setCurrentDialog: (id) => {
    set({ currentDialogId: id })
  },

  deleteDialog: (id) => {
    set(state => {
      // Cascade delete: recursively find and remove all child dialogs
      const idsToRemove = new Set<string>()
      const collectChildren = (parentId: string) => {
        idsToRemove.add(parentId)
        state.dialogs.forEach(d => {
          if (d.parentDialogId === parentId && !idsToRemove.has(d.id)) {
            collectChildren(d.id)
          }
        })
      }
      collectChildren(id)
      return {
        dialogs: state.dialogs.filter(d => !idsToRemove.has(d.id)),
        currentDialogId: idsToRemove.has(state.currentDialogId ?? '') ? null : state.currentDialogId,
      }
    })
  },

  updateDialogTitle: (id, title) => {
    set(state => ({
      dialogs: state.dialogs.map(d => d.id === id ? { ...d, title } : d),
    }))
  },

  updateDialog: (id, updates) => {
    set(state => ({
      dialogs: state.dialogs.map(d => d.id === id ? { ...d, ...updates } : d),
    }))
  },

  addMessage: (dialogId, msg) => {
    const msgId = generateId()
    const fullMsg: Message = { ...msg, id: msgId, createdAt: getTimestamp() }
    set(state => ({
      dialogs: state.dialogs.map(d =>
        d.id === dialogId
          ? { ...d, messages: [...d.messages, fullMsg], updatedAt: getTimestamp() }
          : d
      ),
    }))
    return msgId
  },

  updateMessage: (dialogId, msgId, updates) => {
    set(state => ({
      dialogs: state.dialogs.map(d =>
        d.id === dialogId
          ? {
              ...d,
              messages: d.messages.map(m =>
                m.id === msgId
                  ? { ...m, ...updates,
                      previousVersions:
                        m.content !== updates.content && updates.content && m.status !== 'streaming'
                          ? [...(m.previousVersions || []), { content: m.content, editedAt: getTimestamp() }]
                          : m.previousVersions,
                    }
                  : m
              ),
              updatedAt: getTimestamp(),
            }
          : d
      ),
    }))
  },

  clearMessages: (dialogId) => {
    set(state => ({
      dialogs: state.dialogs.map(d =>
        d.id === dialogId ? { ...d, messages: [], updatedAt: getTimestamp() } : d
      ),
    }))
  },

  archiveDialog: (id) => {
    set(state => ({
      dialogs: state.dialogs.map(d =>
        d.id === id ? { ...d, status: d.status === 'archived' ? 'active' : 'archived', updatedAt: getTimestamp() } : d
      ),
    }))
  },

  tagDialog: (id, tag) => {
    set(state => ({
      dialogs: state.dialogs.map(d =>
        d.id === id ? { ...d, tags: [...new Set([...(d.tags || []), tag])], updatedAt: getTimestamp() } : d
      ),
    }))
  },

  untagDialog: (id, tag) => {
    set(state => ({
      dialogs: state.dialogs.map(d =>
        d.id === id ? { ...d, tags: (d.tags || []).filter(t => t !== tag), updatedAt: getTimestamp() } : d
      ),
    }))
  },

  undoMerge: (subDialogId) => {
    set(state => {
      const subDialog = state.dialogs.find(d => d.id === subDialogId)
      if (!subDialog?.mergeSnapshot) return state

      const { parentMessageId, originalContent, originalTitle } = subDialog.mergeSnapshot
      const parentDialogId = subDialog.parentDialogId
      if (!parentDialogId) return state

      return {
        dialogs: state.dialogs.map(d => {
          // Restore parent message content
          if (d.id === parentDialogId) {
            return {
              ...d,
              messages: d.messages.map(m =>
                m.id === parentMessageId
                  ? { ...m, content: originalContent, mergedFromSubDialogId: undefined }
                  : m
              ),
            }
          }
          // Restore sub-dialog title and clear snapshot
          if (d.id === subDialogId) {
            return { ...d, title: originalTitle, mergeSnapshot: undefined }
          }
          return d
        }),
      }
    })
  },
}))
