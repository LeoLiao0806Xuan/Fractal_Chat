// ── Plugin registry store ──

import { create } from 'zustand'
import type { Plugin } from '../lib/types'

const STORAGE_KEY = 'fractal-chat-plugins'

interface PluginState {
  /** All registered plugins */
  plugins: Plugin[]
  /** Enabled plugin IDs */
  enabled: Set<string>

  register: (plugin: Plugin) => void
  unregister: (id: string) => void
  isEnabled: (id: string) => boolean
  setEnabled: (id: string, on: boolean) => void
  getEnabledPlugins: () => Plugin[]
}

function loadEnabled(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set<string>()
  }
}

function saveEnabled(enabled: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...enabled]))
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  enabled: loadEnabled(),

  register: (plugin) => {
    set(state => {
      if (state.plugins.some(p => p.id === plugin.id)) return state
      return { plugins: [...state.plugins, plugin] }
    })
  },

  unregister: (id) => {
    set(state => {
      const { [id]: _, ...rest } = Object.fromEntries(state.enabled.entries())
      const newEnabled = new Set(Object.keys(rest))
      saveEnabled(newEnabled)
      return { plugins: state.plugins.filter(p => p.id !== id), enabled: newEnabled }
    })
  },

  isEnabled: (id) => get().enabled.has(id),

  setEnabled: (id, on) => {
    set(state => {
      const next = new Set(state.enabled)
      if (on) next.add(id); else next.delete(id)
      saveEnabled(next)
      return { enabled: next }
    })
  },

  getEnabledPlugins: () => {
    return get().plugins.filter(p => get().enabled.has(p.id))
  },
}))
