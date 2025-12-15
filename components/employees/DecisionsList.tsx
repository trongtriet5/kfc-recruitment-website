'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'

interface Decision {
  id: string
  type: { id: string; name: string; code: string } | string | null
  title: string
  content: string
  effectiveDate: string
  status: { id: string; name: string; code: string } | string | null
  employee: {
    id: string
    employeeCode: string
    fullName: string
  }
  createdBy: {
    fullName: string
  }
}

interface User {
  role: string
}

export default function DecisionsList() {
  const router = useRouter()
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeOptions, setTypeOptions] = useState<{ value: string; label: string }[]>([])
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    loadUser()
    loadTypeOptions()
    loadStatusOptions()
    loadDecisions()
  }, [typeFilter, statusFilter])

  const loadTypeOptions = async () => {
    try {
      const res = await api.get('/types/by-category/DECISION_TYPE')
      setTypeOptions([
        { value: '', label: 'Tất cả loại' },
        ...res.data.map((t: any) => ({ value: t.code, label: t.name })),
      ])
    } catch (err) {
      console.error('Failed to load type options:', err)
    }
  }

  const loadStatusOptions = async () => {
    try {
      const res = await api.get('/types/by-category/DECISION_STATUS')
      setStatusOptions([
        { value: '', label: 'Tất cả trạng thái' },
        ...res.data.map((s: any) => ({ value: s.code, label: s.name })),
      ])
    } catch (err) {
      console.error('Failed to load status options:', err)
    }
  }

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadDecisions = () => {
    const params = new URLSearchParams()
    if (typeFilter) params.append('type', typeFilter)
    if (statusFilter) params.append('status', statusFilter)
    const url = `/decisions${params.toString() ? '?' + params.toString() : ''}`
    api
      .get(url)
      .then((res) => setDecisions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const getTypeLabel = (type: string | { id: string; name: string; code: string } | null) => {
    if (!type) return 'Chưa có loại'
    if (typeof type === 'object') return type.name
    return type
  }

  const getStatusLabel = (status: string | { id: string; name: string; code: string } | null) => {
    if (!status) return 'Chưa có trạng thái'
    if (typeof status === 'object') return status.name
    const labels: Record<string, string> = {
      ACTIVE: 'Đang hiệu lực',
      CANCELLED: 'Đã hủy',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string | { id: string; name: string; code: string } | null) => {
    const statusCode = typeof status === 'object' ? status?.code : status
    if (!statusCode) return 'bg-gray-100 text-gray-800'
    switch (statusCode) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canCreate = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT')

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Danh sách quyết định</h2>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {canCreate && (
            <Link
              href="/dashboard/employees/decisions/new"
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
            >
              Tạo quyết định mới
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {decisions.length === 0 ? (
            <li className="px-4 py-5 text-center text-gray-500">Chưa có quyết định nào</li>
          ) : (
            decisions.map((decision) => (
              <li key={decision.id}>
                <Link
                  href={`/dashboard/employees/decisions/${decision.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-yellow-600">
                            {decision.title}
                          </p>
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              decision.status
                            )}`}
                          >
                            {getStatusLabel(decision.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <span>Loại: {getTypeLabel(decision.type)}</span>
                          <span className="ml-4">
                            Nhân viên: {decision.employee.fullName} ({decision.employee.employeeCode})
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <span>
                            Ngày hiệu lực: {new Date(decision.effectiveDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {decision.content}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Tạo bởi: {decision.createdBy.fullName}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

