'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { useCandidateStatuses } from '@/lib/useCandidateStatuses'

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
  [key: string]: any
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
  pic?: { id: string; fullName: string; email: string } | null
}

interface User {
  role: string
}

export default function CandidateDetail({ 
  candidateId, 
  isModal = false 
}: { 
  candidateId: string, 
  isModal?: boolean 
}) {
  const router = useRouter()
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStatusChange, setShowStatusChange] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusChangeLoading, setStatusChangeLoading] = useState(false)
  const [provinces, setProvinces] = useState<any[]>([])
  const { dbStatuses, dynamicGroups } = useCandidateStatuses()

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

    // Get provinces for resolving city ID to name
    api.get('/locations/provinces')
      .then(res => setProvinces(res.data || []))
      .catch(console.error)
  }, [candidateId])

  const getCityName = (cityId: string | null | undefined) => {
    if (!cityId) return 'Chưa có'
    const province = provinces.find(p => p.id === cityId)
    if (province?.name) return province.name
    // If not found in provinces, it's likely already a name (not an ID)
    if (cityId.length < 10) return cityId // ID length is typically long, name is short
    return cityId
  }

  const getStatusLabel = (status: unknown) => {
    if (!status || typeof status !== 'string' && typeof status !== 'object') return 'Chưa có trạng thái'
    
    // If it's an object from the new relational backend
    if (typeof status === 'object' && status !== null && 'name' in status) return String((status as { name: string }).name || '')
    
    const statusCode = typeof status === 'string' ? status : (status as any)?.code
    if (!statusCode) return 'Chưa có trạng thái'

    const dbObj = dbStatuses.find(s => s.code === String(statusCode))
    if (dbObj) return String(dbObj.name || '')

    return String(statusCode || '')
  }

  const getStatusColor = (status: unknown) => {
    if (!status || typeof status !== 'string' && typeof status !== 'object') return 'bg-gray-100 text-gray-800'
    const statusCode = typeof status === 'object' && status !== null && 'code' in status ? String((status as any).code || '') : String(status || '')
    if (!statusCode) return 'bg-gray-100 text-gray-800'
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

  const getTypeLabel = (type: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!type) return 'Chưa có loại'
    if (typeof type === 'object') return String(type.name || '')
    const labels: Record<string, string> = {
      HR_SCREENING: 'HR Sơ vấn',
      SM_AM_INTERVIEW: 'SM/AM Phỏng vấn',
      OM_PV_INTERVIEW: 'OM/PV Phỏng vấn',
    }
    return labels[String(type)] || String(type)
  }

  const getResultLabel = (result: string | { id: string; name: string; code: string } | null | undefined) => {
    if (!result) return 'Chưa có kết quả'
    if (typeof result === 'object') return String(result.name || '')
    const labels: Record<string, string> = {
      PASSED: 'Đạt',
      FAILED: 'Không đạt',
      NO_SHOW: 'Không đến',
    }
    return labels[String(result)] || String(result)
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
      return dbStatuses.map(s => s.code)
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
            href="/recruitment/dashboard"
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
            {typeof candidate === 'object' && candidate !== null && 'fullName' in candidate ? candidate.fullName : 'Unknown'}
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
            href={`/recruitment/candidates/${candidateId}/edit`}
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
          {!isModal && (
            <Link
              href="/recruitment/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Quay lại
            </Link>
          )}
        </div>
      </div>

{/* Status Change Form */}
      {showStatusChange && allowedStatuses.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Chuyển trạng thái</h3>
          <div className="space-y-6">
            {Object.entries(dynamicGroups).map(([groupKey, group]) => {
              const availableStatuses = group.statuses.filter((s) => allowedStatuses.includes(s.value))
              if (availableStatuses.length === 0) return null

              return (
<div key={groupKey}>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {group.label}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {group.statuses
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
              )
            })}

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
              <p className="mt-1 text-sm text-gray-900">{typeof candidate === 'object' && candidate !== null && 'fullName' in candidate ? candidate.fullName : 'Unknown'}</p>
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
              <p className="mt-1 text-sm text-gray-900">{typeof candidate.store === 'object' && candidate.store !== null && 'name' in candidate.store ? candidate.store.name : 'Chưa có'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Form tuyển dụng</label>
              <p className="mt-1 text-sm text-gray-900">{(candidate as any).form?.title || 'Chưa có'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Chiến dịch</label>
              <p className="mt-1 text-sm text-gray-900">{typeof candidate.campaign === 'object' && candidate.campaign !== null && 'name' in candidate.campaign ? candidate.campaign.name : 'Chưa có'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Địa điểm mong muốn làm việc</label>
              <p className="mt-1 text-sm text-gray-900">{getCityName(candidate.currentCity)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(candidate.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Người phụ trách (TA)</label>
              <p className="mt-1 text-sm font-semibold text-purple-700">
                {candidate.pic && typeof candidate.pic === 'object' && 'fullName' in candidate.pic ? (candidate.pic as { fullName: string }).fullName : 'Chưa phân công'}
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
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ghi chú</h3>
              {(() => {
                try {
                  const notesObj = JSON.parse(candidate.notes);
                  if (notesObj && typeof notesObj === 'object') {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {notesObj.currentStreet && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Địa chỉ hiện tại</label>
                            <p className="mt-1 text-sm text-gray-900">{notesObj.currentStreet}</p>
                          </div>
                        )}
                        {notesObj.availableStartDate && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Ngày có thể bắt đầu</label>
                            <p className="mt-1 text-sm text-gray-900">{new Date(notesObj.availableStartDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                        )}
                        {notesObj.preferredWorkShift && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Ca làm việc mong muốn</label>
                            <p className="mt-1 text-sm text-gray-900">{notesObj.preferredWorkShift}</p>
                          </div>
                        )}
                        {notesObj.canWorkTet && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Làm Tết</label>
                            <p className="mt-1 text-sm text-gray-900">{notesObj.canWorkTet}</p>
                          </div>
                        )}
                        {notesObj.referrer && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Người giới thiệu</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {notesObj.referrer === 'Có' && notesObj.referrerName ? notesObj.referrerName : notesObj.referrer}
                            </p>
                          </div>
                        )}
                        {notesObj.workExperience && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Kinh nghiệm làm việc</label>
                            <p className="mt-1 text-sm text-gray-900">{notesObj.workExperience}</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                } catch (e) {
                  return <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{candidate.notes}</p>;
                }
                return <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{candidate.notes}</p>;
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Interviews */}
      {candidate.interviews && candidate.interviews.length > 0 && (
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
                    <p>Người phỏng vấn: {typeof interview.interviewer === 'object' && 'fullName' in interview.interviewer ? String(interview.interviewer.fullName || 'N/A') : 'N/A'} ({typeof interview.interviewer === 'object' && 'email' in interview.interviewer ? String(interview.interviewer.email || '') : ''})</p>
                    {interview.location && <p>Địa điểm: {String(interview.location || '')}</p>}
                    {interview.notes && <p className="mt-1">Ghi chú: {String(interview.notes || '')}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Proposals */}
      {candidate.proposals && candidate.proposals.length > 0 && (
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

