'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'

export interface SearchableSelectOption {
  id: string
  name: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
  variant?: 'default' | 'yellow'
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

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  )

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

  const handleSelect = (id: string) => {
    onChange(id)
    setIsOpen(false)
    setSearch('')
  }

  const borderColor = error
    ? 'border-red-500 focus:ring-red-500'
    : variant === 'yellow'
      ? 'border-gray-300 focus:ring-yellow-500'
      : 'border-gray-300 focus:ring-slate-500'

  const ringColor = variant === 'yellow' ? 'focus:ring-yellow-500' : 'focus:ring-slate-500'

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-md bg-white flex justify-between items-center focus:ring-2 ${ringColor} ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
        } ${error ? 'border-red-500' : 'border-gray-300'}`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {isOpen && !disabled && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className={`w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 ${
                  variant === 'yellow' ? 'focus:ring-yellow-500' : 'focus:ring-slate-500'
                }`}
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    value === opt.id
                      ? variant === 'yellow'
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-slate-50 text-slate-700'
                      : 'text-gray-700'
                  }`}
                  onClick={() => handleSelect(opt.id)}
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}