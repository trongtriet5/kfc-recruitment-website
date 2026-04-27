'use client'

import { useState, useEffect, useRef } from 'react'
import { format, addDays, startOfWeek, isSameDay, isToday, parseISO, setHours, setMinutes } from 'date-fns'
import { vi } from 'date-fns/locale'
import api from '@/lib/api'
import { toast } from 'sonner'
import Icon from '@/components/icons/Icon'
import Modal from '@/components/common/Modal'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Interview {
  id: string
  candidateId: string
  candidate: {
    id: string
    fullName: string
    avatar?: string
    phone?: string
    email?: string
  }
  position: {
    id: string
    name: string
  }
  store: {
    id: string
    name: string
  }
  interviewer: {
    id: string
    fullName: string
  } | null
  type: 'ONLINE' | 'OFFLINE' | 'INITIAL' | 'FINAL'
  status: 'SCHEDULED' | 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED'
  date: string
  startTime: string
  endTime: string
  notes?: string
  meetingLink?: string
  location?: string
}

interface InterviewCalendarProps {
  reloadTrigger?: number
}

const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => i + 8)
const DAYS_TO_SHOW = 7

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-slate-200 text-slate-800 border-slate-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
}

const TYPE_COLORS: Record<string, string> = {
  ONLINE: 'bg-purple-100 text-purple-800',
  OFFLINE: 'bg-orange-100 text-orange-800',
  INITIAL: 'bg-cyan-100 text-cyan-800',
  FINAL: 'bg-pink-100 text-pink-800',
}

