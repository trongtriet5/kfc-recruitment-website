'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface CandidateStatus {
  id: string
  name: string
  code: string
  color: string | null
  group: string | null
  order: number
  isActive: boolean
  slaHours: number | null
}

const GROUP_OPTIONS = ['new', 'screening', 'interview', 'offered', 'hired', 'rejected', 'other']
const GROUP_LABELS: Record<string, string> = {
  new: 'Mới',
  screening: 'Sàng lọc',
  interview: 'Phỏng vấn',
  offered: 'Đã đề nghị',
  hired: 'Đã tuyển',
  rejected: 'Từ chối',
  other: 'Khác',
  application: 'Ứng tuyển',
  offer: 'Mời việc',
  onboarding: 'Nhận việc',
  'Ứng tuyển': 'Ứng tuyển',
  'Phỏng vấn': 'Phỏng vấn',
  'Mời việc': 'Mời việc',
  'Nhận việc': 'Nhận việc',
}

const normalizeGroup = (group: string): string => {
  const lower = group.toLowerCase().trim()
  if (lower === 'application' || lower === 'ứng tuyển') return 'Ứng tuyển'
  if (lower === 'screening' || lower === 'sàng lọc') return 'Sàng lọc'
  if (lower === 'interview' || lower === 'phỏng vấn') return 'Phỏng vấn'
  if (lower === 'offered' || lower === 'offer' || lower === 'mời việc') return 'Mời việc'
  if (lower === 'hired' || lower === 'đã tuyển' || lower === 'onboarding' || lower === 'nhận việc') return 'Nhận việc'
  if (lower === 'rejected' || lower === 'từ chối') return 'Từ chối'
  if (lower === 'new' || lower === 'mới') return 'Mới'
  if (lower === 'other' || lower === 'khác') return 'Khác'
  return group
}

