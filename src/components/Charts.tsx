import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import type { SalesRecord } from '../types'

interface ChartsProps {
  data: SalesRecord[]
}

const CHANNEL_COLORS = ['#2563eb', '#d1d5db']
const REGION_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']

const monthLabels: Record<string, string> = {
  '01': 'Янв', '02': 'Фев', '03': 'Мар', '04': 'Апр',
  '05': 'Май', '06': 'Июн', '07': 'Июл', '08': 'Авг',
  '09': 'Сен', '10': 'Окт', '11': 'Ноя', '12': 'Дек',
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function Charts({ data }: ChartsProps) {
  const monthlyData = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of data) {
      const month = r.date.slice(5, 7)
      map.set(month, (map.get(month) || 0) + r.revenue)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, rev]) => ({ month: monthLabels[m] || m, revenue: rev }))
  }, [data])

  const regionData = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of data) {
      map.set(r.region, (map.get(r.region) || 0) + r.revenue)
    }
    return Array.from(map.entries())
      .map(([region, revenue]) => ({ region, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [data])

  const channelData = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of data) {
      map.set(r.channel, (map.get(r.channel) || 0) + r.revenue)
    }
    return Array.from(map.entries())
      .map(([channel, value]) => ({ channel, value }))
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

  const formatRevenue = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн`
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)} тыс`
    return String(v)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Динамика выручки по месяцам</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tickFormatter={formatRevenue} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip formatter={(v) => formatCurrency(v as number)} />
            <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Выручка по регионам</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={regionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="region" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tickFormatter={formatRevenue} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip formatter={(v) => formatCurrency(v as number)} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {regionData.map((_, i) => (
                <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Доли каналов сбыта</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={channelData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              dataKey="value"
              nameKey="channel"
              label={({ channel, percent }: { channel?: string; percent?: number }) => `${channel} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {channelData.map((_, i) => (
                <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(v as number)} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Топ-10 магазинов по выручке</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topStoresData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tickFormatter={formatRevenue} tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis type="category" dataKey="store" tick={{ fontSize: 11 }} stroke="#9ca3af" width={150} />
            <Tooltip formatter={(v) => formatCurrency(v as number)} />
            <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
