import { useState, useMemo, useCallback } from 'react'
import { salesData } from './data/mockData'
import type { SalesRecord, Granularity } from './types'
import Filters from './components/Filters'
import KPICards from './components/KPICards'
import Charts from './components/Charts'
import SalesTable from './components/SalesTable'
import Insights from './components/Insights'

function getDateBounds(data: SalesRecord[]): { min: string; max: string } {
  let min = data[0]?.date ?? '2025-01-01'
  let max = min
  for (const r of data) {
    if (r.date < min) min = r.date
    if (r.date > max) max = r.date
  }
  return { min, max }
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function getPreviousDateRange(dateStart: string, dateEnd: string): { start: string; end: string } {
  const diff = daysBetween(dateStart, dateEnd)
  const startMs = new Date(dateStart).getTime() - (diff + 1) * 86400000
  const endMs = new Date(dateStart).getTime() - 86400000
  const start = new Date(startMs).toISOString().slice(0, 10)
  const end = new Date(endMs).toISOString().slice(0, 10)
  return { start, end }
}

export default function App() {
  const bounds = useMemo(() => getDateBounds(salesData), [])

  const [granularity, setGranularity] = useState<Granularity>('month')
  const [dateStart, setDateStart] = useState(bounds.min)
  const [dateEnd, setDateEnd] = useState(bounds.max)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [selectedManagers, setSelectedManagers] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])

  const previousRange = useMemo(() => getPreviousDateRange(dateStart, dateEnd), [dateStart, dateEnd])

  const filterData = useCallback((data: SalesRecord[], start: string, end: string) => {
    let filtered = data.filter(r => r.date >= start && r.date <= end)
    if (selectedRegions.length > 0) filtered = filtered.filter(r => selectedRegions.includes(r.region))
    if (selectedStores.length > 0) filtered = filtered.filter(r => selectedStores.includes(r.store_id))
    if (selectedManagers.length > 0) filtered = filtered.filter(r => selectedManagers.includes(r.manager))
    if (selectedCategories.length > 0) filtered = filtered.filter(r => selectedCategories.includes(r.category))
    if (selectedSources.length > 0) filtered = filtered.filter(r => selectedSources.includes(r.source))
    return filtered
  }, [selectedRegions, selectedStores, selectedManagers, selectedCategories, selectedSources])

  const currentData = useMemo(() => filterData(salesData, dateStart, dateEnd), [filterData, dateStart, dateEnd])
  const previousData = useMemo(() => filterData(salesData, previousRange.start, previousRange.end), [filterData, previousRange])

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
          granularity={granularity}
          dateStart={dateStart}
          dateEnd={dateEnd}
          regions={selectedRegions}
          stores={selectedStores}
          managers={selectedManagers}
          categories={selectedCategories}
          sources={selectedSources}
          onGranularityChange={setGranularity}
          onDateStartChange={setDateStart}
          onDateEndChange={setDateEnd}
          onRegionsChange={setSelectedRegions}
          onStoresChange={setSelectedStores}
          onManagersChange={setSelectedManagers}
          onCategoriesChange={setSelectedCategories}
          onSourcesChange={setSelectedSources}
        />

        <div id="dashboard-content" className="mt-4 space-y-4">
          <KPICards current={currentData} previous={previousData} />
          <Charts data={currentData} granularity={granularity} />
          <SalesTable data={currentData} previousData={previousData} />
          <Insights data={currentData} allData={salesData} dateStart={dateStart} dateEnd={dateEnd} />
        </div>
      </div>
    </div>
  )
}
