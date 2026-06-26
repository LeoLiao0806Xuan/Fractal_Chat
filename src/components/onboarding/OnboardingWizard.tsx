import { useState } from 'react'
import { useTranslation } from '../../i18n'
import { getProvidersByLocale, type FreeProvider } from '../../data/freeProviders'
import { useModelStore } from '../../stores/modelStore'
import { encryptAPIKey, storeSessionKey, setSessionPassword, getSessionPassword } from '../../services/crypto'

interface Props {
  onComplete: (action: 'connected' | 'skipped') => void
}

type Step = 'list' | 'detail' | 'success'

export function OnboardingWizard({ onComplete }: Props) {
  const { locale } = useTranslation()
  const { primary, other } = getProvidersByLocale(locale)
  const addConfig = useModelStore(s => s.addConfig)
  const isZh = locale.startsWith('zh')

  const [step, setStep] = useState<Step>('list')
  const [selectedProvider, setSelectedProvider] = useState<FreeProvider | null>(null)
  const [showOther, setShowOther] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [connectedName, setConnectedName] = useState('')

  const existingPassword = getSessionPassword()

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

  const handleConnect = async () => {
    if (!selectedProvider) return
    setError('')

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

    if (!apiKey.trim()) {
      setError(isZh ? '请粘贴你的 API Key' : 'Please paste your API Key')
      return
    }

    setConnecting(true)

    try {
      const pw = existingPassword || password
      const encrypted = await encryptAPIKey(apiKey.trim(), pw)
      if (!existingPassword) setSessionPassword(pw)
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
      setConnectedName(selectedProvider.name)
      setStep('success')
    } catch (err) {
      setError(isZh ? '保存失败，请重试' : 'Failed to save. Please try again.')
      console.error('Onboarding connect error:', err)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto" onClick={() => onComplete('skipped')}>
      <div className="bg-white rounded-2xl shadow-2xl w-[94vw] sm:w-[580px] my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

        {step === 'list' && (
          <>
            {/* Hero header */}
            <div className="text-center px-6 pt-8 pb-4 bg-gradient-to-b from-indigo-50/60 to-transparent rounded-t-2xl">
              <div className="text-4xl mb-3 animate-bounce">🚀</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {isZh ? '欢迎使用 Fractal Chat' : 'Welcome to Fractal Chat'}
              </h1>
              <p className="text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
                {isZh
                  ? '选择一个免费 AI 提供商，2 分钟配置完成即可开始对话'
                  : 'Pick a free AI provider and start chatting in 2 minutes'}
              </p>
            </div>

            {/* Provider cards */}
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
              {primary.map((provider, idx) => (
                <button
                  key={provider.id}
                  onClick={() => openDetail(provider)}
                  className="w-full text-left group"
                >
                  <div className={`rounded-xl border-2 p-5 transition-all hover:shadow-lg hover:border-indigo-400
                    ${idx === 0
                      ? 'border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/40 hover:border-indigo-400'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0
                        ${idx === 0
                          ? 'bg-gradient-to-br from-indigo-100 to-purple-100'
                          : 'bg-gray-50'
                        }`}
                      >
                        {provider.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + rank */}
                        <div className="flex items-center gap-2 mb-1">
                          {idx === 0 && (
                            <span className="text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white px-1.5 py-0.5 rounded-full">
                              {isZh ? '推荐' : 'RECOMMENDED'}
                            </span>
                          )}
                          <span className="text-base font-bold text-gray-800">{provider.name}</span>
                          {!provider.requiresPayment && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">免费</span>
                          )}
                        </div>

                        {/* Free tier summary */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {provider.tags.map(tag => <TagBadge key={tag} tag={tag} isZh={isZh} />)}
                        </div>

                        {provider.note && (
                          <p className="text-xs text-amber-600 mt-2 leading-relaxed">{provider.note}</p>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0 mt-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Other providers */}
              <div className="border-t border-gray-100 pt-3 mt-2">
                <button
                  onClick={() => setShowOther(!showOther)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full"
                >
                  <span className="text-gray-300">{showOther ? '▼' : '▶'}</span>
                  {isZh ? `其他选项 (${other.length}) — 需 Google/GitHub 账号` : `Other options (${other.length}) — Google/GitHub account required`}
                </button>

                {showOther && (
                  <div className="mt-2 space-y-2">
                    {other.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => openDetail(provider)}
                        className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{provider.icon}</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">{provider.name}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {provider.tags.map(tag => <TagBadge key={tag} tag={tag} isZh={isZh} />)}
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2 shrink-0">
              <button
                onClick={() => onComplete('skipped')}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {isZh ? '💡 先看看演示（无需配置）' : '💡 Try demo first (no config needed)'}
              </button>
            </div>
          </>
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
          <SuccessView providerName={connectedName} onStart={() => onComplete('connected')} isZh={isZh} />
        )}
      </div>
    </div>
  )
}

function TagBadge({ tag, isZh }: { tag: string; isZh: boolean }) {
  const labels: Record<string, [string, string]> = {
    free_5m: ['500万 tokens 免费', '5M free tokens'],
    free_9b: ['9B以下永久免费', 'Free for sub-9B models'],
    free_rate: ['免费·速率限制', 'Free rate-limited'],
    free_2000w: ['送 2000万 Token', '20M free tokens'],
    email_phone: ['邮箱/手机号注册', 'Email or phone'],
    email_only: ['仅邮箱', 'Email only'],
    no_cc: ['无需信用卡', 'No credit card'],
    china_id: ['需实名认证', 'Real-name ID req.'],
    google_account: ['需 Google 账号', 'Google account'],
    github_account: ['需 GitHub 账号', 'GitHub account'],
    free_tier: ['免费额度', 'Free tier'],
  }
  const [zh, en] = labels[tag] || [tag, tag]
  return (
    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
      {isZh ? zh : en}
    </span>
  )
}

function DetailView({
  provider, existingPassword, password, setPassword, confirmPassword, setConfirmPassword,
  passwordError, apiKey, setApiKey, selectedModel, setSelectedModel,
  connecting, error, onBack, onConnect, onSkip, isZh,
}: {
  provider: FreeProvider; existingPassword: boolean; password: string; setPassword: (v: string) => void
  confirmPassword: string; setConfirmPassword: (v: string) => void; passwordError: string
  apiKey: string; setApiKey: (v: string) => void; selectedModel: string; setSelectedModel: (v: string) => void
  connecting: boolean; error: string; onBack: () => void; onConnect: () => void; onSkip: () => void; isZh: boolean
}) {
  const guideSteps = isZh ? provider.guide.zh : provider.guide.en

  return (
    <>
      {/* Back + title */}
      <div className="px-5 pt-4 pb-2 border-b border-gray-100 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 -ml-1 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-2xl">{provider.icon}</span>
        <div>
          <h2 className="font-bold text-gray-800">{provider.name}</h2>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {provider.tags.map(tag => <TagBadge key={tag} tag={tag} isZh={isZh} />)}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Step 1: Password */}
        {!existingPassword && (
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-2">
              🔒 {isZh ? '设置加密密码' : 'Set encryption password'}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {isZh
                ? 'API Key 会加密存储，密码仅本次会话有效。'
                : 'Your API Key is encrypted. Password is session-only.'}
            </p>
            <div className="space-y-2">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={isZh ? '输入密码（至少 4 位）' : 'Enter password (min 4 chars)'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder={isZh ? '确认密码' : 'Confirm password'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            </div>
          </section>
        )}
        {existingPassword && (
          <section className="bg-green-50 rounded-xl p-3">
            <p className="text-sm text-green-700">✅ {isZh ? '加密密码已设置' : 'Encryption password set'}</p>
          </section>
        )}

        {/* Step 2: Get Key guide */}
        <section>
          <h3 className="text-sm font-bold text-gray-700 mb-2">
            🔑 {isZh ? '获取免费 API Key' : 'Get your free API Key'}
          </h3>
          <div className="bg-indigo-50/60 rounded-xl p-4 space-y-2.5 border border-indigo-100">
            {guideSteps.map((step, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-700 pt-0.5">{step}</span>
              </div>
            ))}
            <a href={provider.signupUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {isZh ? '打开注册页 →' : 'Open signup page →'}
            </a>
          </div>
        </section>

        {/* Step 3: Paste key */}
        <section>
          <h3 className="text-sm font-bold text-gray-700 mb-2">
            📋 {isZh ? '粘贴 Key 并选择模型' : 'Paste Key & select model'}
          </h3>
          <div className="space-y-3">
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder={isZh ? '粘贴你的 API Key...' : 'Paste your API Key...'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
              {provider.models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
        <button onClick={onConnect} disabled={connecting}
          className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md">
          {connecting ? (isZh ? '连接中...' : 'Connecting...') : `🔗 ${isZh ? '连接并开始使用' : 'Connect & start chatting'}`}
        </button>
        <button onClick={onSkip}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">
          {isZh ? '💡 先看看演示' : '💡 Skip to demo'}
        </button>
      </div>
    </>
  )
}

function SuccessView({ providerName, onStart, isZh }: { providerName: string; onStart: () => void; isZh: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="text-6xl mb-4 animate-bounce">🎉</div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        {isZh ? '准备就绪！' : 'Ready to go!'}
      </h2>
      <p className="text-sm text-gray-500 mt-2 max-w-xs">
        {isZh
          ? `已成功连接 ${providerName}，你现在可以开始 AI 对话了。`
          : `Successfully connected to ${providerName}. Start chatting now!`}
      </p>
      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {isZh ? 'API Key 已加密存储' : 'API Key is encrypted'}
      </p>
      <button onClick={onStart}
        className="mt-6 py-3 px-10 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-[0.98] shadow-lg">
        💬 {isZh ? '开始对话' : 'Start chatting'}
      </button>
    </div>
  )
}
