import type { SalesRecord } from '../types'

interface KPICardsProps {
  current: SalesRecord[]
  previous: SalesRecord[]
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n)
}

function computeChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100 * 100) / 100
}

export default function KPICards({ current, previous }: KPICardsProps) {
  const currentRevenue = current.reduce((s, r) => s + r.revenue, 0)
  const currentTransactions = current.reduce((s, r) => s + r.transactions, 0)
  const currentUnits = current.reduce((s, r) => s + r.units_sold, 0)
  const currentAvgCheck = currentTransactions > 0 ? Math.round(currentRevenue / currentTransactions) : 0

  const prevRevenue = previous.reduce((s, r) => s + r.revenue, 0)
  const prevTransactions = previous.reduce((s, r) => s + r.transactions, 0)
  const prevUnits = previous.reduce((s, r) => s + r.units_sold, 0)
  const prevAvgCheck = prevTransactions > 0 ? Math.round(prevRevenue / prevTransactions) : 0

  const cards = [
    { label: 'Общая выручка', value: formatCurrency(currentRevenue), change: computeChange(currentRevenue, prevRevenue) },
    { label: 'Транзакции', value: formatNumber(currentTransactions), change: computeChange(currentTransactions, prevTransactions) },
    { label: 'Средний чек', value: formatCurrency(currentAvgCheck), change: computeChange(currentAvgCheck, prevAvgCheck) },
    { label: 'Проданные единицы', value: formatNumber(currentUnits), change: computeChange(currentUnits, prevUnits) },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => {
        const isPositive = card.change >= 0
        return (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPositive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
              </svg>
              <span>{isPositive ? '+' : ''}{card.change}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
