'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'

interface CandidateDetail {
  id: string
  fullName: string
  email: string | null
  phone: string
  cvUrl: string | null
  position: string | null
  notes: string | null
  status: string | { id: string; name: string; code: string } | null
  form: { id: string; title: string } | null
  campaign: { id: string; name: string } | null
  store: { id: string; name: string } | null
  interviews: Array<{
    id: string
    type: string | { id: string; name: string; code: string } | null
    result: string | { id: string; name: string; code: string } | null
    scheduledAt: string
    location: string | null
    notes: string | null
    interviewer: {
      id: string
      fullName: string
      email: string
    }
  }>
  proposals: Array<{
    id: string
    title: string
    status: string | { id: string; name: string; code: string } | null
  }>
  createdAt: string
  updatedAt: string
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
    subgroups: {
      waiting: {
        label: 'Chờ phỏng vấn',
        statuses: [
          { value: 'WAITING_INTERVIEW', label: 'Chờ phỏng vấn' },
        ],
      },
      hr: {
        label: 'HR sơ vấn',
        statuses: [
          { value: 'HR_INTERVIEW_PASSED', label: 'HR sơ vấn đạt' },
          { value: 'HR_INTERVIEW_FAILED', label: 'HR sơ vấn loại' },
        ],
      },
      sm_am: {
        label: 'SM/AM PV',
        statuses: [
          { value: 'SM_AM_INTERVIEW_PASSED', label: 'SM/AM PV Đạt' },
          { value: 'SM_AM_INTERVIEW_FAILED', label: 'SM/AM PV Loại' },
          { value: 'SM_AM_INTERVIEW_NO_SHOW', label: 'SM/AM PV Không đến PV' },
        ],
      },
      om_pv: {
        label: 'OM PV',
        statuses: [
          { value: 'OM_PV_INTERVIEW_PASSED', label: 'OM PV Đạt' },
          { value: 'OM_PV_INTERVIEW_FAILED', label: 'OM PV Loại' },
          { value: 'OM_PV_INTERVIEW_NO_SHOW', label: 'OM PV Không đến PV' },
        ],
      },
    },
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

export default function CandidateDetail({ candidateId }: { candidateId: string }) {
  const router = useRouter()
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStatusChange, setShowStatusChange] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusChangeLoading, setStatusChangeLoading] = useState(false)

  useEffect(() => {
    // Get user info
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)

    // Get candidate detail
    api
      .get(`/recruitment/candidates/${candidateId}`)
      .then((res) => setCandidate(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Không thể tải chi tiết ứng viên')
      })
      .finally(() => setLoading(false))
  }, [candidateId])

  const getStatusLabel = (status: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!status) return 'Chưa có trạng thái'
    if (typeof status === 'object') return status.name
    return status
  }

  const getStatusColor = (status: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    const statusCode = typeof status === 'object' ? status.code : status
    if (!statusCode) return 'bg-gray-100 text-gray-800'
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

  const getAllowedStatuses = (): string[] => {
    if (!user) return []
    if (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT') {
      return Object.values(STATUS_GROUPS).flatMap((group) => {
        // Handle groups with statuses
        if ('statuses' in group && group.statuses) {
          return group.statuses.map((s) => s.value)
        }
        // Handle groups with subgroups (like interview)
        if ('subgroups' in group && group.subgroups) {
          return Object.values(group.subgroups).flatMap((subgroup) =>
            subgroup.statuses.map((s) => s.value)
          )
        }
        return []
      })
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
    if (!newStatus) return

    setStatusChangeLoading(true)
    try {
      // Fetch status ID from backend
      const statuses = await api.get('/types/by-category/CANDIDATE_STATUS')
      const targetStatus = statuses.data.find((s: any) => s.code === newStatus)
      if (!targetStatus) {
        setError('Không tìm thấy trạng thái')
        setStatusChangeLoading(false)
        return
      }
      await api.patch(`/recruitment/candidates/${candidateId}`, {
        statusId: targetStatus.id,
      })
      // Reload candidate
      const res = await api.get(`/recruitment/candidates/${candidateId}`)
      setCandidate(res.data)
      setShowStatusChange(false)
      setNewStatus('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setStatusChangeLoading(false)
    }
  }

  const allowedStatuses = getAllowedStatuses()

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Đang tải...</div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy ứng viên'}</p>
          <Link
            href="/dashboard/recruitment"
            className="text-yellow-600 hover:text-yellow-700"
          >
            Quay lại danh sách ứng viên
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {candidate.fullName}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Chi tiết ứng viên
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              candidate.status
            )}`}
          >
            {getStatusLabel(candidate.status)}
          </span>
          <Link
            href={`/dashboard/recruitment/candidates/${candidateId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <span className="flex items-center gap-1">
              <Icon name="edit" size={16} />
              Chỉnh sửa
            </span>
          </Link>
          {allowedStatuses.length > 0 && (
            <button
              onClick={() => setShowStatusChange(!showStatusChange)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
            >
              {showStatusChange ? 'Hủy' : 'Chuyển trạng thái'}
            </button>
          )}
          <Link
            href="/dashboard/recruitment"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Quay lại
          </Link>
        </div>
      </div>

      {/* Status Change Form */}
      {showStatusChange && allowedStatuses.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Chuyển trạng thái</h3>
          <div className="space-y-6">
            {/* Ứng tuyển */}
            {STATUS_GROUPS.application.statuses.some(s => allowedStatuses.includes(s.value)) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {STATUS_GROUPS.application.label}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {STATUS_GROUPS.application.statuses
                    .filter((s) => allowedStatuses.includes(s.value))
                    .map((status) => {
                      const currentStatusCode = typeof candidate.status === 'object' 
                        ? candidate.status?.code 
                        : candidate.status
                      const isSelected = currentStatusCode === status.value
                      
                      return (
                        <button
                          key={status.value}
                          onClick={() => setNewStatus(status.value)}
                          className={`
                            px-3 py-2 text-sm rounded-md border transition-all
                            ${isSelected 
                              ? 'bg-yellow-50 border-yellow-500 text-yellow-700 font-medium' 
                              : newStatus === status.value
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          {status.label}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Phỏng vấn - với các nhóm con */}
            {STATUS_GROUPS.interview.subgroups && Object.values(STATUS_GROUPS.interview.subgroups).some(subgroup => 
              subgroup.statuses.some(s => allowedStatuses.includes(s.value))
            ) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {STATUS_GROUPS.interview.label}
                </label>
                <div className="space-y-4">
                  {Object.entries(STATUS_GROUPS.interview.subgroups).map(([subKey, subgroup]) => {
                    const allowedSubStatuses = subgroup.statuses.filter(s => allowedStatuses.includes(s.value))
                    if (allowedSubStatuses.length === 0) return null
                    
                    return (
                      <div key={subKey} className="ml-4">
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                          {subgroup.label}
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {allowedSubStatuses.map((status) => {
                            const currentStatusCode = typeof candidate.status === 'object' 
                              ? candidate.status?.code 
                              : candidate.status
                            const isSelected = currentStatusCode === status.value
                            
                            return (
                              <button
                                key={status.value}
                                onClick={() => setNewStatus(status.value)}
                                className={`
                                  px-3 py-2 text-sm rounded-md border transition-all
                                  ${isSelected 
                                    ? 'bg-yellow-50 border-yellow-500 text-yellow-700 font-medium' 
                                    : newStatus === status.value
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }
                                `}
                              >
                                {status.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Thư mời */}
            {STATUS_GROUPS.offer.statuses.some(s => allowedStatuses.includes(s.value)) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {STATUS_GROUPS.offer.label}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {STATUS_GROUPS.offer.statuses
                    .filter((s) => allowedStatuses.includes(s.value))
                    .map((status) => {
                      const currentStatusCode = typeof candidate.status === 'object' 
                        ? candidate.status?.code 
                        : candidate.status
                      const isSelected = currentStatusCode === status.value
                      
                      return (
                        <button
                          key={status.value}
                          onClick={() => setNewStatus(status.value)}
                          className={`
                            px-3 py-2 text-sm rounded-md border transition-all
                            ${isSelected 
                              ? 'bg-yellow-50 border-yellow-500 text-yellow-700 font-medium' 
                              : newStatus === status.value
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          {status.label}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Trúng tuyển */}
            {STATUS_GROUPS.onboarding.statuses.some(s => allowedStatuses.includes(s.value)) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {STATUS_GROUPS.onboarding.label}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {STATUS_GROUPS.onboarding.statuses
                    .filter((s) => allowedStatuses.includes(s.value))
                    .map((status) => {
                      const currentStatusCode = typeof candidate.status === 'object' 
                        ? candidate.status?.code 
                        : candidate.status
                      const isSelected = currentStatusCode === status.value
                      
                      return (
                        <button
                          key={status.value}
                          onClick={() => setNewStatus(status.value)}
                          className={`
                            px-3 py-2 text-sm rounded-md border transition-all
                            ${isSelected 
                              ? 'bg-yellow-50 border-yellow-500 text-yellow-700 font-medium' 
                              : newStatus === status.value
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          {status.label}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {newStatus && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowStatusChange(false)
                    setNewStatus('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={statusChangeLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  {statusChangeLoading ? 'Đang cập nhật...' : 'Xác nhận'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidate Details */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Thông tin ứng viên</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Họ và tên</label>
              <p className="mt-1 text-sm text-gray-900">{candidate.fullName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-sm text-gray-900">{candidate.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
              <p className="mt-1 text-sm text-gray-900">{candidate.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Vị trí</label>
              <p className="mt-1 text-sm text-gray-900">{candidate.position || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Cửa hàng</label>
              <p className="mt-1 text-sm text-gray-900">{candidate.store?.name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Form tuyển dụng</label>
              <p className="mt-1 text-sm text-gray-900">{candidate.form?.title || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Chiến dịch</label>
              <p className="mt-1 text-sm text-gray-900">{candidate.campaign?.name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(candidate.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Cập nhật lần cuối</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(candidate.updatedAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          {candidate.cvUrl && (
            <div>
              <label className="text-sm font-medium text-gray-500">CV</label>
              <p className="mt-1">
                <a
                  href={candidate.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  Xem CV
                </a>
              </p>
            </div>
          )}

          {candidate.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Ghi chú</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{candidate.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Interviews */}
      {candidate.interviews.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Lịch sử phỏng vấn</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {candidate.interviews.map((interview) => (
                <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(interview.scheduledAt).toLocaleString('vi-VN')}
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
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Người phỏng vấn: {interview.interviewer.fullName} ({interview.interviewer.email})</p>
                    {interview.location && <p>Địa điểm: {interview.location}</p>}
                    {interview.notes && <p className="mt-1">Ghi chú: {interview.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Proposals */}
      {candidate.proposals.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Đề xuất tuyển dụng</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-2">
              {candidate.proposals.map((proposal) => (
                <div key={proposal.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-900">{proposal.title}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      (typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : (typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {typeof proposal.status === 'object'
                      ? proposal.status?.name
                      : proposal.status === 'APPROVED'
                      ? 'Đã duyệt'
                      : proposal.status === 'REJECTED'
                      ? 'Từ chối'
                      : 'Chờ duyệt'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

