'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'

export interface SearchableSelectOption {
  id: string
  name: string
  group?: string
  isGroupHeader?: boolean
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string | string[]
  onChange: (val: any) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
  variant?: 'default' | 'yellow' | 'slate'
  isMulti?: boolean
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Chọn...',
  className = '',
  disabled = false,
  error,
  variant = 'default',
  isMulti = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter((opt) => {
    const nameMatch = (opt.name || '').toLowerCase().includes(search.toLowerCase())
    const groupMatch = (opt.group || '').toLowerCase().includes(search.toLowerCase())
    return nameMatch || groupMatch
  })

  const isSelected = (id: string) => {
    if (isMulti && Array.isArray(value)) {
      return value.includes(id)
    }
    return value === id
  }

  const selectedOptions = isMulti && Array.isArray(value)
    ? options.filter(opt => value.includes(opt.id))
    : options.find(opt => opt.id === value) ? [options.find(opt => opt.id === value)!] : []

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id: string, isGroupHeader?: boolean) => {
    if (isGroupHeader) return

    const allIds = ['ALL', '__all__']
    const isAllId = allIds.includes(id)

    if (isMulti) {
      const currentValues = Array.isArray(value) ? [...value] : []
      if (isAllId) {
        onChange([id])
      } else {
        // Remove "All" IDs if selecting specific items
        const filteredValues = currentValues.filter(v => !allIds.includes(v))
        if (filteredValues.includes(id)) {
          onChange(filteredValues.filter(v => v !== id))
        } else {
          onChange([...filteredValues, id])
        }
      }
    } else {
      onChange(id)
      setIsOpen(false)
      setSearch('')
    }
  }

  const handleToggleGroup = (groupName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const groupOptions = options.filter(opt => opt.group === groupName && !opt.isGroupHeader)
    const groupIds = groupOptions.map(opt => opt.id)

    const allIds = ['ALL', '__all__']
    const currentValues = Array.isArray(value) ? value.filter(v => !allIds.includes(v)) : []
    const allGroupSelected = groupIds.every(id => currentValues.includes(id))

    if (allGroupSelected) {
      // Unselect all in group
      onChange(currentValues.filter(id => !groupIds.includes(id)))
    } else {
      // Select all in group
      const newValues = Array.from(new Set([...currentValues, ...groupIds]))
      onChange(newValues)
    }
  }

  const ringColor = variant === 'yellow'
    ? 'focus:ring-yellow-500'
    : variant === 'slate'
      ? 'focus:ring-slate-800'
      : 'focus:ring-slate-500'

  // Group filtered options if they have groups
  const groupedOptions: SearchableSelectOption[] = []
  let currentGroup = ''

  filteredOptions.forEach(opt => {
    if (opt.group && opt.group !== currentGroup && !search) {
      currentGroup = opt.group
      groupedOptions.push({ id: `group-${currentGroup}`, name: currentGroup, isGroupHeader: true })
    }
    groupedOptions.push(opt)
  })

  const displayOptions = search ? filteredOptions : (options.some(o => o.group) ? groupedOptions : filteredOptions)

  const getDisplayText = () => {
    if (selectedOptions.length === 0) return placeholder
    const allIds = ['ALL', '__all__']
    if (isMulti) {
      const allOption = selectedOptions.find(opt => allIds.includes(opt.id))
      if (allOption) return allOption.name
      if (selectedOptions.length === 1) return selectedOptions[0].name
      return `${selectedOptions.length} đã chọn`
    }
    return selectedOptions[0].name
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-md bg-white flex justify-between items-center focus:outline-none focus:ring-2 ${ringColor} ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-gray-400 transition-colors'
          } ${error ? 'border-red-500' : 'border-gray-200 shadow-sm'}`}
      >
        <span className={`truncate text-sm ${selectedOptions.length > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1">
          {isMulti && selectedOptions.length > 0 && !selectedOptions.some(o => ['ALL', '__all__'].includes(o.id)) && (
            <span className="flex items-center justify-center bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {selectedOptions.length}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {isOpen && !disabled && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl animate-in fade-in zoom-in duration-150">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                className={`w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 ${ringColor} bg-gray-50`}
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
            {displayOptions.length > 0 ? (
              displayOptions.map((opt) => {
                const selected = isSelected(opt.id)

                if (opt.isGroupHeader) {
                  const groupOptions = options.filter(o => o.group === opt.name && !o.isGroupHeader)
                  const groupIds = groupOptions.map(o => o.id)
                  const allSelectedInGroup = isMulti && groupIds.length > 0 && groupIds.every(id => isSelected(id))

                  return (
                    <div
                      key={opt.id}
                      onClick={(e) => isMulti && handleToggleGroup(opt.name, e)}
                      className={`px-3 py-2 bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 flex justify-between items-center ${isMulti ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {isMulti && (
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${allSelectedInGroup ? 'bg-slate-600 border-slate-600' : 'border-gray-300 bg-white'
                            }`}>
                            {allSelectedInGroup && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                        <span>{opt.name}</span>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={opt.id}
                    className={`px-3 py-2 text-sm transition-colors flex items-center justify-between ${selected
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                      }`}
                    onClick={() => handleSelect(opt.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isMulti && (
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selected ? 'bg-slate-800 border-slate-800' : 'border-gray-300 bg-white'
                          }`}>
                          {selected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                      <span>{opt.name}</span>
                    </div>
                    {selected && !isMulti && (
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="px-3 py-6 text-sm text-gray-400 text-center italic">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}