import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import type { SalesRecord, Granularity } from '../types'

interface ChartsProps {
  data: SalesRecord[]
  granularity: Granularity
}

const CATEGORY_COLORS: Record<string, string> = {
  'Электроника': '#2563eb',
  'Одежда': '#059669',
  'Продукты': '#d97706',
  'Товары для дома': '#7c3aed',
}
const SOURCE_COLORS = ['#2563eb', '#d1d5db', '#f59e0b']
const REGION_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']
const MANAGER_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#9333ea', '#ea580c']

const monthLabels: Record<string, string> = {
  '01': 'Янв', '02': 'Фев', '03': 'Мар', '04': 'Апр',
  '05': 'Май', '06': 'Июн', '07': 'Июл', '08': 'Авг',
  '09': 'Сен', '10': 'Окт', '11': 'Ноя', '12': 'Дек',
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function getISOWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00')
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function formatTooltipLabel(granularity: Granularity, label: string): string {
  if (granularity === 'day') return label
  if (granularity === 'week') return `Неделя ${label}`
  const m = label.padStart(2, '0')
  return monthLabels[m] || label
}

interface AggregateEntry {
  label: string
  revenue: number
  [category: string]: string | number
}

function aggregateByGranularity(data: SalesRecord[], g: Granularity): AggregateEntry[] {
  const map = new Map<string, AggregateEntry>()

  for (const r of data) {
    let key: string
    if (g === 'day') {
      key = r.date
    } else if (g === 'week') {
      const m = r.date.slice(5, 7)
      const w = String(getISOWeek(r.date))
      key = `${m}-W${w}`
    } else {
      key = r.date.slice(5, 7)
    }

    const existing = map.get(key) || { label: key, revenue: 0 }
    existing.revenue += r.revenue
    map.set(key, existing)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}

function aggregateCategoriesByPeriod(data: SalesRecord[], g: Granularity): AggregateEntry[] {
  const periodMap = new Map<string, { label: string; categories: Map<string, number> }>()

  for (const r of data) {
    let key: string
    if (g === 'day') {
      key = r.date
    } else if (g === 'week') {
      const m = r.date.slice(5, 7)
      const w = String(getISOWeek(r.date))
      key = `${m}-W${w}`
    } else {
      key = r.date.slice(5, 7)
    }

    let entry = periodMap.get(key)
    if (!entry) {
      entry = { label: key, categories: new Map() }
      periodMap.set(key, entry)
    }
    entry.categories.set(r.category, (entry.categories.get(r.category) || 0) + r.revenue)
  }

  const cats = ['Электроника', 'Одежда', 'Продукты', 'Товары для дома']

  return Array.from(periodMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => {
      const obj: Record<string, string | number> = { label: v.label }
      for (const cat of cats) {
        obj[cat] = v.categories.get(cat) || 0
      }
      return obj as unknown as AggregateEntry
    })
}

const formatRevenue = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} тыс`
  return String(v)
}

export default function Charts({ data, granularity }: ChartsProps) {
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set())

  const timeSeriesData = useMemo(() => aggregateByGranularity(data, granularity), [data, granularity])
  const categoryData = useMemo(() => aggregateCategoriesByPeriod(data, granularity), [data, granularity])

  const regionData = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of data) {
      map.set(r.region, (map.get(r.region) || 0) + r.revenue)
    }
    return Array.from(map.entries())
      .map(([region, revenue]) => ({ region, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [data])

  const sourceData = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of data) {
      map.set(r.source, (map.get(r.source) || 0) + r.revenue)
    }
    return Array.from(map.entries())
      .map(([source, value]) => ({ source, value }))
  }, [data])

  const topStoresData = useMemo(() => {
    const map = new Map<string, { revenue: number; store_name: string }>()
    for (const r of data) {
      const existing = map.get(r.store_id)
      if (existing) {
        existing.revenue += r.revenue
      } else {
        map.set(r.store_id, { revenue: r.revenue, store_name: r.store_name })
      }
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([, v]) => ({ store: v.store_name, revenue: v.revenue }))
  }, [data])

  const managerData = useMemo(() => {
    const map = new Map<string, { revenue: number; transactions: number }>()
    for (const r of data) {
      const existing = map.get(r.manager) || { revenue: 0, transactions: 0 }
      existing.revenue += r.revenue
      existing.transactions += r.transactions
      map.set(r.manager, existing)
    }
    return Array.from(map.entries())
      .map(([manager, stats]) => ({
        manager,
        revenue: stats.revenue,
        transactions: stats.transactions,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [data])

  const cats = ['Электроника', 'Одежда', 'Продукты', 'Товары для дома']

  function toggleCategory(cat: string) {
    setHiddenCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const timeXFormatter = (label: string) => {
    if (granularity === 'day') {
      const parts = label.split('-')
      return `${parseInt(parts[2])}.${parts[1]}`
    }
    if (granularity === 'week') return `Н${label.split('-W')[1] || label}`
    return monthLabels[label.padStart(2, '0')] || label
  }

  const categoryXFormatter = (label: string) => {
    if (granularity === 'day') {
      const parts = label.split('-')
      return `${parseInt(parts[2])}.${parts[1]}`
    }
    if (granularity === 'week') return `Н${label.split('-W')[1] || label}`
    return monthLabels[label.padStart(2, '0')] || label
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
        <h3 className="text-sm font-medium text-gray-500 mb-4">
          Динамика выручки
          {granularity === 'day' ? ' по дням' : granularity === 'week' ? ' по неделям' : ' по месяцам'}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tickFormatter={timeXFormatter} tick={{ fontSize: 11 }} stroke="#9ca3af" interval="preserveStartEnd" />
            <YAxis tickFormatter={formatRevenue} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip
              labelFormatter={(l) => formatTooltipLabel(granularity, l as string)}
              formatter={(v) => [formatCurrency(v as number), 'Выручка']}
            />
            <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={granularity === 'month' ? { r: 3 } : false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Динамика по продуктам/категориям</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          {cats.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border cursor-pointer transition-colors ${
                hiddenCategories.has(cat)
                  ? 'border-gray-200 text-gray-300 line-through'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
              {cat}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tickFormatter={categoryXFormatter} tick={{ fontSize: 11 }} stroke="#9ca3af" interval="preserveStartEnd" />
            <YAxis tickFormatter={formatRevenue} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip
              labelFormatter={(l) => formatTooltipLabel(granularity, l as string)}
              formatter={(v, name) => [formatCurrency(v as number), name as string]}
            />
            {cats.map(cat => (
              <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat]} hide={hiddenCategories.has(cat)} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Выручка по регионам</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={regionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="region" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tickFormatter={formatRevenue} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip formatter={(v) => [formatCurrency(v as number), 'Выручка']} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {regionData.map((_, i) => (
                <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Распределение по менеджерам</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={managerData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tickFormatter={formatRevenue} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis type="category" dataKey="manager" tick={{ fontSize: 12 }} stroke="#9ca3af" width={80} />
            <Tooltip formatter={(v) => [formatCurrency(v as number), 'Выручка']} />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
              {managerData.map((_, i) => (
                <Cell key={i} fill={MANAGER_COLORS[i % MANAGER_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Доли источников</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={sourceData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              dataKey="value"
              nameKey="source"
              label={({ source, percent }: { source?: string; percent?: number }) =>
                `${source} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {sourceData.map((_, i) => (
                <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [formatCurrency(v as number), 'Выручка']} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Топ-10 магазинов по выручке</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topStoresData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tickFormatter={formatRevenue} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis type="category" dataKey="store" tick={{ fontSize: 11 }} stroke="#9ca3af" width={150} />
            <Tooltip formatter={(v) => [formatCurrency(v as number), 'Выручка']} />
            <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
