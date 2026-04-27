'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const [displayMode, setDisplayMode] = useState<'list' | 'calendar'>('calendar')
  
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
    return 'bg-slate-200 text-slate-800'
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Lịch phỏng vấn</h1>
        <p className="text-gray-600 mt-2">Quản lý lịch phỏng vấn, kết quả và theo dõi tiến độ ứng viên</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Select value={typeId} onValueChange={setTypeId}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tất cả vòng PV" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả vòng PV</SelectItem>
              {types.map(t => <SelectItem key={typeof t === 'object' && t !== null && 'id' in t ? t.id : ''} value={typeof t === 'object' && t !== null && 'id' in t ? t.id : ''}>{typeof t === 'object' && t !== null && 'name' in t ? t.name : 'Unknown'}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={resultId} onValueChange={setResultId}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tất cả kết quả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả kết quả</SelectItem>
              {results.map(r => <SelectItem key={typeof r === 'object' && r !== null && 'id' in r ? r.id : ''} value={typeof r === 'object' && r !== null && 'id' in r ? r.id : ''}>{typeof r === 'object' && r !== null && 'name' in r ? r.name : 'Unknown'}</SelectItem>)}
            </SelectContent>
          </Select>
          {displayMode === 'calendar' && (
            <Select value={viewMode} onValueChange={setViewMode as any}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Ngày</SelectItem>
                <SelectItem value="week">Tuần</SelectItem>
                <SelectItem value="month">Tháng</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={displayMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDisplayMode('list')}
          >
            <Icon name="list" size={16} />
            List
          </Button>
          <Button
            variant={displayMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDisplayMode('calendar')}
          >
            <Icon name="calendar" size={16} />
            Calendar
          </Button>
        </div>
      </div>

      {/* Navigation for Calendar mode */}
      {displayMode === 'calendar' && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const prev = new Date(selectedDate)
              if (viewMode === 'day') prev.setDate(prev.getDate() - 1)
              else if (viewMode === 'week') prev.setDate(prev.getDate() - 7)
              else prev.setMonth(prev.getMonth() - 1)
              setSelectedDate(prev.toISOString().split('T')[0])
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Icon name="chevron-left" size={20} />
          </button>
          <span className="font-medium text-gray-900">
            {displayMode === 'calendar' && viewMode === 'day' && new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {displayMode === 'calendar' && viewMode === 'week' && 'Tuần ' + (() => {
              const start = new Date(selectedDate)
              const end = new Date(selectedDate)
              end.setDate(end.getDate() + 6)
              return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`
            })()}
            {displayMode === 'calendar' && viewMode === 'month' && new Date(selectedDate).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' })}
          </span>
          <button
            onClick={() => {
              const next = new Date(selectedDate)
              if (viewMode === 'day') next.setDate(next.getDate() + 1)
              else if (viewMode === 'week') next.setDate(next.getDate() + 7)
              else next.setMonth(next.getMonth() + 1)
              setSelectedDate(next.toISOString().split('T')[0])
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Icon name="chevron-right" size={20} />
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-sm text-gray-600 hover:text-gray-900 ml-2"
          >
            Hôm nay
          </button>
        </div>
      )}

      {/* List View */}
      {displayMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ứng viên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vòng PV</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người PV</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa điểm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kết quả</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {interviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Không có lịch phỏng vấn nào
                  </td>
                </tr>
              ) : (
                interviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{new Date(interview.scheduledAt).toLocaleDateString('vi-VN')}</div>
                      <div className="text-gray-500">{new Date(interview.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{interview.candidate.fullName}</div>
                      <div className="text-gray-500">{interview.candidate.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {getTypeLabel(interview.type)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>{typeof interview.interviewer === 'object' && 'fullName' in interview.interviewer ? interview.interviewer.fullName : 'N/A'}</div>
                      <div className="text-gray-500">{typeof interview.interviewer === 'object' && 'email' in interview.interviewer ? interview.interviewer.email : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {interview.location || 'Chưa có'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getResultColor(interview.result)}`}>
                        {getResultLabel(interview.result)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View */}
      {displayMode === 'calendar' && (
        <div className="space-y-6">
          {sortedDates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có lịch phỏng vấn nào trong khoảng thời gian này
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">
                    {new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {groupedInterviews[date].map((interview) => (
                    <div key={interview.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(interview.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {getTypeLabel(interview.type)}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="font-medium text-gray-900">{interview.candidate.fullName}</span>
                            <span className="text-gray-500 text-sm ml-2">({interview.candidate.phone})</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Người phỏng vấn: {typeof interview.interviewer === 'object' && 'fullName' in interview.interviewer ? interview.interviewer.fullName : 'N/A'}
                            {interview.location && ` - ${interview.location}`}
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getResultColor(interview.result)}`}>
                          {getResultLabel(interview.result)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}