import type {
  CreateSubDialogDependencies,
  CreateSubDialogInput,
} from './types'

/** Creates one independent child for each confirmed exploration action. */
export function createSubDialog(
  input: CreateSubDialogInput,
  dependencies: CreateSubDialogDependencies,
): string {
  const subDialogId = dependencies.createDialog(
    input.title,
    input.parentDialogId,
    input.rootDialogId,
    false,
  )
  dependencies.addMessage(subDialogId, {
    role: 'system',
    content: input.systemPrompt,
    parentId: null,
    branchId: 'main',
    status: 'complete',
  })
  if (input.parentMessageId) {
    dependencies.updateDialog(subDialogId, {
      contextAnchor: {
        messageId: input.parentMessageId,
        selectedText: input.selectedText,
      },
    })
  }
  return subDialogId
}
