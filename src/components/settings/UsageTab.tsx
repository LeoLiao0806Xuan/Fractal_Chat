import { useUsageStore, getProviderLimit } from '../../stores/usageStore'
import { useModelStore } from '../../stores/modelStore'
import { useTranslation } from '../../i18n'

export function UsageTab() {
  const { t } = useTranslation()
  const records = useUsageStore(s => s.records)
  const configs = useModelStore(s => s.configs)
  const allRecords = Object.values(records)

  // Build a lookup of config name → model name
  const configNames = new Map(configs.map(c => [c.id, c.name]))

  if (allRecords.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-500 text-sm">{t('usage.empty')}</p>
      </div>
    )
  }

  // Sort by last used, newest first
  const sorted = [...allRecords].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  )

  return (
    <div className="p-4 space-y-4">
      {sorted.map(record => {
        const providerName = configNames.get(record.configId) || record.providerName
        const limit = getProviderLimit(providerName)
        const configExists = configNames.has(record.configId)

        return (
          <UsageCard
            key={record.configId}
            providerName={providerName}
            modelName={record.modelName}
            totalTokens={record.totalTokens}
            requestCount={record.requestCount}
            lastUpdated={record.lastUpdated}
            limit={limit}
            configExists={configExists}
            t={t}
          />
        )
      })}
    </div>
  )
}

function UsageCard({
  providerName,
  modelName,
  totalTokens,
  requestCount,
  lastUpdated,
  limit,
  configExists,
  t,
}: {
  providerName: string
  modelName: string
  totalTokens: number
  requestCount: number
  lastUpdated: string
  limit: ReturnType<typeof getProviderLimit>
  configExists: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, params?: any) => string
}) {
  const icon = getProviderIcon(providerName)
  const pct = limit?.type === 'tokens' && limit.total
    ? Math.min(100, Math.round((totalTokens / limit.total) * 100))
    : null

  const date = new Date(lastUpdated)
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`rounded-xl border p-4 ${configExists ? 'border-gray-200' : 'border-amber-200 bg-amber-50/30'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-800">{providerName}</span>
              {!configExists && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                  {t('usage.deleted')}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">{modelName}</div>
          </div>
        </div>
        <div className="text-[10px] text-gray-400 text-right">
          <div>{dateStr}</div>
          <div>{timeStr}</div>
        </div>
      </div>

      {/* Tokens progress */}
      {pct != null ? (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{t('usage.tokens_label')}: {formatTokens(totalTokens)}</span>
            <span>{t('usage.percent', { pct })}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-indigo-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {limit && (
            <div className="text-[10px] text-gray-400 mt-0.5">
              / {limit.label}
            </div>
          )}
        </div>
      ) : limit?.type === 'unlimited' ? (
        <div className="flex items-center gap-1.5 text-xs text-green-600 mb-2">
          <span>✅</span>
          <span>{t('usage.unlimited')}</span>
        </div>
      ) : (
        <div className="text-xs text-gray-400 mb-2">
          {t('usage.tokens_label')}: {formatTokens(totalTokens)}
          {limit && <span> · {limit.label}</span>}
        </div>
      )}

      {/* Request count */}
      <div className="text-xs text-gray-400">
        {t('usage.requests_label')}: {requestCount}
      </div>
    </div>
  )
}

function getProviderIcon(name: string): string {
  if (name.includes('DeepSeek')) return '🧠'
  if (name.includes('硅基') || name.includes('Silicon')) return '💎'
  if (name.includes('Groq')) return '⚡'
  if (name.includes('Gemini')) return '🌟'
  if (name.includes('GitHub')) return '🐙'
  if (name.includes('OpenAI')) return '🤖'
  if (name.includes('Anthropic') || name.includes('Claude')) return '🟣'
  return '🔌'
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
