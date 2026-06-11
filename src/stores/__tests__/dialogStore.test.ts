import { describe, it, expect, beforeEach } from 'vitest'
import { useDialogStore } from '../dialogStore'

beforeEach(() => {
  useDialogStore.setState({ dialogs: [], currentDialogId: null })
})

describe('dialogStore', () => {
  describe('createDialog', () => {
    it('creates a dialog and sets as current', () => {
      const id = useDialogStore.getState().createDialog('Test')
      const state = useDialogStore.getState()
      expect(state.dialogs).toHaveLength(1)
      expect(state.dialogs[0].title).toBe('Test')
      expect(state.currentDialogId).toBe(id)
    })

    it('creates with parentDialogId', () => {
      const pid = useDialogStore.getState().createDialog('Parent')
      const cid = useDialogStore.getState().createDialog('Child', pid, pid, false)
      const child = useDialogStore.getState().dialogs.find(d => d.id === cid)
      expect(child?.parentDialogId).toBe(pid)
    })
  })

  describe('setCurrentDialog', () => {
    it('switches current dialog', () => {
      const id = useDialogStore.getState().createDialog('A')
      const id2 = useDialogStore.getState().createDialog('B', undefined, undefined, true)
      useDialogStore.getState().setCurrentDialog(id)
      expect(useDialogStore.getState().currentDialogId).toBe(id)
    })
  })

  describe('deleteDialog', () => {
    it('deletes a dialog', () => {
      const id = useDialogStore.getState().createDialog('Test')
      useDialogStore.getState().deleteDialog(id)
      expect(useDialogStore.getState().dialogs).toHaveLength(0)
    })

    it('cascade deletes child dialogs', () => {
      const pid = useDialogStore.getState().createDialog('Parent')
      const cid = useDialogStore.getState().createDialog('Child', pid, pid, false)
      useDialogStore.getState().deleteDialog(pid)
      const state = useDialogStore.getState()
      expect(state.dialogs).toHaveLength(0)
    })
  })

  describe('updateDialogTitle', () => {
    it('updates title', () => {
      const id = useDialogStore.getState().createDialog('Old')
      useDialogStore.getState().updateDialogTitle(id, 'New')
      expect(useDialogStore.getState().dialogs[0].title).toBe('New')
    })
  })

  describe('updateDialog', () => {
    it('partial update', () => {
      const id = useDialogStore.getState().createDialog('Test')
      useDialogStore.getState().updateDialog(id, { title: 'Updated', status: 'archived' })
      const d = useDialogStore.getState().dialogs[0]
      expect(d.title).toBe('Updated')
      expect(d.status).toBe('archived')
    })
  })

  describe('addMessage', () => {
    it('adds message to dialog', () => {
      const id = useDialogStore.getState().createDialog('Test')
      const msgId = useDialogStore.getState().addMessage(id, {
        role: 'user',
        content: 'hello',
        parentId: null,
        branchId: 'main',
        status: 'complete',
      })
      const d = useDialogStore.getState().dialogs[0]
      expect(d.messages).toHaveLength(1)
      expect(d.messages[0].content).toBe('hello')
      expect(msgId).toBeTruthy()
    })
  })

  describe('undoMerge', () => {
    it('restores original content and clears snapshot', () => {
      const pid = useDialogStore.getState().createDialog('Parent')
      const msgId = useDialogStore.getState().addMessage(pid, {
        role: 'assistant', content: 'original text', parentId: null, branchId: 'main', status: 'complete',
      })
      const sid = useDialogStore.getState().createDialog('Sub', pid, pid, false)

      // Simulate merge: set snapshot + modify message
      useDialogStore.getState().updateDialog(sid, {
        mergeSnapshot: {
          parentMessageId: msgId,
          originalContent: 'original text',
          originalTitle: 'Sub',
          mergeMode: 'footnote',
          mergedAt: '2024-01-01',
        },
      })
      useDialogStore.getState().updateMessage(pid, msgId, {
        content: 'original text\n\n> footnote',
        mergedFromSubDialogId: sid,
      })
      useDialogStore.getState().updateDialogTitle(sid, '📎 已追加: Sub')

      // Undo
      useDialogStore.getState().undoMerge(sid)

      // Verify parent message restored
      const parent = useDialogStore.getState().dialogs.find(d => d.id === pid)
      const msg = parent?.messages.find(m => m.id === msgId)
      expect(msg?.content).toBe('original text')
      expect(msg?.mergedFromSubDialogId).toBeUndefined()

      // Verify sub-dialog restored
      const sub = useDialogStore.getState().dialogs.find(d => d.id === sid)
      expect(sub?.title).toBe('Sub')
      expect(sub?.mergeSnapshot).toBeUndefined()
    })

    it('does nothing if no snapshot', () => {
      const pid = useDialogStore.getState().createDialog('Parent')
      const sid = useDialogStore.getState().createDialog('Sub', pid, pid, false)
      // Should not throw
      expect(() => useDialogStore.getState().undoMerge(sid)).not.toThrow()
    })
  })
})
