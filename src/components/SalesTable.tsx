import { useState, useMemo } from 'react'
import type { SalesRecord, StoreSummary } from '../types'

interface SalesTableProps {
  data: SalesRecord[]
  previousData: SalesRecord[]
}

type SortKey = keyof StoreSummary
type SortDir = 'asc' | 'desc'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n)
}

export default function SalesTable({ data, previousData }: SalesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const prevMap = useMemo(() => {
    const map = new Map<string, { revenue: number; transactions: number; leads: number }>()
    for (const r of previousData) {
      const prev = map.get(r.store_id) || { revenue: 0, transactions: 0, leads: 0 }
      prev.revenue += r.revenue
      prev.transactions += r.transactions
      prev.leads += r.leads
      map.set(r.store_id, prev)
    }
    return map
  }, [previousData])

  const rows = useMemo(() => {
    const storeMap = new Map<string, { store_id: string; store_name: string; manager: string; region: string; revenue: number; transactions: number; leads: number }>()
    for (const r of data) {
      const existing = storeMap.get(r.store_id) || {
        store_id: r.store_id, store_name: r.store_name, manager: r.manager, region: r.region,
        revenue: 0, transactions: 0, leads: 0,
      }
      existing.revenue += r.revenue
      existing.transactions += r.transactions
      existing.leads += r.leads
      storeMap.set(r.store_id, existing)
    }

    const result: StoreSummary[] = []
    for (const v of storeMap.values()) {
      const prev = prevMap.get(v.store_id)
      const prevRevenue = prev?.revenue || 1
      const dynamics = Math.round(((v.revenue - prevRevenue) / prevRevenue) * 100 * 100) / 100
      result.push({
        store_name: v.store_name,
        manager: v.manager,
        region: v.region,
        revenue: v.revenue,
        transactions: v.transactions,
        leads: v.leads,
        conversion: v.leads > 0 ? Math.round((v.transactions / v.leads) * 10000) / 100 : 0,
        avgCheck: v.transactions > 0 ? Math.round(v.revenue / v.transactions) : 0,
        dynamics,
      })
    }

    result.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return result
  }, [data, prevMap, sortKey, sortDir])

  const columns: { key: SortKey; label: string; align?: string }[] = [
    { key: 'store_name', label: 'Магазин' },
    { key: 'manager', label: 'Менеджер' },
    { key: 'region', label: 'Регион' },
    { key: 'revenue', label: 'Выручка', align: 'text-right' },
    { key: 'transactions', label: 'Продажи', align: 'text-right' },
    { key: 'leads', label: 'Заявки', align: 'text-right' },
    { key: 'conversion', label: 'Конверсия', align: 'text-right' },
    { key: 'avgCheck', label: 'Средний чек', align: 'text-right' },
    { key: 'dynamics', label: 'Динамика', align: 'text-right' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none whitespace-nowrap ${col.align || 'text-left'}`}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.store_name + idx} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-3 text-gray-900 whitespace-nowrap">{row.store_name}</td>
                <td className="px-3 py-3 text-gray-600">{row.manager}</td>
                <td className="px-3 py-3 text-gray-600">{row.region}</td>
                <td className="px-3 py-3 text-gray-900 text-right whitespace-nowrap">{formatCurrency(row.revenue)}</td>
                <td className="px-3 py-3 text-gray-900 text-right whitespace-nowrap">{formatNumber(row.transactions)}</td>
                <td className="px-3 py-3 text-gray-900 text-right whitespace-nowrap">{formatNumber(row.leads)}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap">{row.conversion}%</td>
                <td className="px-3 py-3 text-gray-900 text-right whitespace-nowrap">{formatCurrency(row.avgCheck)}</td>
                <td className={`px-3 py-3 text-right whitespace-nowrap`}>
                  <span className={`inline-flex items-center gap-1 ${row.dynamics >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={row.dynamics >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
                    </svg>
                    {row.dynamics >= 0 ? '+' : ''}{row.dynamics}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
