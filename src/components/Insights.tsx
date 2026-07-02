import { useMemo } from 'react'
import type { SalesRecord } from '../types'

interface InsightsProps {
  data: SalesRecord[]
  allData: SalesRecord[]
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function Insights({ data, allData }: InsightsProps) {
  const insights = useMemo(() => {
    const result: string[] = []

    if (data.length === 0) {
      result.push('Нет данных для отображения.')
      return result
    }

    const totalRevenue = data.reduce((s, r) => s + r.revenue, 0)
    const storeRevenue = new Map<string, number>()
    const storeCount = new Map<string, number>()
    for (const r of data) {
      storeRevenue.set(r.store_id, (storeRevenue.get(r.store_id) || 0) + r.revenue)
      storeCount.set(r.store_id, (storeCount.get(r.store_id) || 0) + 1)
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

    const monthSet = new Set(data.map(r => r.date.slice(0, 7)))
    if (monthSet.size >= 3) {
      const storeMonthly = new Map<string, number[]>()
      for (const r of data) {
        if (!storeMonthly.has(r.store_id)) storeMonthly.set(r.store_id, [])
        storeMonthly.get(r.store_id)!.push(r.revenue)
      }

      for (const [storeId, revs] of storeMonthly) {
        if (revs.length >= 3) {
          const first3 = revs.slice(0, 3).reduce((a, b) => a + b, 0) / 3
          const last3 = revs.slice(-3).reduce((a, b) => a + b, 0) / 3
          if (first3 > 0) {
            const change = Math.round(((last3 - first3) / first3) * 100)
            if (change >= 15) {
              result.push(`${storeId} показывает рост на ${change}% за последние 3 месяца.`)
            } else if (change <= -15) {
              result.push(`${storeId} показывает падение на ${Math.abs(change)}% за последние 3 месяца.`)
            }
          }
        }
      }
    }

    const allTotalRevenue = allData.reduce((s, r) => s + r.revenue, 0)
    if (allTotalRevenue > 0) {
      const share = Math.round((totalRevenue / allTotalRevenue) * 100)
      result.push(`Выбранный период составляет ${share}% от общей выручки за год.`)
    }

    return result
  }, [data, allData])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Аналитические выводы</h3>
      <ul className="space-y-2">
        {insights.map((text, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}
