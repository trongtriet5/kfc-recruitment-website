'use client'

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import KanbanView from './KanbanView'

interface Request {
  id: string
  type: string | { id: string; name: string; code: string; [key: string]: any } | null
  status: string | { id: string; name: string; code: string; [key: string]: any } | null
  employee: {
    id: string
    fullName: string
    employeeCode: string
  }
  startDate: string | null
  endDate: string | null
  reason: string | null
  createdAt: string
}

interface User {
  role: string
  employeeId?: string | null
}

interface PaginatedResponse {
  data: Request[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RequestsListRef {
  refresh: () => void
}

const RequestsList = forwardRef<RequestsListRef, { onRefresh?: () => void }>(({ onRefresh }, ref) => {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 0 })

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadRequests = () => {
    setLoading(true)
    // Both list and kanban use pagination
    const params = { page, limit }
    
    api
      .get('/requests', { params })
      .then((res) => {
        // Handle both old format (array) and new format (paginated)
        if (Array.isArray(res.data)) {
          setRequests(res.data)
          setPagination({ total: res.data.length, totalPages: 1 })
        } else {
          setRequests(res.data.data || [])
          setPagination({
            total: res.data.total || 0,
            totalPages: res.data.totalPages || 0,
          })
        }
        // Refresh dashboard after loading requests
        if (onRefresh) {
          onRefresh()
        }
      })
      .catch((err) => {
        console.error('Error loading requests:', err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, viewMode])

  useImperativeHandle(ref, () => ({
    refresh: loadRequests,
  }))

  const handleDelete = async (requestId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!confirm('Bạn có chắc chắn muốn xóa đơn này?')) return

    try {
      await api.delete(`/requests/${requestId}`)
      loadRequests()
      // Refresh dashboard if callback provided
      if (onRefresh) {
        onRefresh()
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa đơn')
    }
  }

  const isUserRequest = (request: Request) => {
    return user?.employeeId && request.employee.id === user.employeeId
  }

  const canEdit = (request: Request) => {
    if (!isUserRequest(request)) return false
    const statusCode = typeof request.status === 'object' ? request.status?.code : request.status
    return statusCode === 'PENDING'
  }

  const canDelete = (request: Request) => {
    if (user?.role === 'ADMIN' || user?.role === 'HEAD_OF_DEPARTMENT') return true
    if (!isUserRequest(request)) return false
    const statusCode = typeof request.status === 'object' ? request.status?.code : request.status
    return statusCode === 'PENDING'
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  const getStatusColor = (status: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    const statusCode = typeof status === 'object' ? status.code : status
    switch (statusCode) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!status) return 'Chưa có trạng thái'
    if (typeof status === 'object') return status.name
    switch (status) {
      case 'APPROVED':
        return 'Đã duyệt'
      case 'REJECTED':
        return 'Đã từ chối'
      case 'PENDING':
        return 'Chờ duyệt'
      default:
        return status
    }
  }

  const getTypeLabel = (type: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!type) return 'Chưa có loại'
    if (typeof type === 'object') return type.name
    const labels: Record<string, string> = {
      LEAVE: 'Nghỉ phép',
      ABSENCE: 'Vắng mặt',
      OVERTIME: 'Làm thêm',
      CHECKIN_CONFIRMATION: 'Xác nhận công',
      SHIFT_CHANGE: 'Đổi ca',
      BUSINESS_TRIP: 'Công tác',
      WORK_SCHEDULE: 'Làm theo chế độ',
      RESIGNATION: 'Thôi việc',
    }
    return labels[type] || type
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Danh sách đơn từ
        </h3>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'kanban'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
          </div>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <Link
            href="/dashboard/requests/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700"
          >
            Tạo đơn mới
          </Link>
        </div>
      </div>
      
      {/* Pagination controls (only for list view) */}
      {viewMode === 'list' && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Hiển thị:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-700">
              / Tổng: {pagination.total} đơn từ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || loading}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Trước
            </button>
            <span className="text-sm text-gray-700">
              Trang {page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= (pagination.totalPages || 1) || loading}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'kanban' ? (
        <div>
          <KanbanView
            requests={requests}
            user={user}
            onRefresh={loadRequests}
            onDelete={handleDelete}
            page={page}
            limit={limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit)
              setPage(1)
            }}
          />
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {requests.length === 0 ? (
            <li className="px-4 py-5 text-center text-gray-500">
              Chưa có đơn từ nào
            </li>
          ) : (
            requests.map((request) => (
            <li key={request.id}>
              <Link
                href={`/dashboard/requests/${request.id}`}
                className="block hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-yellow-600 truncate">
                        {getTypeLabel(request.type)}
                      </p>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Nhân viên: {request.employee.fullName} (
                        {request.employee.employeeCode})
                      </p>
                    </div>
                    {request.startDate && (
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        {new Date(request.startDate).toLocaleDateString('vi-VN')}
                        {request.endDate &&
                          ` - ${new Date(request.endDate).toLocaleDateString('vi-VN')}`}
                      </div>
                    )}
                  </div>
                  {request.reason && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 truncate">
                        {request.reason}
                      </p>
                    </div>
                  )}
                  {/* Action buttons for user's own requests */}
                  {isUserRequest(request) && (canEdit(request) || canDelete(request)) && (
                    <div className="mt-3 flex items-center space-x-2">
                      {canEdit(request) && (
                        <Link
                          href={`/dashboard/requests/${request.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Sửa
                        </Link>
                      )}
                      {canDelete(request) && (
                        <button
                          onClick={(e) => handleDelete(request.id, e)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
})

RequestsList.displayName = 'RequestsList'

export default RequestsList

