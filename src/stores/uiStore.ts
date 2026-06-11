import { create } from 'zustand'

type Panel = 'none' | 'model-config' | 'sub-dialog'

interface UIState {
  leftPanelOpen: boolean
  rightPanel: Panel
  toggles: {
    showTree: boolean
    darkMode: boolean
  }
  setLeftPanel: (open: boolean) => void
  setRightPanel: (panel: Panel) => void
  toggleTree: () => void
  toggleDarkMode: () => void
}

export const useUIStore = create<UIState>((set) => ({
  leftPanelOpen: true,
  rightPanel: 'none',
  toggles: { showTree: true, darkMode: false },

  setLeftPanel: (open) => set({ leftPanelOpen: open }),
  setRightPanel: (panel) => set({ rightPanel: panel }),

  toggleTree: () => set(state => ({
    toggles: { ...state.toggles, showTree: !state.toggles.showTree }
  })),

  toggleDarkMode: () => set(state => ({
    toggles: { ...state.toggles, darkMode: !state.toggles.darkMode }
  })),
}))
