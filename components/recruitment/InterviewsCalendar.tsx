'use client'

import { useEffect, useState } from 'react'
import { format, addDays, startOfWeek, isSameDay, isToday, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

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

// Helper function to format time as AM/PM (e.g., 09:00 SA → 09:00 AM)
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true // Use AM/PM instead of 24h
  }).replace('AM', 'AM').replace('PM', 'PM');
}

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => i + 8) // 08:00 to 23:00

export default function InterviewsCalendar() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [displayMode, setDisplayMode] = useState<'list' | 'calendar'>('calendar')
  
  const [resultFilter, setResultFilter] = useState<string>('__all__')
  const [results] = useState([
    { id: 'PASSED', name: 'Đạt' },
    { id: 'FAILED', name: 'Không đạt' },
    { id: 'PENDING', name: 'Chờ kết quả' }
  ])

  useEffect(() => {
    // No dynamic types or results to load
  }, [])

  useEffect(() => {
    loadInterviews()
  }, [selectedDate, viewMode, resultFilter])


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
        `/recruitment/interviews?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
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

  const getResultLabel = (interview: Interview) => {
    const status = typeof interview.candidate.status === 'object' ? interview.candidate.status?.code : interview.candidate.status;
    
    if (["SM_AM_INTERVIEW_PASSED", "OM_PV_INTERVIEW_PASSED", "OFFER_SENT", "OFFER_ACCEPTED", "OFFER_REJECTED", "WAITING_ONBOARDING", "ONBOARDING_ACCEPTED"].includes(status || "")) {
      return "Đạt";
    }
    if (["SM_AM_INTERVIEW_FAILED", "OM_PV_INTERVIEW_FAILED"].includes(status || "")) {
      return "Không đạt";
    }
    if (status === "WAITING_INTERVIEW") {
      return "Chờ kết quả";
    }
    
    // Fallback to existing result label if status doesn't match
    const result = interview.result;
    if (!result) return 'Chưa có kết quả'
    if (typeof result === 'object') return result.name
    const labels: Record<string, string> = {
      PASSED: 'Đạt',
      FAILED: 'Không đạt',
      NO_SHOW: 'Không đến',
    }
    return labels[result] || result
  }

  const getResultColor = (interview: Interview) => {
    const status = typeof interview.candidate.status === 'object' ? interview.candidate.status?.code : interview.candidate.status;
    
    if (["SM_AM_INTERVIEW_PASSED", "OM_PV_INTERVIEW_PASSED", "OFFER_SENT", "OFFER_ACCEPTED", "OFFER_REJECTED", "WAITING_ONBOARDING", "ONBOARDING_ACCEPTED"].includes(status || "")) {
      return 'bg-green-100 text-green-800';
    }
    if (["SM_AM_INTERVIEW_FAILED", "OM_PV_INTERVIEW_FAILED"].includes(status || "")) {
      return 'bg-red-100 text-red-800';
    }
    if (status === "WAITING_INTERVIEW") {
      return 'bg-blue-100 text-blue-800';
    }
    
    return 'bg-slate-200 text-slate-800';
  }

  const groupInterviewsByDate = () => {
    const grouped: Record<string, Interview[]> = {}
    
    const filtered = interviews.filter(interview => {
      if (!resultFilter || resultFilter === '__all__') return true;
      
      const status = typeof interview.candidate.status === 'object' ? interview.candidate.status?.code : interview.candidate.status;
      
      if (resultFilter === 'PASSED') {
        return ["SM_AM_INTERVIEW_PASSED", "OM_PV_INTERVIEW_PASSED", "OFFER_SENT", "OFFER_ACCEPTED", "OFFER_REJECTED", "WAITING_ONBOARDING", "ONBOARDING_ACCEPTED"].includes(status || "");
      }
      if (resultFilter === 'FAILED') {
        return ["SM_AM_INTERVIEW_FAILED", "OM_PV_INTERVIEW_FAILED"].includes(status || "");
      }
      if (resultFilter === 'PENDING') {
        return status === "WAITING_INTERVIEW";
      }
      return true;
    });

    filtered.forEach((interview) => {
      const date = new Date(interview.scheduledAt).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(interview)
    })
    return grouped
  }

  const getInterviewsForSlot = (date: Date, hour: number) => {
    return interviews.filter(interview => {
      const interviewDate = parseISO(interview.scheduledAt)
      const interviewHour = interviewDate.getHours()
      
      // Filter by result category first (same as groupInterviewsByDate logic)
      const status = typeof interview.candidate.status === 'object' ? interview.candidate.status?.code : interview.candidate.status;
      let matchesFilter = true;
      if (resultFilter && resultFilter !== '__all__') {
        if (resultFilter === 'PASSED') {
          matchesFilter = ["SM_AM_INTERVIEW_PASSED", "OM_PV_INTERVIEW_PASSED", "OFFER_SENT", "OFFER_ACCEPTED", "OFFER_REJECTED", "WAITING_ONBOARDING", "ONBOARDING_ACCEPTED"].includes(status || "");
        } else if (resultFilter === 'FAILED') {
          matchesFilter = ["SM_AM_INTERVIEW_FAILED", "OM_PV_INTERVIEW_FAILED"].includes(status || "");
        } else if (resultFilter === 'PENDING') {
          matchesFilter = status === "WAITING_INTERVIEW";
        }
      }
      
      return matchesFilter && isSameDay(interviewDate, date) && interviewHour === hour
    })
  }

  const getWeekDays = () => {
    const start = new Date(selectedDate)
    const days: Date[] = []
    
    if (viewMode === 'day') {
      days.push(start)
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(start, { weekStartsOn: 1 })
      for (let i = 0; i < 7; i++) {
        days.push(addDays(weekStart, i))
      }
    } else {
      // For month, we'll just show the full month days
      // However, for the grid view, 30 columns might be too much
      // We'll stick to showing the selected week of that month for now
      const weekStart = startOfWeek(start, { weekStartsOn: 1 })
      for (let i = 0; i < 7; i++) {
        days.push(addDays(weekStart, i))
      }
    }
    return days
  }

  if (loading) {
    return <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-kfc-red"></div>
      <p className="mt-2 text-gray-500">Đang tải lịch phỏng vấn...</p>
    </div>
  }

  const weekDays = getWeekDays()

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Lịch phỏng vấn</h1>
        <p className="text-gray-600 mt-2">Quản lý lịch phỏng vấn, kết quả và theo dõi tiến độ ứng viên</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả kết quả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả kết quả</SelectItem>
              <SelectItem value="PASSED">Đạt</SelectItem>
              <SelectItem value="FAILED">Không đạt</SelectItem>
              <SelectItem value="PENDING">Chờ kết quả</SelectItem>
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ứng viên</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Người PV</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Địa điểm</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kết quả</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {interviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 font-medium">
                    <Icon name="search" size={32} className="mx-auto mb-3 opacity-20" />
                    Không có lịch phỏng vấn nào
                  </td>
                </tr>
              ) : (
                interviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-bold text-gray-900">{format(parseISO(interview.scheduledAt), 'dd/MM/yyyy')}</div>
                      <div className="text-gray-500 font-medium">{format(parseISO(interview.scheduledAt), 'HH:mm')}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-bold text-gray-900">{interview.candidate.fullName}</div>
                      <div className="text-gray-500 font-medium">{interview.candidate.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-bold text-gray-900">{typeof interview.interviewer === 'object' && 'fullName' in interview.interviewer ? interview.interviewer.fullName : 'N/A'}</div>
                      <div className="text-gray-400 text-xs">{typeof interview.interviewer === 'object' && 'email' in interview.interviewer ? interview.interviewer.email : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-medium italic">
                      {interview.location || 'Chưa có'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-3 py-1 text-[11px] font-bold rounded-full border shadow-sm ${getResultColor(interview)}`}>
                        {getResultLabel(interview)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar Grid View */}
      {displayMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-[100px_repeat(7,minmax(0,1fr))] border-b bg-gray-50">
            <div className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-r flex items-center justify-end pr-4">
              Giờ
            </div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className={`p-3 text-center border-r last:border-r-0 ${isToday(day) ? 'bg-red-50/50' : ''}`}>
                <div className="text-xs font-bold text-gray-500 uppercase">{format(day, 'EEE', { locale: vi })}</div>
                <div className={`text-base font-bold mt-0.5 ${isToday(day) ? 'text-red-600' : 'text-gray-900'}`}>{format(day, 'dd/MM')}</div>
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 grid grid-cols-[100px_repeat(7,minmax(0,1fr))]">
            {TIME_SLOTS.map(hour => (
              <div key={hour} className="contents group">
                <div className="p-3 text-sm font-bold text-gray-500 bg-gray-50/50 border-r border-b flex flex-col items-end justify-start gap-1 pr-4 group-hover:bg-gray-100 transition-colors">
                  <span className="text-gray-900">{hour.toString().padStart(2, '0')}:00</span>
                  <span className="text-[10px] text-gray-400 font-medium">{(hour + 1).toString().padStart(2, '0')}:00</span>
                </div>
                {weekDays.map(day => {
                  const slots = getInterviewsForSlot(day, hour)
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={`p-2 border-r border-b last:border-r-0 hover:bg-gray-50/50 transition-colors flex flex-col gap-2 min-h-[120px] ${isToday(day) ? 'bg-red-50/20' : ''}`}
                    >
                      {slots.map(interview => (
                        <div
                          key={interview.id}
                          className={`group/card p-3 rounded-xl text-xs cursor-pointer border-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${getResultColor(interview)}`}
                        >
                          <div className="font-bold text-sm truncate mb-1">{interview.candidate.fullName}</div>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-80">
                            <Icon name="clock" size={12} />
                            {format(parseISO(interview.scheduledAt), 'HH:mm')}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-80 mt-1 truncate">
                            <Icon name="user" size={12} />
                            {typeof interview.interviewer === 'object' && 'fullName' in interview.interviewer ? interview.interviewer.fullName : 'N/A'}
                          </div>
                          <div className="mt-2 pt-2 border-t border-current border-opacity-10 flex justify-between items-center">
                            <span className="font-bold uppercase tracking-tighter text-[10px]">{getResultLabel(interview)}</span>
                            <Icon name="chevron-right" size={12} className="opacity-0 group-hover/card:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}