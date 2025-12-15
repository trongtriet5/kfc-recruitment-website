'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'

interface TypeOption {
  id: string
  code: string
  name: string
}

interface RequestData {
  id: string
  type: TypeOption | null
  status: TypeOption | null
  startDate: string | null
  endDate: string | null
  reason: string | null
  description: string | null
  leaveType: TypeOption | null
  leaveDays: number | null
  overtimeHours: number | null
  overtimeDate: string | null
  checkInTime: string | null
  checkOutTime: string | null
  fromShift: string | null
  toShift: string | null
  shiftDate: string | null
  tripLocation: string | null
  tripPurpose: string | null
}

const SHIFTS = [
  { value: 'CA_1', label: 'Ca 1 (6:00 - 14:00)' },
  { value: 'CA_2', label: 'Ca 2 (14:00 - 22:00)' },
  { value: 'CA_3', label: 'Ca 3 (22:00 - 6:00)' },
]

export default function EditRequestForm({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState<RequestData | null>(null)
  const [leaveTypes, setLeaveTypes] = useState<TypeOption[]>([])

  // Form fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [leaveDays, setLeaveDays] = useState('')
  const [overtimeHours, setOvertimeHours] = useState('')
  const [overtimeDate, setOvertimeDate] = useState('')
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('')
  const [fromShift, setFromShift] = useState('')
  const [toShift, setToShift] = useState('')
  const [shiftDate, setShiftDate] = useState('')
  const [tripLocation, setTripLocation] = useState('')
  const [tripPurpose, setTripPurpose] = useState('')

  useEffect(() => {
    // Load request data
    api
      .get(`/requests/${requestId}`)
      .then((res) => {
        const data = res.data
        setRequest(data)
        
        // Populate form fields
        if (data.startDate) {
          setStartDate(new Date(data.startDate).toISOString().split('T')[0])
        }
        if (data.endDate) {
          setEndDate(new Date(data.endDate).toISOString().split('T')[0])
        }
        setReason(data.reason || '')
        setDescription(data.description || '')
        
        if (data.leaveType) {
          setLeaveTypeId(typeof data.leaveType === 'object' ? data.leaveType.id : '')
        }
        if (data.leaveDays) {
          setLeaveDays(data.leaveDays.toString())
        }
        if (data.overtimeHours) {
          setOvertimeHours(data.overtimeHours.toString())
        }
        if (data.overtimeDate) {
          setOvertimeDate(new Date(data.overtimeDate).toISOString().split('T')[0])
        }
        if (data.checkInTime) {
          const checkIn = new Date(data.checkInTime)
          setCheckInTime(checkIn.toISOString().slice(0, 16))
        }
        if (data.checkOutTime) {
          const checkOut = new Date(data.checkOutTime)
          setCheckOutTime(checkOut.toISOString().slice(0, 16))
        }
        setFromShift(data.fromShift || '')
        setToShift(data.toShift || '')
        if (data.shiftDate) {
          setShiftDate(new Date(data.shiftDate).toISOString().split('T')[0])
        }
        setTripLocation(data.tripLocation || '')
        setTripPurpose(data.tripPurpose || '')
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Không thể tải thông tin đơn từ')
      })
      .finally(() => setLoading(false))

    // Load leave types
    api
      .get('/types/by-category/LEAVE_TYPE')
      .then((res) => setLeaveTypes(res.data))
      .catch(console.error)
  }, [requestId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      if (!request) {
        throw new Error('Không tìm thấy đơn từ')
      }

      const statusCode = typeof request.status === 'object' ? request.status?.code : request.status
      if (statusCode !== 'PENDING') {
        throw new Error('Chỉ có thể sửa đơn từ ở trạng thái Chờ duyệt')
      }

      const payload: any = {
        reason: reason || undefined,
        description: description || undefined,
      }

      // Add common date fields
      if (startDate) payload.startDate = new Date(startDate).toISOString()
      if (endDate) payload.endDate = new Date(endDate).toISOString()

      const requestTypeCode = typeof request.type === 'object' ? request.type?.code : request.type

      // Add type-specific fields
      if (requestTypeCode === 'LEAVE') {
        if (leaveTypeId) payload.leaveTypeId = leaveTypeId
        if (leaveDays) payload.leaveDays = parseFloat(leaveDays)
      } else if (requestTypeCode === 'OVERTIME') {
        if (overtimeHours) payload.overtimeHours = parseFloat(overtimeHours)
        if (overtimeDate) payload.overtimeDate = new Date(overtimeDate).toISOString()
      } else if (requestTypeCode === 'CHECKIN_CONFIRMATION') {
        if (checkInTime) payload.checkInTime = new Date(checkInTime).toISOString()
        if (checkOutTime) payload.checkOutTime = new Date(checkOutTime).toISOString()
      } else if (requestTypeCode === 'SHIFT_CHANGE') {
        if (fromShift) payload.fromShift = fromShift
        if (toShift) payload.toShift = toShift
        if (shiftDate) payload.shiftDate = new Date(shiftDate).toISOString()
      } else if (requestTypeCode === 'BUSINESS_TRIP') {
        if (tripLocation) payload.tripLocation = tripLocation
        if (tripPurpose) payload.tripPurpose = tripPurpose
      }

      await api.patch(`/requests/${requestId}`, payload)
      router.push(`/dashboard/requests/${requestId}`)
      router.refresh()
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Có lỗi xảy ra khi cập nhật đơn. Vui lòng thử lại.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">Đang tải...</div>
      </div>
    )
  }

  if (error && !request) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
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

  if (!request) {
    return null
  }

  const requestTypeCode = typeof request.type === 'object' ? request.type?.code : request.type
  const statusCode = typeof request.status === 'object' ? request.status?.code : request.status

  if (statusCode !== 'PENDING') {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">
            Chỉ có thể sửa đơn từ ở trạng thái Chờ duyệt
          </p>
          <Link
            href={`/dashboard/requests/${requestId}`}
            className="text-yellow-600 hover:text-yellow-700"
          >
            Quay lại chi tiết đơn từ
          </Link>
        </div>
      </div>
    )
  }

  const getTypeLabel = () => {
    if (typeof request.type === 'object') return request.type?.name || 'Đơn từ'
    return 'Đơn từ'
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Sửa đơn từ: {getTypeLabel()}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Cập nhật thông tin đơn từ
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Leave Form */}
        {requestTypeCode === 'LEAVE' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại nghỉ phép
                </label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Chọn loại nghỉ phép</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số ngày nghỉ
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ví dụ: 1, 1.5, 2"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    if (e.target.value && endDate) {
                      const start = new Date(e.target.value)
                      const end = new Date(endDate)
                      const diffTime = Math.abs(end.getTime() - start.getTime())
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                      setLeaveDays(diffDays.toString())
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    if (startDate && e.target.value) {
                      const start = new Date(startDate)
                      const end = new Date(e.target.value)
                      const diffTime = Math.abs(end.getTime() - start.getTime())
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                      setLeaveDays(diffDays.toString())
                    }
                  }}
                  min={startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </>
        )}

        {/* Absence Form */}
        {requestTypeCode === 'ABSENCE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
        )}

        {/* Overtime Form */}
        {requestTypeCode === 'OVERTIME' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày làm thêm
              </label>
              <input
                type="date"
                value={overtimeDate}
                onChange={(e) => setOvertimeDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số giờ làm thêm
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Ví dụ: 2, 2.5, 4"
              />
            </div>
          </div>
        )}

        {/* Check-in/out Confirmation Form */}
        {requestTypeCode === 'CHECKIN_CONFIRMATION' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian check-in
              </label>
              <input
                type="datetime-local"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian check-out
              </label>
              <input
                type="datetime-local"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
        )}

        {/* Shift Change Form */}
        {requestTypeCode === 'SHIFT_CHANGE' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ca hiện tại
                </label>
                <select
                  value={fromShift}
                  onChange={(e) => setFromShift(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Chọn ca</option>
                  {SHIFTS.map((shift) => (
                    <option key={shift.value} value={shift.value}>
                      {shift.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ca muốn đổi
                </label>
                <select
                  value={toShift}
                  onChange={(e) => setToShift(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Chọn ca</option>
                  {SHIFTS.map((shift) => (
                    <option key={shift.value} value={shift.value}>
                      {shift.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày đổi ca
              </label>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </>
        )}

        {/* Business Trip Form */}
        {requestTypeCode === 'BUSINESS_TRIP' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa điểm công tác
                </label>
                <input
                  type="text"
                  value={tripLocation}
                  onChange={(e) => setTripLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ví dụ: Hà Nội, TP.HCM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mục đích công tác
                </label>
                <input
                  type="text"
                  value={tripPurpose}
                  onChange={(e) => setTripPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Mô tả mục đích công tác"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          </>
        )}

        {/* Work Schedule Form */}
        {requestTypeCode === 'WORK_SCHEDULE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
        )}

        {/* Resignation Form */}
        {requestTypeCode === 'RESIGNATION' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày thôi việc
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        )}

        {/* Common fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lý do
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Nhập lý do..."
          />
        </div>

        {requestTypeCode !== 'RESIGNATION' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả thêm
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Mô tả thêm (nếu có)..."
            />
          </div>
        )}

        {/* Submit buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/requests/${requestId}`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  )
}

