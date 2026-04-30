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
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
  variant?: 'default' | 'yellow' | 'slate'
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
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter((opt) => {
    const nameMatch = (opt.name || '').toLowerCase().includes(search.toLowerCase())
    const groupMatch = (opt.group || '').toLowerCase().includes(search.toLowerCase())
    return nameMatch || groupMatch
  })

  const selectedOption = options.find((opt) => opt.id === value)

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
    onChange(id)
    setIsOpen(false)
    setSearch('')
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

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-md bg-white flex justify-between items-center focus:outline-none focus:ring-2 ${ringColor} ${
          disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-gray-400 transition-colors'
        } ${error ? 'border-red-500' : 'border-gray-200 shadow-sm'}`}
      >
        <span className={`truncate text-sm ${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
              displayOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`px-3 py-2 text-sm transition-colors ${
                    opt.isGroupHeader
                      ? 'bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 cursor-default'
                      : value === opt.id
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  }`}
                  onClick={() => handleSelect(opt.id, opt.isGroupHeader)}
                >
                  {opt.name}
                </div>
              ))
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