const COLOR_PRESETS = [
  { value: '#3B82F6', label: 'Xanh dương' },
  { value: '#10B981', label: 'Xanh lá' },
  { value: '#F59E0B', label: 'Vàng' },
  { value: '#EF4444', label: 'Đỏ' },
  { value: '#8B5CF6', label: 'Tím' },
  { value: '#6B7280', label: 'Xám' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#F97316', label: 'Cam' },
]

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<CandidateStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStatus, setEditingStatus] = useState<CandidateStatus | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '', color: '#3B82F6', group: 'new', order: 0, slaHours: null as number | null, isActive: true })
  const [submitting, setSubmitting] = useState(false)
  const [filterGroup, setFilterGroup] = useState('')

  useEffect(() => { loadStatuses() }, [])

  const loadStatuses = async () => {
    setLoading(true)
    try {
      const res = await api.get('/recruitment/statuses')
      setStatuses(res.data || [])
    } catch { toast.error('Không thể tải danh sách trạng thái') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditingStatus(null)
    setFormData({ name: '', code: '', color: '#3B82F6', group: 'new', order: statuses.length, slaHours: null, isActive: true })
    setShowModal(true)
  }

  const openEdit = (status: CandidateStatus) => {
    setEditingStatus(status)
    setFormData({ name: status.name, code: status.code, color: status.color || '#3B82F6', group: status.group || 'other', order: status.order ?? 0, slaHours: status.slaHours ?? null, isActive: status.isActive })
    setShowModal(true)
  }

  const handleDelete = async (status: CandidateStatus) => {
    if (!confirm(`Bạn có chắc muốn ${status.isActive ? 'vô hiệu hóa' : 'kích hoạt'} trạng thái "${status.name}"?`)) return
    try {
      await api.delete(`/recruitment/statuses/${status.id}`)
      toast.success('Đã cập nhật trạng thái')
      loadStatuses()
    } catch { toast.error('Có lỗi xảy ra') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingStatus) {
        await api.patch(`/recruitment/statuses/${editingStatus.id}`, formData)
        toast.success('Cập nhật thành công')
      } else {
        await api.post('/recruitment/statuses', formData)
        toast.success('Tạo mới thành công')
      }
      setShowModal(false)
      loadStatuses()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSubmitting(false) }
  }

  const filteredStatuses = statuses.filter(s => {
    const normalizedGroup = normalizeGroup(s.group || 'other')
    if (filterGroup && normalizedGroup !== filterGroup) return false
    return true
  })

  // Get unique groups from actual data, sorted by minimum order
  const uniqueGroups = [...new Set(filteredStatuses.map(s => normalizeGroup(s.group || 'other')))]
    .sort((a, b) => {
      const minA = Math.min(...filteredStatuses.filter(s => normalizeGroup(s.group || 'other') === a).map(s => s.order ?? 999))
      const minB = Math.min(...filteredStatuses.filter(s => normalizeGroup(s.group || 'other') === b).map(s => s.order ?? 999))
      return minA - minB
    })

  const getGroupLabel = (group: string) => GROUP_LABELS[group] || group

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Trạng thái ứng viên</h3>
          <p className="text-sm text-gray-500">Cấu hình các trạng thái trong quy trình tuyển dụng</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-kfc-red text-white rounded-md hover:bg-red-700 text-sm font-medium">
          <Icon name="plus" size={18} /> Thêm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md sm:text-sm">
          <option value="">Tất cả nhóm</option>
          {uniqueGroups.map(g => <option key={g} value={g}>{getGroupLabel(g)}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filteredStatuses.length} trạng thái</span>
      </div>

      {/* Grouped Statuses */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kfc-red"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {uniqueGroups.map(group => {
            const groupStatuses = filteredStatuses.filter(s => normalizeGroup(s.group || 'other') === group).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            if (groupStatuses.length === 0) return null

            return (
              <div key={group} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">{getGroupLabel(group)}</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-24">Mã</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tên</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-20">Thứ tự</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-28">Trạng thái</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {groupStatuses.map(status => (
                      <tr key={status.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-3 text-sm font-bold text-kfc-red">{status.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: status.color || '#9CA3AF' }}></span>
                            {status.name}
                            {status.isActive === false && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">INACTIVE</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">{status.order ?? 0}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${status.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {status.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right space-x-3">
                          <button onClick={() => openEdit(status)} className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded" title="Chỉnh sửa"><Icon name="pencil" size={16} /></button>
                          <button onClick={() => handleDelete(status)} className="text-gray-400 hover:text-kfc-red p-1 hover:bg-red-50 rounded" title={status.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}><Icon name="trash" size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
          {filteredStatuses.length === 0 && (
            <div className="bg-white shadow rounded-lg border border-gray-100">
              <div className="px-4 py-12 text-center text-gray-400">
                <Icon name="GitBranch" size={48} className="mb-2 opacity-20 mx-auto" />
                <p>Không tìm thấy trạng thái nào</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="bg-kfc-red/10 p-2 rounded-lg text-kfc-red"><Icon name={editingStatus ? 'pencil' : 'plus'} size={20} /></div>
              {editingStatus ? 'Chỉnh sửa trạng thái' : 'Tạo trạng thái mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mã <span className="text-red-500">*</span></Label>
                <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required placeholder="VD: NEW" />
              </div>
              <div>
                <Label>Tên <span className="text-red-500">*</span></Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="VD: Mới" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nhóm</Label>
                <select value={formData.group} onChange={e => setFormData({ ...formData, group: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-kfc-red focus:border-kfc-red outline-none">
                  {GROUP_OPTIONS.map(g => <option key={g} value={g}>{GROUP_LABELS[g]}</option>)}
                </select>
              </div>
              <div>
                <Label>Thứ tự</Label>
                <Input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Màu sắc</Label>
              <div className="flex gap-2 mt-1">
                {COLOR_PRESETS.map(c => (
                  <button key={c.value} type="button" onClick={() => setFormData({ ...formData, color: c.value })} className={`w-7 h-7 rounded-full border-2 transition-transform ${formData.color === c.value ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: c.value }} title={c.label} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4" />
              <span className="text-sm text-gray-700">Hoạt động</span>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Hủy bỏ</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-kfc-red text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50">
                {submitting ? 'Đang xử lý...' : (editingStatus ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
