'use client'

import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import toast from 'react-hot-toast'
import CandidateContextMenu from './CandidateContextMenu'
import CandidatesKanban from './CandidatesKanban'
import { useClickOutside } from '@/hooks/useClickOutside'
import Icon from '@/components/icons/Icon'
import { useCandidateStatuses } from '@/lib/useCandidateStatuses'
import Modal from '@/components/common/Modal'
import CreateCandidateForm from './CreateCandidateForm'
import EditCandidateForm from './EditCandidateForm'
import CreateInterviewForm from './CreateInterviewForm'
import CandidateDetail from './CandidateDetail'

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string
  status: string | { id: string; name: string; code: string } | null
  position: string | null
  store: { name: string } | null
  campaign: { name: string } | null
  pic?: { id: string; fullName: string; email: string } | null
  createdAt: string
}

interface User {
  role: string
}


export default function CandidatesList() {
  const { dbStatuses, dynamicGroups } = useCandidateStatuses()
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
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewCandidateId, setViewCandidateId] = useState<string | null>(null)
  const [editCandidateId, setEditCandidateId] = useState<string | null>(null)
  const [interviewCandidateId, setInterviewCandidateId] = useState<string | null>(null)
  const statusUpdateFormRef = useRef<HTMLDivElement>(null)

  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    candidate: Candidate | null;
    campaigns: any[];
    selectedCampaignId: string;
    loading: boolean;
  }>({ isOpen: false, candidate: null, campaigns: [], selectedCampaignId: '', loading: false });

  useClickOutside(statusUpdateFormRef, () => {
    if (selectedCandidate) {
      setSelectedCandidate(null)
      setNewStatus('')
    }
  }, !!selectedCandidate)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    setPage(1) // Reset to page 1 when filter changes
  }, [statusFilter])

  useEffect(() => {
    loadCandidates()
  }, [statusFilter, page, limit, viewMode])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadCandidates = () => {
    setLoading(true)
    const params: any = { page, limit }
    if (statusFilter) {
      params.statusId = statusFilter
    }
    
    api
      .get('/recruitment/candidates', { params })
      .then((res) => {
        // Handle both old format (array) and new format (paginated)
        if (Array.isArray(res.data)) {
          setCandidates(res.data)
          setPagination({ total: res.data.length, totalPages: 1 })
        } else {
          setCandidates(res.data.data || [])
          setPagination({
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

  const handleStatusChange = async () => {
    if (!selectedCandidate || !newStatus) return

    try {
      await api.patch(`/recruitment/candidates/${selectedCandidate.id}`, {
        status: newStatus,
      })
      setSelectedCandidate(null)
      setNewStatus('')
      toast.success('Cập nhật trạng thái thành công')
      loadCandidates()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    }
  }

  const handleContextMenu = (e: React.MouseEvent, candidate: Candidate) => {
    e.preventDefault()
    setContextMenu({
      candidate,
      position: { x: e.clientX, y: e.clientY },
    })
  }

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await api.delete(`/recruitment/candidates/${candidateId}`)
      toast.success('Xóa ứng viên thành công')
      loadCandidates()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa ứng viên')
    }
  }

  const loadCampaignsForTransfer = async (candidate: Candidate) => {
    try {
      setTransferModal((prev) => ({ ...prev, isOpen: true, candidate, loading: true }));
      const res = await api.get('/recruitment/campaigns');
      setTransferModal({
        isOpen: true,
        candidate,
        campaigns: res.data.filter((c: any) => c.isActive),
        selectedCampaignId: '',
        loading: false,
      });
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách chiến dịch');
      setTransferModal((prev) => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  const submitTransferCampaign = async () => {
    if (!transferModal.candidate || !transferModal.selectedCampaignId) return;
    setTransferModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.patch(`/recruitment/candidates/${transferModal.candidate.id}/transfer-campaign`, {
        campaignId: transferModal.selectedCampaignId
      });
      toast.success('Chuyển chiến dịch thành công');
      setTransferModal({ isOpen: false, candidate: null, campaigns: [], selectedCampaignId: '', loading: false });
      loadCandidates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
      setTransferModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const getStatusLabel = (status: unknown) => {
    if (!status || typeof status !== 'string' && typeof status !== 'object') return 'Chưa có trạng thái'
    
    // If it's an object from the new relational backend
    if (typeof status === 'object' && status !== null && 'name' in status) {
      return String((status as { name: string }).name || '')
    }

    const statusCode = typeof status === 'string' ? status : (status as any)?.code
    if (!statusCode) return 'Chưa có trạng thái'

    const dbObj = dbStatuses.find((s) => s.code === String(statusCode))
    if (dbObj) return String(dbObj.name || '')
    return String(statusCode || '')
  }

  const getStatusColor = (status: unknown) => {
    if (!status || typeof status !== 'string' && typeof status !== 'object') {
      return 'bg-gray-100 text-gray-700'
    }
    const statusCode = typeof status === 'string' ? String(status) : (status as any)?.code ? String((status as any).code) : ''
    if (!statusCode) {
      return 'bg-gray-100 text-gray-700'
    }
    if (statusCode === 'CV_FILTERING') {
      return 'bg-sky-50 text-sky-700 border border-sky-200'
    }
    if (statusCode === 'CV_PASSED' || statusCode === 'HR_INTERVIEW_PASSED' || statusCode === 'SM_AM_INTERVIEW_PASSED' || statusCode === 'OM_PV_INTERVIEW_PASSED') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    }
    if (statusCode === 'CV_FAILED' || statusCode === 'HR_INTERVIEW_FAILED' || statusCode === 'SM_AM_INTERVIEW_FAILED' || statusCode === 'OM_PV_INTERVIEW_FAILED' || statusCode === 'BLACKLIST') {
      return 'bg-rose-50 text-rose-700 border border-rose-200'
    }
    if (statusCode === 'WAITING_INTERVIEW' || statusCode === 'WAITING_ONBOARDING' || statusCode === 'OFFER_SENT') {
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    }
    if (statusCode === 'OFFER_ACCEPTED' || statusCode === 'ONBOARDING_ACCEPTED') {
      return 'bg-green-50 text-green-700 border border-green-200 font-bold'
    }
    if (statusCode === 'CANNOT_CONTACT' || statusCode === 'AREA_NOT_RECRUITING') {
      return 'bg-slate-50 text-slate-700 border border-slate-200'
    }
    return 'bg-blue-50 text-blue-700 border border-blue-200'
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
  const allStatuses = dbStatuses.map((s) => ({ value: s.code, label: s.name }))

  return (
    <div className="relative pt-6 space-y-8">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Danh sách ứng viên</h1>
        <p className="text-gray-600 mt-2">Quản lý danh sách ứng viên, kiểm tra trạng thái và xếp lịch phỏng vấn</p>
      </div>

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
                toast.error('Không tìm thấy trạng thái')
                return
              }
              await api.patch(`/recruitment/candidates/${candidate.id}`, {
                status: targetStatus.code,
              })
              toast.success(`Đã cập nhật: ${targetStatus.name}`)
              loadCandidates()
              setContextMenu(null)
            } catch (err: any) {
              const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái'
              toast.error(errorMsg)
              console.error('Error updating status:', err)
            }
          }}
          onDelete={handleDeleteCandidate}
          onScheduleInterview={(candidate) => setInterviewCandidateId(candidate.id)}
          onEdit={(candidate) => setEditCandidateId(candidate.id)}
          onTransferCampaign={loadCampaignsForTransfer}
          onViewDetail={(id) => setViewCandidateId(id)}
          allowedStatuses={allowedStatuses}
          statusOptions={allStatuses}
        />
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
          >
            <Icon name="plus" size={16} />
            Thêm ứng viên
          </button>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon name="list" size={16} />
              Danh sách
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-l border-gray-200 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon name="dashboard" size={16} />
              Kanban
            </button>
          </div>
          {viewMode === 'list' && (
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white text-gray-700 shadow-sm"
              >
                <option value="">Tất cả trạng thái</option>
              {Object.entries(dynamicGroups).map(([key, group]) => (
                <optgroup key={key} label={group.label}>
                  {group.statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          {selectedCandidate && (
            <div ref={statusUpdateFormRef} className="mb-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Cập nhật trạng thái: <span className="text-gray-700">{selectedCandidate.fullName}</span></h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white text-gray-700"
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
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <Icon name="check" size={16} />
                  Cập nhật
                </button>
                <button
                  onClick={() => {
                    setSelectedCandidate(null)
                    setNewStatus('')
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {candidates.length === 0 ? (
                <li className="px-6 py-16 text-center">
                  <div className="text-gray-300 mb-4 flex justify-center">
                    <Icon name="users" size={56} />
                  </div>
                  <p className="text-gray-600 font-medium text-base">Chưa có ứng viên nào</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {statusFilter ? 'Thử thay đổi bộ lọc trạng thái' : 'Bắt đầu bằng cách thêm ứng viên mới'}
                  </p>
                  {!statusFilter && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
                    >
                      <Icon name="plus" size={16} />
                      Thêm ứng viên đầu tiên
                    </button>
                  )}
                </li>
              ) : (
            candidates.map((candidate) => (
              <li
                key={candidate.id}
                onContextMenu={(e) => handleContextMenu(e, candidate)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setViewCandidateId(candidate.id)}
              >
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-base font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                      >
                        {candidate.fullName}
                      </span>
                      <div className="mt-2 space-y-1.5">
                        {candidate.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 truncate" title={candidate.email}>
                            <Icon name="mail" size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{candidate.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600" title={candidate.phone}>
                          <Icon name="phone" size={14} className="text-gray-400 flex-shrink-0" />
                          <span>{candidate.phone}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {candidate.position && (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium">
                              <Icon name="briefcase" size={12} />
                              {candidate.position}
                            </span>
                          )}
                          {candidate.store && typeof candidate.store === 'object' && candidate.store !== null && 'name' in candidate.store && (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium">
                              <Icon name="store" size={12} />
                              {(candidate.store as { name: string }).name}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-medium">
                            <Icon name="campaign" size={12} />
                            Chiến dịch: {typeof candidate.campaign === 'object' && candidate.campaign !== null && 'name' in candidate.campaign ? candidate.campaign.name : 'Chiến dịch tuyển dụng tổng'}
                          </span>
                          {candidate.pic && typeof candidate.pic === 'object' && candidate.pic !== null && 'fullName' in candidate.pic && (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md font-medium">
                              <Icon name="user" size={12} />
                              TA Phụ trách: {(candidate.pic as { fullName: string }).fullName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${getStatusColor(
                          candidate.status
                        )}`}
                      >
                        {getStatusLabel(candidate.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))
              )}
            </ul>
          </div>
          {viewMode === 'list' && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Hiển thị:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white text-gray-700"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-gray-500">
                  / Tổng: <span className="font-semibold text-gray-700">{pagination.total}</span> ứng viên
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || loading}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors text-gray-700 bg-white"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-600 px-2">
                  Trang <span className="font-semibold text-gray-900">{page}</span> / {pagination.totalPages || 1}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= (pagination.totalPages || 1) || loading}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors text-gray-700 bg-white"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === 'kanban' && (
        <CandidatesKanban 
          candidates={candidates} 
          onStatusChange={loadCandidates}
          page={page}
          limit={limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit)
            setPage(1)
          }}
          onTransferCampaign={loadCampaignsForTransfer}
          onViewDetail={(id) => setViewCandidateId(id)}
        />
      )}

      {/* Create Candidate Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Thêm ứng viên mới"
        maxWidth="max-w-2xl"
      >
        <CreateCandidateForm 
          onSuccess={() => {
            setShowCreateModal(false)
            loadCandidates()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Candidate Detail Modal */}
      <Modal
        isOpen={!!viewCandidateId}
        onClose={() => setViewCandidateId(null)}
        title="Chi tiết ứng viên"
        maxWidth="max-w-5xl"
      >
        {viewCandidateId && (
          <CandidateDetail 
            candidateId={viewCandidateId} 
            isModal={true} 
          />
        )}
      </Modal>
      {transferModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Chuyển chiến dịch tuyển dụng</h3>
              <button onClick={() => setTransferModal(prev => ({ ...prev, isOpen: false }))}>
                <span className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</span>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Ứng viên: <span className="font-semibold text-gray-900">{transferModal.candidate?.fullName}</span>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn chiến dịch mới <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={transferModal.selectedCampaignId}
                onChange={e => setTransferModal(prev => ({ ...prev, selectedCampaignId: e.target.value }))}
                disabled={transferModal.loading}
              >
                <option value="">-- Chọn chiến dịch mới --</option>
                {transferModal.campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 bg-white text-gray-700" 
                onClick={() => setTransferModal(prev => ({ ...prev, isOpen: false }))}
                disabled={transferModal.loading}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                onClick={submitTransferCampaign}
                disabled={!transferModal.selectedCampaignId || transferModal.loading}
              >
                {transferModal.loading ? 'Đang chuyển...' : 'Xác nhận chuyển'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Candidate Modal */}
      <Modal
        isOpen={!!editCandidateId}
        onClose={() => setEditCandidateId(null)}
        title="Chỉnh sửa ứng viên"
        maxWidth="max-w-4xl"
      >
        {editCandidateId && (
          <EditCandidateForm
            candidateId={editCandidateId}
            onSuccess={() => {
              setEditCandidateId(null)
              loadCandidates()
            }}
            onCancel={() => setEditCandidateId(null)}
          />
        )}
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={!!interviewCandidateId}
        onClose={() => setInterviewCandidateId(null)}
        title="Tạo lịch phỏng vấn"
        maxWidth="max-w-2xl"
      >
        {interviewCandidateId && (
          <CreateInterviewForm
            candidateId={interviewCandidateId}
            onSuccess={() => {
              setInterviewCandidateId(null)
              loadCandidates()
            }}
            onCancel={() => setInterviewCandidateId(null)}
          />
        )}
      </Modal>
    </div>
  )
}
