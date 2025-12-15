'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'

type RequestType =
  | 'LEAVE'
  | 'ABSENCE'
  | 'OVERTIME'
  | 'CHECKIN_CONFIRMATION'
  | 'SHIFT_CHANGE'
  | 'BUSINESS_TRIP'
  | 'WORK_SCHEDULE'
  | 'RESIGNATION'

type LeaveType = 'PAID_LEAVE' | 'UNPAID_LEAVE' | 'SICK_LEAVE' | 'MATERNITY_LEAVE' | 'OTHER'

const REQUEST_TYPES: { value: RequestType; label: string; icon: string }[] = [
  { value: 'LEAVE', label: 'Đơn xin nghỉ', icon: 'clipboard' },
  { value: 'ABSENCE', label: 'Đơn vắng mặt', icon: 'x' },
  { value: 'OVERTIME', label: 'Đơn làm thêm', icon: 'clock' },
  { value: 'CHECKIN_CONFIRMATION', label: 'Đơn xác nhận công', icon: 'check' },
  { value: 'SHIFT_CHANGE', label: 'Đơn đổi ca', icon: 'clock' },
  { value: 'BUSINESS_TRIP', label: 'Đơn công tác', icon: 'airplane' },
  { value: 'WORK_SCHEDULE', label: 'Đơn làm theo chế độ', icon: 'calendar' },
  { value: 'RESIGNATION', label: 'Đơn thôi việc', icon: 'handWave' },
]

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'PAID_LEAVE', label: 'Nghỉ có lương' },
  { value: 'UNPAID_LEAVE', label: 'Nghỉ không lương' },
  { value: 'SICK_LEAVE', label: 'Nghỉ ốm' },
  { value: 'MATERNITY_LEAVE', label: 'Nghỉ thai sản' },
  { value: 'OTHER', label: 'Khác' },
]

const SHIFTS = [
  { value: 'CA_1', label: 'Ca 1 (6:00 - 14:00)' },
  { value: 'CA_2', label: 'Ca 2 (14:00 - 22:00)' },
  { value: 'CA_3', label: 'Ca 3 (22:00 - 6:00)' },
]

interface TypeOption {
  id: string
  code: string
  name: string
}

