import { create } from 'zustand'
import type { MergeMode } from '../lib/mergeUtils'

export interface MergeInfo {
  mode: MergeMode
  mergedAt: string
}

export interface SubDialogState {
  /** Whether sub-dialog panel is open */
  isOpen: boolean
  /** The text that was selected */
  selectedText: string
  /** The mode (deep-dive / debug / ask-other / anchor) */
  mode: string
  /** The parent message ID (where the selected text came from) */
  parentMessageId: string | null
  /** The parent dialog ID */
  parentDialogId: string | null
  /** The created sub-dialog ID */
  subDialogId: string | null

  open: (text: string, mode: string, parentMessageId: string, parentDialogId: string) => void
  reopen: (subDialogId: string, parentDialogId: string, parentMessageId: string) => void
  close: () => void
  setSubDialogId: (id: string) => void
}

export const useSubDialogStore = create<SubDialogState>((set) => ({
  isOpen: false,
  selectedText: '',
  mode: '',
  parentMessageId: null,
  parentDialogId: null,
  subDialogId: null,

  open: (text: string, mode: string, parentMessageId: string, parentDialogId: string) => set({
    isOpen: true,
    selectedText: text,
    mode,
    parentMessageId,
    parentDialogId,
    subDialogId: null,
  }),

  /** Reopen an existing sub-dialog panel (for reverse navigation after merge) */
  reopen: (subDialogId: string, parentDialogId: string, parentMessageId: string) => set({
    isOpen: true,
    subDialogId,
    parentDialogId,
    parentMessageId,
    selectedText: '',
    mode: 'deep-dive',
  }),

  close: () => set({
    isOpen: false,
    selectedText: '',
    mode: '',
    parentMessageId: null,
    parentDialogId: null,
    subDialogId: null,
  }),

  setSubDialogId: (id) => set({ subDialogId: id }),
}))
