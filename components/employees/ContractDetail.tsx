'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Contract {
  id: string
  type: { id: string; name: string; code: string } | null
  status: { id: string; name: string; code: string } | null
  startDate: string
  endDate: string | null
  salary: number
  position: string | null
  department: string | null
  fileUrl: string | null
  employee: {
    id: string
    employeeCode: string
    fullName: string
    department: { name: string } | null
    position: { name: string } | null
    store: { name: string } | null
  }
  createdBy: {
    fullName: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface User {
  role: string
}

export default function ContractDetail({ contractId }: { contractId: string }) {
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)

    api
      .get(`/contracts/${contractId}`)
      .then((res) => setContract(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Không thể tải chi tiết hợp đồng')
      })
      .finally(() => setLoading(false))
  }, [contractId])

  const getStatusColor = (status: { id: string; name: string; code: string } | null) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    switch (status.code) {
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Đang tải...</div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy hợp đồng'}</p>
          <Link
            href="/dashboard/employees/contracts"
            className="text-yellow-600 hover:text-yellow-700"
          >
            Quay lại danh sách hợp đồng
          </Link>
        </div>
      </div>
    )
  }

  const canEdit = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hợp đồng</h1>
          <p className="mt-2 text-sm text-gray-600">
            {contract.employee.fullName} ({contract.employee.employeeCode})
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              contract.status
            )}`}
          >
            {contract.status?.name || 'Chưa có trạng thái'}
          </span>
          <Link
            href="/dashboard/employees/contracts"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
          >
            Quay lại
          </Link>
        </div>
      </div>

      {/* Contract Details */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Thông tin hợp đồng</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Loại hợp đồng</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.type?.name || 'Chưa có'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    contract.status
                  )}`}
                >
                  {contract.status?.name || 'Chưa có trạng thái'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ngày bắt đầu</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(contract.startDate).toLocaleDateString('vi-VN')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ngày kết thúc</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.endDate
                  ? new Date(contract.endDate).toLocaleDateString('vi-VN')
                  : 'Vô thời hạn'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Lương</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.salary.toLocaleString('vi-VN')} VNĐ
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Vị trí công việc</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.position || contract.employee.position?.name || 'Chưa có'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.department || contract.employee.department?.name || 'Chưa có'}
              </dd>
            </div>
            {contract.fileUrl && (
              <div>
                <dt className="text-sm font-medium text-gray-500">File hợp đồng</dt>
                <dd className="mt-1">
                  <a
                    href={contract.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-yellow-600 hover:text-yellow-700"
                  >
                    Xem file
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Employee Info */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Thông tin nhân viên</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Mã nhân viên</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <Link
                  href={`/dashboard/employees/${contract.employee.id}`}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  {contract.employee.employeeCode}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Họ và tên</dt>
              <dd className="mt-1 text-sm text-gray-900">{contract.employee.fullName}</dd>
            </div>
            {contract.employee.department && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contract.employee.department.name}
                </dd>
              </div>
            )}
            {contract.employee.position && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Vị trí</dt>
                <dd className="mt-1 text-sm text-gray-900">{contract.employee.position.name}</dd>
              </div>
            )}
            {contract.employee.store && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Cửa hàng</dt>
                <dd className="mt-1 text-sm text-gray-900">{contract.employee.store.name}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Thông tin khác</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Tạo bởi</dt>
              <dd className="mt-1 text-sm text-gray-900">{contract.createdBy.fullName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ngày tạo</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(contract.createdAt).toLocaleString('vi-VN')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Cập nhật lần cuối</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(contract.updatedAt).toLocaleString('vi-VN')}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

