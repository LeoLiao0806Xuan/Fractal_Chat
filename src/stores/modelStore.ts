import { create } from 'zustand'
import type { ModelConfig } from '../lib/types'
import { generateId, getTimestamp } from '../lib/utils'

interface ModelState {
  configs: ModelConfig[]
  activeModelId: string | null

  addConfig: (config: Omit<ModelConfig, 'id' | 'createdAt'>) => string
  removeConfig: (id: string) => void
  updateConfig: (id: string, updates: Partial<ModelConfig>) => void
  setActiveModel: (id: string | null) => void
  getActiveConfig: () => ModelConfig | undefined
}

export const useModelStore = create<ModelState>((set, get) => ({
  configs: [],
  activeModelId: null,

  addConfig: (config) => {
    const id = generateId()
    set(state => ({
      configs: [...state.configs, { ...config, id, createdAt: getTimestamp() }],
    }))
    return id
  },

  removeConfig: (id) => {
    set(state => ({
      configs: state.configs.filter(c => c.id !== id),
      activeModelId: state.activeModelId === id ? null : state.activeModelId,
    }))
  },

  updateConfig: (id, updates) => {
    set(state => ({
      configs: state.configs.map(c => c.id === id ? { ...c, ...updates } : c),
    }))
  },

  setActiveModel: (id) => set({ activeModelId: id }),

  getActiveConfig: () => {
    const { configs, activeModelId } = get()
    return configs.find(c => c.id === activeModelId)
  },
}))
