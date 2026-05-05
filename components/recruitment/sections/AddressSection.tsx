'use client'

import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import Icon from '@/components/icons/Icon'
import api from '@/lib/api'

interface AddressSectionProps {
  formData: {
    currentCity: string
    currentWard: string
    currentStreet: string
    permanentSameAsCurrent: boolean
    permanentCity: string
    permanentWard: string
    permanentStreet: string
  }
  validationErrors: Record<string, string>
  onChange: (field: string, value: string | boolean) => void
  provinces: { id: string; name: string; code: string }[]
}

interface Ward {
  id: string
  name: string
  code: string
}

export default function AddressSection({
  formData,
  validationErrors,
  onChange,
  provinces,
}: AddressSectionProps) {
  const [currentWards, setCurrentWards] = useState<Ward[]>([])
  const [permanentWards, setPermanentWards] = useState<Ward[]>([])

  // Load current wards when province changes
  useEffect(() => {
    if (formData.currentCity) {
      loadWards(formData.currentCity, setCurrentWards)
    } else {
      setCurrentWards([])
    }
  }, [formData.currentCity])

  // Load permanent wards when province changes
  useEffect(() => {
    if (!formData.permanentSameAsCurrent && formData.permanentCity) {
      loadWards(formData.permanentCity, setPermanentWards)
    } else {
      setPermanentWards([])
    }
  }, [formData.permanentCity, formData.permanentSameAsCurrent])

  const loadWards = async (provinceId: string, setWards: (wards: Ward[]) => void) => {
    try {
      const res = await api.get(`/locations/provinces/${provinceId}/wards`)
      setWards((res.data || []).map((w: any) => ({ ...w, name: w.fullName || w.name })))
    } catch (err) {
      console.error('Error loading wards:', err)
      setWards([])
    }
  }

  const handlePermanentSameChange = (checked: boolean) => {
    onChange('permanentSameAsCurrent', checked)
    if (checked) {
      // Copy current address to permanent address
      onChange('permanentCity', formData.currentCity)
      onChange('permanentWard', formData.currentWard)
      onChange('permanentStreet', formData.currentStreet)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b">
        <Icon name="map-pin" size={20} className="text-kfc-red" />
        <h3 className="text-lg font-semibold text-gray-900">Địa chỉ hiện tại</h3>
      </div>

      {/* Tỉnh/Thành phố hiện tại */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tỉnh/Thành phố <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.currentCity}
          onChange={e => {
            onChange('currentCity', e.target.value)
            onChange('currentWard', '') // Reset ward when province changes
          }}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
            validationErrors.currentCity ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Chọn tỉnh/thành phố</option>
          {provinces.map(province => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
        {validationErrors.currentCity && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.currentCity}</p>
        )}
      </div>

      {/* Phường/Xã hiện tại */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phường/Xã <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.currentWard}
          onChange={e => onChange('currentWard', e.target.value)}
          disabled={!formData.currentCity}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
            validationErrors.currentWard ? 'border-red-500' : 'border-gray-300'
          } ${!formData.currentCity ? 'bg-gray-100' : ''}`}
        >
          <option value="">Chọn phường/xã</option>
          {currentWards.map(ward => (
            <option key={ward.id} value={ward.id}>
              {ward.name}
            </option>
          ))}
        </select>
        {validationErrors.currentWard && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.currentWard}</p>
        )}
      </div>

      {/* Địa chỉ cụ thể */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Địa chỉ cụ thể <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.currentStreet}
          onChange={e => onChange('currentStreet', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
            validationErrors.currentStreet ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Số nhà, đường,..."
        />
        {validationErrors.currentStreet && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.currentStreet}</p>
        )}
      </div>

      {/* Permanent Address Section */}
      <div className="pt-4 border-t space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Địa chỉ thường trú</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.permanentSameAsCurrent}
              onChange={e => handlePermanentSameChange(e.target.checked)}
              className="w-4 h-4 text-kfc-red rounded focus:ring-kfc-red"
            />
            <span className="text-sm text-gray-600">Giống địa chỉ hiện tại</span>
          </label>
        </div>

        {!formData.permanentSameAsCurrent && (
          <>
            {/* Tỉnh/Thành phố permanent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tỉnh/Thành phố <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.permanentCity}
                onChange={e => {
                  onChange('permanentCity', e.target.value)
                  onChange('permanentWard', '')
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
                  validationErrors.permanentCity ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Chọn tỉnh/thành phố</option>
                {provinces.map(province => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
              {validationErrors.permanentCity && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.permanentCity}</p>
              )}
            </div>

            {/* Phường/Xã permanent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phường/Xã <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.permanentWard}
                onChange={e => onChange('permanentWard', e.target.value)}
                disabled={!formData.permanentCity}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
                  validationErrors.permanentWard ? 'border-red-500' : 'border-gray-300'
                } ${!formData.permanentCity ? 'bg-gray-100' : ''}`}
              >
                <option value="">Chọn phường/xã</option>
                {permanentWards.map(ward => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
              {validationErrors.permanentWard && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.permanentWard}</p>
              )}
            </div>

            {/* Địa chỉ cụ thể permanent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ cụ thể <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.permanentStreet}
                onChange={e => onChange('permanentStreet', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
                  validationErrors.permanentStreet ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Số nhà, đường,..."
              />
              {validationErrors.permanentStreet && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.permanentStreet}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
