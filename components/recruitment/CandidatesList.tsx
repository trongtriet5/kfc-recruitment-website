'use client'

import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import CandidateContextMenu from './CandidateContextMenu'
import CandidatesKanban from './CandidatesKanban'
import { useClickOutside } from '@/hooks/useClickOutside'
import Icon from '@/components/icons/Icon'
import { getBrandLabel } from '@/lib/brand-utils'

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

export default function CandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    candidate: Candidate
    position: { x: number; y: number }
  } | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const statusUpdateFormRef = useRef<HTMLDivElement>(null)

  useClickOutside(statusUpdateFormRef, () => {
    if (selectedCandidate) {
      setSelectedCandidate(null)
      setNewStatus('')
    }
  }, !!selectedCandidate)

  useEffect(() => {
    loadUser()
    loadCandidates()
  }, [statusFilter])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadCandidates = () => {
    const url = statusFilter
      ? `/recruitment/candidates?statusId=${statusFilter}`
      : '/recruitment/candidates'
    api
      .get(url)
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

  const handleStatusChange = async () => {
    if (!selectedCandidate || !newStatus) return

    try {
      await api.patch(`/recruitment/candidates/${selectedCandidate.id}`, {
        statusId: newStatus,
      })
      setSelectedCandidate(null)
      setNewStatus('')
      loadCandidates()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    }
  }

  const handleContextMenu = (e: React.MouseEvent, candidate: Candidate) => {
    e.preventDefault()
    setContextMenu({
      candidate,
      position: { x: e.clientX, y: e.clientY },
    })
  }

  const handleScheduleInterview = (candidate: Candidate) => {
    window.location.href = `/dashboard/recruitment/interviews/new?candidateId=${candidate.id}`
  }

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await api.delete(`/recruitment/candidates/${candidateId}`)
      loadCandidates()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa ứng viên')
    }
  }

  const getStatusLabel = (status: string | null | undefined | { id: string; name: string; code: string }) => {
    if (!status) {
      return 'Chưa có trạng thái'
    }
    if (typeof status === 'object') {
      return status.name
    }
    
    // Try to find in STATUS_GROUPS
    for (const group of Object.values(STATUS_GROUPS)) {
      if ('statuses' in group) {
        const found = group.statuses.find((s) => s.value === status)
        if (found) return found.label
      }
    }
    return status
  }

  const getStatusColor = (status: string | null | undefined | { id: string; name: string; code: string }) => {
    if (!status) {
      return 'bg-gray-100 text-gray-800'
    }
    const statusCode = typeof status === 'object' ? status.code : status
    if (!statusCode) {
      return 'bg-gray-100 text-gray-800'
    }
    if (statusCode.includes('PASSED') || statusCode === 'OFFER_ACCEPTED' || statusCode === 'ONBOARDING_ACCEPTED') {
      return 'bg-green-100 text-green-800'
    }
    if (statusCode.includes('FAILED') || statusCode === 'OFFER_REJECTED' || statusCode === 'ONBOARDING_REJECTED') {
      return 'bg-red-100 text-red-800'
    }
    if (statusCode.includes('WAITING') || statusCode === 'OFFER_SENT') {
      return 'bg-yellow-100 text-yellow-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
        <p className="mt-4 text-gray-600">Đang tải danh sách ứng viên...</p>
      </div>
    )
  }

  const allowedStatuses = getAllowedStatuses()
  const allStatuses = Object.values(STATUS_GROUPS).flatMap((group) => group.statuses)

  return (
    <div className="relative">
      {contextMenu && (
        <CandidateContextMenu
          candidate={contextMenu.candidate}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onStatusChange={(candidate) => {
            setSelectedCandidate(candidate)
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
              loadCandidates()
              setContextMenu(null)
              // Show success feedback
              const statusName = targetStatus.name || newStatusCode
              console.log(`✅ Đã cập nhật trạng thái thành: ${statusName}`)
            } catch (err: any) {
              const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái'
              alert(errorMsg)
              console.error('Error updating status:', err)
            }
          }}
          onDelete={handleDeleteCandidate}
          onScheduleInterview={handleScheduleInterview}
          allowedStatuses={allowedStatuses}
          statusOptions={allStatuses}
        />
      )}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Danh sách ứng viên</h2>
        <div className="flex gap-2">
          <Link
            href="/dashboard/recruitment/candidates/new"
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
          >
            ➕ Thêm ứng viên
          </Link>
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'list'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon name="list" size={16} />
              Danh sách
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 text-sm border-l border-gray-300 ${
                viewMode === 'kanban'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon name="dashboard" size={16} />
              Kanban
            </button>
          </div>
          {viewMode === 'list' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="">🔍 Tất cả trạng thái</option>
              {Object.entries(STATUS_GROUPS).map(([key, group]) => {
                if ('statuses' in group) {
                  return (
                    <optgroup key={key} label={group.label}>
                      {group.statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </optgroup>
                  )
                }
                return null
              })}
            </select>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          {selectedCandidate && (
            <div ref={statusUpdateFormRef} className="mb-4 bg-white shadow rounded-lg p-4">
              <h3 className="font-medium mb-2">Cập nhật trạng thái: {selectedCandidate.fullName}</h3>
              <div className="flex gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Chọn trạng thái mới</option>
                  {allowedStatuses.map((status) => {
                    const statusInfo = allStatuses.find((s) => s.value === status)
                    return (
                      <option key={status} value={status}>
                        {statusInfo?.label || status}
                      </option>
                    )
                  })}
                </select>
                <button
                  onClick={handleStatusChange}
                  disabled={!newStatus}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  Cập nhật
                </button>
                <button
                  onClick={() => {
                    setSelectedCandidate(null)
                    setNewStatus('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {candidates.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  Tổng cộng: <span className="font-semibold text-gray-900">{candidates.length}</span> ứng viên
                </p>
              </div>
            )}
            <ul className="divide-y divide-gray-200">
              {candidates.length === 0 ? (
                <li className="px-4 py-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Icon name="list" size={48} />
                  </div>
                  <p className="text-gray-500 font-medium">Chưa có ứng viên nào</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {statusFilter ? 'Thử thay đổi bộ lọc trạng thái' : 'Bắt đầu bằng cách thêm ứng viên mới'}
                  </p>
                  {!statusFilter && (
                    <Link
                      href="/dashboard/recruitment/candidates/new"
                      className="mt-4 inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                    >
                      ➕ Thêm ứng viên đầu tiên
                    </Link>
                  )}
                </li>
              ) : (
            candidates.map((candidate) => (
              <li
                key={candidate.id}
                onContextMenu={(e) => handleContextMenu(e, candidate)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/recruitment/candidates/${candidate.id}`}
                        className="text-sm font-medium text-yellow-600 hover:text-yellow-700 hover:underline"
                      >
                        {candidate.fullName}
                      </Link>
                      <div className="mt-1.5 text-sm text-gray-500 space-y-0.5">
                        {candidate.email && (
                          <div className="truncate" title={candidate.email}>
                            📧 {candidate.email}
                          </div>
                        )}
                        <div className="truncate flex items-center gap-1" title={candidate.phone}>
                          <Icon name="clock" size={14} className="text-gray-400" />
                          {candidate.phone}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {candidate.position && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                              <Icon name="briefcase" size={12} />
                              {candidate.position}
                            </span>
                          )}
                          {candidate.store && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1">
                              <Icon name="store" size={12} />
                              {candidate.store.name}
                            </span>
                          )}
                          {candidate.brand && (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                              <Icon name="tag" size={12} />
                              {getBrandLabel(candidate.brand)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          candidate.status
                        )}`}
                      >
                        {getStatusLabel(candidate.status)}
                      </span>
                      {allowedStatuses.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCandidate(candidate)
                          }}
                          className="text-sm text-yellow-600 hover:text-yellow-700 hover:underline px-2 py-1 rounded hover:bg-yellow-50"
                          title="Đổi trạng thái"
                        >
                          🔄
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))
              )}
            </ul>
          </div>
        </>
      )}

      {viewMode === 'kanban' && (
        <CandidatesKanban candidates={candidates} onStatusChange={loadCandidates} />
      )}
    </div>
  )
}
