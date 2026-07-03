import { useMemo } from 'react'
import type { SalesRecord } from '../types'

interface InsightsProps {
  data: SalesRecord[]
  allData: SalesRecord[]
  dateStart: string
  dateEnd: string
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function formatPercent(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1
}

export default function Insights({ data, allData, dateStart, dateEnd }: InsightsProps) {
  const generalInsights = useMemo(() => {
    const result: string[] = []
    if (data.length === 0) {
      result.push('Нет данных для отображения.')
      return result
    }

    const totalRevenue = data.reduce((s, r) => s + r.revenue, 0)

    const storeRevenue = new Map<string, number>()
    for (const r of data) {
      storeRevenue.set(r.store_id, (storeRevenue.get(r.store_id) || 0) + r.revenue)
    }
    const sortedStores = Array.from(storeRevenue.entries()).sort(([, a], [, b]) => b - a)
    if (sortedStores.length > 0) {
      const best = sortedStores[0]
      result.push(`Лидер по выручке — ${best[0]} с результатом ${formatCurrency(best[1])}.`)
    }
    if (sortedStores.length > 1) {
      const worst = sortedStores[sortedStores.length - 1]
      result.push(`Наименьший показатель у ${worst[0]} — ${formatCurrency(worst[1])}.`)
    }

    const categoryRevenue = new Map<string, number>()
    for (const r of data) {
      categoryRevenue.set(r.category, (categoryRevenue.get(r.category) || 0) + r.revenue)
    }
    const topCategory = Array.from(categoryRevenue.entries()).sort(([, a], [, b]) => b - a)[0]
    if (topCategory) {
      const catPercent = Math.round((topCategory[1] / totalRevenue) * 100)
      result.push(`Категория "${topCategory[0]}" приносит ${catPercent}% выручки.`)
    }

    const onlineRevenue = data.filter(r => r.channel === 'Онлайн').reduce((s, r) => s + r.revenue, 0)
    const onlinePercent = Math.round((onlineRevenue / totalRevenue) * 100)
    result.push(`Доля онлайн-продаж составляет ${onlinePercent}%.`)

    const allTotalRevenue = allData.reduce((s, r) => s + r.revenue, 0)
    if (allTotalRevenue > 0) {
      const share = Math.round((totalRevenue / allTotalRevenue) * 100)
      result.push(`Выбранный период составляет ${share}% от общей выручки за год.`)
    }

    return result
  }, [data, allData])

  const managementInsights = useMemo(() => {
    const insights: { text: string; direction: 'up' | 'down' | 'neutral'; value: string }[] = []

    if (data.length === 0) return insights

    const storeRevenue = new Map<string, number[]>()
    for (const r of data) {
      if (!storeRevenue.has(r.store_id)) storeRevenue.set(r.store_id, [])
      storeRevenue.get(r.store_id)!.push(r.revenue)
    }

    let worstStore = ''
    let worstChange = 0
    for (const [storeId, revs] of storeRevenue) {
      if (revs.length >= 3) {
        const half = Math.floor(revs.length / 2)
        const firstHalf = revs.slice(0, half).reduce((a, b) => a + b, 0)
        const secondHalf = revs.slice(-half).reduce((a, b) => a + b, 0)
        if (firstHalf > 0) {
          const change = ((secondHalf - firstHalf) / firstHalf) * 100
          if (change < worstChange) {
            worstChange = change
            worstStore = storeId
          }
        }
      }
    }
    if (worstStore) {
      const days = daysBetween(dateStart, dateEnd)
      insights.push({
        text: `${worstStore} показывает падение выручки на ${Math.abs(worstChange).toFixed(1)}% за последние ${days} дней`,
        direction: 'down',
        value: formatPercent(worstChange),
      })
    }

    const monthRevenue = new Map<string, number>()
    for (const r of data) {
      const m = r.date.slice(0, 7)
      monthRevenue.set(m, (monthRevenue.get(m) || 0) + r.revenue)
    }
    const categoryMonthly = new Map<string, Map<string, number>>()
    for (const r of data) {
      if (!categoryMonthly.has(r.category)) categoryMonthly.set(r.category, new Map())
      const m = r.date.slice(0, 7)
      const cm = categoryMonthly.get(r.category)!
      cm.set(m, (cm.get(m) || 0) + r.revenue)
    }

    for (const [cat, months] of categoryMonthly) {
      if (months.size >= 2) {
        const sorted = Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b))
        const last = sorted[sorted.length - 1][1]
        const prev = sorted[sorted.length - 2][1]
        if (prev > 0) {
          const mom = ((last - prev) / prev) * 100
          insights.push({
            text: `Категория "${cat}" демонстрирует рост ${formatPercent(mom)} MoM`,
            direction: mom >= 0 ? 'up' : 'down',
            value: formatPercent(mom),
          })
        }
      }
    }

    const channelRevenue = new Map<string, { current: number; previous: number }>()
    const months = Array.from(monthRevenue.entries()).sort(([a], [b]) => a.localeCompare(b))
    for (const r of data) {
      if (!channelRevenue.has(r.channel)) {
        channelRevenue.set(r.channel, { current: 0, previous: 0 })
      }
      const m = r.date.slice(0, 7)
      const isCurrent = months.length > 0 && m === months[months.length - 1][0]
      const isPrev = months.length > 1 && m === months[months.length - 2][0]
      const entry = channelRevenue.get(r.channel)!
      if (isCurrent) entry.current += r.revenue
      if (isPrev) entry.previous += r.revenue
    }

    const online = channelRevenue.get('Онлайн')
    const offline = channelRevenue.get('Офлайн')
    if (online && offline && online.previous > 0 && offline.previous > 0) {
      const onlineGrowth = ((online.current - online.previous) / online.previous) * 100
      const offlineGrowth = ((offline.current - offline.previous) / offline.previous) * 100
      insights.push({
        text: `Онлайн-канал растёт быстрее Офлайн (${formatPercent(onlineGrowth)} vs ${formatPercent(offlineGrowth)})`,
        direction: onlineGrowth >= offlineGrowth ? 'up' : 'down',
        value: formatPercent(onlineGrowth - offlineGrowth),
      })
    }

    const regionStats = new Map<string, { revenue: number; transactions: number }>()
    for (const r of data) {
      const existing = regionStats.get(r.region) || { revenue: 0, transactions: 0 }
      existing.revenue += r.revenue
      existing.transactions += r.transactions
      regionStats.set(r.region, existing)
    }
    let bestRegion = ''
    let bestAvgCheck = 0
    for (const [region, stats] of regionStats) {
      const avg = stats.transactions > 0 ? stats.revenue / stats.transactions : 0
      if (avg > bestAvgCheck) {
        bestAvgCheck = avg
        bestRegion = region
      }
    }
    if (bestRegion) {
      insights.push({
        text: `Регион "${bestRegion}" показывает самый высокий средний чек — ${formatCurrency(Math.round(bestAvgCheck))}`,
        direction: 'neutral',
        value: formatCurrency(Math.round(bestAvgCheck)),
      })
    }

    return insights
  }, [data, dateStart, dateEnd])

  return (
    <div className="space-y-4">
      {managementInsights.length > 0 && (
        <div>
          <h3 className="text-base font-medium text-gray-800 mb-3">Ключевые управленческие выводы</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {managementInsights.map((insight, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl border shadow-sm p-4 ${
                  insight.direction === 'up'
                    ? 'border-emerald-100'
                    : insight.direction === 'down'
                      ? 'border-red-100'
                      : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    insight.direction === 'up'
                      ? 'bg-emerald-50 text-emerald-600'
                      : insight.direction === 'down'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {insight.direction === 'up' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : insight.direction === 'down' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{insight.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Аналитические выводы</h3>
        <ul className="space-y-2">
          {generalInsights.map((text, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
