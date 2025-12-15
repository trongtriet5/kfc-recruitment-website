'use client'

import { useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'

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

const STATUS_GROUPS = {
  pending: {
    label: 'Chờ duyệt',
    statusCode: 'PENDING',
  },
  approved: {
    label: 'Đã duyệt',
    statusCode: 'APPROVED',
  },
  rejected: {
    label: 'Từ chối',
    statusCode: 'REJECTED',
  },
}

interface KanbanViewProps {
  requests: Request[]
  user: User | null
  onRefresh: () => void
  onDelete: (requestId: string) => void
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

const KanbanView = ({
  requests,
  user,
  onRefresh,
  onDelete,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: KanbanViewProps) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [draggedRequest, setDraggedRequest] = useState<Request | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)

  const getStatusCode = (status: string | { id: string; name: string; code: string } | null | undefined): string => {
    if (!status) return 'UNKNOWN'
    return typeof status === 'object' ? status.code || 'UNKNOWN' : status
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

  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case 'APPROVED':
        return 'bg-green-50 border-green-200'
      case 'REJECTED':
        return 'bg-red-50 border-red-200'
      case 'PENDING':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getAllowedStatuses = (): string[] => {
    if (!user) return []
    if (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT' || user.role === 'MANAGER' || user.role === 'SUPERVISOR') {
      return ['PENDING', 'APPROVED', 'REJECTED']
    }
    return []
  }

  const handleDragStart = (e: React.DragEvent, request: Request) => {
    setDraggedRequest(request)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '') // Required for Firefox
  }

  const handleDragEnd = () => {
    setDraggedRequest(null)
    setDragOverGroup(null)
  }

  const handleDragOver = (e: React.DragEvent, groupKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedRequest) {
      setDragOverGroup(groupKey)
    }
  }

  const handleDragLeave = () => {
    setDragOverGroup(null)
  }

  const handleDrop = async (e: React.DragEvent, targetGroupKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverGroup(null)

    if (!draggedRequest) return

    const targetGroup = STATUS_GROUPS[targetGroupKey as keyof typeof STATUS_GROUPS]
    if (!targetGroup) return

    // Check if user has permission
    const allowedStatuses = getAllowedStatuses()
    if (!allowedStatuses.includes(targetGroup.statusCode)) {
      alert('Bạn không có quyền chuyển trạng thái này')
      setDraggedRequest(null)
      return
    }

    // Don't update if status is the same
    const currentStatusCode = getStatusCode(draggedRequest.status)
    if (currentStatusCode === targetGroup.statusCode) {
      setDraggedRequest(null)
      return
    }

    try {
      // Fetch status ID from backend
      const statuses = await api.get('/types/by-category/REQUEST_STATUS')
      const targetStatus = statuses.data.find((s: any) => s.code === targetGroup.statusCode)
      if (!targetStatus) {
        alert('Không tìm thấy trạng thái')
        setDraggedRequest(null)
        return
      }

      // If rejecting, ask for reason
      if (targetGroup.statusCode === 'REJECTED') {
        const reason = prompt('Nhập lý do từ chối:')
        if (!reason || !reason.trim()) {
          setDraggedRequest(null)
          return
        }
        await api.patch(`/requests/${draggedRequest.id}`, {
          statusId: targetStatus.id,
          rejectionReason: reason,
        })
      } else {
        await api.patch(`/requests/${draggedRequest.id}`, {
          statusId: targetStatus.id,
        })
      }

      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setDraggedRequest(null)
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!confirm('Bạn có chắc chắn muốn duyệt đơn này?')) return

    setActionLoading(requestId)
    try {
      const statuses = await api.get('/types/by-category/REQUEST_STATUS')
      const approvedStatus = statuses.data.find((s: any) => s.code === 'APPROVED')
      if (!approvedStatus) {
        alert('Không tìm thấy trạng thái APPROVED')
        return
      }
      await api.patch(`/requests/${requestId}`, {
        statusId: approvedStatus.id,
      })
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt đơn')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (requestId: string) => {
    const reason = prompt('Nhập lý do từ chối:')
    if (!reason || !reason.trim()) return

    setActionLoading(requestId)
    try {
      const statuses = await api.get('/types/by-category/REQUEST_STATUS')
      const rejectedStatus = statuses.data.find((s: any) => s.code === 'REJECTED')
      if (!rejectedStatus) {
        alert('Không tìm thấy trạng thái REJECTED')
        return
      }
      await api.patch(`/requests/${requestId}`, {
        statusId: rejectedStatus.id,
        rejectionReason: reason,
      })
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối đơn')
    } finally {
      setActionLoading(null)
    }
  }

  const getRequestsByGroup = (groupKey: string) => {
    const group = STATUS_GROUPS[groupKey as keyof typeof STATUS_GROUPS]
    if (!group) return []
    return requests.filter((r) => getStatusCode(r.status) === group.statusCode)
  }

  const handleRequestClick = (e: React.MouseEvent, request: Request) => {
    // Only navigate on left click, not right click or when dragging
    if (draggedRequest) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    e.preventDefault()
    e.stopPropagation()
    window.location.href = `/dashboard/requests/${request.id}`
  }

  const allowedStatuses = getAllowedStatuses()
  const canApprove = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT' || user.role === 'MANAGER' || user.role === 'SUPERVISOR')

  const RequestCard = ({ request }: { request: Request }) => {
    const statusCode = getStatusCode(request.status)
    const isUserRequest = user?.employeeId && request.employee.id === user.employeeId
    const canEdit = isUserRequest && statusCode === 'PENDING'

    return (
      <div
        draggable={allowedStatuses.length > 0}
        onDragStart={(e) => handleDragStart(e, request)}
        onDragEnd={handleDragEnd}
        onClick={(e) => handleRequestClick(e, request)}
        className={`
          p-3 rounded-lg border cursor-pointer transition-all
          ${getStatusColor(statusCode)}
          hover:shadow-md
          ${draggedRequest?.id === request.id ? 'opacity-50' : ''}
          ${allowedStatuses.length > 0 ? 'cursor-move' : ''}
        `}
      >
        <div className="font-medium text-sm text-gray-900">
          {getTypeLabel(request.type)}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {request.employee.fullName} ({request.employee.employeeCode})
        </div>
        {request.startDate && (
          <div className="text-xs text-gray-500 mt-1">
            {new Date(request.startDate).toLocaleDateString('vi-VN')}
            {request.endDate && ` - ${new Date(request.endDate).toLocaleDateString('vi-VN')}`}
          </div>
        )}
        {request.reason && (
          <div className="text-xs text-gray-500 truncate mt-1" title={request.reason}>
            {request.reason}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {new Date(request.createdAt).toLocaleDateString('vi-VN')}
          </div>
          <div className={`text-xs px-2 py-0.5 rounded ${getStatusColor(statusCode)}`}>
            {statusCode === 'PENDING' ? 'Chờ duyệt' : statusCode === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <Link
              href={`/dashboard/requests/${request.id}/edit`}
              className="flex-1 text-center text-xs px-2 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
            >
              Sửa
            </Link>
          )}
          {canApprove && statusCode === 'PENDING' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleApprove(request.id)
                }}
                disabled={actionLoading === request.id}
                className="flex-1 text-center text-xs px-2 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
              >
                {actionLoading === request.id ? '...' : 'Duyệt'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleReject(request.id)
                }}
                disabled={actionLoading === request.id}
                className="flex-1 text-center text-xs px-2 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50"
              >
                {actionLoading === request.id ? '...' : 'Từ chối'}
              </button>
            </>
          )}
          {isUserRequest && statusCode === 'PENDING' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Bạn có chắc chắn muốn xóa đơn này?')) {
                  onDelete(request.id)
                }
              }}
              className="text-xs px-2 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100"
            >
              Xóa
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Pagination controls */}
      <div className="mb-4 px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Hiển thị:</span>
          <select
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value))
              onPageChange(1)
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-700">
            / Tổng: {total} đơn từ
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="text-sm text-gray-700">
            Trang {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4 relative">
        <div className="flex gap-4 min-w-max">
          {Object.entries(STATUS_GROUPS).map(([groupKey, group]) => {
            const groupRequests = getRequestsByGroup(groupKey)
            return (
              <div key={groupKey} className="flex-shrink-0 w-80">
                <div className="bg-gray-100 rounded-lg p-4 mb-2">
                  <h3 className="font-semibold text-gray-900">{group.label}</h3>
                  <p className="text-sm text-gray-500">
                    {groupRequests.length} đơn từ
                  </p>
                </div>
                <div
                  className={`
                    bg-white rounded-lg border-2 min-h-[400px] p-3 transition-all
                    ${dragOverGroup === groupKey
                      ? 'border-yellow-500 bg-yellow-50 border-solid'
                      : 'border-gray-300'
                    }
                  `}
                  onDragOver={(e) => handleDragOver(e, groupKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, groupKey)}
                >
                  <div className="space-y-2">
                    {groupRequests.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                    {groupRequests.length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-8">
                        Không có đơn từ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default KanbanView
