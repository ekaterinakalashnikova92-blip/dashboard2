import { useState, useMemo, useCallback } from 'react'
import { salesData } from './data/mockData'
import type { SalesRecord, PeriodType } from './types'
import Filters from './components/Filters'
import KPICards from './components/KPICards'
import Charts from './components/Charts'
import SalesTable from './components/SalesTable'
import Insights from './components/Insights'

function getPeriodMonths(periodType: PeriodType, period: string): string[] {
  if (periodType === 'month') {
    return [period]
  }
  if (periodType === 'quarter') {
    const q = parseInt(period.slice(-1), 10)
    const startMonth = (q - 1) * 3 + 1
    return Array.from({ length: 3 }, (_, i) => {
      const m = startMonth + i
      return `2025-${String(m).padStart(2, '0')}`
    })
  }
  return [
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
  ]
}

function getPreviousPeriod(periodType: PeriodType, period: string): string[] {
  if (periodType === 'month') {
    const m = parseInt(period.slice(-2), 10)
    if (m <= 1) return []
    const prev = `2025-${String(m - 1).padStart(2, '0')}`
    return [prev]
  }
  if (periodType === 'quarter') {
    const q = parseInt(period.slice(-1), 10)
    if (q <= 1) return []
    const prevQ = q - 1
    const startMonth = (prevQ - 1) * 3 + 1
    return Array.from({ length: 3 }, (_, i) => {
      const m = startMonth + i
      return `2025-${String(m).padStart(2, '0')}`
    })
  }
  const prevMonths = [
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
  ]
  return prevMonths
}

function filterByPeriod(data: SalesRecord[], months: string[]): SalesRecord[] {
  if (months.length === 0) return []
  const monthSet = new Set(months)
  return data.filter(r => monthSet.has(r.date.slice(0, 7)))
}

export default function App() {
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [selectedPeriod, setSelectedPeriod] = useState('2025-01')
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])

  const currentMonths = useMemo(() => getPeriodMonths(periodType, selectedPeriod), [periodType, selectedPeriod])
  const previousMonths = useMemo(() => getPreviousPeriod(periodType, selectedPeriod), [periodType, selectedPeriod])

  const filterData = useCallback((data: SalesRecord[], months: string[]) => {
    let filtered = filterByPeriod(data, months)
    if (selectedRegions.length > 0) filtered = filtered.filter(r => selectedRegions.includes(r.region))
    if (selectedStores.length > 0) filtered = filtered.filter(r => selectedStores.includes(r.store_id))
    if (selectedCategories.length > 0) filtered = filtered.filter(r => selectedCategories.includes(r.category))
    if (selectedChannels.length > 0) filtered = filtered.filter(r => selectedChannels.includes(r.channel))
    return filtered
  }, [selectedRegions, selectedStores, selectedCategories, selectedChannels])

  const currentData = useMemo(() => filterData(salesData, currentMonths), [filterData, currentMonths])
  const previousData = useMemo(() => filterData(salesData, previousMonths), [filterData, previousMonths])

  const handleExportPNG = useCallback(async () => {
    const html2canvas = (await import('html2canvas')).default
    const el = document.getElementById('dashboard-content')
    if (!el) return
    const canvas = await html2canvas(el, { backgroundColor: '#f9fafb', scale: 2 })
    const link = document.createElement('a')
    link.download = 'dashboard-export.png'
    link.href = canvas.toDataURL()
    link.click()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Дашборд аналитики продаж</h1>
            <p className="text-sm text-gray-500 mt-0.5">Сеть из 50 магазинов, 5 регионов</p>
          </div>
          <button
            type="button"
            onClick={handleExportPNG}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Экспорт в PNG
          </button>
        </div>

        <Filters
          periodType={periodType}
          selectedPeriod={selectedPeriod}
          regions={selectedRegions}
          stores={selectedStores}
          categories={selectedCategories}
          channels={selectedChannels}
          onPeriodTypeChange={setPeriodType}
          onPeriodChange={setSelectedPeriod}
          onRegionsChange={setSelectedRegions}
          onStoresChange={setSelectedStores}
          onCategoriesChange={setSelectedCategories}
          onChannelsChange={setSelectedChannels}
        />

        <div id="dashboard-content" className="mt-4 space-y-4">
          <KPICards current={currentData} previous={previousData} />
          <Charts data={currentData} />
          <SalesTable data={currentData} previousData={previousData} />
          <Insights data={currentData} allData={salesData} />
        </div>
      </div>
    </div>
  )
}
