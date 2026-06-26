import { useState } from 'react'
import { useTranslation } from '../../i18n'
import { getProvidersByLocale, type FreeProvider, type ProviderModel } from '../../data/freeProviders'
import { useModelStore } from '../../stores/modelStore'
import { encryptAPIKey, storeSessionKey, setSessionPassword, getSessionPassword } from '../../services/crypto'

interface Props {
  onComplete: (action: 'connected' | 'skipped') => void
}

type Step = 'list' | 'detail' | 'success'

export function OnboardingWizard({ onComplete }: Props) {
  const { t, locale } = useTranslation()
  const { primary, other } = getProvidersByLocale(locale)
  const addConfig = useModelStore(s => s.addConfig)

  const [step, setStep] = useState<Step>('list')
  const [selectedProvider, setSelectedProvider] = useState<FreeProvider | null>(null)
  const [showOther, setShowOther] = useState(false)

  // ── Password state ──
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // ── API key + model state ──
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  // ── Success state ──
  const [connectedName, setConnectedName] = useState('')

  const existingPassword = getSessionPassword()
  const isZh = locale.startsWith('zh')

  // ── Open provider detail ──
  const openDetail = (provider: FreeProvider) => {
    setSelectedProvider(provider)
    setSelectedModel(provider.defaultModel)
    setApiKey('')
    setPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setError('')
    setStep('detail')
  }

  // ── Handle connect ──
  const handleConnect = async () => {
    if (!selectedProvider) return
    setError('')

    // Validate password
    if (!existingPassword) {
      if (!password || password.length < 4) {
        setPasswordError(isZh ? '密码至少 4 位' : 'Password must be at least 4 characters')
        return
      }
      if (password !== confirmPassword) {
        setPasswordError(isZh ? '两次密码不一致' : 'Passwords do not match')
        return
      }
    }

    // Validate API key
    if (!apiKey.trim()) {
      setError(isZh ? '请粘贴你的 API Key' : 'Please paste your API Key')
      return
    }

    setConnecting(true)

    try {
      const pw = existingPassword || password

      // Encrypt first, then commit session state
      const encrypted = await encryptAPIKey(apiKey.trim(), pw)
      if (!existingPassword) {
        setSessionPassword(pw)
      }
      const setActiveModel = useModelStore.getState().setActiveModel
      const configId = addConfig({
        name: selectedProvider.name,
        apiUrl: selectedProvider.apiUrl,
        apiKey: encrypted,
        modelName: selectedModel,
        isDefault: true,
      })
      setActiveModel(configId)
      storeSessionKey(configId, apiKey.trim())

      // Show success
      setConnectedName(selectedProvider.name)
      setStep('success')
    } catch (err) {
      setError(isZh ? '保存失败，请重试' : 'Failed to save. Please try again.')
      console.error('Onboarding connect error:', err)
    } finally {
      setConnecting(false)
    }
  }

  // ── Render ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => onComplete('skipped')}>
      <div className="bg-white rounded-2xl shadow-2xl w-[540px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {step === 'list' && (
          <ListView
            primary={primary}
            other={other}
            showOther={showOther}
            setShowOther={setShowOther}
            onSelect={openDetail}
            onSkip={() => onComplete('skipped')}
          />
        )}

        {step === 'detail' && selectedProvider && (
          <DetailView
            provider={selectedProvider}
            existingPassword={!!existingPassword}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            passwordError={passwordError}
            apiKey={apiKey}
            setApiKey={setApiKey}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            connecting={connecting}
            error={error}
            onBack={() => setStep('list')}
            onConnect={handleConnect}
            onSkip={() => onComplete('skipped')}
            isZh={isZh}
          />
        )}

        {step === 'success' && (
          <SuccessView
            providerName={connectedName}
            onStart={() => onComplete('connected')}
            isZh={isZh}
          />
        )}
      </div>
    </div>
  )
}

// ── Sub-components ──

