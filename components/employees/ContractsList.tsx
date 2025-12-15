'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'

interface Contract {
  id: string
  type: { id: string; name: string; code: string } | string | null
  startDate: string
  endDate: string | null
  salary: number
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

export default function ContractsList() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadUser()
    loadContracts()
  }, [statusFilter])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadContracts = () => {
    const url = statusFilter
      ? `/contracts?status=${statusFilter}`
      : '/contracts'
    api
      .get(url)
      .then((res) => {
        setContracts(res.data)
      })
      .catch((err) => {
        console.error('Error loading contracts:', err)
        setContracts([])
      })
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
      ACTIVE: 'Đang hoạt động',
      EXPIRED: 'Hết hạn',
      TERMINATED: 'Chấm dứt',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string | { id: string; name: string; code: string } | null) => {
    const statusCode = typeof status === 'object' ? status?.code : status
    if (!statusCode) return 'bg-gray-100 text-gray-800'
    switch (statusCode) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'TERMINATED':
        return 'bg-gray-100 text-gray-800'
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
        <h2 className="text-xl font-semibold">Danh sách hợp đồng</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="EXPIRED">Hết hạn</option>
            <option value="TERMINATED">Chấm dứt</option>
          </select>
          {canCreate && (
            <Link
              href="/dashboard/employees/contracts/new"
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
            >
              Tạo hợp đồng mới
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {contracts.length === 0 ? (
            <li className="px-4 py-5 text-center text-gray-500">Chưa có hợp đồng nào</li>
          ) : (
            contracts.map((contract) => (
              <li key={contract.id}>
                <Link
                  href={`/dashboard/employees/contracts/${contract.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-yellow-600">
                            {contract.employee.fullName} ({contract.employee.employeeCode})
                          </p>
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              contract.status
                            )}`}
                          >
                            {getStatusLabel(contract.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <span>Loại: {getTypeLabel(contract.type)}</span>
                          <span className="ml-4">
                            Lương: {contract.salary.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <span>
                            Từ: {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                          </span>
                          {contract.endDate && (
                            <span className="ml-4">
                              Đến: {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                          {!contract.endDate && <span className="ml-4">Vô thời hạn</span>}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Tạo bởi: {contract.createdBy.fullName}
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

