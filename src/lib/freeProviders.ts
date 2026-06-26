// ── Free API provider definitions ──
// Locale-aware: zh users see different recommendations than en users

export interface ProviderGuide {
  en: string[]
  zh: string[]
}

export interface ProviderModel {
  id: string
  label: string
}

export interface FreeProvider {
  id: string
  name: string
  icon: string
  /** Which locales this provider appears as a primary recommendation */
  locales: ('en' | 'zh')[]
  apiUrl: string
  models: ProviderModel[]
  defaultModel: string
  guide: ProviderGuide
  signupUrl: string
  /** Short tags shown on the card */
  tags: string[]
  /** Important usage note (region restriction, ID requirement, etc.) */
  note?: string
  /** Whether this provider requires a credit card / payment setup */
  requiresPayment: boolean
}

export interface ProviderCategory {
  id: string
  name: Record<string, string>
  providers: FreeProvider[]
}

/**
 * Get providers for a given locale.
 * Returns { primary: FreeProvider[], other: FreeProvider[] }
 * where "other" are collapsed in a secondary section.
 */
export function getProvidersByLocale(locale: string): {
  primary: FreeProvider[]
  other: FreeProvider[]
} {
  const isZh = locale.startsWith('zh')

  // Primary recommendations — ordered by priority
  const primary: FreeProvider[] = []

  // DeepSeek is #1 for ALL locales (email/phone, globally accessible)
  primary.push(DEEPSEEK)

  // Second slot differs by locale
  if (isZh) {
    primary.push(SILICONFLOW)
  } else {
    primary.push(GROQ)
  }

  // "Other" providers — Gemini + GitHub Models
  const other: FreeProvider[] = [GEMINI, GITHUB_MODELS]

  return { primary, other }
}

// ── Provider definitions ──

const DEEPSEEK: FreeProvider = {
  id: 'deepseek',
  name: 'DeepSeek',
  icon: '🧠',
  locales: ['en', 'zh'],
  apiUrl: 'https://api.deepseek.com',
  models: [
    { id: 'deepseek-chat', label: 'DeepSeek V4' },
    { id: 'deepseek-reasoner', label: 'DeepSeek R1' },
  ],
  defaultModel: 'deepseek-chat',
  signupUrl: 'https://platform.deepseek.com',
  tags: ['free_5m', 'email_phone', 'no_cc'],
  requiresPayment: false,
  guide: {
    en: [
      'Open platform.deepseek.com',
      'Sign up with email (or phone number) — no credit card needed',
      'Go to API Keys → Create API Key → Copy the key',
    ],
    zh: [
      '打开 platform.deepseek.com',
      '使用邮箱或手机号注册 — 无需信用卡',
      '进入 API Keys → 创建 API Key → 复制密钥',
    ],
  },
}

const SILICONFLOW: FreeProvider = {
  id: 'siliconflow',
  name: '硅基流动 (SiliconFlow)',
  icon: '💎',
  locales: ['zh'],
  apiUrl: 'https://api.siliconflow.cn/v1',
  models: [
    { id: 'Qwen/Qwen2.5-7B-Instruct', label: 'Qwen2.5-7B (免费)' },
    { id: 'THUDM/glm-4-9b-chat', label: 'GLM-4-9B (免费)' },
    { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', label: 'DeepSeek-R1-7B (免费)' },
    { id: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek-V3 (付费)' },
  ],
  defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
  signupUrl: 'https://cloud.siliconflow.cn',
  tags: ['free_9b', 'china_id', 'free_2000w'],
  requiresPayment: false,
  note: '9B 以下模型永久免费；需中国大陆身份证实名认证。选择模型时注意避开付费模型，否则余额会变负。',
  guide: {
    en: [
      'Open cloud.siliconflow.cn',
      'Register with phone number (China mainland) — real-name ID required',
      'Go to API Key page → Create API Key → Copy the key',
    ],
    zh: [
      '打开 cloud.siliconflow.cn',
      '使用手机号注册 — 需要中国大陆身份证实名认证',
      '进入 API Key 页面 → 创建 API Key → 复制密钥',
    ],
  },
}

const GROQ: FreeProvider = {
  id: 'groq',
  name: 'Groq',
  icon: '⚡',
  locales: ['en'],
  apiUrl: 'https://api.groq.com/openai/v1',
  models: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
  ],
  defaultModel: 'llama-3.3-70b-versatile',
  signupUrl: 'https://console.groq.com',
  tags: ['free_rate', 'email_only', 'no_cc'],
  requiresPayment: false,
  note: 'Region-restricted: not accessible in Greater China. Email-only registration.',
  guide: {
    en: [
      'Open console.groq.com',
      'Sign up with email (Google/GitHub also available)',
      'Go to API Keys → Create API Key → Copy the key',
    ],
    zh: [
      '打开 console.groq.com',
      '使用邮箱注册（也可用 Google/GitHub 登录）',
      '进入 API Keys → 创建 API Key → 复制密钥',
    ],
  },
}

const GEMINI: FreeProvider = {
  id: 'gemini',
  name: 'Google Gemini',
  icon: '🌟',
  locales: ['en', 'zh'],
  apiUrl: 'https://generativelanguage.googleapis.com',
  models: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ],
  defaultModel: 'gemini-2.0-flash',
  signupUrl: 'https://aistudio.google.com/app/apikey',
  tags: ['free_tier', 'google_account', 'no_cc'],
  requiresPayment: false,
  guide: {
    en: [
      'Open aistudio.google.com',
      'Sign in with your Google account',
      'Click "Get API Key" → Create → Copy the key',
    ],
    zh: [
      '打开 aistudio.google.com',
      '使用 Google 账号登录',
      '点击「Get API Key」→ 创建 → 复制密钥',
    ],
  },
}

const GITHUB_MODELS: FreeProvider = {
  id: 'github',
  name: 'GitHub Models',
  icon: '🐙',
  locales: ['en', 'zh'],
  apiUrl: 'https://models.inference.ai.azure.com',
  models: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'deepseek-chat', label: 'DeepSeek V3' },
  ],
  defaultModel: 'gpt-4o',
  signupUrl: 'https://github.com/marketplace/models',
  tags: ['free_rate', 'github_account', 'no_cc'],
  requiresPayment: false,
  guide: {
    en: [
      'Open github.com/marketplace/models',
      'Sign in with your GitHub account',
      'Go to Settings → Developer settings → Personal access tokens → Generate a token → Copy it',
    ],
    zh: [
      '打开 github.com/marketplace/models',
      '使用 GitHub 账号登录',
      '进入 Settings → Developer settings → Personal access tokens → 生成 Token → 复制',
    ],
  },
}
