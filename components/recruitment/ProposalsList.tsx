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
  store: { id: string; name: string } | null
  position: { id: string; name: string } | null
  approver: { fullName: string } | null
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason?: string | null
  campaign: { id: string; name: string } | null
  createdAt: string
  isUnplanned: boolean
  startDate: string | null
  endDate: string | null
  isUntilFilled: boolean
  _count: { candidates: number }
  workflowHistory?: { id: string; fromStatus: string; toStatus: string; action: string; actorRole: string; notes: string | null; createdAt: string; actor: { fullName: string } | null }[]
}

interface User {
  id: string
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
  const [showDetail, setShowDetail] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [confirmUnapprove, setConfirmUnapprove] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; proposal: Proposal } | null>(null)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    storeId: '',
    positionId: '',
    quantity: 0,
    picId: '',
    recruiterId: '',
    isActive: true,
  })
  const [allUsers, setAllUsers] = useState<any[]>([])
  const campaignFormRef = useRef<HTMLDivElement>(null)

  const isPending = (status: any) => {
    const code = typeof status === 'object' ? status?.code : status
    return code === 'SUBMITTED' || code === 'AM_REVIEWED'
  }

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
    loadUsers()
  }, [])

  const loadUsers = () => {
    api.get('/users').then((res) => setAllUsers(res.data || [])).catch(console.error)
  }

  const loadUser = () => {
    api.get('/auth/me').then((res) => {
      console.log('User role:', res.data?.role)
      setUser(res.data)
    }).catch(console.error)
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
      toast.success(user?.role === 'ADMIN' ? 'Tạo đề xuất thành công!' : 'Tạo đề xuất thành công!')
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

  const handleUnapprove = async () => {
    if (!selectedProposal) return
    setActionLoading(true)
    try {
      await api.post(`/recruitment/proposals/${selectedProposal.id}/unapprove`, {})
      toast.success('Hoàn duyệt thành công')
      loadProposals()
      setConfirmUnapprove(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedProposal) return
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do không duyệt')
      return
    }
    setActionLoading(true)
    try {
      await api.post(`/recruitment/proposals/${selectedProposal.id}/reject`, { reason: rejectReason })
      toast.success('Từ chối đề xuất thành công')
      loadProposals()
      setConfirmReject(false)
      setRejectReason('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(false)
    }
  }

  const canCreateCampaign = user && ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER'].includes(user.role)

  return (
    <div className="space-y-8">
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
          {!formData.isUntilFilled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          )}
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
              <li key={proposal.id} className="px-4 py-5 sm:px-6 hover:bg-gray-50 cursor-pointer border-b border-gray-100" onClick={() => { setSelectedProposal(proposal); setShowDetail(true) }} onContextMenu={e => handleContextMenu(e, proposal)}>
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
                        {typeof proposal.status === 'object' ? proposal.status?.name : proposal.status === 'APPROVED' ? 'Đã duyệt' : proposal.status === 'REJECTED' ? 'Từ chối' : proposal.status === 'SUBMITTED' ? 'Chờ duyệt' : proposal.status === 'AM_REVIEWED' ? 'AM đã xem xét' : 'Chờ duyệt'}
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
                    {canApprove && isPending(proposal.status) && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedProposal(proposal); setConfirmApprove(true) }} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Duyệt</button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedProposal(proposal); setConfirmReject(true) }} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Từ chối</button>
                      </>
                    )}
                    {canApprove && (typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'APPROVED' && !proposal.campaign && (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedProposal(proposal); setConfirmUnapprove(true) }} className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">Hoàn duyệt</button>
                    )}
                    {(typeof proposal.status === 'object' ? proposal.status?.code : proposal.status) === 'APPROVED' && !proposal.campaign && (
                      <button onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProposal(proposal)
                        setShowCreateCampaign(true)
                        setCampaignFormData({
                          name: `${proposal.title} - Chiến dịch`,
                          description: proposal.description || '',
                          storeId: proposal.store?.id || '',
                          positionId: proposal.position?.id || '',
                          quantity: proposal.quantity,
                          picId: user?.id || '',
                          recruiterId: user?.id || '',
                          isActive: true,
                        })
                      }} className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
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
          <button onClick={() => { setSelectedProposal(contextMenu.proposal); setContextMenu(null); setShowDetail(true) }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700">
            <Icon name="eye" size={14} /> Xem chi tiết
          </button>
          {canApprove && isPending(contextMenu.proposal.status) && (
            <>
              <button onClick={() => { setSelectedProposal(contextMenu.proposal); setConfirmApprove(true); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-green-600">
                <Icon name="check" size={14} /> Duyệt
              </button>
              <button onClick={() => { setSelectedProposal(contextMenu.proposal); setConfirmReject(true); setContextMenu(null) }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600">
                <Icon name="x" size={14} /> Từ chối
              </button>
            </>
          )}
          {canCreateCampaign && (
            <button onClick={() => {
              const proposal = contextMenu.proposal
              setSelectedProposal(proposal)
              setContextMenu(null)
              setShowCreateCampaign(true)
              setCampaignFormData({
                name: `${proposal.title} - Chiến dịch`,
                description: proposal.description || '',
                storeId: proposal.store?.id || '',
                positionId: proposal.position?.id || '',
                quantity: proposal.quantity,
                picId: user?.id || '',
                recruiterId: user?.id || '',
                isActive: true,
              })
            }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-yellow-600">
              <Icon name="megaphone" size={14} /> Tạo chiến dịch
            </button>
          )}
          <button onClick={() => { setSelectedProposal(contextMenu.proposal); setContextMenu(null); setConfirmDelete(true) }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600">
            <Icon name="trash" size={14} /> Xóa
          </button>
        </div>
      )}

      <Modal isOpen={showCreateCampaign} onClose={() => setShowCreateCampaign(false)} title="Tạo chiến dịch" maxWidth="max-w-2xl">
        <form onSubmit={async e => {
          e.preventDefault()
          if (!selectedProposal || !campaignFormData.name || !campaignFormData.storeId || !campaignFormData.positionId) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
          }
          try {
            await api.post('/recruitment/campaigns', {
              name: campaignFormData.name,
              description: campaignFormData.description,
              storeId: campaignFormData.storeId,
              positionId: campaignFormData.positionId,
              quantity: campaignFormData.quantity,
              picId: campaignFormData.picId || undefined,
              recruiterId: campaignFormData.recruiterId || undefined,
              proposalId: selectedProposal.id,
              isActive: campaignFormData.isActive,
              isUntilFilled: selectedProposal.isUntilFilled,
              startDate: selectedProposal.startDate,
              endDate: selectedProposal.endDate,
            })
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng <span className="text-red-500">*</span></label>
              <select value={campaignFormData.storeId} onChange={e => setCampaignFormData({ ...campaignFormData, storeId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Chọn cửa hàng</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí <span className="text-red-500">*</span></label>
              <select value={campaignFormData.positionId} onChange={e => setCampaignFormData({ ...campaignFormData, positionId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Chọn vị trí</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tuyển</label>
              <input type="number" value={campaignFormData.quantity} onChange={e => setCampaignFormData({ ...campaignFormData, quantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách</label>
              <select value={campaignFormData.picId} onChange={e => setCampaignFormData({ ...campaignFormData, picId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Chọn người phụ trách</option>
                {allUsers.filter(u => ['ADMIN', 'RECRUITER', 'HEAD_OF_DEPARTMENT', 'MANAGER'].includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Người lọc hồ sơ</label>
            <select value={campaignFormData.recruiterId} onChange={e => setCampaignFormData({ ...campaignFormData, recruiterId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Chọn người lọc hồ sơ</option>
              {allUsers.filter(u => ['ADMIN', 'RECRUITER', 'HEAD_OF_DEPARTMENT', 'MANAGER'].includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
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

      <ConfirmDialog isOpen={confirmReject} title="Từ chối đề xuất" message={selectedProposal ? `Bạn có chắc muốn từ chối đề xuất "${selectedProposal.title}"? Vui lòng nhập lý do.` : ''} confirmText="Từ chối" onConfirm={handleReject} onClose={() => { setConfirmReject(false); setRejectReason('') }} isLoading={actionLoading} destructive>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Lý do không duyệt <span className="text-red-500">*</span></label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
            placeholder="Nhập lý do không duyệt đề xuất..."
            autoFocus
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog isOpen={confirmUnapprove} title="Hoàn duyệt đề xuất" message={selectedProposal ? `Bạn có chắc muốn hoàn duyệt đề xuất "${selectedProposal.title}"? Đề xuất sẽ quay lại trạng thái chờ duyệt.` : ''} confirmText="Hoàn duyệt" onConfirm={handleUnapprove} onClose={() => setConfirmUnapprove(false)} isLoading={actionLoading} destructive />

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Chi tiết đề xuất" maxWidth="max-w-2xl">
        {selectedProposal && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedProposal.title}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                selectedProposal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                selectedProposal.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                selectedProposal.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
                selectedProposal.status === 'AM_REVIEWED' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedProposal.status === 'APPROVED' ? 'Đã duyệt' : selectedProposal.status === 'REJECTED' ? 'Từ chối' : selectedProposal.status === 'SUBMITTED' ? 'Chờ duyệt' : selectedProposal.status === 'AM_REVIEWED' ? 'AM đã xem xét' : 'Chờ duyệt'}
              </span>
            </div>
            {/* Workflow Steps Indicator */}
            {(() => {
              const status = typeof selectedProposal.status === 'object' ? selectedProposal.status?.code : selectedProposal.status;
              const workflowHistory = (selectedProposal as any).workflowHistory || [];
              const submitEntry = workflowHistory.find((w: any) => w.action === 'SUBMIT');
              const isCreatedByAdmin = submitEntry && ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER'].includes(submitEntry.actorRole || '');
              
              const statusOrder = isCreatedByAdmin 
                ? ['SUBMITTED', 'APPROVED'] 
                : ['SUBMITTED', 'AM_REVIEWED', 'APPROVED'];
              
              const isCompleted = (checkStatus: string) => {
                return statusOrder.indexOf(status || '') >= statusOrder.indexOf(checkStatus);
              };
              const isCurrent = (checkStatus: string) => status === checkStatus;
              return (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Tiến trình phê duyệt</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrent('SUBMITTED') ? 'bg-yellow-100 border-2 border-yellow-500' : isCompleted('SUBMITTED') ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100 border-2 border-gray-300'}`}>
                        {isCompleted('SUBMITTED') && <span className="text-green-600">✓</span>}
                        {isCurrent('SUBMITTED') && <span className="text-yellow-600 text-sm font-bold">1</span>}
                        {!isCompleted('SUBMITTED') && !isCurrent('SUBMITTED') && <span className="text-gray-400 text-sm font-bold">1</span>}
                      </div>
                      <span className="ml-2 text-sm font-medium">{isCreatedByAdmin ? 'Admin tạo' : 'SM tạo'}</span>
                    </div>
                    {!isCreatedByAdmin && (
                      <>
                        <div className={`flex-1 h-0.5 mx-2 ${isCompleted('AM_REVIEWED') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrent('AM_REVIEWED') ? 'bg-yellow-100 border-2 border-yellow-500' : isCompleted('AM_REVIEWED') ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100 border-2 border-gray-300'}`}>
                            {isCompleted('AM_REVIEWED') && <span className="text-green-600">✓</span>}
                            {isCurrent('AM_REVIEWED') && <span className="text-yellow-600 text-sm font-bold">2</span>}
                            {!isCompleted('AM_REVIEWED') && !isCurrent('AM_REVIEWED') && <span className="text-gray-400 text-sm font-bold">2</span>}
                          </div>
                          <span className="ml-2 text-sm font-medium">AM duyệt</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 ${isCompleted('APPROVED') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      </>
                    )}
                    {isCreatedByAdmin && (
                      <div className={`flex-1 h-0.5 mx-2 ${isCompleted('APPROVED') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    )}
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrent('APPROVED') ? 'bg-yellow-100 border-2 border-yellow-500' : isCompleted('APPROVED') ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100 border-2 border-gray-300'}`}>
                        {isCompleted('APPROVED') && <span className="text-green-600">✓</span>}
                        {isCurrent('APPROVED') && <span className="text-yellow-600 text-sm font-bold">{isCreatedByAdmin ? '2' : '3'}</span>}
                        {!isCompleted('APPROVED') && !isCurrent('APPROVED') && <span className="text-gray-400 text-sm font-bold">{isCreatedByAdmin ? '2' : '3'}</span>}
                      </div>
                      <span className="ml-2 text-sm font-medium">Admin duyệt</span>
                    </div>
                  </div>
                  {!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status || '') && (
                    <p className="mt-3 text-sm text-yellow-600 font-medium">
                      {status === 'SUBMITTED' && (isCreatedByAdmin ? '→ Đang chờ Admin duyệt' : '→ Đang chờ AM duyệt')}
                      {status === 'AM_REVIEWED' && '→ Đang chờ Admin duyệt'}
                    </p>
                  )}
                  {status === 'REJECTED' && (
                    <p className="mt-3 text-sm text-red-600 font-medium">
                      → Đề xuất đã bị từ chối {selectedProposal.rejectionReason && `- Lý do: ${selectedProposal.rejectionReason}`}
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="text-gray-500">Cửa hàng</label><p className="font-medium">{selectedProposal.store?.name || 'N/A'}</p></div>
              <div><label className="text-gray-500">Vị trí</label><p className="font-medium">{selectedProposal.position?.name || 'N/A'}</p></div>
              <div><label className="text-gray-500">Số lượng</label><p className="font-medium">{selectedProposal.quantity}</p></div>
              <div><label className="text-gray-500">Loại</label><p className="font-medium">{selectedProposal.isUnplanned ? 'Đột xuất' : 'Theo kế hoạch'}</p></div>
            </div>
            {selectedProposal.description && <div><label className="text-gray-500 text-sm">Mô tả</label><p className="text-sm">{selectedProposal.description}</p></div>}
            {selectedProposal.reason && <div><label className="text-gray-500 text-sm">Lý do</label><p className="text-sm">{selectedProposal.reason}</p></div>}
            
            {/* Workflow Timeline */}
            {selectedProposal.workflowHistory && selectedProposal.workflowHistory.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Lịch sử duyệt</h4>
                <div className="space-y-3">
                  {selectedProposal.workflowHistory.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((w, idx) => (
                    <div key={w.id} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${w.toStatus === 'APPROVED' ? 'bg-green-500' : w.toStatus === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                        {idx < selectedProposal.workflowHistory!.length - 1 && <div className="w-0.5 h-full bg-gray-300 mt-1"></div>}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{w.action === 'SUBMIT' ? 'Tạo đề xuất' : w.action === 'REVIEW' ? 'AM xem xét' : w.action === 'APPROVE' ? 'Duyệt' : w.action === 'REJECT' ? 'Từ chối' : w.action === 'UNAPPROVE' ? 'Hoàn duyệt' : w.action}</span>
                          <span className="text-gray-500 text-xs">{new Date(w.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <p className="text-gray-600 text-xs">{w.actor?.fullName || w.actorRole} {w.notes && `- ${w.notes}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button onClick={() => setShowDetail(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Đóng</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}