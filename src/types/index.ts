export interface SalesRecord {
  date: string
  region: string
  store_id: string
  store_name: string
  category: string
  channel: string
  revenue: number
  transactions: number
  units_sold: number
}

export type Granularity = 'day' | 'week' | 'month'

export interface FilterState {
  granularity: Granularity
  dateStart: string
  dateEnd: string
  regions: string[]
  stores: string[]
  categories: string[]
  channels: string[]
}

export interface KPIItem {
  label: string
  value: string
  change: number
  prefix?: string
}

export interface StoreSummary {
  store_name: string
  region: string
  revenue: number
  transactions: number
  avgCheck: number
  dynamics: number
}
