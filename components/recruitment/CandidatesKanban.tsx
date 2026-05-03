'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import CandidateContextMenu from './CandidateContextMenu'
import Icon from '@/components/icons/Icon'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCandidateStatuses } from '@/lib/useCandidateStatuses'

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string
  status: string | { id: string; name: string; code: string } | null
  position: string | null
  store: { name: string } | null
  campaign: { name: string } | null
  createdAt: string
}

interface User {
  role: string
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
  onAssignPIC?: (candidate: any) => void
  onViewDetail?: (candidateId: string) => void
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
    onAssignPIC,
    onViewDetail,
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

  const { dbStatuses, dynamicGroups, loading: dbLoading } = useCandidateStatuses()

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
    if (user.role === 'ADMIN' || user.role === 'RECRUITER') {
      return dbStatuses.map((s) => s.code)
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

    const targetGroup = dynamicGroups[targetGroupKey]
    if (!targetGroup || targetGroup.statuses.length === 0) return

    // Get first status of target group
    const firstStatus = targetGroup.statuses[0]

    // Check if user has permission
    const allowedStatuses = getAllowedStatuses()
    if (!allowedStatuses.includes(firstStatus.value)) {
      toast.error('Bạn không có quyền chuyển trạng thái này')
      setDraggedCandidate(null)
      return
    }

    try {
      // Fetch status ID from backend not needed, we have targetStatus code
      const targetStatus = dbStatuses.find((s: any) => s.code === firstStatus.value)
      if (!targetStatus) {
        toast.error('Không tìm thấy trạng thái')
        setDraggedCandidate(null)
        return
      }
      await api.patch(`/recruitment/candidates/${draggedCandidate.id}`, {
        status: targetStatus.code,
      })
      if (propsCandidates && onStatusChange) {
        onStatusChange()
      } else {
        loadCandidates()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
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
    window.location.href = `/recruitment/interviews/new?candidateId=${candidate.id}`
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
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa ứng viên')
    }
  }

  const getStatusLabel = (status: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!status) return 'Chưa có trạng thái'
    if (typeof status === 'object' && status.name) {
      return status.name
    }
    const statusCode = typeof status === 'string' ? status : (status as any)?.code
    if (!statusCode) return 'Chưa có trạng thái'

    for (const group of Object.values(dynamicGroups)) {
      const found = group.statuses.find((s) => s.value === statusCode)
      if (found) return found.label
    }
    return statusCode
  }

  const getStatusColor = (status: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!status) return 'bg-gray-50 border-gray-200'
    const statusCode = typeof status === 'object' ? status.code : status
    if (!statusCode) return 'bg-gray-50 border-gray-200'

    if (statusCode === 'CV_FILTERING') {
      return 'bg-sky-50 border-sky-200 shadow-sm'
    }
    if (statusCode === 'HR_INTERVIEW_PASSED' || statusCode === 'SM_AM_INTERVIEW_PASSED' || statusCode === 'OM_PV_INTERVIEW_PASSED') {
      return 'bg-emerald-50 border-emerald-200 shadow-sm'
    }
    if (statusCode === 'HR_INTERVIEW_FAILED' || statusCode === 'SM_AM_INTERVIEW_FAILED' || statusCode === 'OM_PV_INTERVIEW_FAILED' || statusCode === 'BLACKLIST') {
      return 'bg-rose-50 border-rose-200 shadow-sm'
    }
    if (statusCode === 'WAITING_INTERVIEW' || statusCode === 'WAITING_ONBOARDING' || statusCode === 'OFFER_SENT') {
      return 'bg-amber-50 border-amber-200 shadow-sm'
    }
    if (statusCode === 'OFFER_ACCEPTED' || statusCode === 'ONBOARDING_ACCEPTED') {
      return 'bg-green-50 border-green-200 shadow-sm font-semibold'
    }
    if (statusCode === 'CANNOT_CONTACT' || statusCode === 'AREA_NOT_RECRUITING') {
      return 'bg-slate-50 border-slate-200 shadow-sm'
    }
    return 'bg-white border-gray-200 shadow-sm'
  }

  const getCandidatesByGroup = (groupKey: string) => {
    const group = dynamicGroups[groupKey]
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
    if (onViewDetail) {
      onViewDetail(candidate.id)
    } else {
      window.location.href = `/recruitment/candidates/${candidate.id}`
    }
  }

  const allowedStatuses = getAllowedStatuses()
  const allStatuses = dbStatuses.map((s) => ({ value: s.code, label: s.name }))

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div className="relative">
      {/* Pagination controls */}
      <div className="mb-4 px-6 py-3 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Hiển thị:</span>
          <Select value={String(limit)} onValueChange={(v) => handleLimitChange(Number(v))}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-gray-500">
            / Tổng: <span className="font-semibold text-gray-700">{total}</span> ứng viên
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            Trước
          </Button>
          <span className="text-sm text-gray-600 px-2">
            Trang <span className="font-semibold text-gray-900">{page}</span> / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Sau
          </Button>
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
                  toast.error('Không tìm thấy trạng thái')
                  return
                }
                await api.patch(`/recruitment/candidates/${candidate.id}`, {
                  status: targetStatus.code,
                })
                if (propsCandidates && onStatusChange) {
                  onStatusChange()
                } else {
                  loadCandidates()
                }
                setContextMenu(null)
              } catch (err: any) {
                toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
              }
            }}
            onDelete={handleDeleteCandidate}
            onScheduleInterview={handleScheduleInterview}
            onTransferCampaign={onTransferCampaign}
            onAssignPIC={onAssignPIC}
            allowedStatuses={allowedStatuses}
            statusOptions={allStatuses}
          />
        )}
        <div className="flex gap-4 min-w-max">
          {Object.entries(dynamicGroups).map(([groupKey, group]) => {
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
                          {candidate.store && typeof candidate.store === 'object' && candidate.store !== null && 'name' in candidate.store && (
                            <div className="text-xs text-gray-500">
                              {(candidate.store as { name: string }).name}
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
                        <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          <Icon name="campaign" size={10} />
                          <span className="truncate">
                            {typeof candidate.campaign === 'object' && candidate.campaign !== null && 'name' in candidate.campaign ? (candidate.campaign as { name: string }).name.replace(/^Chiến dịch\s*[-–]?\s*|\s*[-–]?\s*Chiến dịch\s*$/gi, '').trim() : 'Chưa có chiến dịch'}
                          </span>
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

