'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import CandidateContextMenu from './CandidateContextMenu'

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string
  status: string | { id: string; name: string; code: string } | null
  position: string | null
  brand: string | null
  store: { name: string } | null
  createdAt: string
}

interface User {
  role: string
}

const STATUS_GROUPS = {
  application: {
    label: 'Ứng tuyển',
    statuses: [
      { value: 'CV_FILTERING', label: 'Lọc CV' },
      { value: 'CV_PASSED', label: 'Ứng viên đạt' },
      { value: 'CV_FAILED', label: 'Ứng viên loại' },
      { value: 'BLACKLIST', label: 'Blacklist' },
      { value: 'CANNOT_CONTACT', label: 'Không liên hệ được' },
      { value: 'AREA_NOT_RECRUITING', label: 'Khu vực chưa tuyển dụng' },
    ],
  },
  interview: {
    label: 'Phỏng vấn',
    statuses: [
      { value: 'WAITING_INTERVIEW', label: 'Chờ phỏng vấn' },
      { value: 'HR_INTERVIEW_PASSED', label: 'HR sơ vấn đạt' },
      { value: 'HR_INTERVIEW_FAILED', label: 'HR sơ vấn loại' },
      { value: 'SM_AM_INTERVIEW_PASSED', label: 'SM/AM PV Đạt' },
      { value: 'SM_AM_INTERVIEW_FAILED', label: 'SM/AM PV Loại' },
      { value: 'SM_AM_INTERVIEW_NO_SHOW', label: 'SM/AM PV Không đến PV' },
      { value: 'OM_PV_INTERVIEW_PASSED', label: 'OM PV Đạt' },
      { value: 'OM_PV_INTERVIEW_FAILED', label: 'OM PV Loại' },
      { value: 'OM_PV_INTERVIEW_NO_SHOW', label: 'OM PV Không đến PV' },
    ],
  },
  offer: {
    label: 'Thư mời',
    statuses: [
      { value: 'OFFER_SENT', label: 'Đã gửi offer letter' },
      { value: 'OFFER_ACCEPTED', label: 'Đồng ý offer letter' },
      { value: 'OFFER_REJECTED', label: 'Từ chối offer letter' },
    ],
  },
  onboarding: {
    label: 'Trúng tuyển',
    statuses: [
      { value: 'WAITING_ONBOARDING', label: 'Chờ nhận việc' },
      { value: 'ONBOARDING_ACCEPTED', label: 'Đồng ý nhận việc' },
      { value: 'ONBOARDING_REJECTED', label: 'Từ chối nhận việc' },
    ],
  },
}

interface CandidatesKanbanProps {
  candidates?: Candidate[]
  onStatusChange?: () => void
}

