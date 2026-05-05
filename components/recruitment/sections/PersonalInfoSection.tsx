'use client'

import { User } from 'lucide-react'
import Icon from '@/components/icons/Icon'

interface PersonalInfoSectionProps {
  formData: {
    fullName: string
    gender: 'MALE' | 'FEMALE'
    phone: string
    dateOfBirth: string
    email: string
    cccd: string
  }
  validationErrors: Record<string, string>
  onChange: (field: string, value: string) => void
}

export default function PersonalInfoSection({
  formData,
  validationErrors,
  onChange,
}: PersonalInfoSectionProps) {
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.slice(0, 10)
  }

  const formatDateOfBirth = (value: string) => {
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

  const formatCCCD = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.slice(0, 12)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b">
        <Icon name="user" size={20} className="text-kfc-red" />
        <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
      </div>

      {/* Họ và tên */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={e => onChange('fullName', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
            validationErrors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Nhập họ và tên"
        />
        {validationErrors.fullName && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.fullName}</p>
        )}
      </div>

      {/* Giới tính */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Giới tính <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value="MALE"
              checked={formData.gender === 'MALE'}
              onChange={() => onChange('gender', 'MALE')}
              className="w-4 h-4 text-kfc-red focus:ring-kfc-red"
            />
            <span className="text-gray-700">Nam</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value="FEMALE"
              checked={formData.gender === 'FEMALE'}
              onChange={() => onChange('gender', 'FEMALE')}
              className="w-4 h-4 text-kfc-red focus:ring-kfc-red"
            />
            <span className="text-gray-700">Nữ</span>
          </label>
        </div>
        {validationErrors.gender && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.gender}</p>
        )}
      </div>

      {/* Số điện thoại */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={e => onChange('phone', formatPhone(e.target.value))}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
            validationErrors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="0xxxxxxxxx"
        />
        {validationErrors.phone && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.phone}</p>
        )}
      </div>

      {/* Ngày sinh */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ngày sinh <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.dateOfBirth}
          onChange={e => onChange('dateOfBirth', formatDateOfBirth(e.target.value))}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
            validationErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="DD/MM/YYYY"
        />
        {validationErrors.dateOfBirth && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.dateOfBirth}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={e => onChange('email', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
            validationErrors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="email@example.com"
        />
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
        )}
      </div>

      {/* CCCD */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số CCCD/CMND <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.cccd}
          onChange={e => onChange('cccd', formatCCCD(e.target.value))}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-kfc-red ${
            validationErrors.cccd ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="xxxxxxxxxxxx"
          maxLength={12}
        />
        {validationErrors.cccd && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.cccd}</p>
        )}
      </div>
    </div>
  )
}
