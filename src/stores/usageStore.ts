// ── Usage tracking store ──
// Tracks API token consumption per model config
// Persisted to localStorage so it survives refreshes

import { create } from 'zustand'

const STORAGE_KEY = 'fractal-chat-usage'

export interface UsageRecord {
  configId: string
  providerName: string
  modelName: string
  totalTokens: number
  requestCount: number
  lastUpdated: string
}

interface UsageState {
  records: Record<string, UsageRecord>

  /** Record token usage for a model config */
  recordUsage: (configId: string, providerName: string, modelName: string, tokens: number) => void
  /** Get a specific record */
  getRecord: (configId: string) => UsageRecord | undefined
  /** Get all records as an array */
  getAllRecords: () => UsageRecord[]
  /** Reset a specific record */
  resetRecord: (configId: string) => void
  /** Reset all records */
  resetAll: () => void
}

function loadFromStorage(): Record<string, UsageRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(records: Record<string, UsageRecord>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch { /* quota exceeded — silently ignore */ }
}

export const useUsageStore = create<UsageState>((set, get) => ({
  records: loadFromStorage(),

  recordUsage: (configId, providerName, modelName, tokens) => {
    set(state => {
      const existing = state.records[configId]
      const updated: Record<string, UsageRecord> = {
        ...state.records,
        [configId]: {
          configId,
          providerName,
          modelName,
          totalTokens: (existing?.totalTokens ?? 0) + tokens,
          requestCount: (existing?.requestCount ?? 0) + 1,
          lastUpdated: new Date().toISOString(),
        },
      }
      saveToStorage(updated)
      return { records: updated }
    })
  },

  getRecord: (configId) => {
    return get().records[configId]
  },

  getAllRecords: () => {
    return Object.values(get().records)
  },

  resetRecord: (configId) => {
    set(state => {
      const { [configId]: _, ...rest } = state.records
      saveToStorage(rest)
      return { records: rest }
    })
  },

  resetAll: () => {
    saveToStorage({})
    set({ records: {} })
  },
}))

// ── Provider limit info (for display in Usage tab) ──

export interface ProviderLimit {
  type: 'tokens' | 'requests' | 'unlimited'
  /** Total allowance (null for unlimited) */
  total: number | null
  /** Human-readable description */
  label: string
}

const PROVIDER_LIMITS: Record<string, ProviderLimit> = {
  DeepSeek: { type: 'tokens', total: 5_000_000, label: '5M tokens (one-time)' },
  '硅基流动 (SiliconFlow)': { type: 'unlimited', total: null, label: '9B以下永久免费' },
  Groq: { type: 'requests', total: null, label: '30 req/min · 1000 req/day' },
  Gemini: { type: 'tokens', total: null, label: 'Free tier (rate-limited)' },
  'GitHub Models': { type: 'requests', total: null, label: 'Free tier (rate-limited)' },
}

export function getProviderLimit(providerName: string): ProviderLimit | null {
  // Fuzzy match: check if the provider name contains any of the known keys
  for (const [key, limit] of Object.entries(PROVIDER_LIMITS)) {
    if (providerName.toLowerCase().includes(key.toLowerCase())) {
      return limit
    }
  }
  // Fallback: check against known short names
  if (providerName.includes('DeepSeek')) return PROVIDER_LIMITS.DeepSeek
  if (providerName.includes('硅基') || providerName.includes('Silicon')) return PROVIDER_LIMITS['硅基流动 (SiliconFlow)']
  if (providerName.includes('Groq')) return PROVIDER_LIMITS.Groq
  if (providerName.includes('Gemini')) return PROVIDER_LIMITS.Gemini
  if (providerName.includes('GitHub')) return PROVIDER_LIMITS['GitHub Models']
  return null
}
