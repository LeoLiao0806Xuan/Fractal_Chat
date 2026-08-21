import type { Dialog, Message } from '../../lib/types'

export interface CreateSubDialogInput {
  parentDialogId: string
  rootDialogId: string
  parentMessageId: string | null
  selectedText: string
  title: string
  systemPrompt: string
}

export interface CreateSubDialogDependencies {
  createDialog: (
    title?: string,
    parentDialogId?: string,
    rootDialogId?: string,
    activate?: boolean,
  ) => string
  addMessage: (
    dialogId: string,
    message: Omit<Message, 'id' | 'createdAt'>,
  ) => string
  updateDialog: (dialogId: string, updates: Partial<Dialog>) => void
}
