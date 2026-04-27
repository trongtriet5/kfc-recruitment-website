'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, ChevronDown } from 'lucide-react'

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
}: { 
  options: { id: string, name: string }[], 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOption = options.find(opt => opt.id === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-white flex justify-between items-center cursor-pointer focus:ring-2 focus:ring-slate-500`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    value === opt.id ? 'bg-slate-50 text-slate-700' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    onChange(opt.id)
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string
  currentCity?: string
  currentWard?: string
  currentStreet?: string
  store?: {
    id: string
    name: string
    address: string | null
  }
}

interface Employee {
  id: string
  fullName: string
  email: string | null
  role: string
}

interface TypeOption {
  id: string
  code: string
  name: string
}

export default function CreateInterviewForm({
  candidateId: initialCandidateId,
  onSuccess,
  onCancel,
}: {
  candidateId?: string
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const candidateIdParam = initialCandidateId || searchParams.get('candidateId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])



  // Form fields
  const [candidateId, setCandidateId] = useState(candidateIdParam || '')
  const [interviewerId, setInterviewerId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    // Load candidates
    api
      .get('/recruitment/candidates')
      .then((res) => {
        const data = res.data
        if (Array.isArray(data)) {
          setCandidates(data)
        } else if (Array.isArray(data?.candidates)) {
          setCandidates(data.candidates)
        } else if (Array.isArray(data?.data)) {
          setCandidates(data.data)
        } else {
          setCandidates([])
        }
      })
      .catch(console.error)

    // Load users (to get interviewers)
    api
      .get('/users')
      .then((res) => {
        const data = res.data
        let userList = []
        if (Array.isArray(data)) {
          userList = data
        } else if (Array.isArray(data?.users)) {
          userList = data.users
        } else if (Array.isArray(data?.data)) {
          userList = data.data
        }
        // Use all active users as potential interviewers
        setEmployees(userList.filter((u: any) => u.isActive))
      })
      .catch(console.error)



    // Load candidate if candidateId is provided
    if (candidateIdParam) {
      api
        .get(`/recruitment/candidates/${candidateIdParam}`)
        .then((res) => setCandidate(res.data))
        .catch(console.error)
    }
  }, [candidateIdParam])

  // Update candidate when candidateId changes
  useEffect(() => {
    if (candidateId && candidates.length > 0) {
      const found = candidates.find((c) => c.id === candidateId)
      if (found) {
        setCandidate(found)
      }
    }
  }, [candidateId, candidates])

  // Set default location when candidate is loaded
  useEffect(() => {
    if (candidate?.store) {
      setLocation(candidate.store.name)
    }
  }, [candidate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!candidateId) {
        throw new Error('Vui lòng chọn ứng viên')
      }
      if (!interviewerId) {
        throw new Error('Vui lòng chọn người phỏng vấn')
      }
      if (!scheduledDate) {
        throw new Error('Vui lòng chọn ngày phỏng vấn')
      }

      // Combine date and time
      const [hours, minutes] = scheduledTime.split(':')
      const combinedDate = new Date(scheduledDate + 'T00:00:00')
      combinedDate.setHours(parseInt(hours), parseInt(minutes))

      const payload: any = {
        candidateId,
        interviewerId,
        scheduledAt: combinedDate.toISOString(),
      }

      if (location) payload.location = location
      if (notes) payload.notes = notes

      await api.post('/recruitment/interviews', payload)
      toast.success('Tạo lịch phỏng vấn thành công')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/recruitment/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo lịch phỏng vấn'
      toast.error(errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Format datetime-local value from ISO string
  const formatDateTimeLocal = (isoString: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  return (
    <div className={onSuccess ? "" : "bg-white shadow rounded-lg p-6"}>
      {!onSuccess && <h2 className="text-xl font-semibold mb-6">Tạo lịch phỏng vấn</h2>}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Candidate Selection */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            Ứng viên <span className="text-red-500">*</span>
          </Label>
          {(candidateIdParam || initialCandidateId) && candidate ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="font-semibold text-gray-900 text-base">{candidate.fullName}</div>
              <div className="text-sm text-gray-600 mt-1 flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">SĐT:</span> {candidate.phone}
                </div>
                {(candidate.currentStreet || candidate.currentWard || candidate.currentCity) && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium">Địa chỉ:</span>
                    <span>
                      {[candidate.currentStreet, candidate.currentWard, candidate.currentCity].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <select
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            >
              <option value="">Chọn ứng viên</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} - {c.phone}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Interviewer Selection */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            Người phỏng vấn <span className="text-red-500">*</span>
          </Label>
          <SearchableSelect
            options={employees.map(e => ({ id: e.id, name: `${e.fullName} (${e.email || ''})` }))}
            value={interviewerId}
            onChange={setInterviewerId}
            placeholder="Tìm người phỏng vấn..."
          />
        </div>

        {/* Date and Time Pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Ngày phỏng vấn <span className="text-red-500">*</span>
            </Label>
            <DatePicker 
              value={scheduledDate} 
              onChange={setScheduledDate} 
              placeholder="Chọn ngày phỏng vấn" 
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Giờ phỏng vấn <span className="text-red-500">*</span>
            </Label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full h-10"
              required
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            Địa điểm phỏng vấn
          </Label>
          <Input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Mặc định: Tại cửa hàng của chiến dịch"
            className="w-full"
          />
          <p className="text-xs text-gray-500 italic">
            * Mặc định là tên cửa hàng của đề xuất tuyển dụng.
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            Ghi chú
          </Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Thêm thông tin bổ sung nếu cần (đổi địa điểm, chuẩn bị hồ sơ...)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.back())}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-slate-800 text-white hover:bg-slate-900 min-w-[140px]"
          >
            {loading ? 'Đang tạo...' : 'Xác nhận lịch'}
          </Button>
        </div>
      </form>
    </div>
  )
}

