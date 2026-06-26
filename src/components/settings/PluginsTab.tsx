import { usePluginStore } from '../../stores/pluginStore'
import { useTranslation } from '../../i18n'

export function PluginsTab() {
  const { t } = useTranslation()
  const plugins = usePluginStore(s => s.plugins)
  const enabled = usePluginStore(s => s.enabled)
  const setEnabled = usePluginStore(s => s.setEnabled)

  if (plugins.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-3">🔌</div>
        <p className="text-gray-500 text-sm">{t('plugins.empty')}</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {plugins.map(plugin => (
        <div
          key={plugin.id}
          className="rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-800">{plugin.name}</span>
                <span className="text-[10px] text-gray-400">v{plugin.version}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{plugin.description}</p>
              {plugin.author && (
                <p className="text-[10px] text-gray-400 mt-1">{t('plugins.by')} {plugin.author}</p>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={enabled.has(plugin.id)}
                onChange={e => setEnabled(plugin.id, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300
                            rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
                            peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px]
                            after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4
                            after:transition-all peer-checked:bg-indigo-500" />
            </label>
          </div>
        </div>
      ))}
    </div>
  )
}