export default function InterviewCalendar({ reloadTrigger }: InterviewCalendarProps) {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; interview: Interview } | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    interviewer: '',
    position: '',
    store: '',
    status: '',
    type: '',
  })

  const [stores, setStores] = useState<{id: string, name: string}[]>([])
  const [positions, setPositions] = useState<{id: string, name: string}[]>([])
  const [users, setUsers] = useState<{id: string, fullName: string}[]>([])

  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [currentWeekStart, reloadTrigger])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [interviewsRes, storesRes, positionsRes, usersRes] = await Promise.all([
        api.get('/recruitment/interviews'),
        api.get('/stores'),
        api.get('/recruitment/positions'),
        api.get('/recruitment/users/tas'),
      ])
      setInterviews(interviewsRes.data || [])
      setStores(storesRes.data || [])
      setPositions(positionsRes.data || [])
      setUsers(usersRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getInterviewsForSlot = (date: Date, hour: number) => {
    return interviews.filter(interview => {
      const interviewDate = parseISO(interview.date)
      const interviewHour = parseInt(interview.startTime.split(':')[0])
      return isSameDay(interviewDate, date) && interviewHour === hour
    })
  }

  const weekDays = Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(currentWeekStart, i))

  const handlePrevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7))
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7))
  const handleToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const handleContextMenu = (e: React.MouseEvent, interview: Interview) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, interview })
  }

  const handleViewDetail = (interview: Interview) => {
    setSelectedInterview(interview)
    setShowDetailModal(true)
    setContextMenu(null)
  }

  const handleCancelInterview = async () => {
    if (!selectedInterview) return
    setCancelLoading(true)
    try {
      await api.patch(`/recruitment/interviews/${selectedInterview.id}`, { status: 'CANCELLED' })
      toast.success('Hủy lịch phỏng vấn thành công')
      loadData()
      setConfirmCancel(false)
      setShowDetailModal(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setCancelLoading(false)
    }
  }

  const filteredInterviews = interviews.filter(interview => {
    if (filters.search && !interview.candidate.fullName.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.interviewer && interview.interviewer?.id !== filters.interviewer) return false
    if (filters.position && interview.position.id !== filters.position) return false
    if (filters.store && interview.store.id !== filters.store) return false
    if (filters.status && interview.status !== filters.status) return false
    if (filters.type && interview.type !== filters.type) return false
    return true
  })

  const getInterviewsForSlotFiltered = (date: Date, hour: number) => {
    return filteredInterviews.filter(interview => {
      const interviewDate = parseISO(interview.date)
      const interviewHour = parseInt(interview.startTime.split(':')[0])
      return isSameDay(interviewDate, date) && interviewHour === hour
    })
  }

  return (
    <div className="pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch phỏng vấn</h1>
          <p className="text-gray-600 mt-1">Quản lý lịch phỏng vấn tuyển dụng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            <Icon name="chevron-left" size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>Hôm nay</Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <Icon name="chevron-right" size={16} />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg shadow-sm border">
        <Input
          placeholder="Tìm ứng viên..."
          value={filters.search}
          onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="w-48"
        />
        <Select value={filters.interviewer} onValueChange={v => setFilters(prev => ({ ...prev, interviewer: v }))}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Người phỏng vấn" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.position} onValueChange={v => setFilters(prev => ({ ...prev, position: v }))}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Vị trí" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            {positions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.store} onValueChange={v => setFilters(prev => ({ ...prev, store: v }))}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Cửa hàng" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={v => setFilters(prev => ({ ...prev, status: v }))}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.type} onValueChange={v => setFilters(prev => ({ ...prev, type: v }))}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Loại phỏng vấn" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="ONLINE">Online</SelectItem>
            <SelectItem value="OFFLINE">Offline</SelectItem>
            <SelectItem value="INITIAL">Initial</SelectItem>
            <SelectItem value="FINAL">Final</SelectItem>
          </SelectContent>
        </Select>
        {(filters.search || filters.interviewer || filters.position || filters.store || filters.status || filters.type) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ search: '', interviewer: '', position: '', store: '', status: '', type: '' })}>
            Xóa lọc
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" ref={calendarRef}>
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 text-sm font-medium text-gray-500 bg-gray-50 sticky left-0 z-10" />
          {weekDays.map(day => (
            <div key={day.toISOString()} className={`p-3 text-center border-l ${isToday(day) ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="text-xs font-medium text-gray-500 uppercase">{format(day, 'EEE', { locale: vi })}</div>
              <div className={`text-lg font-semibold ${isToday(day) ? 'text-green-600' : 'text-gray-900'}`}>{format(day, 'd')}</div>
            </div>
          ))}
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {TIME_SLOTS.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b min-h-[100px]">
              <div className="p-2 text-xs text-gray-500 bg-gray-50 sticky left-0 border-r text-right pr-2">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map(day => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className={`p-1 border-l hover:bg-gray-50 transition-colors ${isToday(day) ? 'bg-green-50/30' : ''}`}
                >
                  {getInterviewsForSlotFiltered(day, hour).map(interview => (
                    <div
                      key={interview.id}
                      onClick={() => handleViewDetail(interview)}
                      onContextMenu={e => handleContextMenu(e, interview)}
                      className={`p-2 rounded-lg text-xs cursor-pointer hover:opacity-80 transition-opacity mb-1 border ${STATUS_COLORS[interview.status]}`}
                    >
                      <div className="font-medium truncate">{interview.candidate.fullName}</div>
                      <div className="truncate text-gray-600">{interview.startTime} - {interview.endTime}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className={`text-[10px] px-1 ${TYPE_COLORS[interview.type]}`}>
                          {interview.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {contextMenu && (
        <div className="fixed bg-white shadow-lg rounded-md border py-1 z-50" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => handleViewDetail(contextMenu.interview)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700">
            <Icon name="eye" size={14} /> Xem chi tiết
          </button>
          <button onClick={() => { setSelectedInterview(contextMenu.interview); setConfirmCancel(true); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700">
            <Icon name="x" size={14} /> Hủy lịch
          </button>
        </div>
      )}

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết phỏng vấn" maxWidth="max-w-lg">
        {selectedInterview && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                {selectedInterview.candidate.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedInterview.candidate.fullName}</h3>
                <p className="text-sm text-gray-600">{selectedInterview.position.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Cửa hàng</label>
                <p className="text-sm font-medium">{selectedInterview.store.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Người phỏng vấn</label>
                <p className="text-sm font-medium">{selectedInterview.interviewer?.fullName || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Ngày</label>
                <p className="text-sm font-medium">{format(parseISO(selectedInterview.date), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Giờ</label>
                <p className="text-sm font-medium">{selectedInterview.startTime} - {selectedInterview.endTime}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Loại phỏng vấn</label>
                <p className="text-sm font-medium">{selectedInterview.type}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Trạng thái</label>
                <Badge className={`${STATUS_COLORS[selectedInterview.status]}`}>
                  {selectedInterview.status}
                </Badge>
              </div>
            </div>

            {selectedInterview.notes && (
              <div>
                <label className="text-xs text-gray-500">Ghi chú</label>
                <p className="text-sm">{selectedInterview.notes}</p>
              </div>
            )}

            {selectedInterview.meetingLink && (
              <div>
                <label className="text-xs text-gray-500">Link meeting</label>
                <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  {selectedInterview.meetingLink}
                </a>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Đóng</Button>
              {selectedInterview.status !== 'CANCELLED' && selectedInterview.status !== 'COMPLETED' && (
                <Button variant="destructive" onClick={() => setConfirmCancel(true)}>Hủy lịch</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmCancel}
        title="Hủy lịch phỏng vấn"
        message={`Bạn có chắc muốn hủy lịch phỏng vấn của "${selectedInterview?.candidate.fullName}"?`}
        confirmText="Hủy lịch"
        destructive
        isLoading={cancelLoading}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancelInterview}
      />
    </div>
  )
}