'use client'

import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import { useClickOutside } from '@/hooks/useClickOutside'
import Icon from '@/components/icons/Icon'

interface Campaign {
  id: string
  name: string
  description: string | null
  link: string
  startDate: string
  endDate: string | null
  isActive: boolean
  form: { id: string; title: string; brand: string }
  store?: { id: string; name: string; code: string }
  _count: { candidates: number }
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formId: '',
    storeId: '',
    startDate: '',
    endDate: '',
    isActive: true,
  })
  const createFormRef = useRef<HTMLDivElement>(null)
  const editModalRef = useRef<HTMLDivElement>(null)

  useClickOutside(createFormRef, () => {
    if (showCreateForm) {
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        formId: '',
        storeId: '',
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

  const loadForms = () => {
    api
      .get('/recruitment/forms')
      .then((res) => setForms(res.data))
      .catch(console.error)
  }

  const loadStores = () => {
    api
      .get('/stores')
      .then((res) => setStores(res.data))
      .catch(console.error)
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
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: string) => {
    setContextMenu(null)
    if (!confirm('Bạn có chắc chắn muốn xóa chiến dịch này?')) return
    try {
      await api.delete(`/recruitment/campaigns/${id}`)
      loadCampaigns()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
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
    alert('Đã copy link!')
  }

  const openForm = (link: string) => {
    window.open(getCampaignUrl(link), '_blank')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/recruitment/campaigns', formData)
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        formId: '',
        storeId: '',
        startDate: '',
        endDate: '',
        isActive: true,
      })
      loadCampaigns()
      loadStatistics()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setContextMenu(null)
    if (!confirm(currentStatus ? 'Bạn muốn tạm dừng chiến dịch này?' : 'Bạn muốn mở lại chiến dịch này?')) return
    try {
      await api.patch(`/recruitment/campaigns/${id}`, { isActive: !currentStatus })
      loadCampaigns()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  const canManage = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT');

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Chiến dịch tuyển dụng</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Tạo chiến dịch
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
            <div className="text-sm text-gray-600">CV đạt</div>
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

      {showCreateForm && (
        <div ref={createFormRef} className="mb-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Tạo chiến dịch mới</h3>
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
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-context-menu"
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
                        {new Date(campaign.startDate).toLocaleDateString('vi-VN')}
                        {campaign.endDate &&
                          ` - ${new Date(campaign.endDate).toLocaleDateString('vi-VN')}`}
                      </span>
                      <span>Ứng viên: {campaign._count?.candidates || 0}</span>
                      <span>Link: {campaign.link}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <button
                      onClick={() => copyLink(campaign.link)}
                      className="text-sm text-yellow-600 hover:text-yellow-700 px-3 py-1 border border-yellow-300 rounded-md hover:bg-yellow-50 flex items-center gap-1"
                    >
                      <Icon name="copy" size={16} />
                      Copy link
                    </button>
                    <button
                      onClick={() => openForm(campaign.link)}
                      className="text-sm text-green-600 hover:text-green-700 px-3 py-1 border border-green-300 rounded-md hover:bg-green-50 flex items-center gap-1"
                    >
                      <Icon name="eye" size={16} />
                      Mở form
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleToggleActive(campaign.id, campaign.isActive)}
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
                            onClick={() => handleDelete(campaign.id)}
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
            onClick={() => handleEdit(contextMenu.campaign)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Icon name="edit" size={16} /> Chỉnh sửa
          </button>
          <button
            onClick={() => handleToggleActive(contextMenu.campaign.id, contextMenu.campaign.isActive)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Icon name={contextMenu.campaign.isActive ? 'pause' : 'play'} size={16} />
            {contextMenu.campaign.isActive ? 'Tạm dừng' : 'Mở lại'}
          </button>
          {contextMenu.campaign._count?.candidates === 0 && (
            <button
              onClick={() => handleDelete(contextMenu.campaign.id)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
            >
              <Icon name="trash" size={16} /> Xóa
            </button>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

