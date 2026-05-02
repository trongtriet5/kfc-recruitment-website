'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/select-searchable'

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

interface Store {
  id: string
  name: string
  code: string
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
  const [stores, setStores] = useState<Store[]>([])




  const [candidateId, setCandidateId] = useState(candidateIdParam || '')
  const [interviewerId, setInterviewerId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [selectedStoreId, setSelectedStoreId] = useState('')
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

    // Load stores
    api
      .get('/stores')
      .then((res) => {
        const data = res.data
        let storeList: Store[] = []
        if (Array.isArray(data)) {
          storeList = data
        } else if (Array.isArray(data?.stores)) {
          storeList = data.stores
        } else if (Array.isArray(data?.data)) {
          storeList = data.data
        }
        // Sort by store code ascending
        storeList.sort((a, b) => a.code.localeCompare(b.code))
        setStores(storeList)
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

  // Set default store when candidate is loaded
  useEffect(() => {
    if (candidate?.store) {
      setSelectedStoreId(candidate.store.id)
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

      if (selectedStoreId) {
        const selectedStore = stores.find(s => s.id === selectedStoreId)
        if (selectedStore) {
          payload.location = `${selectedStore.code} - ${selectedStore.name}`
        }
      }
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
              onClick={(e: any) => e.target.showPicker && e.target.showPicker()}
              className="w-full h-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            Địa điểm phỏng vấn
          </Label>
          <SearchableSelect
            options={stores.map(s => ({ id: s.id, name: `${s.code} - ${s.name}` }))}
            value={selectedStoreId}
            onChange={setSelectedStoreId}
            placeholder="Chọn cửa hàng..."
          />
          <p className="text-xs text-gray-500 italic">
            * Mặc định là cửa hàng của đề xuất tuyển dụng.
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

