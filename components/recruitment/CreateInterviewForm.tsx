'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string
}

interface Employee {
  id: string
  fullName: string
  email: string | null
  user: {
    id: string
    email: string
    role: string
  } | null
}

interface TypeOption {
  id: string
  code: string
  name: string
}

export default function CreateInterviewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const candidateIdParam = searchParams.get('candidateId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [interviewTypes, setInterviewTypes] = useState<TypeOption[]>([])
  const [interviewResults, setInterviewResults] = useState<TypeOption[]>([])

  // Form fields
  const [candidateId, setCandidateId] = useState(candidateIdParam || '')
  const [interviewerId, setInterviewerId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [resultId, setResultId] = useState('')

  useEffect(() => {
    // Load candidates
    api
      .get('/recruitment/candidates')
      .then((res) => setCandidates(res.data))
      .catch(console.error)

    // Load employees (to get interviewers)
    api
      .get('/employees')
      .then((res) => {
        // Filter employees that have users
        const employeesWithUsers = res.data.filter((emp: Employee) => emp.user !== null)
        setEmployees(employeesWithUsers)
      })
      .catch(console.error)

    // Load interview types
    api
      .get('/types/by-category/INTERVIEW_TYPE')
      .then((res) => setInterviewTypes(res.data))
      .catch(console.error)

    // Load interview results
    api
      .get('/types/by-category/INTERVIEW_RESULT')
      .then((res) => setInterviewResults(res.data))
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
      if (!typeId) {
        throw new Error('Vui lòng chọn loại phỏng vấn')
      }
      if (!scheduledAt) {
        throw new Error('Vui lòng chọn thời gian phỏng vấn')
      }

      const payload: any = {
        candidateId,
        interviewerId,
        typeId,
        scheduledAt: new Date(scheduledAt).toISOString(),
      }

      if (location) payload.location = location
      if (notes) payload.notes = notes
      if (resultId) payload.resultId = resultId

      await api.post('/recruitment/interviews', payload)
      router.push('/dashboard/recruitment')
      router.refresh()
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Có lỗi xảy ra khi tạo lịch phỏng vấn. Vui lòng thử lại.'
      )
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
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Tạo lịch phỏng vấn</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Candidate Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ứng viên <span className="text-red-500">*</span>
          </label>
          {candidateIdParam && candidate ? (
            <div className="p-3 bg-gray-50 border border-gray-300 rounded-md">
              <div className="font-medium text-gray-900">{candidate.fullName}</div>
              <div className="text-sm text-gray-600">{candidate.phone}</div>
              {candidate.email && (
                <div className="text-sm text-gray-600">{candidate.email}</div>
              )}
            </div>
          ) : (
            <select
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            >
              <option value="">Chọn ứng viên</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.fullName} - {candidate.phone}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Interviewer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Người phỏng vấn <span className="text-red-500">*</span>
          </label>
          <select
            value={interviewerId}
            onChange={(e) => setInterviewerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          >
            <option value="">Chọn người phỏng vấn</option>
            {employees.map((employee) => (
              <option key={employee.user!.id} value={employee.user!.id}>
                {employee.fullName} ({employee.user!.email})
              </option>
            ))}
          </select>
        </div>

        {/* Interview Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại phỏng vấn <span className="text-red-500">*</span>
          </label>
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          >
            <option value="">Chọn loại phỏng vấn</option>
            {interviewTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Scheduled Date/Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thời gian phỏng vấn <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa điểm
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ví dụ: Văn phòng Maycha, Phòng họp A..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Ghi chú về buổi phỏng vấn..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Interview Result (Optional - for completed interviews) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kết quả phỏng vấn (tùy chọn)
          </label>
          <select
            value={resultId}
            onChange={(e) => setResultId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">Chưa có kết quả</option>
            {interviewResults.map((result) => (
              <option key={result.id} value={result.id}>
                {result.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Có thể để trống nếu chưa phỏng vấn
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang tạo...' : 'Tạo lịch phỏng vấn'}
          </button>
        </div>
      </form>
    </div>
  )
}

