'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface RequestDetail {
  id: string
  type: string | { id: string; name: string; code: string } | null
  status: string | { id: string; name: string; code: string } | null
  startDate: string | null
  endDate: string | null
  reason: string | null
  description: string | null
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  employee: {
    id: string
    employeeCode: string
    fullName: string
    department: { name: string } | null
    position: { name: string } | null
  }
  department: { name: string } | null
  approver: {
    id: string
    fullName: string
    email: string
  } | null
  // Leave specific
  leaveType: string | { id: string; name: string; code: string } | null
  leaveDays: number | null
  // Overtime specific
  overtimeHours: number | null
  overtimeDate: string | null
  // Check-in/out confirmation
  checkInTime: string | null
  checkOutTime: string | null
  // Shift change
  fromShift: string | null
  toShift: string | null
  shiftDate: string | null
  // Business trip
  tripLocation: string | null
  tripPurpose: string | null
}

interface User {
  role: string
  employeeId?: string | null
}

export default function RequestDetail({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get user info
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)

    // Get request detail
    api
      .get(`/requests/${requestId}`)
      .then((res) => setRequest(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Không thể tải chi tiết đơn từ')
      })
      .finally(() => setLoading(false))
  }, [requestId])

  const handleApprove = async () => {
    if (!confirm('Bạn có chắc chắn muốn duyệt đơn này?')) return

    setActionLoading(true)
    try {
      // Fetch APPROVED status ID
      const statuses = await api.get('/types/by-category/REQUEST_STATUS')
      const approvedStatus = statuses.data.find((s: any) => s.code === 'APPROVED')
      if (!approvedStatus) {
        setError('Không tìm thấy trạng thái APPROVED')
        setActionLoading(false)
        return
      }
      await api.patch(`/requests/${requestId}`, {
        statusId: approvedStatus.id,
      })
      router.refresh()
      // Reload request
      const res = await api.get(`/requests/${requestId}`)
      setRequest(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt đơn')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối')
      return
    }

    setActionLoading(true)
    try {
      // Fetch REJECTED status ID
      const statuses = await api.get('/types/by-category/REQUEST_STATUS')
      const rejectedStatus = statuses.data.find((s: any) => s.code === 'REJECTED')
      if (!rejectedStatus) {
        setError('Không tìm thấy trạng thái REJECTED')
        setActionLoading(false)
        return
      }
      await api.patch(`/requests/${requestId}`, {
        statusId: rejectedStatus.id,
        rejectionReason: rejectionReason,
      })
      router.refresh()
      // Reload request
      const res = await api.get(`/requests/${requestId}`)
      setRequest(res.data)
      setShowRejectForm(false)
      setRejectionReason('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối đơn')
    } finally {
      setActionLoading(false)
    }
  }

  const getTypeLabel = (type: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!type) return 'Đơn từ'
    if (typeof type === 'object') {
      return type.name || type.code || 'Đơn từ'
    }
    const labels: Record<string, string> = {
      LEAVE: 'Đơn xin nghỉ',
      ABSENCE: 'Đơn vắng mặt',
      OVERTIME: 'Đơn làm thêm',
      CHECKIN_CONFIRMATION: 'Đơn xác nhận công',
      SHIFT_CHANGE: 'Đơn đổi ca',
      BUSINESS_TRIP: 'Đơn công tác',
      WORK_SCHEDULE: 'Đơn làm theo chế độ',
      RESIGNATION: 'Đơn thôi việc',
    }
    return labels[type] || type
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
    if (typeof status === 'object') {
      return status.name || status.code || 'Chưa có trạng thái'
    }
    switch (status) {
      case 'APPROVED':
        return 'Đã duyệt'
      case 'REJECTED':
        return 'Từ chối'
      case 'PENDING':
        return 'Chờ duyệt'
      default:
        return status
    }
  }

  const getLeaveTypeLabel = (type: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!type) return 'N/A'
    if (typeof type === 'object') {
      return type.name || type.code || 'N/A'
    }
    const labels: Record<string, string> = {
      PAID_LEAVE: 'Nghỉ có lương',
      UNPAID_LEAVE: 'Nghỉ không lương',
      SICK_LEAVE: 'Nghỉ ốm',
      MATERNITY_LEAVE: 'Nghỉ thai sản',
      OTHER: 'Khác',
    }
    return labels[type] || type
  }

  const canApprove = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT' || user.role === 'MANAGER')

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Đang tải...</div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy đơn từ'}</p>
          <Link
            href="/dashboard/requests"
            className="text-yellow-600 hover:text-yellow-700"
          >
            Quay lại danh sách đơn từ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getTypeLabel(request.type)}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Chi tiết đơn từ
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              request.status
            )}`}
          >
            {getStatusLabel(request.status)}
          </span>
          <Link
            href="/dashboard/requests"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Quay lại
          </Link>
        </div>
      </div>

      {/* Action buttons for approvers */}
      {canApprove && (typeof request.status === 'object' ? request.status?.code : request.status) === 'PENDING' && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Thao tác</h3>
            <div className="flex space-x-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Đang xử lý...' : 'Duyệt đơn'}
              </button>
              {!showRejectForm ? (
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Từ chối
                </button>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Lý do từ chối..."
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Xác nhận
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false)
                      setRejectionReason('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Details */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Thông tin đơn từ</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Employee Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nhân viên</label>
              <p className="mt-1 text-sm text-gray-900">
                {request.employee.fullName} ({request.employee.employeeCode})
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phòng ban</label>
              <p className="mt-1 text-sm text-gray-900">
                {request.employee.department?.name || request.department?.name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Chức vụ</label>
              <p className="mt-1 text-sm text-gray-900">
                {request.employee.position?.name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(request.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Type-specific fields */}
          {(typeof request.type === 'object' ? request.type?.code : request.type) === 'LEAVE' && (
            <>
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-500">Loại nghỉ phép</label>
                <p className="mt-1 text-sm text-gray-900">
                  {getLeaveTypeLabel(request.leaveType)}
                </p>
              </div>
              {request.leaveDays && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Số ngày nghỉ</label>
                  <p className="mt-1 text-sm text-gray-900">{request.leaveDays} ngày</p>
                </div>
              )}
            </>
          )}

          {(typeof request.type === 'object' ? request.type?.code : request.type) === 'OVERTIME' && (
            <>
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-500">Ngày làm thêm</label>
                <p className="mt-1 text-sm text-gray-900">
                  {request.overtimeDate
                    ? new Date(request.overtimeDate).toLocaleDateString('vi-VN')
                    : 'N/A'}
                </p>
              </div>
              {request.overtimeHours && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Số giờ làm thêm</label>
                  <p className="mt-1 text-sm text-gray-900">{request.overtimeHours} giờ</p>
                </div>
              )}
            </>
          )}

          {(typeof request.type === 'object' ? request.type?.code : request.type) === 'CHECKIN_CONFIRMATION' && (
            <>
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Thời gian check-in</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {request.checkInTime
                      ? new Date(request.checkInTime).toLocaleString('vi-VN')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Thời gian check-out</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {request.checkOutTime
                      ? new Date(request.checkOutTime).toLocaleString('vi-VN')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </>
          )}

          {(typeof request.type === 'object' ? request.type?.code : request.type) === 'SHIFT_CHANGE' && (
            <>
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ca hiện tại</label>
                  <p className="mt-1 text-sm text-gray-900">{request.fromShift || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ca muốn đổi</label>
                  <p className="mt-1 text-sm text-gray-900">{request.toShift || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày đổi ca</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {request.shiftDate
                      ? new Date(request.shiftDate).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </>
          )}

          {(typeof request.type === 'object' ? request.type?.code : request.type) === 'BUSINESS_TRIP' && (
            <>
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Địa điểm công tác</label>
                  <p className="mt-1 text-sm text-gray-900">{request.tripLocation || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Mục đích công tác</label>
                  <p className="mt-1 text-sm text-gray-900">{request.tripPurpose || 'N/A'}</p>
                </div>
              </div>
            </>
          )}

          {/* Common date fields */}
          {(request.startDate || request.endDate) && (
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {request.startDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {(typeof request.type === 'object' ? request.type?.code : request.type) === 'RESIGNATION' ? 'Ngày thôi việc' : 'Ngày bắt đầu'}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(request.startDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
              {request.endDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày kết thúc</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(request.endDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          {request.reason && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500">Lý do</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{request.reason}</p>
            </div>
          )}

          {/* Description */}
          {request.description && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500">Mô tả thêm</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          {/* Approval info */}
          {request.approver && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500">
                {(typeof request.status === 'object' ? request.status?.code : request.status) === 'APPROVED' ? 'Người duyệt' : 'Người xử lý'}
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {request.approver.fullName} ({request.approver.email})
              </p>
              {request.approvedAt && (
                <p className="mt-1 text-xs text-gray-500">
                  Duyệt lúc: {new Date(request.approvedAt).toLocaleString('vi-VN')}
                </p>
              )}
              {request.rejectedAt && (
                <p className="mt-1 text-xs text-gray-500">
                  Từ chối lúc: {new Date(request.rejectedAt).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
          )}

          {/* Rejection reason */}
          {request.rejectionReason && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500">Lý do từ chối</label>
              <p className="mt-1 text-sm text-red-600 whitespace-pre-wrap">
                {request.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

