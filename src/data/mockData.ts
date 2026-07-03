import type { SalesRecord } from '../types'

const storeNames = [
  { id: 'Store_01', region: 'Москва', name: 'Магазин на Тверской', manager: 'Иванов' },
  { id: 'Store_02', region: 'Москва', name: 'Магазин на Арбате', manager: 'Петрова' },
  { id: 'Store_03', region: 'Санкт-Петербург', name: 'Магазин на Невском', manager: 'Сидоров' },
  { id: 'Store_04', region: 'Санкт-Петербург', name: 'Магазин на Лиговском', manager: 'Кузнецов' },
  { id: 'Store_05', region: 'Казань', name: 'Магазин на Баумана', manager: 'Смирнова' },
  { id: 'Store_06', region: 'Казань', name: 'Магазин на Кремлёвской', manager: 'Васильев' },
  { id: 'Store_07', region: 'Новосибирск', name: 'Магазин на Красном проспекте', manager: 'Федорова' },
  { id: 'Store_08', region: 'Новосибирск', name: 'Магазин на Советской', manager: 'Морозов' },
  { id: 'Store_09', region: 'Екатеринбург', name: 'Магазин на Малышева', manager: 'Новикова' },
  { id: 'Store_10', region: 'Екатеринбург', name: 'Магазин на Розы Люксембург', manager: 'Козлов' },
]

const categories = ['Электроника', 'Одежда', 'Продукты', 'Товары для дома']
const sources = ['Сайт', 'Офлайн', 'Маркетплейс']

const growthStores = new Set(['Store_01', 'Store_04'])
const declineStores = new Set(['Store_06', 'Store_08'])

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function generateMockData(): SalesRecord[] {
  const records: SalesRecord[] = []
  let recordIndex = 0
  const year = 2025

  for (const store of storeNames) {
    for (const category of categories) {
      for (const source of sources) {
        for (let month = 1; month <= 12; month++) {
          recordIndex++

          const baseRevenue = 80000 + seededRandom(recordIndex * 7) * 400000
          const baseTransactions = 50 + seededRandom(recordIndex * 13) * 500
          const baseUnits = 30 + seededRandom(recordIndex * 17) * 300
          const baseLeads = 200 + seededRandom(recordIndex * 29) * 1500

          let trendMultiplier = 1
          if (growthStores.has(store.id)) {
            trendMultiplier = Math.pow(1.03, month - 1)
          } else if (declineStores.has(store.id)) {
            trendMultiplier = Math.pow(0.98, month - 1)
          } else {
            trendMultiplier = 1 + (seededRandom(recordIndex * 3) - 0.5) * 0.15
          }

          let seasonalityMultiplier = 1
          if (category === 'Электроника' && (month === 11 || month === 12)) {
            seasonalityMultiplier = 1.5 + seededRandom(recordIndex * 5) * 0.3
          }
          if (category === 'Одежда' && (month === 3 || month === 4)) {
            seasonalityMultiplier = 1.4 + seededRandom(recordIndex * 5) * 0.2
          }

          const sourceMultiplier = source === 'Сайт' ? 0.6 : source === 'Маркетплейс' ? 0.8 : 1
          const noise = 0.85 + seededRandom(recordIndex * 11) * 0.3

          const monthRevenue = Math.round(baseRevenue * trendMultiplier * seasonalityMultiplier * sourceMultiplier * noise)
          const monthTransactions = Math.round(baseTransactions * trendMultiplier * seasonalityMultiplier * sourceMultiplier * (0.85 + seededRandom(recordIndex * 19) * 0.3))
          const monthUnits = Math.round(baseUnits * trendMultiplier * seasonalityMultiplier * sourceMultiplier * (0.85 + seededRandom(recordIndex * 23) * 0.3))
          const monthLeads = Math.round(baseLeads * trendMultiplier * sourceMultiplier * (0.85 + seededRandom(recordIndex * 31) * 0.3))

          const dim = daysInMonth(year, month)
          let remainingRev = monthRevenue
          let remainingTrx = monthTransactions
          let remainingUnits = monthUnits
          let remainingLeads = monthLeads

          for (let day = 1; day <= dim; day++) {
            const isLast = day === dim
            const daysLeft = dim - day + 1
            const fraction = isLast ? 1 : (0.7 + seededRandom(recordIndex * 100 + day * 7) * 0.6) / daysLeft

            const rev = Math.round(remainingRev * fraction)
            const trx = Math.round(remainingTrx * fraction)
            const units = Math.round(remainingUnits * fraction)
            const leads = Math.round(remainingLeads * fraction)

            remainingRev -= rev
            remainingTrx -= trx
            remainingUnits -= units
            remainingLeads -= leads

            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

            records.push({
              date,
              region: store.region,
              store_id: store.id,
              store_name: store.name,
              manager: store.manager,
              category,
              source,
              revenue: Math.max(0, rev),
              transactions: Math.max(0, trx),
              units_sold: Math.max(0, units),
              leads: Math.max(0, leads),
            })
          }
        }
      }
    }
  }

  return records
}

export const salesData: SalesRecord[] = generateMockData()