export default function CandidatesKanban(props: CandidatesKanbanProps = {}) {
  const { candidates: propsCandidates, onStatusChange } = props
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    candidate: Candidate
    position: { x: number; y: number }
  } | null>(null)

  useEffect(() => {
    loadUser()
    if (propsCandidates) {
      setCandidates(propsCandidates)
      setLoading(false)
    } else {
      loadCandidates()
    }
  }, [propsCandidates])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadCandidates = () => {
    api
      .get('/recruitment/candidates')
      .then((res) => setCandidates(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const getAllowedStatuses = (): string[] => {
    if (!user) return []
    if (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT') {
      return Object.values(STATUS_GROUPS).flatMap((group) =>
        group.statuses.map((s) => s.value)
      )
    }
    if (user.role === 'MANAGER') {
      return [
        'SM_AM_INTERVIEW_PASSED',
        'SM_AM_INTERVIEW_FAILED',
        'SM_AM_INTERVIEW_NO_SHOW',
      ]
    }
    return []
  }

  const handleDragStart = (e: React.DragEvent, candidate: Candidate) => {
    setDraggedCandidate(candidate)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '') // Required for Firefox
  }

  const handleDragEnd = () => {
    setDraggedCandidate(null)
    setDragOverGroup(null)
  }

  const handleDragOver = (e: React.DragEvent, groupKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedCandidate) {
      setDragOverGroup(groupKey)
    }
  }

  const handleDragLeave = () => {
    setDragOverGroup(null)
  }

  const handleDrop = async (e: React.DragEvent, targetGroupKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverGroup(null)

    if (!draggedCandidate) return

    const targetGroup = STATUS_GROUPS[targetGroupKey as keyof typeof STATUS_GROUPS]
    if (!targetGroup || targetGroup.statuses.length === 0) return

    // Get first status of target group
    const firstStatus = targetGroup.statuses[0]
    
    // Check if user has permission
    const allowedStatuses = getAllowedStatuses()
    if (!allowedStatuses.includes(firstStatus.value)) {
      alert('Bạn không có quyền chuyển trạng thái này')
      setDraggedCandidate(null)
      return
    }

    try {
      // Fetch status ID from backend
      const statuses = await api.get('/types/by-category/CANDIDATE_STATUS')
      const targetStatus = statuses.data.find((s: any) => s.code === firstStatus.value)
      if (!targetStatus) {
        alert('Không tìm thấy trạng thái')
        setDraggedCandidate(null)
        return
      }
      await api.patch(`/recruitment/candidates/${draggedCandidate.id}`, {
        statusId: targetStatus.id,
      })
      if (propsCandidates && onStatusChange) {
        onStatusChange()
      } else {
        loadCandidates()
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setDraggedCandidate(null)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, candidate: Candidate) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      candidate,
      position: { x: e.clientX, y: e.clientY },
    })
  }

  const handleScheduleInterview = (candidate: Candidate) => {
    // Navigate to create interview page with candidate pre-filled
    window.location.href = `/dashboard/recruitment/interviews/new?candidateId=${candidate.id}`
  }

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await api.delete(`/recruitment/candidates/${candidateId}`)
      if (propsCandidates && onStatusChange) {
        onStatusChange()
      } else {
        loadCandidates()
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa ứng viên')
    }
  }

  const getStatusLabel = (status: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!status) {
      return 'Chưa có trạng thái'
    }
    if (typeof status === 'object') {
      return status.name
    }
    for (const group of Object.values(STATUS_GROUPS)) {
      const found = group.statuses.find((s) => s.value === status)
      if (found) return found.label
    }
    return status
  }

  const getStatusColor = (status: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!status) {
      return 'bg-gray-50 border-gray-200'
    }
    const statusCode = typeof status === 'object' ? status.code : status
    if (!statusCode) {
      return 'bg-gray-50 border-gray-200'
    }
    if (statusCode.includes('PASSED') || statusCode === 'OFFER_ACCEPTED' || statusCode === 'ONBOARDING_ACCEPTED') {
      return 'bg-green-50 border-green-200'
    }
    if (statusCode.includes('FAILED') || statusCode === 'OFFER_REJECTED' || statusCode === 'ONBOARDING_REJECTED') {
      return 'bg-red-50 border-red-200'
    }
    if (statusCode.includes('WAITING') || statusCode === 'OFFER_SENT') {
      return 'bg-yellow-50 border-yellow-200'
    }
    return 'bg-blue-50 border-blue-200'
  }

  const getCandidatesByGroup = (groupKey: string) => {
    const group = STATUS_GROUPS[groupKey as keyof typeof STATUS_GROUPS]
    if (!group) return []
    
    return candidates.filter((c) => {
      if (!c.status) return false
      const candidateStatusCode = typeof c.status === 'object' ? c.status.code : c.status
      return group.statuses.some((s) => s.value === candidateStatusCode)
    })
  }

  const handleCandidateClick = (e: React.MouseEvent, candidate: Candidate) => {
    // Only navigate on left click, not right click or when dragging
    if (draggedCandidate) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    e.preventDefault()
    e.stopPropagation()
    window.location.href = `/dashboard/recruitment/candidates/${candidate.id}`
  }

  const allowedStatuses = getAllowedStatuses()
  const allStatuses = Object.values(STATUS_GROUPS).flatMap((group) => group.statuses)

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div className="overflow-x-auto pb-4 relative">
      {contextMenu && (
        <CandidateContextMenu
          candidate={contextMenu.candidate}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onStatusChange={(candidate) => {
            setContextMenu(null)
          }}
          onStatusSelect={async (candidate, newStatusCode) => {
            try {
              // Fetch status ID from backend
              const statuses = await api.get('/types/by-category/CANDIDATE_STATUS')
              const targetStatus = statuses.data.find((s: any) => s.code === newStatusCode)
              if (!targetStatus) {
                alert('Không tìm thấy trạng thái')
                return
              }
              await api.patch(`/recruitment/candidates/${candidate.id}`, {
                statusId: targetStatus.id,
              })
              if (propsCandidates && onStatusChange) {
                onStatusChange()
              } else {
                loadCandidates()
              }
              setContextMenu(null)
            } catch (err: any) {
              alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
            }
          }}
          onDelete={handleDeleteCandidate}
          onScheduleInterview={handleScheduleInterview}
          allowedStatuses={allowedStatuses}
          statusOptions={allStatuses}
        />
      )}
      <div className="flex gap-4 min-w-max">
        {Object.entries(STATUS_GROUPS).map(([groupKey, group]) => {
          const groupCandidates = getCandidatesByGroup(groupKey)
          return (
            <div key={groupKey} className="flex-shrink-0 w-80">
              <div className="bg-gray-100 rounded-lg p-4 mb-2">
                <h3 className="font-semibold text-gray-900">{group.label}</h3>
                <p className="text-sm text-gray-500">
                  {groupCandidates.length} ứng viên
                </p>
              </div>
              <div
                className={`
                  bg-white rounded-lg border-2 min-h-[400px] p-3 transition-all
                  ${dragOverGroup === groupKey
                    ? 'border-yellow-500 bg-yellow-50 border-solid'
                    : 'border-gray-300'
                  }
                `}
                onDragOver={(e) => handleDragOver(e, groupKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, groupKey)}
              >
                <div className="space-y-2">
                  {groupCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable={allowedStatuses.length > 0}
                      onDragStart={(e) => handleDragStart(e, candidate)}
                      onDragEnd={handleDragEnd}
                      onContextMenu={(e) => handleContextMenu(e, candidate)}
                      onClick={(e) => handleCandidateClick(e, candidate)}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all
                        ${getStatusColor(candidate.status)}
                        hover:shadow-md
                        ${draggedCandidate?.id === candidate.id ? 'opacity-50' : ''}
                        ${allowedStatuses.length > 0 ? 'cursor-move' : ''}
                      `}
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {candidate.fullName}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {candidate.phone}
                      </div>
                      {candidate.email && (
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {candidate.email}
                        </div>
                      )}
                      {candidate.position && (
                        <div className="text-xs text-gray-500 mt-1">
                          Vị trí: {candidate.position}
                        </div>
                      )}
                      {candidate.store && (
                        <div className="text-xs text-gray-500 mt-1">
                          {candidate.store.name}
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          {new Date(candidate.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {getStatusLabel(candidate.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {groupCandidates.length === 0 && (
                    <div className="text-sm text-gray-400 text-center py-8">
                      Không có ứng viên
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

