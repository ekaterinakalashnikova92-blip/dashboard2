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
  const currentLeads = current.reduce((s, r) => s + r.leads, 0)
  const currentConversion = currentLeads > 0 ? Math.round((currentTransactions / currentLeads) * 10000) / 100 : 0
  const currentAvgCheck = currentTransactions > 0 ? Math.round(currentRevenue / currentTransactions) : 0

  const prevRevenue = previous.reduce((s, r) => s + r.revenue, 0)
  const prevTransactions = previous.reduce((s, r) => s + r.transactions, 0)
  const prevLeads = previous.reduce((s, r) => s + r.leads, 0)
  const prevConversion = prevLeads > 0 ? Math.round((prevTransactions / prevLeads) * 10000) / 100 : 0
  const prevAvgCheck = prevTransactions > 0 ? Math.round(prevRevenue / prevTransactions) : 0

  const cards = [
    { label: 'Выручка', value: formatCurrency(currentRevenue), change: computeChange(currentRevenue, prevRevenue) },
    { label: 'Количество заявок', value: formatNumber(currentLeads), change: computeChange(currentLeads, prevLeads) },
    { label: 'Количество продаж', value: formatNumber(currentTransactions), change: computeChange(currentTransactions, prevTransactions) },
    { label: 'Конверсия', value: `${currentConversion}%`, change: computeChange(currentConversion, prevConversion) },
    { label: 'Средний чек', value: formatCurrency(currentAvgCheck), change: computeChange(currentAvgCheck, prevAvgCheck) },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(card => {
        const isPositive = card.change >= 0
        return (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-lg font-semibold text-gray-900">{card.value}</p>
            <div className={`flex items-center gap-1 mt-1.5 text-xs ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
