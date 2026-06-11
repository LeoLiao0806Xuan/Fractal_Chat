import { openDB, type IDBPDatabase } from 'idb'
import type { Dialog, Message, ModelConfig, SubDialog } from './types'

const DB_NAME = 'fractal-chat'
const DB_VERSION = 2

let dbInstance: IDBPDatabase | null = null

export async function getDB() {
  if (dbInstance) return dbInstance
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('dialogs', { keyPath: 'id' })
        db.createObjectStore('messages', { keyPath: 'id' })
        db.createObjectStore('models', { keyPath: 'id' })
        db.createObjectStore('subDialogs', { keyPath: 'id' })
      }
      if (oldVersion < 2) {
        // Version 2: messages merged into dialogs — drop old messages store
        if (db.objectStoreNames.contains('messages')) {
          db.deleteObjectStore('messages')
        }
      }
    },
  })
  return dbInstance
}

// ── Batch operations (for persistence) ──

export async function saveAllDialogs(dialogs: Dialog[]) {
  const db = await getDB()
  const tx = db.transaction('dialogs', 'readwrite')
  // Clear and rewrite
  await tx.store.clear()
  for (const dialog of dialogs) {
    await tx.store.put(dialog)
  }
  await tx.done
}

export async function loadAllDialogs(): Promise<Dialog[]> {
  const db = await getDB()
  return db.getAll('dialogs')
}

export async function saveAllModels(configs: ModelConfig[]) {
  const db = await getDB()
  const tx = db.transaction('models', 'readwrite')
  await tx.store.clear()
  for (const config of configs) {
    await tx.store.put(config)
  }
  await tx.done
}

export async function loadAllModels(): Promise<ModelConfig[]> {
  const db = await getDB()
  return db.getAll('models')
}


// ── Dialog CRUD ──
export async function saveDialog(dialog: Dialog) {
  const db = await getDB()
  await db.put('dialogs', dialog)
}

export async function getDialog(id: string): Promise<Dialog | undefined> {
  const db = await getDB()
  return db.get('dialogs', id)
}

export async function getAllDialogs(): Promise<Dialog[]> {
  const db = await getDB()
  return db.getAll('dialogs')
}

export async function deleteDialog(id: string) {
  const db = await getDB()
  await db.delete('dialogs', id)
}

// ── Message CRUD ──
export async function saveMessage(msg: Message & { dialogId: string }) {
  const db = await getDB()
  await db.put('messages', msg)
}

export async function getMessagesByDialog(dialogId: string): Promise<(Message & { dialogId: string })[]> {
  const db = await getDB()
  return db.getAllFromIndex('messages', 'dialogId', dialogId)
}

// ── Model Config CRUD ──
export async function saveModelConfig(model: ModelConfig) {
  const db = await getDB()
  await db.put('models', model)
}

export async function getModelConfigs(): Promise<ModelConfig[]> {
  const db = await getDB()
  return db.getAll('models')
}

export async function deleteModelConfig(id: string) {
  const db = await getDB()
  await db.delete('models', id)
}

// ── SubDialog CRUD ──
export async function saveSubDialog(sub: SubDialog) {
  const db = await getDB()
  await db.put('subDialogs', sub)
}

export async function getSubDialogsByParent(parentDialogId: string): Promise<SubDialog[]> {
  const db = await getDB()
  const all: SubDialog[] = await db.getAll('subDialogs')
  return all.filter(s => s.parentDialogId === parentDialogId)
}
