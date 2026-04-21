'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import CandidateContextMenu from './CandidateContextMenu'
import Icon from '@/components/icons/Icon'

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string
  status: string | { id: string; name: string; code: string } | null
  position: string | null
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
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  onTransferCampaign?: (candidate: any) => void
}

export default function CandidatesKanban(props: CandidatesKanbanProps = {}) {
  const { 
    candidates: propsCandidates, 
    onStatusChange,
    page: propsPage,
    limit: propsLimit,
    total: propsTotal,
    totalPages: propsTotalPages,
    onPageChange,
    onLimitChange,
    onTransferCampaign,
  } = props
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    candidate: Candidate
    position: { x: number; y: number }
  } | null>(null)
  
  // Local pagination state for standalone usage
  const [localPage, setLocalPage] = useState(1)
  const [localLimit, setLocalLimit] = useState(10)
  const [localPagination, setLocalPagination] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 0 })

  // Use props pagination if provided, otherwise use local state
  const page = propsPage !== undefined ? propsPage : localPage
  const limit = propsLimit !== undefined ? propsLimit : localLimit
  const total = propsTotal !== undefined ? propsTotal : localPagination.total
  const totalPages = propsTotalPages !== undefined ? propsTotalPages : localPagination.totalPages
  const handlePageChange = onPageChange || setLocalPage
  const handleLimitChange = onLimitChange || ((newLimit: number) => {
    setLocalLimit(newLimit)
    setLocalPage(1)
  })

  useEffect(() => {
    loadUser()
    if (propsCandidates) {
      setCandidates(propsCandidates)
      setLoading(false)
    } else {
      loadCandidates()
    }
  }, [propsCandidates])

  useEffect(() => {
    if (!propsCandidates) {
      loadCandidates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadCandidates = () => {
    setLoading(true)
    const params: any = { page, limit }
    
    api
      .get('/recruitment/candidates', { params })
      .then((res) => {
        // Handle both old format (array) and new format (paginated)
        if (Array.isArray(res.data)) {
          setCandidates(res.data)
          setLocalPagination({ total: res.data.length, totalPages: 1 })
        } else {
          setCandidates(res.data.data || [])
          setLocalPagination({
            total: res.data.total || 0,
            totalPages: res.data.totalPages || 0,
          })
        }
      })
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
      return 'bg-emerald-50 border-emerald-200'
    }
    if (statusCode.includes('FAILED') || statusCode === 'OFFER_REJECTED' || statusCode === 'ONBOARDING_REJECTED') {
      return 'bg-red-50 border-red-200'
    }
    if (statusCode.includes('WAITING') || statusCode === 'OFFER_SENT') {
      return 'bg-amber-50 border-amber-200'
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
    <div className="relative">
      {/* Pagination controls */}
      <div className="mb-4 px-6 py-3 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Hiển thị:</span>
          <select
            value={limit}
            onChange={(e) => {
              handleLimitChange(Number(e.target.value))
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white text-gray-700"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-gray-500">
            / Tổng: <span className="font-semibold text-gray-700">{total}</span> ứng viên
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-700 bg-white"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600 px-2">
            Trang <span className="font-semibold text-gray-900">{page}</span> / {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-700 bg-white"
          >
            Sau
          </button>
        </div>
      </div>
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
          onTransferCampaign={onTransferCampaign}
          allowedStatuses={allowedStatuses}
          statusOptions={allStatuses}
        />
      )}
      <div className="flex gap-4 min-w-max">
        {Object.entries(STATUS_GROUPS).map(([groupKey, group]) => {
          const groupCandidates = getCandidatesByGroup(groupKey)
          return (
            <div key={groupKey} className="flex-shrink-0 w-80">
              <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
                <h3 className="font-semibold text-gray-900 text-sm">{group.label}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {groupCandidates.length} ứng viên
                </p>
              </div>
              <div
                className={`
                  bg-white rounded-lg border min-h-[400px] p-3 transition-all shadow-sm
                  ${dragOverGroup === groupKey
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200'
                  }
                `}
                onDragOver={(e) => handleDragOver(e, groupKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, groupKey)}
              >
                <div className="space-y-2.5">
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
                        hover:shadow-md hover:border-gray-300
                        ${draggedCandidate?.id === candidate.id ? 'opacity-50' : ''}
                        ${allowedStatuses.length > 0 ? 'cursor-move' : ''}
                      `}
                    >
                      <div className="font-semibold text-sm text-gray-900 mb-2">
                        {candidate.fullName}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Icon name="phone" size={12} className="text-gray-400" />
                          {candidate.phone}
                        </div>
                        {candidate.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                            <Icon name="mail" size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{candidate.email}</span>
                          </div>
                        )}
                        {candidate.position && (
                          <div className="text-xs text-gray-500 mt-1.5">
                            <span className="font-medium">Vị trí:</span> {candidate.position}
                          </div>
                        )}
                        {candidate.store && (
                          <div className="text-xs text-gray-500">
                            {candidate.store.name}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          {new Date(candidate.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                          {getStatusLabel(candidate.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {groupCandidates.length === 0 && (
                    <div className="text-sm text-gray-400 text-center py-12">
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
    </div>
  )
}