function ListView({
  primary,
  other,
  showOther,
  setShowOther,
  onSelect,
  onSkip,
}: {
  primary: FreeProvider[]
  other: FreeProvider[]
  showOther: boolean
  setShowOther: (v: boolean) => void
  onSelect: (p: FreeProvider) => void
  onSkip: () => void
}) {
  const { locale } = useTranslation()
  const isZh = locale.startsWith('zh')

  return (
    <>
      {/* Header */}
      <div className="p-5 pb-3 text-center shrink-0">
        <div className="text-3xl mb-2">🚀</div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {isZh ? '欢迎使用 Fractal Chat' : 'Welcome to Fractal Chat'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isZh ? '选择一个 AI 提供商，2 分钟即可开始对话' : 'Pick an AI provider and start in 2 minutes'}
        </p>
      </div>

      {/* Provider list */}
      <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-3">
        {primary.map((provider, idx) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            rank={idx + 1}
            onClick={() => onSelect(provider)}
          />
        ))}

        {/* Other providers — collapsed */}
        <div className="border-t border-gray-100 pt-3 mt-2">
          <button
            onClick={() => setShowOther(!showOther)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full"
          >
            <span className="text-gray-300">
              {showOther ? '▼' : '▶'}
            </span>
            {isZh ? `其他选项 (${other.length})` : `Other options (${other.length})`}
          </button>

          {showOther && (
            <div className="mt-2 space-y-2">
              {other.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  rank={null}
                  onClick={() => onSelect(provider)}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 shrink-0">
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
        >
          {isZh ? '💡 先看看演示' : '💡 Skip to demo'}
        </button>
      </div>
    </>
  )
}

function ProviderCard({
  provider,
  rank,
  onClick,
  compact,
}: {
  provider: FreeProvider
  rank: number | null
  onClick: () => void
  compact?: boolean
}) {
  const { locale } = useTranslation()
  const isZh = locale.startsWith('zh')

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all group ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`shrink-0 ${compact ? 'text-xl' : 'text-2xl'} mt-0.5`}>{provider.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {rank && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                rank === 1
                  ? 'bg-amber-100 text-amber-700'
                  : rank === 2
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-orange-100 text-orange-600'
              }`}>
                #{rank}
              </span>
            )}
            <span className={`font-semibold text-gray-800 ${compact ? 'text-sm' : 'text-base'}`}>
              {provider.name}
            </span>
            {!provider.requiresPayment && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">
                {isZh ? '免费' : 'Free'}
              </span>
            )}
          </div>

          {!compact && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {provider.tags.map(tag => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          {provider.note && !compact && (
            <p className="text-xs text-amber-600 mt-1.5 leading-relaxed">{provider.note}</p>
          )}
        </div>
        <div className="text-indigo-400 group-hover:text-indigo-600 transition-colors shrink-0 mt-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}

function TagBadge({ tag }: { tag: string }) {
  const labels: Record<string, string> = {
    free_5m: '500万免费额度',
    free_9b: '9B以下永久免费',
    free_rate: '免费·速率限制',
    free_2000w: '送2000万Token',
    email_phone: '邮箱/手机号',
    email_only: '仅邮箱',
    no_cc: '无需信用卡',
    china_id: '需实名认证',
    google_account: '需Google账号',
    github_account: '需GitHub账号',
    free_tier: '免费额度',
  }
  return (
    <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
      {labels[tag] || tag}
    </span>
  )
}

function DetailView({
  provider,
  existingPassword,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  passwordError,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  connecting,
  error,
  onBack,
  onConnect,
  onSkip,
  isZh,
}: {
  provider: FreeProvider
  existingPassword: boolean
  password: string
  setPassword: (v: string) => void
  confirmPassword: string
  setConfirmPassword: (v: string) => void
  passwordError: string
  apiKey: string
  setApiKey: (v: string) => void
  selectedModel: string
  setSelectedModel: (v: string) => void
  connecting: boolean
  error: string
  onBack: () => void
  onConnect: () => void
  onSkip: () => void
  isZh: boolean
}) {
  const guideSteps = isZh ? provider.guide.zh : provider.guide.en

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 p-1 -ml-1 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xl">{provider.icon}</span>
        <h2 className="font-semibold text-gray-800">{provider.name}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Step 1: Password */}
        {!existingPassword && (
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              🔒 {isZh ? '1. 设置加密密码' : '1. Set encryption password'}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {isZh
                ? 'API Key 会加密存储。密码仅本次会话有效，不会保存在服务器。'
                : 'Your API Key will be encrypted. The password is session-only and never stored.'}
            </p>
            <div className="space-y-2">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isZh ? '输入密码（至少 4 位）' : 'Enter password (min 4 chars)'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={isZh ? '确认密码' : 'Confirm password'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {passwordError && (
                <p className="text-xs text-red-500">{passwordError}</p>
              )}
            </div>
          </section>
        )}
        {existingPassword && (
          <section className="bg-green-50 rounded-xl p-3">
            <p className="text-sm text-green-700">✅ {isZh ? '加密密码已设置' : 'Encryption password set'}</p>
          </section>
        )}

        {/* Step 2: Get API Key */}
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            🔑 {isZh ? '2. 获取免费 API Key' : '2. Get your free API Key'}
          </h3>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            {guideSteps.map((step, i) => (
              <div key={i} className="flex gap-2.5 text-sm">
                <span className="text-indigo-500 font-bold shrink-0 w-5 text-right">{i + 1}.</span>
                <span className="text-gray-700">{step}</span>
              </div>
            ))}
            <a
              href={provider.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {isZh ? '打开注册页 →' : 'Open signup page →'}
            </a>
          </div>
        </section>

        {/* Step 3: Paste Key + Select Model */}
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            📋 {isZh ? '3. 粘贴 API Key 并连接' : '3. Paste API Key & connect'}
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={isZh ? '粘贴你的 API Key...' : 'Paste your API Key...'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {isZh ? '选择模型' : 'Model'}
              </label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                {provider.models.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
        <button
          onClick={onConnect}
          disabled={connecting}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {connecting
            ? (isZh ? '连接中...' : 'Connecting...')
            : `🔗 ${isZh ? '连接并开始使用' : 'Connect & start chatting'}`}
        </button>
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
        >
          {isZh ? '💡 先看看演示' : '💡 Skip to demo'}
        </button>
      </div>
    </>
  )
}

function SuccessView({
  providerName,
  onStart,
  isZh,
}: {
  providerName: string
  onStart: () => void
  isZh: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="text-5xl mb-4 animate-bounce">🎉</div>
      <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        {isZh ? '已就绪！' : 'Ready to go!'}
      </h2>
      <p className="text-sm text-gray-500 mt-2 max-w-xs">
        {isZh
          ? `已成功连接 ${providerName}，你现在可以开始 AI 对话了。`
          : `Successfully connected to ${providerName}. Start chatting now!`}
      </p>

      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {isZh ? 'API Key 已加密存储' : 'API Key is encrypted'}
      </div>

      <button
        onClick={onStart}
        className="mt-6 py-2.5 px-8 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-[0.98]"
      >
        {isZh ? '💬 开始对话' : '💬 Start chatting'}
      </button>
    </div>
  )
}
