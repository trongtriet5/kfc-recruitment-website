'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Interview {
  id: string
  type: string | { id: string; name: string; code: string } | null
  scheduledAt: string
  location: string | null
  notes: string | null
  result: string | { id: string; name: string; code: string } | null
  candidate: {
    id: string
    fullName: string
    email: string | null
    phone: string
    status: string | { id: string; name: string; code: string } | null
  }
  interviewer: {
    id: string
    fullName: string
    email: string
  }
}

export default function InterviewsCalendar() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  
  const [typeId, setTypeId] = useState<string>('')
  const [resultId, setResultId] = useState<string>('')
  const [types, setTypes] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    loadTypes()
    loadResults()
  }, [])

  useEffect(() => {
    loadInterviews()
  }, [selectedDate, viewMode, typeId, resultId])

  const loadTypes = () => {
    api.get('/types/by-category/INTERVIEW_TYPE').then(res => setTypes(res.data)).catch(console.error)
  }

  const loadResults = () => {
    api.get('/types/by-category/INTERVIEW_RESULT').then(res => setResults(res.data)).catch(console.error)
  }

  const loadInterviews = () => {
    const startDate = new Date(selectedDate)
    let endDate = new Date(selectedDate)

    if (viewMode === 'day') {
      endDate = new Date(selectedDate)
    } else if (viewMode === 'week') {
      endDate.setDate(startDate.getDate() + 6)
    } else {
      endDate.setMonth(startDate.getMonth() + 1)
    }

    api
      .get(
        `/recruitment/interviews?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${typeId ? `&typeId=${typeId}` : ''}${resultId ? `&resultId=${resultId}` : ''}`
      )
      .then((res) => setInterviews(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const getTypeLabel = (type: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!type) return 'Chưa có loại'
    if (typeof type === 'object') return type.name
    const labels: Record<string, string> = {
      HR_SCREENING: 'HR Sơ vấn',
      SM_AM_INTERVIEW: 'SM/AM Phỏng vấn',
      OM_PV_INTERVIEW: 'OM/PV Phỏng vấn',
    }
    return labels[type] || type
  }

  const getResultLabel = (result: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!result) return 'Chưa có kết quả'
    if (typeof result === 'object') return result.name
    const labels: Record<string, string> = {
      PASSED: 'Đạt',
      FAILED: 'Không đạt',
      NO_SHOW: 'Không đến',
    }
    return labels[result] || result
  }

  const getResultColor = (result: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!result) return 'bg-gray-100 text-gray-800'
    const resultCode = typeof result === 'object' ? result.code : result
    if (resultCode === 'PASSED') return 'bg-green-100 text-green-800'
    if (resultCode === 'FAILED') return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const groupInterviewsByDate = () => {
    const grouped: Record<string, Interview[]> = {}
    interviews.forEach((interview) => {
      const date = new Date(interview.scheduledAt).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(interview)
    })
    return grouped
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  const groupedInterviews = groupInterviewsByDate()
  const sortedDates = Object.keys(groupedInterviews).sort()

  return (
    <div className="pt-6 space-y-8">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Lịch phỏng vấn</h1>
        <p className="text-gray-600 mt-2">Quản lý lịch phỏng vấn, kết quả và theo dõi tiến độ ứng viên</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả vòng PV</option>
            {types.map(t => <option key={typeof t === 'object' && t !== null && 'id' in t ? t.id : ''} value={typeof t === 'object' && t !== null && 'id' in t ? t.id : ''}>{typeof t === 'object' && t !== null && 'name' in t ? t.name : 'Unknown'}</option>)}
          </select>
          <select
            value={resultId}
            onChange={(e) => setResultId(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả kết quả</option>
            {results.map(r => <option key={typeof r === 'object' && r !== null && 'id' in r ? r.id : ''} value={typeof r === 'object' && r !== null && 'id' in r ? r.id : ''}>{typeof r === 'object' && r !== null && 'name' in r ? r.name : 'Unknown'}</option>)}
          </select>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {sortedDates.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">Không có lịch phỏng vấn</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedDates.map((date) => (
              <div key={date} className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {new Date(date).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <div className="space-y-3">
                  {groupedInterviews[date].map((interview) => (
                    <div
                      key={interview.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-yellow-600">
                              {new Date(interview.scheduledAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {getTypeLabel(interview.type)}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getResultColor(interview.result)}`}
                            >
                              {getResultLabel(interview.result)}
                            </span>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              Ứng viên: {typeof interview.candidate === 'object' && interview.candidate !== null && 'fullName' in interview.candidate ? interview.candidate.fullName : 'N/A'}
                            </p>
                            <p className="text-gray-500">{typeof interview.candidate === 'object' && interview.candidate !== null && 'phone' in interview.candidate ? interview.candidate.phone : ''}</p>
                            <p className="text-gray-500">
                              Người phỏng vấn: {typeof interview.interviewer === 'object' && interview.interviewer !== null && 'fullName' in interview.interviewer ? String(interview.interviewer.fullName || 'N/A') : 'N/A'}
                            </p>
                            {interview.location && (
                              <p className="text-gray-500">Địa điểm: {interview.location}</p>
                            )}
                            {interview.notes && (
                              <p className="text-gray-500 mt-1">Ghi chú: {interview.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

