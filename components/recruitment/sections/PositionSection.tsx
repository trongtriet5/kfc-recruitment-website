'use client'

import { useState } from 'react'
import { Briefcase, Store } from 'lucide-react'
import Icon from '@/components/icons/Icon'
import { SearchableSelect } from '@/components/ui/select-searchable'

interface PositionSectionProps {
  formData: {
    appliedPosition: string
    appliedPositionOther: string
    availableStartDate: string
    canWorkTet?: string
    referrer?: string
    referrerName?: string
    preferredLocations: string[]
  }
  validationErrors: Record<string, string>
  onChange: (field: string, value: string | string[] | boolean) => void
  positions: { id: string; name: string }[]
  availableStores: any[]
  storeSearch: string
  onStoreSearchChange: (value: string) => void
  filteredStores: any[]
}

const REFERRERS = [
  { value: 'Nhân viên công ty', label: 'Nhân viên công ty' },
  { value: 'Cộng tác viên', label: 'Cộng tác viên' },
  { value: 'Không có', label: 'Không có' },
]

export default function PositionSection({
  formData,
  validationErrors,
  onChange,
  positions,
  availableStores,
  storeSearch,
  onStoreSearchChange,
  filteredStores,
}: PositionSectionProps) {
  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    let formatted = ''
    if (numbers.length > 0) {
      formatted = numbers.slice(0, 2)
    }
    if (numbers.length > 2) {
      formatted += '/' + numbers.slice(2, 4)
    }
    if (numbers.length > 4) {
      formatted += '/' + numbers.slice(4, 8)
    }
    return formatted
  }

  const handleLocationToggle = (storeId: string) => {
    const currentLocations = formData.preferredLocations || []
    const newLocations = currentLocations.includes(storeId)
      ? currentLocations.filter((id: string) => id !== storeId)
      : [...currentLocations, storeId]
    onChange('preferredLocations', newLocations)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b">
        <Icon name="briefcase" size={20} className="text-kfc-red" />
        <h3 className="text-lg font-semibold text-gray-900">Vị trí ứng tuyển</h3>
      </div>

      {/* Vị trí ứng tuyển */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vị trí ứng tuyển <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.appliedPosition}
          onChange={e => onChange('appliedPosition', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
            validationErrors.appliedPosition ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Chọn vị trí</option>
          {positions.map(position => (
            <option key={position.id} value={position.id}>
              {position.name}
            </option>
          ))}
        </select>
        {validationErrors.appliedPosition && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.appliedPosition}</p>
        )}
      </div>

      {/* Vị trí khác */}
      {formData.appliedPosition === 'OTHER' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vị trí khác <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.appliedPositionOther}
            onChange={e => onChange('appliedPositionOther', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
              validationErrors.appliedPositionOther ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập vị trí bạn muốn ứng tuyển"
          />
          {validationErrors.appliedPositionOther && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.appliedPositionOther}</p>
          )}
        </div>
      )}

      {/* Ngày có thể bắt đầu */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ngày có thể bắt đầu <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.availableStartDate}
          onChange={e => onChange('availableStartDate', formatDate(e.target.value))}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
            validationErrors.availableStartDate ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="DD/MM/YYYY"
        />
        {validationErrors.availableStartDate && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.availableStartDate}</p>
        )}
      </div>

      {/* Có thể làm Tết */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Có thể làm việc ngày Tết?
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="canWorkTet"
              value="Có"
              checked={formData.canWorkTet === 'Có'}
              onChange={() => onChange('canWorkTet', 'Có')}
              className="w-4 h-4 text-kfc-red focus:ring-kfc-red"
            />
            <span className="text-gray-700">Có</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="canWorkTet"
              value="Không"
              checked={formData.canWorkTet === 'Không' || !formData.canWorkTet}
              onChange={() => onChange('canWorkTet', 'Không')}
              className="w-4 h-4 text-kfc-red focus:ring-kfc-red"
            />
            <span className="text-gray-700">Không</span>
          </label>
        </div>
      </div>

      {/* Người giới thiệu */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bạn biết đến KFC qua?
        </label>
        <select
          value={formData.referrer || 'Không có'}
          onChange={e => onChange('referrer', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red"
        >
          {REFERRERS.map(ref => (
            <option key={ref.value} value={ref.value}>
              {ref.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tên người giới thiệu */}
      {(formData.referrer === 'Nhân viên công ty' || formData.referrer === 'Cộng tác viên') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên người giới thiệu
          </label>
          <input
            type="text"
            value={formData.referrerName || ''}
            onChange={e => onChange('referrerName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red"
            placeholder="Nhập tên người giới thiệu"
          />
        </div>
      )}

      {/* Cửa hàng mong muốn */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cửa hàng mong muốn (chọn nhiều)
        </label>

        {/* Search input */}
        <div className="mb-3">
          <input
            type="text"
            value={storeSearch}
            onChange={e => onStoreSearchChange(e.target.value)}
            placeholder="Tìm kiếm cửa hàng..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red text-sm"
          />
        </div>

        {/* Store list */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
          {filteredStores.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-4">
              Không có cửa hàng nào phù hợp
            </p>
          ) : (
            filteredStores.map(store => {
              const isSelected = formData.preferredLocations.includes(store.id)
              return (
                <label
                  key={store.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-kfc-red text-white'
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleLocationToggle(store.id)}
                    className="sr-only"
                  />
                  <Store size={14} />
                  <span className="text-sm truncate">{store.name}</span>
                </label>
              )
            })
          )}
        </div>

        {formData.preferredLocations.length > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Đã chọn: {formData.preferredLocations.length} cửa hàng
          </p>
        )}
      </div>
    </div>
  )
}
