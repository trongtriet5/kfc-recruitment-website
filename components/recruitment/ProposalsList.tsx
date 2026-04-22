'use client'

import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import { useClickOutside } from '@/hooks/useClickOutside'
import toast from 'react-hot-toast'

interface Proposal {
  id: string
  title: string
  description: string | null
  quantity: number
  reason: string | null
  status: string | { id: string; name: string; code: string } | null
  store: { name: string } | null
  position: { name: string } | null
  approver: { fullName: string } | null
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason?: string | null
  campaign: { id: string; name: string; form: { title: string } } | null
  createdAt: string
  isUnplanned: boolean
  _count: { candidates: number }
}

interface User {
  role: string
}

export default function ProposalsList() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [stores, setStores] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    storeId: '',
    positionId: '',
    quantity: 1,
    reason: '',
    isUnplanned: false,
  })
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | 'create-campaign' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    formId: '',
    startDate: '',
    endDate: '',
    isActive: true,
  })
  const [forms, setForms] = useState<any[]>([])
  const createFormRef = useRef<HTMLDivElement>(null)
  const campaignFormRef = useRef<HTMLDivElement>(null)
  const actionFormRef = useRef<HTMLDivElement>(null)

  useClickOutside(createFormRef, () => {
    if (showCreateForm) {
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        storeId: '',
        positionId: '',
        quantity: 1,
        reason: '',
        isUnplanned: false,
      })
    }
  }, showCreateForm)

  useClickOutside(campaignFormRef, () => {
    if (showCreateCampaign) {
      setShowCreateCampaign(false)
      setCampaignFormData({
        name: '',
        description: '',
        formId: '',
        startDate: '',
        endDate: '',
        isActive: true,
      })
    }
  }, showCreateCampaign)

  useClickOutside(actionFormRef, () => {
    if (action && action !== 'create-campaign') {
      setSelectedProposal(null)
      setAction(null)
      setRejectionReason('')
    }
  }, !!action && action !== 'create-campaign')

  useEffect(() => {
    loadUser()
    loadProposals()
    loadStores()
    loadPositions()
    loadForms()
  }, [])

  const loadForms = () => {
    api
      .get('/recruitment/forms')
      .then((res) => setForms(res.data))
      .catch(console.error)
  }

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadStores = () => {
    // Assuming there's a stores endpoint
    api.get('/stores').then((res) => setStores(res.data)).catch(() => setStores([]))
  }

  const loadPositions = () => {
    // Assuming there's a positions endpoint
    api.get('/positions').then((res) => setPositions(res.data)).catch(() => setPositions([]))
  }

  const loadProposals = () => {
    api
      .get('/recruitment/proposals')
      .then((res) => setProposals(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/recruitment/proposals', formData)
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        storeId: '',
        positionId: '',
        quantity: 1,
        reason: '',
        isUnplanned: false,
      })
      loadProposals()
      toast.success('Tạo đề xuất thành công')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleApprove = async () => {
    if (!selectedProposal) return
    try {
      // Fetch APPROVED status ID
      const statuses = await api.get('/types/by-category/PROPOSAL_STATUS')
      const approvedStatus = statuses.data.find((s: any) => s.code === 'APPROVED')
      if (!approvedStatus) {
        alert('Không tìm thấy trạng thái APPROVED')
        return
      }
      await api.patch(`/recruitment/proposals/${selectedProposal.id}`, {
        status: approvedStatus.code,
      })
      setSelectedProposal(null)
      setAction(null)
      toast.success('Đã duyệt đề xuất')
      loadProposals()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleReject = async () => {
    if (!selectedProposal || !rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối')
      return
    }
    try {
      // Fetch REJECTED status ID
      const statuses = await api.get('/types/by-category/PROPOSAL_STATUS')
      const rejectedStatus = statuses.data.find((s: any) => s.code === 'REJECTED')
      if (!rejectedStatus) {
        alert('Không tìm thấy trạng thái REJECTED')
        return
      }
      await api.patch(`/recruitment/proposals/${selectedProposal.id}`, {
        status: rejectedStatus.code,
        rejectionReason: rejectionReason,
      })
      setSelectedProposal(null)
      setAction(null)
      setRejectionReason('')
      toast.success('Đã từ chối đề xuất')
      loadProposals()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const canApprove = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT' || user.role === 'MANAGER')
  const canCreateCampaign = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT')

  const handleCreateCampaign = async () => {
    if (!selectedProposal || !campaignFormData.name || !campaignFormData.formId || !campaignFormData.startDate) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }
    try {
      await api.post('/recruitment/campaigns', {
        ...campaignFormData,
        proposalId: selectedProposal.id,
      })
      setShowCreateCampaign(false)
      setAction(null)
      setSelectedProposal(null)
      setCampaignFormData({
        name: '',
        description: '',
        formId: '',
        startDate: '',
        endDate: '',
        isActive: true,
      })
      loadProposals()
      toast.success('Tạo chiến dịch thành công!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo chiến dịch')
    }
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Đề xuất tuyển dụng</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Tạo đề xuất
        </button>
      </div>

      {showCreateForm && (
        <div ref={createFormRef} className="mb-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Tạo đề xuất mới</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng</label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Chọn cửa hàng</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                <select
                  value={formData.positionId}
                  onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Chọn vị trí</option>
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
              />
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="isUnplanned"
                checked={formData.isUnplanned}
                onChange={(e) => setFormData({ ...formData, isUnplanned: e.target.checked })}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label htmlFor="isUnplanned" className="ml-2 block text-sm text-gray-900">
                Tuyển dụng không theo định biên (đột xuất)
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Tạo
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedProposal && action && action !== 'create-campaign' && (
        <div ref={actionFormRef} className="mb-4 bg-white shadow rounded-lg p-4">
          <h3 className="font-medium mb-2">
            {action === 'approve' ? 'Duyệt' : 'Từ chối'} đề xuất: {selectedProposal.title}
          </h3>
          {action === 'reject' && (
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do từ chối</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={action === 'approve' ? handleApprove : handleReject}
              className={`px-4 py-2 rounded-md ${
                action === 'approve'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Xác nhận
            </button>
            <button
              onClick={() => {
                setSelectedProposal(null)
                setAction(null)
                setRejectionReason('')
              }}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {showCreateCampaign && selectedProposal && (
        <div ref={campaignFormRef} className="mb-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">
            Tạo chiến dịch cho đề xuất: {selectedProposal.title}
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateCampaign()
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên chiến dịch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignFormData.name}
                onChange={(e) => setCampaignFormData({ ...campaignFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={campaignFormData.description}
                onChange={(e) => setCampaignFormData({ ...campaignFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form ứng tuyển <span className="text-red-500">*</span>
              </label>
              <select
                value={campaignFormData.formId}
                onChange={(e) => setCampaignFormData({ ...campaignFormData, formId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Chọn form</option>
                {forms.map((form) => (
<option key={form.id} value={form.id}>
                      {form.title}
                    </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={campaignFormData.startDate}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  value={campaignFormData.endDate}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateCampaign(false)
                  setAction(null)
                  setSelectedProposal(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Tạo chiến dịch
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {proposals.length === 0 ? (
            <li className="px-4 py-5 text-center text-gray-500">Chưa có đề xuất nào</li>
          ) : (
            proposals.map((proposal) => (
              <li key={proposal.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">
                        {proposal.title}
                        {proposal.isUnplanned && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Đột xuất
                          </span>
                        )}
                      </h3>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                    <p className="mt-1 text-sm text-gray-500">{proposal.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      {proposal.store && typeof proposal.store === 'object' && proposal.store !== null && 'name' in proposal.store && <span>Cửa hàng: {(proposal.store as { name: string }).name}</span>}
                      {proposal.position && typeof proposal.position === 'object' && proposal.position !== null && 'name' in proposal.position && <span>Vị trí: {(proposal.position as { name: string }).name}</span>}
                      <span>Số lượng: {proposal.quantity}</span>
                      <span>Ứng viên: {proposal._count?.candidates || 0}</span>
                    </div>
                    {proposal.approver && typeof proposal.approver === 'object' && proposal.approver !== null && 'fullName' in proposal.approver && (
                      <div className="mt-1 text-xs text-gray-500">
                        {(typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'APPROVED'
                          ? `Đã duyệt bởi ${(proposal.approver as { fullName: string }).fullName}`
                          : (typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'REJECTED'
                          ? `Từ chối bởi ${(proposal.approver as { fullName: string }).fullName}`
                          : ''}
                      </div>
                    )}
                    {proposal.campaign && typeof proposal.campaign === 'object' && proposal.campaign !== null && 'name' in proposal.campaign && (
                      <div className="mt-1 text-xs text-blue-600">
                        ✓ Đã có chiến dịch: {(proposal.campaign as { name: string }).name} (Form: {proposal.campaign.form && typeof proposal.campaign.form === 'object' && 'title' in proposal.campaign ? (proposal.campaign.form as { title: string }).title : 'N/A'})
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex gap-2">
                    {canApprove && (typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'PENDING' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedProposal(proposal)
                            setAction('approve')
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProposal(proposal)
                            setAction('reject')
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {canCreateCampaign && 
                     (typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'APPROVED' && 
                     !proposal.campaign && (
                      <button
                        onClick={() => {
                          setSelectedProposal(proposal)
                          setAction('create-campaign')
                          setShowCreateCampaign(true)
                          setCampaignFormData({
                            name: `${proposal.title} - Chiến dịch`,
                            description: proposal.description || '',
                            formId: '',
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: '',
                            isActive: true,
                          })
                        }}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                      >
                        Tạo chiến dịch
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

