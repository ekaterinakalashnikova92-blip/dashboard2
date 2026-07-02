import { useState, useRef, useEffect } from 'react'
import type { PeriodType } from '../types'

const regions = ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург']
const storeOptions = [
  'Store_01', 'Store_02', 'Store_03', 'Store_04', 'Store_05',
  'Store_06', 'Store_07', 'Store_08', 'Store_09', 'Store_10',
]
const categories = ['Электроника', 'Одежда', 'Продукты', 'Товары для дома']
const channels = ['Онлайн', 'Офлайн']

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleOption(opt: string) {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }

  const displayText = selected.length === 0
    ? 'Все'
    : selected.length === 1
      ? selected[0]
      : `Выбрано ${selected.length}`

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer flex items-center justify-between"
      >
        <span className={selected.length === 0 ? 'text-gray-400' : ''}>{displayText}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="rounded border-gray-300 text-gray-600 focus:ring-gray-400"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

interface FiltersProps {
  periodType: PeriodType
  selectedPeriod: string
  regions: string[]
  stores: string[]
  categories: string[]
  channels: string[]
  onPeriodTypeChange: (t: PeriodType) => void
  onPeriodChange: (p: string) => void
  onRegionsChange: (r: string[]) => void
  onStoresChange: (s: string[]) => void
  onCategoriesChange: (c: string[]) => void
  onChannelsChange: (c: string[]) => void
}

const periodOptions: Record<PeriodType, string[]> = {
  month: [
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
  ],
  quarter: ['2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4'],
  year: ['2025'],
}

const monthLabels: Record<string, string> = {
  '2025-01': 'Январь', '2025-02': 'Февраль', '2025-03': 'Март',
  '2025-04': 'Апрель', '2025-05': 'Май', '2025-06': 'Июнь',
  '2025-07': 'Июль', '2025-08': 'Август', '2025-09': 'Сентябрь',
  '2025-10': 'Октябрь', '2025-11': 'Ноябрь', '2025-12': 'Декабрь',
}

export default function Filters({
  periodType, selectedPeriod,
  regions: selectedRegions, stores: selectedStores,
  categories: selectedCategories, channels: selectedChannels,
  onPeriodTypeChange, onPeriodChange,
  onRegionsChange, onStoresChange, onCategoriesChange, onChannelsChange,
}: FiltersProps) {
  const options = periodOptions[periodType]

  return (
    <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 pb-4 pt-4 px-0">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Период</label>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            {(['month', 'quarter', 'year'] as const).map(pt => (
              <button
                key={pt}
                type="button"
                onClick={() => {
                  if (pt !== periodType) {
                    onPeriodTypeChange(pt)
                    onPeriodChange(periodOptions[pt][0])
                  }
                }}
                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                  periodType === pt
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {pt === 'month' ? 'Месяц' : pt === 'quarter' ? 'Квартал' : 'Год'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Значение</label>
          <select
            value={selectedPeriod}
            onChange={e => onPeriodChange(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>
                {monthLabels[opt] || opt}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px]">
          <MultiSelect
            label="Регион"
            options={regions}
            selected={selectedRegions}
            onChange={onRegionsChange}
          />
        </div>

        <div className="min-w-[140px]">
          <MultiSelect
            label="Магазин"
            options={storeOptions}
            selected={selectedStores}
            onChange={onStoresChange}
          />
        </div>

        <div className="min-w-[140px]">
          <MultiSelect
            label="Категория"
            options={categories}
            selected={selectedCategories}
            onChange={onCategoriesChange}
          />
        </div>

        <div className="min-w-[120px]">
          <MultiSelect
            label="Канал"
            options={channels}
            selected={selectedChannels}
            onChange={onChannelsChange}
          />
        </div>
      </div>
    </div>
  )
}
