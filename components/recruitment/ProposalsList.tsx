'use client'

import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import { useClickOutside } from '@/hooks/useClickOutside'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Modal from '@/components/common/Modal'
import Icon from '@/components/icons/Icon'

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
  startDate: string | null
  endDate: string | null
  isUntilFilled: boolean
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
  const [forms, setForms] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    storeId: '',
    positionId: '',
    quantity: 1,
    reason: '',
    startDate: '',
    endDate: '',
    isUntilFilled: false,
  })
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; proposal: Proposal } | null>(null)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    formId: '',
    isActive: true,
    startDate: '',
    endDate: '',
  })
  const campaignFormRef = useRef<HTMLDivElement>(null)

  useClickOutside(campaignFormRef, () => {
    if (showCreateCampaign) {
      setShowCreateCampaign(false)
    }
  })

  useEffect(() => {
    loadUser()
    loadProposals()
    loadStores()
    loadPositions()
    loadForms()
  }, [])

  const loadForms = () => {
    api.get('/recruitment/forms').then((res) => setForms(res.data)).catch(console.error)
  }

  const loadUser = () => {
    api.get('/auth/me').then((res) => setUser(res.data)).catch(console.error)
  }

  const loadStores = () => {
    api.get('/stores').then((res) => setStores(res.data)).catch(() => setStores([]))
  }

  const loadPositions = () => {
    api.get('/recruitment/positions').then((res) => setPositions(res.data)).catch(() => setPositions([]))
  }

  const loadProposals = () => {
    api.get('/recruitment/proposals').then((res) => setProposals(res.data || [])).catch(console.error).finally(() => setLoading(false))
  }

  const canEditTitle = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT' || user.role === 'MANAGER')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/recruitment/proposals', formData)
      setShowCreateForm(false)
      setFormData({ title: '', description: '', storeId: '', positionId: '', quantity: 1, reason: '', startDate: '', endDate: '', isUntilFilled: false })
      loadProposals()
      toast.success('Tạo đề xuất thành công!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleContextMenu = (e: React.MouseEvent, proposal: Proposal) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, proposal })
  }

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const handleDeleteProposal = async () => {
    if (!selectedProposal) return
    setActionLoading(true)
    try {
      await api.delete(`/recruitment/proposals/${selectedProposal.id}`)
      toast.success('Xóa đề xuất thành công')
      loadProposals()
      setConfirmDelete(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(false)
    }
  }

  const canApprove = user && ['ADMIN', 'HEAD_OF_DEPARTMENT'].includes(user.role)

  const handleApprove = async () => {
    if (!selectedProposal) return
    setActionLoading(true)
    try {
      await api.post(`/recruitment/proposals/${selectedProposal.id}/approve`)
      toast.success('Duyệt đề xuất thành công')
      loadProposals()
      setConfirmApprove(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedProposal) return
    setActionLoading(true)
    try {
      await api.post(`/recruitment/proposals/${selectedProposal.id}/reject`, { reason: '' })
      toast.success('Từ chối đề xuất thành công')
      loadProposals()
      setConfirmReject(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(false)
    }
  }

  const canCreateCampaign = user && ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER'].includes(user.role)

  return (
    <div className="pt-6 space-y-8">
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Đề xuất tuyển dụng</h1>
        <p className="text-gray-600 mt-2">Quản lý đề xuất tuyển dụng từ các cửa hàng, phê duyệt và tạo chiến dịch</p>
      </div>

      <div className="flex justify-between items-center">
        <button onClick={() => setShowCreateForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium">
          + Tạo đề xuất
        </button>
      </div>

      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} title="Tạo đề xuất tuyển dụng mới" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng <span className="text-red-500">*</span></label>
              <select value={formData.storeId} onChange={e => setFormData({ ...formData, storeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Chọn cửa hàng</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí <span className="text-red-500">*</span></label>
              <select value={formData.positionId} onChange={e => setFormData({ ...formData, positionId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Chọn vị trí</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng <span className="text-red-500">*</span></label>
              <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 mt-6">
                <input type="checkbox" checked={formData.isUntilFilled} onChange={e => setFormData({ ...formData, isUntilFilled: e.target.checked })} />
                <span className="text-sm">Tuyển đến khi đủ</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
            <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Tạo</button>
          </div>
        </form>
      </Modal>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 min-h-[300px]">
          {loading ? (
            <li className="px-4 py-5 text-center text-gray-500">Đang tải...</li>
          ) : proposals.length === 0 ? (
            <li className="px-4 py-5 text-center text-gray-500">Chưa có đề xuất nào</li>
          ) : (
            proposals.map(proposal => (
              <li key={proposal.id} className="px-4 py-5 sm:px-6 hover:bg-gray-50 cursor-pointer border-b border-gray-100" onContextMenu={e => handleContextMenu(e, proposal)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">{proposal.title}</h3>
                      {proposal.isUnplanned && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Đột xuất</span>}
                    </div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : (typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {typeof proposal.status === 'object' ? proposal.status?.name : proposal.status === 'APPROVED' ? 'Đã duyệt' : proposal.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{proposal.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      {proposal.store && <span>Cửa hàng: {proposal.store.name}</span>}
                      {proposal.position && <span>Vị trí: {proposal.position.name}</span>}
                      <span>Số lượng: {proposal.quantity}</span>
                      <span>Ứng viên: {proposal._count?.candidates || 0}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    {canApprove && (typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'PENDING' && (
                      <>
                        <button onClick={() => { setSelectedProposal(proposal); setConfirmApprove(true) }} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Duyệt</button>
                        <button onClick={() => { setSelectedProposal(proposal); setConfirmReject(true) }} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Từ chối</button>
                      </>
                    )}
                    {canCreateCampaign && (typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'APPROVED' && !proposal.campaign && (
                      <button onClick={() => { setSelectedProposal(proposal); setShowCreateCampaign(true); setCampaignFormData({ name: `${proposal.title} - Chiến dịch`, description: proposal.description || '', formId: forms[0]?.id || '', isActive: true, startDate: '', endDate: '' }) }} className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
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

      {contextMenu && (
        <div className="fixed bg-white shadow-lg rounded-md border py-1 z-50" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { setSelectedProposal(contextMenu.proposal); setContextMenu(null); setConfirmDelete(true) }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600">
            <Icon name="trash" size={14} /> Xóa
          </button>
        </div>
      )}

      <Modal isOpen={showCreateCampaign} onClose={() => setShowCreateCampaign(false)} title="Tạo chiến dịch" maxWidth="max-w-lg">
        <form onSubmit={async e => {
          e.preventDefault()
          if (!selectedProposal || !campaignFormData.name || !campaignFormData.formId) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
          }
          try {
            await api.post('/recruitment/campaigns', { ...campaignFormData, proposalId: selectedProposal.id, startDate: selectedProposal.isUntilFilled ? null : selectedProposal.startDate, endDate: selectedProposal.isUntilFilled ? null : selectedProposal.endDate, isUntilFilled: selectedProposal.isUntilFilled })
            setShowCreateCampaign(false)
            loadProposals()
            toast.success('Tạo chiến dịch thành công!')
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên chiến dịch <span className="text-red-500">*</span></label>
            <input type="text" value={campaignFormData.name} onChange={e => setCampaignFormData({ ...campaignFormData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form <span className="text-red-500">*</span></label>
            <select value={campaignFormData.formId} onChange={e => setCampaignFormData({ ...campaignFormData, formId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Chọn form</option>
              {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreateCampaign(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Tạo</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmDelete} title="Xóa đề xuất" message={`Bạn có chắc muốn xóa đề xuất "${selectedProposal?.title}"?`} confirmText="Xóa" onConfirm={handleDeleteProposal} onClose={() => setConfirmDelete(false)} isLoading={actionLoading} destructive />

      <ConfirmDialog isOpen={confirmApprove} title="Duyệt đề xuất" message={selectedProposal ? `Bạn có chắc muốn duyệt đề xuất "${selectedProposal.title}"?` : ''} confirmText="Duyệt" onConfirm={handleApprove} onClose={() => setConfirmApprove(false)} isLoading={actionLoading} />

      <ConfirmDialog isOpen={confirmReject} title="Từ chối đề xuất" message="Xác nhận từ chối đề xuất này?" confirmText="Từ chối" onConfirm={handleReject} onClose={() => setConfirmReject(false)} isLoading={actionLoading} destructive />
    </div>
  )
}