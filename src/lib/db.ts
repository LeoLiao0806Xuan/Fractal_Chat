import { openDB, type IDBPDatabase } from 'idb'
import type { Dialog, ModelConfig } from './types'

const DB_NAME = 'fractal-chat'
const DB_VERSION = 2

let dbInstance: IDBPDatabase | null = null

export async function getDB() {
  if (dbInstance) return dbInstance
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('dialogs', { keyPath: 'id' })
        db.createObjectStore('models', { keyPath: 'id' })
      }
      if (oldVersion < 2) {
        // Version 2: messages merged into dialogs — drop old separate store
        if (db.objectStoreNames.contains('messages')) {
          db.deleteObjectStore('messages')
        }
        if (db.objectStoreNames.contains('subDialogs')) {
          db.deleteObjectStore('subDialogs')
        }
      }
    },
  })
  return dbInstance
}

// ── Batch persistence (used by App.tsx debounced auto-save) ──

export async function saveAllDialogs(dialogs: Dialog[]) {
  const db = await getDB()
  const tx = db.transaction('dialogs', 'readwrite')
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
