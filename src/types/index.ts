export interface SalesRecord {
  date: string
  region: string
  store_id: string
  store_name: string
  manager: string
  category: string
  source: string
  revenue: number
  transactions: number
  units_sold: number
  leads: number
}

export type Granularity = 'day' | 'week' | 'month'

export interface FilterState {
  granularity: Granularity
  dateStart: string
  dateEnd: string
  regions: string[]
  stores: string[]
  managers: string[]
  categories: string[]
  sources: string[]
}

export interface KPIItem {
  label: string
  value: string
  change: number
}

export interface StoreSummary {
  store_name: string
  manager: string
  region: string
  revenue: number
  transactions: number
  leads: number
  conversion: number
  avgCheck: number
  dynamics: number
}
