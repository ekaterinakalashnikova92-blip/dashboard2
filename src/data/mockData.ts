import type { SalesRecord } from '../types'

const storeNames = [
  { id: 'Store_01', region: 'Москва', name: 'Магазин на Тверской' },
  { id: 'Store_02', region: 'Москва', name: 'Магазин на Арбате' },
  { id: 'Store_03', region: 'Санкт-Петербург', name: 'Магазин на Невском' },
  { id: 'Store_04', region: 'Санкт-Петербург', name: 'Магазин на Лиговском' },
  { id: 'Store_05', region: 'Казань', name: 'Магазин на Баумана' },
  { id: 'Store_06', region: 'Казань', name: 'Магазин на Кремлёвской' },
  { id: 'Store_07', region: 'Новосибирск', name: 'Магазин на Красном проспекте' },
  { id: 'Store_08', region: 'Новосибирск', name: 'Магазин на Советской' },
  { id: 'Store_09', region: 'Екатеринбург', name: 'Магазин на Малышева' },
  { id: 'Store_10', region: 'Екатеринбург', name: 'Магазин на Розы Люксембург' },
]

const categories = ['Электроника', 'Одежда', 'Продукты', 'Товары для дома']
const channels = ['Онлайн', 'Офлайн']

const growthStores = new Set(['Store_01', 'Store_04'])
const declineStores = new Set(['Store_06', 'Store_08'])

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function generateMockData(): SalesRecord[] {
  const records: SalesRecord[] = []
  let recordIndex = 0

  for (const store of storeNames) {
    for (const category of categories) {
      for (const channel of channels) {
        for (let month = 1; month <= 12; month++) {
          recordIndex++

          const baseRevenue = 80000 + seededRandom(recordIndex * 7) * 400000
          const baseTransactions = 50 + seededRandom(recordIndex * 13) * 500
          const baseUnits = 30 + seededRandom(recordIndex * 17) * 300

          const monthStr = String(month).padStart(2, '0')
          const date = `2025-${monthStr}-01`

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

          const channelMultiplier = channel === 'Онлайн' ? 0.7 : 1

          const revenue = Math.round(baseRevenue * trendMultiplier * seasonalityMultiplier * channelMultiplier * (0.85 + seededRandom(recordIndex * 11) * 0.3))
          const transactions = Math.round(baseTransactions * trendMultiplier * seasonalityMultiplier * channelMultiplier * (0.85 + seededRandom(recordIndex * 19) * 0.3))
          const units_sold = Math.round(baseUnits * trendMultiplier * seasonalityMultiplier * channelMultiplier * (0.85 + seededRandom(recordIndex * 23) * 0.3))

          records.push({
            date,
            region: store.region,
            store_id: store.id,
            store_name: store.name,
            category,
            channel,
            revenue,
            transactions,
            units_sold,
          })
        }
      }
    }
  }

  return records
}

export const salesData: SalesRecord[] = generateMockData()
