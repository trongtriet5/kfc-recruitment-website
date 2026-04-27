'use client'

import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import { useClickOutside } from '@/hooks/useClickOutside'
import Icon from '@/components/icons/Icon'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Modal from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Campaign {
  id: string
  name: string
  description: string | null
  link: string | null
  startDate: string
  endDate: string | null
  isActive: boolean
  form: { id: string; title: string; brand: string }
  store?: { id: string; name: string; code: string }
  _count: { candidates: number }
  proposalId?: string
  targetQty?: number
  fulfilledQty?: number
  hiredQty?: number
  offerAcceptedQty?: number
}

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string
  status: { id: string; name: string; code: string; color: string }
  createdAt: string
}

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [forms, setForms] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [statistics, setStatistics] = useState<any>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; campaign: Campaign } | null>(null)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    destructive: boolean
    action: null | (() => Promise<void>)
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    destructive: false,
    action: null,
  })
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formId: '',
    storeId: '',
    proposalId: '',
    startDate: '',
    endDate: '',
    isActive: true,
  })
  const [proposals, setProposals] = useState<any[]>([])
  const createFormRef = useRef<HTMLDivElement>(null)
  const editModalRef = useRef<HTMLDivElement>(null)
  
  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null)
  const [campaignCandidates, setCampaignCandidates] = useState<Candidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)

  useClickOutside(createFormRef, () => {
    if (showCreateForm) {
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        formId: '',
        storeId: '',
        proposalId: '',
        startDate: '',
        endDate: '',
        isActive: true,
      })
    }
  }, showCreateForm)

  useClickOutside(editModalRef, () => {
    setShowEditModal(false)
    setEditingCampaign(null)
  }, showEditModal)

  useEffect(() => {
    loadUser()
    loadCampaigns()
    loadForms()
    loadProposals()
    loadStores()
    loadStatistics()
  }, [])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    loadStatistics(selectedCampaignId || undefined)
  }, [selectedCampaignId])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadCampaignCandidates = async (campaignId: string) => {
    setLoadingCandidates(true)
    try {
      const res = await api.get(`/recruitment/candidates?campaignId=${campaignId}&limit=100`)
      setCampaignCandidates(res.data.candidates || [])
    } catch (err) {
      console.error('Failed to load candidates:', err)
      setCampaignCandidates([])
    } finally {
      setLoadingCandidates(false)
    }
  }

  const loadForms = () => {
    api
      .get('/recruitment/forms')
      .then((res) => setForms(res.data))
      .catch(console.error)
  }

  const loadProposals = () => {
    api
      .get('/recruitment/proposals')
      .then((res) => setProposals(res.data))
      .catch(console.error)
  }

  const loadStores = () => {
    api
      .get('/stores')
      .then((res) => setStores(res.data))
      .catch(console.error)
  }

  const getProposalDetails = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId)
    return proposal ? { quantity: proposal.quantity, position: proposal.position?.name } : null
  }

  const handleContextMenu = (e: React.MouseEvent, campaign: Campaign) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, campaign })
  }

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      formId: campaign.form?.id || '',
      storeId: campaign.store?.id || '',
      proposalId: (campaign as any).proposalId || '',
      startDate: campaign.startDate?.split('T')[0] || '',
      endDate: campaign.endDate?.split('T')[0] || '',
      isActive: campaign.isActive,
    })
    setShowEditModal(true)
    setContextMenu(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return
    try {
      await api.patch(`/recruitment/campaigns/${editingCampaign.id}`, formData)
      setShowEditModal(false)
      setEditingCampaign(null)
      loadCampaigns()
      toast.success('Cập nhật chiến dịch thành công')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = (campaign: Campaign) => {
    setContextMenu(null)
    setConfirmState({
      isOpen: true,
      title: 'Xóa chiến dịch',
      message: `Bạn có chắc chắn muốn xóa chiến dịch "${campaign.name}"?`,
      confirmText: 'Xóa',
      destructive: true,
      action: async () => {
        await api.delete(`/recruitment/campaigns/${campaign.id}`)
        toast.success('Xóa chiến dịch thành công')
        loadCampaigns()
      },
    })
  }

  const loadCampaigns = () => {
    api
      .get('/recruitment/campaigns')
      .then((res) => setCampaigns(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const loadStatistics = async (campaignId?: string) => {
    try {
      const params = campaignId ? `?campaignId=${campaignId}` : ''
      const res = await api.get(`/recruitment/campaigns/statistics${params}`)
      setStatistics(res.data)
    } catch (err) {
      console.error('Error loading statistics:', err)
    }
  }

  const getCampaignUrl = (link: string) => {
    return `${window.location.origin}/apply?campaignId=${encodeURIComponent(link)}`
  }

  const copyLink = (link: string) => {
    const fullUrl = getCampaignUrl(link)
    navigator.clipboard.writeText(fullUrl)
    toast.success('Đã copy link')
  }

  const openForm = (link: string) => {
    window.open(getCampaignUrl(link), '_blank')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        proposalId: formData.proposalId || undefined,
      }
      await api.post('/recruitment/campaigns', submitData)
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        formId: '',
        storeId: '',
        proposalId: '',
        startDate: '',
        endDate: '',
        isActive: true,
      })
      loadCampaigns()
      loadStatistics()
      toast.success('Tạo chiến dịch thành công')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleToggleActive = (campaign: Campaign) => {
    setContextMenu(null)
    const nextAction = campaign.isActive ? 'tạm dừng' : 'mở lại'
    setConfirmState({
      isOpen: true,
      title: `${campaign.isActive ? 'Tạm dừng' : 'Mở lại'} chiến dịch`,
      message: `Bạn có chắc chắn muốn ${nextAction} chiến dịch "${campaign.name}"?`,
      confirmText: campaign.isActive ? 'Tạm dừng' : 'Mở lại',
      destructive: false,
      action: async () => {
        await api.patch(`/recruitment/campaigns/${campaign.id}`, { isActive: !campaign.isActive })
        toast.success(`${campaign.isActive ? 'Đã tạm dừng' : 'Đã mở lại'} chiến dịch`)
        loadCampaigns()
      },
    })
  }

  const handleConfirmAction = async () => {
    if (!confirmState.action) return
    setConfirmLoading(true)
    try {
      await confirmState.action()
      setConfirmState((prev) => ({ ...prev, isOpen: false, action: null }))
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setConfirmLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  const canManage = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Chiến dịch tuyển dụng</h1>
        <p className="text-gray-600 mt-2">Quản lý các chiến dịch tuyển dụng, theo dõi ứng viên và kết quả</p>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
        >
          + Tạo chiến dịch
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Tổng ứng viên</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {statistics.totalCandidates || 0}
            </div>
            {selectedCampaignId && (
              <div className="text-xs text-gray-500 mt-1">
                {campaigns.find(c => c.id === selectedCampaignId)?.name}
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Đang lọc CV</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {statistics.candidatesByStatus?.find((s: any) => s.status === 'CV_FILTERING')?._count || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Ứng viên đạt</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {statistics.candidatesByStatus?.find((s: any) => s.status === 'CV_PASSED')?._count || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Đã trúng tuyển</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {statistics.candidatesByStatus?.find((s: any) => s.status === 'ONBOARDING_ACCEPTED')?._count || 0}
            </div>
          </div>
        </div>
      )}

      {/* Campaign Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lọc theo chiến dịch
        </label>
        <select
          value={selectedCampaignId}
          onChange={(e) => setSelectedCampaignId(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Tất cả chiến dịch</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>

      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} title="Tạo chiến dịch tuyển dụng mới" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên chiến dịch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form tuyển dụng <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.formId}
                onChange={(e) => setFormData({ ...formData, formId: e.target.value })}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cửa hàng
              </label>
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đề xuất tuyển dụng (không bắt buộc)
            </label>
            <select
              value={formData.proposalId}
              onChange={(e) => {
                const proposalId = e.target.value
                const details = getProposalDetails(proposalId)
                setFormData({ 
                  ...formData, 
                  proposalId,
                  name: details && !formData.name ? `${details.position} - ${details.quantity} NV` : formData.name,
                  storeId: details && !formData.storeId ? proposals.find(p => p.id === proposalId)?.storeId : formData.storeId
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Chọn đề xuất (không bắt buộc)</option>
              {proposals.filter(p => p.quantity).map((proposal) => (
                <option key={proposal.id} value={proposal.id}>
                  {proposal.title} - {proposal.quantity} NV - {proposal.position?.name}
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
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min={formData.startDate}
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Kích hoạt
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900"
            >
              Tạo
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {campaigns.length === 0 ? (
            <li className="px-4 py-5 text-center text-gray-500">Chưa có chiến dịch nào</li>
          ) : (
            campaigns
              .filter((campaign) => !selectedCampaignId || campaign.id === selectedCampaignId)
              .map((campaign) => (
              <li 
                  key={campaign.id} 
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setDetailCampaign(campaign)
                    setShowDetailModal(true)
                    loadCampaignCandidates(campaign.id)
                  }}
                  onContextMenu={(e) => handleContextMenu(e, campaign)}
                >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">{campaign.name}</h3>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {campaign.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                      </span>
                      {campaign.store && (
                        <span className="ml-2 text-xs text-gray-500">
                          Cửa hàng: {campaign.store.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{campaign.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>Form: {campaign.form?.title}</span>
                      <span>
                        {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                        {campaign.endDate && ` - ${new Date(campaign.endDate).toLocaleDateString('vi-VN')}`}
                      </span>
                      <span>Ứng viên: {campaign._count?.candidates || 0}</span>

                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    
                    
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleToggleActive(campaign)}
                          className={`text-sm px-3 py-1 border rounded-md flex items-center gap-1 ${
                            campaign.isActive 
                              ? 'text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:bg-yellow-50' 
                              : 'text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50'
                          }`}
                        >
                          {campaign.isActive ? 'Tạm dừng' : 'Mở lại'}
                        </button>
                        {campaign._count?.candidates === 0 && (
                          <button
                            onClick={() => handleDelete(campaign)}
                            className="text-sm text-red-600 hover:text-red-700 px-3 py-1 border border-red-300 rounded-md hover:bg-red-50 flex items-center gap-1"
                          >
                            Xóa
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-white shadow-lg rounded-md border py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              setDetailCampaign(contextMenu.campaign)
              setShowDetailModal(true)
              loadCampaignCandidates(contextMenu.campaign.id)
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Icon name="eye" size={16} /> Xem chi tiết
          </button>
          <button
            onClick={() => handleEdit(contextMenu.campaign)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Icon name="edit" size={16} /> Chỉnh sửa
          </button>
          <button
            onClick={() => handleToggleActive(contextMenu.campaign)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Icon name={contextMenu.campaign.isActive ? 'pause' : 'play'} size={16} />
            {contextMenu.campaign.isActive ? 'Tạm dừng' : 'Mở lại'}
          </button>
          {contextMenu.campaign._count?.candidates === 0 && (
            <button
              onClick={() => handleDelete(contextMenu.campaign)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
            >
              <Icon name="trash" size={16} /> Xóa
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        destructive={confirmState.destructive}
        isLoading={confirmLoading}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false, action: null }))}
        onConfirm={handleConfirmAction}
      />

      {/* Edit Modal */}
      {showEditModal && editingCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div ref={editModalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Chỉnh sửa chiến dịch</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chiến dịch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cửa hàng
                </label>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="editIsActive" className="text-sm text-gray-700">
                  Kích hoạt
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingCampaign(null) }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Chiến dịch: ${detailCampaign?.name || ''}`} maxWidth="max-w-4xl">
        {detailCampaign && (
          <div className="space-y-6">
            {/* Campaign Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Trạng thái</p>
                  <p className={`font-medium ${detailCampaign.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                    {detailCampaign.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cửa hàng</p>
                  <p className="font-medium">{detailCampaign.store?.name || 'Chưa gán'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ngày bắt đầu</p>
                  <p className="font-medium">{detailCampaign.startDate ? new Date(detailCampaign.startDate).toLocaleDateString('vi-VN') : 'Chưa có'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ngày kết thúc</p>
                  <p className="font-medium">{detailCampaign.endDate ? new Date(detailCampaign.endDate).toLocaleDateString('vi-VN') : 'Chưa có'}</p>
                </div>
              </div>
              {detailCampaign.description && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500">Mô tả</p>
                  <p className="text-sm">{detailCampaign.description}</p>
                </div>
              )}
            </div>

            {/* Candidates Table */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Danh sách ứng viên ({campaignCandidates.length})
              </h4>
              {loadingCandidates ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : campaignCandidates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Chưa có ứng viên nào</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">STT</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Họ tên</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SĐT</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Trạng thái</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaignCandidates.map((candidate, index) => (
                        <tr key={candidate.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">{index + 1}</td>
                          <td className="px-4 py-2 text-sm font-medium">{candidate.fullName}</td>
                          <td className="px-4 py-2 text-sm">{candidate.email || '-'}</td>
                          <td className="px-4 py-2 text-sm">{candidate.phone}</td>
                          <td className="px-4 py-2">
                            <span 
                              className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: candidate.status?.color + '20', color: candidate.status?.color }}
                            >
                              {candidate.status?.name || 'Chưa có'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm">{new Date(candidate.createdAt).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

