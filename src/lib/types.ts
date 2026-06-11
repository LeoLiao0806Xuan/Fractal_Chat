// ── Core type definitions for Fractal Chat ──

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string        // ISO timestamp
  parentId: string | null  // parent message for branched conversations
  branchId: string         // which branch this message belongs to
  model?: string           // which model generated this (null for user messages)
  tokens?: number          // token usage (optional)
  status?: 'streaming' | 'complete' | 'error'
  tags?: string[]
  mergedFromSubDialogId?: string  // set when merged — links back to the sub-dialog
  editedAt?: string        // ISO timestamp of last edit
  previousVersions?: { content: string; editedAt: string }[]
}

/** Snapshot saved before a merge, enabling undo */
export interface MergeSnapshot {
  parentMessageId: string
  originalContent: string
  originalTitle: string
  mergeMode: 'replace' | 'footnote' | 'keep-child'
  mergedAt: string
}

export interface Dialog {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: Message[]
  status: 'active' | 'archived'
  parentDialogId: string | null  // for sub-dialogs
  rootDialogId: string            // top-level dialog this belongs to
  contextAnchor?: {
    messageId: string
    selectedText: string
  }
  mergeSnapshot?: MergeSnapshot   // saved before merge, cleared on undo
  tags?: string[]                // user-assigned tags
}

export interface ModelConfig {
  id: string
  name: string
  apiUrl: string
  apiKey: string           // encrypted, stored in IndexedDB
  modelName: string
  group?: string
  isDefault?: boolean
  createdAt: string
}

export interface SubDialog {
  id: string
  parentDialogId: string
  anchorMessageId: string
  selectedText: string
  childDialogId: string
  mergeMode?: 'replace' | 'footnote' | 'keep-child'
  mergedAt?: string
}

