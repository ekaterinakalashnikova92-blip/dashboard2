import { useState, useRef, useEffect } from 'react'
import type { Granularity } from '../types'

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
  granularity: Granularity
  dateStart: string
  dateEnd: string
  regions: string[]
  stores: string[]
  categories: string[]
  channels: string[]
  onGranularityChange: (g: Granularity) => void
  onDateStartChange: (d: string) => void
  onDateEndChange: (d: string) => void
  onRegionsChange: (r: string[]) => void
  onStoresChange: (s: string[]) => void
  onCategoriesChange: (c: string[]) => void
  onChannelsChange: (c: string[]) => void
}

export default function Filters({
  granularity, dateStart, dateEnd,
  regions: selectedRegions, stores: selectedStores,
  categories: selectedCategories, channels: selectedChannels,
  onGranularityChange, onDateStartChange, onDateEndChange,
  onRegionsChange, onStoresChange, onCategoriesChange, onChannelsChange,
}: FiltersProps) {
  return (
    <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 pb-4 pt-4 px-0">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Детализация</label>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            {(['day', 'week', 'month'] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => onGranularityChange(g)}
                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${
                  granularity === g
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {g === 'day' ? 'День' : g === 'week' ? 'Неделя' : 'Месяц'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">С</label>
          <input
            type="date"
            value={dateStart}
            onChange={e => onDateStartChange(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">По</label>
          <input
            type="date"
            value={dateEnd}
            onChange={e => onDateEndChange(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
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
