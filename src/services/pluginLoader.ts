// ── Plugin loader ──
// v1: loads built-in plugins from the plugins directory

import { usePluginStore } from '../stores/pluginStore'
import type { Plugin } from '../lib/types'

export function loadBuiltinPlugins() {
  // In a dynamic system this would scan a directory.
  // For v1, we manually register each built-in plugin.
  const store = usePluginStore.getState()

  // Built-in plugins are imported dynamically to keep the bundle lean
  // and allow future hot-reloading.
  const builtins: Plugin[] = [
    // Plugins register themselves here
  ]

  builtins.forEach(p => store.register(p))
}
