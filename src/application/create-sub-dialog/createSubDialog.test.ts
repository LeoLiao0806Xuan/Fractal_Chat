import { beforeEach, describe, expect, it } from 'vitest'
import { useDialogStore } from '../../stores/dialogStore'
import { createSubDialog } from './index'

beforeEach(() => {
  useDialogStore.setState({ dialogs: [], currentDialogId: null })
})

describe('createSubDialog', () => {
  it('creates independent children for repeated exploration of the same parent', () => {
    const store = useDialogStore.getState()
    const parentDialogId = store.createDialog('Parent')
    const parentMessageId = store.addMessage(parentDialogId, {
      role: 'assistant',
      content: 'Compare option A and option B',
      parentId: null,
      branchId: 'main',
      status: 'complete',
    })

    const dependencies = {
      createDialog: store.createDialog,
      addMessage: store.addMessage,
      updateDialog: store.updateDialog,
    }
    const firstChildId = createSubDialog({
      parentDialogId,
      rootDialogId: parentDialogId,
      parentMessageId,
      selectedText: 'option A',
      title: 'Option A',
      systemPrompt: 'Explore option A',
    }, dependencies)
    const secondChildId = createSubDialog({
      parentDialogId,
      rootDialogId: parentDialogId,
      parentMessageId,
      selectedText: 'option B',
      title: 'Option B',
      systemPrompt: 'Explore option B',
    }, dependencies)
    const thirdChildId = createSubDialog({
      parentDialogId,
      rootDialogId: parentDialogId,
      parentMessageId,
      selectedText: 'counterargument',
      title: 'Counterargument',
      systemPrompt: 'Challenge both options',
    }, dependencies)

    const children = useDialogStore.getState().dialogs.filter(
      dialog => dialog.parentDialogId === parentDialogId,
    )
    expect(firstChildId).not.toBe(secondChildId)
    expect(secondChildId).not.toBe(thirdChildId)
    expect(children).toHaveLength(3)
    expect(children.map(child => child.contextAnchor?.selectedText)).toEqual([
      'option A',
      'option B',
      'counterargument',
    ])
  })
})
