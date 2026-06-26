import { useState } from 'react'
import { useModelStore } from '../../stores/modelStore'
import { encryptAPIKey, decryptAPIKey, storeSessionKey, setSessionPassword, getSessionPassword } from '../../services/crypto'
import { useTranslation } from '../../i18n'

export function GeneralTab() {
  const { t } = useTranslation()
  const configs = useModelStore(s => s.configs)
  const addConfig = useModelStore(s => s.addConfig)
  const removeConfig = useModelStore(s => s.removeConfig)
  const setActiveModel = useModelStore(s => s.setActiveModel)
  const activeModelId = useModelStore(s => s.activeModelId)

  const [showAddForm, setShowAddForm] = useState(false)
  const [password, setPassword] = useState(getSessionPassword() || '')
  const [unlocked, setUnlocked] = useState(!!getSessionPassword())

  const [form, setForm] = useState({
    name: '',
    apiUrl: 'https://api.openai.com',
    apiKey: '',
    modelName: 'gpt-4o',
  })

  const handleUnlock = async () => {
    if (password.length < 4) return
    setSessionPassword(password)
    // Try to decrypt existing keys and restore to session store
    for (const cfg of configs) {
      try {
        const raw = await decryptAPIKey(cfg.apiKey, password)
        storeSessionKey(cfg.id, raw)
      } catch { /* wrong password — skip this key */ }
    }
    setUnlocked(true)
  }

  const handleAdd = async () => {
    if (!form.name || !form.apiKey || !unlocked) return
    const encrypted = await encryptAPIKey(form.apiKey, password)
    const newId = addConfig({
      name: form.name,
      apiUrl: form.apiUrl,
      apiKey: encrypted,
      modelName: form.modelName,
      isDefault: configs.length === 0,
    })
    setActiveModel(newId)
    storeSessionKey(newId, form.apiKey)
    setForm({ name: '', apiUrl: 'https://api.openai.com', apiKey: '', modelName: 'gpt-4o' })
    setShowAddForm(false)
  }

  const PRESETS = [
    { name: 'DeepSeek V4', apiUrl: 'https://api.deepseek.com', modelName: 'deepseek-chat' },
    { name: 'Groq (Llama)', apiUrl: 'https://api.groq.com/openai/v1', modelName: 'llama-3.3-70b-versatile' },
    { name: 'OpenAI GPT-4o', apiUrl: 'https://api.openai.com', modelName: 'gpt-4o' },
    { name: 'Google Gemini', apiUrl: 'https://generativelanguage.googleapis.com', modelName: 'gemini-2.0-flash' },
    { name: 'Anthropic Claude', apiUrl: 'https://api.anthropic.com', modelName: 'claude-sonnet-4-20250514' },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Password unlock */}
      {!unlocked ? (
        <div>
          <p className="text-sm text-gray-600 mb-3">{t('model.password_hint')}</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('model.password')}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            />
            <button
              onClick={handleUnlock}
              disabled={password.length < 4}
              className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
            >
              {t('model.unlock')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Model list */}
          <div className="space-y-2">
            {configs.map(config => (
              <div
                key={config.id}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  activeModelId === config.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setActiveModel(config.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{config.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{config.modelName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{config.apiUrl}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.isDefault && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{t('model.default')}</span>
                    )}
                    {activeModelId === config.id && (
                      <span className="text-green-500">●</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeConfig(config.id) }}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      {t('tree.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add form */}
            {showAddForm ? (
              <div className="p-3 rounded-xl border border-gray-300 bg-gray-50 space-y-2">
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t('model.name_label')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  value={form.apiUrl}
                  onChange={e => setForm(f => ({ ...f, apiUrl: e.target.value }))}
                  placeholder="API URL"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  value={form.apiKey}
                  onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                  type="password"
                  placeholder="API Key"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  value={form.modelName}
                  onChange={e => setForm(f => ({ ...f, modelName: e.target.value }))}
                  placeholder={t('model.model_label')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAdd} className="bg-indigo-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-indigo-700">
                    {t('chat.bubble.save')}
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="text-gray-500 px-3 py-1.5 text-sm hover:text-gray-700">
                    {t('chat.bubble.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                + {t('model.add')}
              </button>
            )}
          </div>

          {/* Presets */}
          <div>
            <div className="text-xs text-gray-500 mb-2">{t('model.presets')}</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setForm({
                      name: preset.name,
                      apiUrl: preset.apiUrl,
                      apiKey: '',
                      modelName: preset.modelName,
                    })
                    setShowAddForm(true)
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full text-gray-700 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