export default function CreateRequestForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestType, setRequestType] = useState<RequestType | ''>('')
  const [requestTypeId, setRequestTypeId] = useState<string>('')
  const [requestTypes, setRequestTypes] = useState<TypeOption[]>([])
  const [leaveTypes, setLeaveTypes] = useState<TypeOption[]>([])
  const [leaveTypeId, setLeaveTypeId] = useState<string>('')

  // Common fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')

  // Leave specific
  const [leaveDays, setLeaveDays] = useState('')

  // Overtime specific
  const [overtimeHours, setOvertimeHours] = useState('')
  const [overtimeDate, setOvertimeDate] = useState('')

  // Check-in/out confirmation
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('')

  // Shift change
  const [fromShift, setFromShift] = useState('')
  const [toShift, setToShift] = useState('')
  const [shiftDate, setShiftDate] = useState('')

  // Business trip
  const [tripLocation, setTripLocation] = useState('')
  const [tripPurpose, setTripPurpose] = useState('')

  // Validation states (must be declared before any conditional returns)
  const [startDateError, setStartDateError] = useState<string | null>(null)
  const [endDateError, setEndDateError] = useState<string | null>(null)
  const [overtimeDateError, setOvertimeDateError] = useState<string | null>(null)
  const [shiftDateError, setShiftDateError] = useState<string | null>(null)
  const [checkInTimeError, setCheckInTimeError] = useState<string | null>(null)
  const [checkOutTimeError, setCheckOutTimeError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!requestTypeId) {
        throw new Error('Vui lòng chọn loại đơn từ')
      }

      const payload: any = {
        typeId: requestTypeId,
        reason: reason || undefined,
        description: description || undefined,
      }

      // Add common date fields
      if (startDate) payload.startDate = new Date(startDate).toISOString()
      if (endDate) payload.endDate = new Date(endDate).toISOString()

      // Add type-specific fields
      if (requestType === 'LEAVE') {
        if (!leaveTypeId) {
          throw new Error('Vui lòng chọn loại nghỉ phép')
        }
        payload.leaveTypeId = leaveTypeId
        if (leaveDays) payload.leaveDays = parseFloat(leaveDays)
        if (!startDate || !endDate) {
          throw new Error('Vui lòng chọn ngày bắt đầu và ngày kết thúc')
        }
      } else if (requestType === 'OVERTIME') {
        if (overtimeHours) payload.overtimeHours = parseFloat(overtimeHours)
        if (overtimeDate) payload.overtimeDate = new Date(overtimeDate).toISOString()
        if (!overtimeDate || !overtimeHours) {
          throw new Error('Vui lòng điền đầy đủ thông tin làm thêm')
        }
      } else if (requestType === 'CHECKIN_CONFIRMATION') {
        if (checkInTime) payload.checkInTime = new Date(checkInTime).toISOString()
        if (checkOutTime) payload.checkOutTime = new Date(checkOutTime).toISOString()
        if (!checkInTime || !checkOutTime) {
          throw new Error('Vui lòng điền thời gian check-in và check-out')
        }
      } else if (requestType === 'SHIFT_CHANGE') {
        payload.fromShift = fromShift
        payload.toShift = toShift
        if (shiftDate) payload.shiftDate = new Date(shiftDate).toISOString()
        if (!fromShift || !toShift || !shiftDate) {
          throw new Error('Vui lòng điền đầy đủ thông tin đổi ca')
        }
      } else if (requestType === 'BUSINESS_TRIP') {
        payload.tripLocation = tripLocation
        payload.tripPurpose = tripPurpose
        if (!tripLocation || !tripPurpose || !startDate || !endDate) {
          throw new Error('Vui lòng điền đầy đủ thông tin công tác')
        }
      } else if (requestType === 'RESIGNATION') {
        if (!reason || !startDate) {
          throw new Error('Vui lòng điền lý do và ngày thôi việc')
        }
      } else if (requestType === 'ABSENCE') {
        if (!startDate || !endDate) {
          throw new Error('Vui lòng chọn ngày bắt đầu và ngày kết thúc')
        }
      } else if (requestType === 'WORK_SCHEDULE') {
        if (!startDate || !endDate) {
          throw new Error('Vui lòng chọn ngày bắt đầu và ngày kết thúc')
        }
      }

      await api.post('/requests', payload)
      router.push('/dashboard/requests')
      router.refresh()
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Có lỗi xảy ra khi tạo đơn. Vui lòng thử lại.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load request types
    api
      .get('/types/by-category/REQUEST_TYPE')
      .then((res) => setRequestTypes(res.data))
      .catch(console.error)

    // Load leave types
    api
      .get('/types/by-category/LEAVE_TYPE')
      .then((res) => setLeaveTypes(res.data))
      .catch(console.error)
  }, [])

  const resetForm = () => {
    setRequestType('')
    setRequestTypeId('')
    setStartDate('')
    setEndDate('')
    setReason('')
    setDescription('')
    setLeaveTypeId('')
    setLeaveDays('')
    setOvertimeHours('')
    setOvertimeDate('')
    setCheckInTime('')
    setCheckOutTime('')
    setFromShift('')
    setToShift('')
    setShiftDate('')
    setTripLocation('')
    setTripPurpose('')
    setError(null)
    // Reset validation errors
    setStartDateError(null)
    setEndDateError(null)
    setOvertimeDateError(null)
    setShiftDateError(null)
    setCheckInTimeError(null)
    setCheckOutTimeError(null)
  }

  if (!requestType) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Chọn loại đơn từ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {requestTypes.length > 0 ? (
            requestTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setRequestType(type.code as RequestType)
                  setRequestTypeId(type.id)
                }}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left"
              >
                <div className="mb-2">
                  <Icon name={REQUEST_TYPES.find((t) => t.value === type.code)?.icon || 'clipboard'} size={32} />
                </div>
                <div className="font-medium text-gray-900">{type.name}</div>
              </button>
            ))
          ) : (
            REQUEST_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  const foundType = requestTypes.find((t) => t.code === type.value)
                  if (foundType) {
                    setRequestType(type.value)
                    setRequestTypeId(foundType.id)
                  }
                }}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left"
              >
                <div className="mb-2">
                  <Icon name={type.icon} size={32} />
                </div>
                <div className="font-medium text-gray-900">{type.label}</div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  const selectedType = REQUEST_TYPES.find((t) => t.value === requestType)
  
  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0]
  
  // Helper function to validate date >= today
  const validateDateMinToday = (date: string, setError: (error: string | null) => void) => {
    if (date && date < today) {
      setError('Ngày phải lớn hơn hoặc bằng ngày hiện tại')
    } else {
      setError(null)
    }
  }
  
  // Helper function to validate datetime >= now
  const validateDateTimeMinNow = (dateTime: string, setError: (error: string | null) => void) => {
    if (dateTime) {
      const selected = new Date(dateTime)
      const now = new Date()
      if (selected < now) {
        setError('Thời gian phải lớn hơn hoặc bằng thời gian hiện tại')
      } else {
        setError(null)
      }
    } else {
      setError(null)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {selectedType && (
            <Icon name={selectedType.icon} size={24} />
          )}
          <div>
            <h2 className="text-xl font-semibold">
              {selectedType?.label}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Điền thông tin để tạo đơn từ
            </p>
          </div>
        </div>
        <button
          onClick={resetForm}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Chọn lại loại đơn
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Leave Form */}
        {requestType === 'LEAVE' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại nghỉ phép <span className="text-red-500">*</span>
                </label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
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
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    setStartDate(selectedDate)
                    
                    // Validate: start date >= today
                    if (selectedDate && selectedDate < today) {
                      setStartDateError('Ngày bắt đầu phải lớn hơn hoặc bằng ngày hiện tại')
                    } else {
                      setStartDateError(null)
                    }
                    
                    // Auto calculate leave days
                    if (selectedDate && endDate) {
                      const start = new Date(selectedDate)
                      const end = new Date(endDate)
                      if (end >= start) {
                        const diffTime = Math.abs(end.getTime() - start.getTime())
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                        setLeaveDays(diffDays.toString())
                        setEndDateError(null)
                      } else {
                        setEndDateError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu')
                      }
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    startDateError 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-yellow-500'
                  }`}
                  required
                />
                {startDateError && (
                  <p className="mt-1 text-sm text-red-600">{startDateError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    setEndDate(selectedDate)
                    
                    // Validate: end date >= start date
                    if (startDate && selectedDate < startDate) {
                      setEndDateError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu')
                    } else {
                      setEndDateError(null)
                    }
                    
                    // Auto calculate leave days
                    if (startDate && selectedDate) {
                      const start = new Date(startDate)
                      const end = new Date(selectedDate)
                      if (end >= start) {
                        const diffTime = Math.abs(end.getTime() - start.getTime())
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                        setLeaveDays(diffDays.toString())
                      }
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    endDateError 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-yellow-500'
                  }`}
                  required
                />
                {endDateError && (
                  <p className="mt-1 text-sm text-red-600">{endDateError}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Absence Form */}
        {requestType === 'ABSENCE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => {
                  const selectedDate = e.target.value
                  setStartDate(selectedDate)
                  validateDateMinToday(selectedDate, setStartDateError)
                  if (endDate && selectedDate > endDate) {
                    setEndDateError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu')
                  } else {
                    setEndDateError(null)
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  startDateError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-yellow-500'
                }`}
                required
              />
              {startDateError && (
                <p className="mt-1 text-sm text-red-600">{startDateError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => {
                  const selectedDate = e.target.value
                  setEndDate(selectedDate)
                  if (startDate && selectedDate < startDate) {
                    setEndDateError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu')
                  } else {
                    setEndDateError(null)
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  endDateError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-yellow-500'
                }`}
                required
              />
              {endDateError && (
                <p className="mt-1 text-sm text-red-600">{endDateError}</p>
              )}
            </div>
          </div>
        )}

        {/* Overtime Form */}
        {requestType === 'OVERTIME' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày làm thêm <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={overtimeDate}
                min={today}
                onChange={(e) => {
                  const selectedDate = e.target.value
                  setOvertimeDate(selectedDate)
                  validateDateMinToday(selectedDate, setOvertimeDateError)
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  overtimeDateError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-yellow-500'
                }`}
                required
              />
              {overtimeDateError && (
                <p className="mt-1 text-sm text-red-600">{overtimeDateError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số giờ làm thêm <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Ví dụ: 2, 2.5, 4"
                required
              />
            </div>
          </div>
        )}

        {/* Check-in/out Confirmation Form */}
        {requestType === 'CHECKIN_CONFIRMATION' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian check-in <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={checkInTime}
                onChange={(e) => {
                  const selectedTime = e.target.value
                  setCheckInTime(selectedTime)
                  validateDateTimeMinNow(selectedTime, setCheckInTimeError)
                  if (checkOutTime && selectedTime > checkOutTime) {
                    setCheckOutTimeError('Thời gian check-out phải lớn hơn hoặc bằng thời gian check-in')
                  } else {
                    setCheckOutTimeError(null)
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  checkInTimeError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-yellow-500'
                }`}
                required
              />
              {checkInTimeError && (
                <p className="mt-1 text-sm text-red-600">{checkInTimeError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian check-out <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={checkOutTime}
                min={checkInTime}
                onChange={(e) => {
                  const selectedTime = e.target.value
                  setCheckOutTime(selectedTime)
                  if (checkInTime && selectedTime < checkInTime) {
                    setCheckOutTimeError('Thời gian check-out phải lớn hơn hoặc bằng thời gian check-in')
                  } else {
                    setCheckOutTimeError(null)
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  checkOutTimeError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-yellow-500'
                }`}
                required
              />
              {checkOutTimeError && (
                <p className="mt-1 text-sm text-red-600">{checkOutTimeError}</p>
              )}
            </div>
          </div>
        )}

        {/* Shift Change Form */}
        {requestType === 'SHIFT_CHANGE' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ca hiện tại <span className="text-red-500">*</span>
                </label>
                <select
                  value={fromShift}
                  onChange={(e) => setFromShift(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
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
                  Ca muốn đổi <span className="text-red-500">*</span>
                </label>
                <select
                  value={toShift}
                  onChange={(e) => setToShift(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
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
                Ngày đổi ca <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={shiftDate}
                min={today}
                onChange={(e) => {
                  const selectedDate = e.target.value
                  setShiftDate(selectedDate)
                  validateDateMinToday(selectedDate, setShiftDateError)
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  shiftDateError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-yellow-500'
                }`}
                required
              />
              {shiftDateError && (
                <p className="mt-1 text-sm text-red-600">{shiftDateError}</p>
              )}
            </div>
          </>
        )}

        {/* Business Trip Form */}
        {requestType === 'BUSINESS_TRIP' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa điểm công tác <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tripLocation}
                  onChange={(e) => setTripLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ví dụ: Hà Nội, TP.HCM"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mục đích công tác <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tripPurpose}
                  onChange={(e) => setTripPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Mô tả mục đích công tác"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    setStartDate(selectedDate)
                    validateDateMinToday(selectedDate, setStartDateError)
                    if (endDate && selectedDate > endDate) {
                      setEndDateError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu')
                    } else {
                      setEndDateError(null)
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    startDateError 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-yellow-500'
                  }`}
                  required
                />
                {startDateError && (
                  <p className="mt-1 text-sm text-red-600">{startDateError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    setEndDate(selectedDate)
                    if (startDate && selectedDate < startDate) {
                      setEndDateError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu')
                    } else {
                      setEndDateError(null)
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    endDateError 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-yellow-500'
                  }`}
                  required
                />
                {endDateError && (
                  <p className="mt-1 text-sm text-red-600">{endDateError}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Work Schedule Form */}
        {requestType === 'WORK_SCHEDULE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => {
                  const selectedDate = e.target.value
                  setStartDate(selectedDate)
                  validateDateMinToday(selectedDate, setStartDateError)
                  if (endDate && selectedDate > endDate) {
                    setEndDateError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu')
                  } else {
                    setEndDateError(null)
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  startDateError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-yellow-500'
                }`}
                required
              />
              {startDateError && (
                <p className="mt-1 text-sm text-red-600">{startDateError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => {
                  const selectedDate = e.target.value
                  setEndDate(selectedDate)
                  if (startDate && selectedDate < startDate) {
                    setEndDateError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu')
                  } else {
                    setEndDateError(null)
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  endDateError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-yellow-500'
                }`}
                required
              />
              {endDateError && (
                <p className="mt-1 text-sm text-red-600">{endDateError}</p>
              )}
            </div>
          </div>
        )}

        {/* Resignation Form */}
        {requestType === 'RESIGNATION' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày thôi việc <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => {
                const selectedDate = e.target.value
                setStartDate(selectedDate)
                validateDateMinToday(selectedDate, setStartDateError)
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                startDateError 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-yellow-500'
              }`}
              required
            />
            {startDateError && (
              <p className="mt-1 text-sm text-red-600">{startDateError}</p>
            )}
          </div>
        )}

        {/* Common fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lý do {requestType === 'RESIGNATION' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Nhập lý do..."
            required={requestType === 'RESIGNATION'}
          />
        </div>

        {requestType !== 'RESIGNATION' && (
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
            onClick={() => router.push('/dashboard/requests')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang tạo...' : 'Tạo đơn'}
          </button>
        </div>
      </form>
    </div>
  )
}

