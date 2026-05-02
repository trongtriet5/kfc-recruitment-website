'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface Source {
  id: string
  name: string
  code: string
  description: string | null
  isActive: boolean
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSource, setEditingSource] = useState<Source | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '', description: '', isActive: true })
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { loadSources() }, [])

  const loadSources = async () => {
    setLoading(true)
    try {
      const res = await api.get('/recruitment/sources')
      setSources(res.data || [])
    } catch { toast.error('Không thể tải danh sách nguồn tuyển dụng') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditingSource(null)
    setFormData({ name: '', code: '', description: '', isActive: true })
    setShowModal(true)
  }

  const openEdit = (source: Source) => {
    setEditingSource(source)
    setFormData({ name: source.name, code: source.code, description: source.description || '', isActive: source.isActive })
    setShowModal(true)
  }

  const handleDelete = async (source: Source) => {
    if (!confirm(`Bạn có chắc muốn ${source.isActive ? 'vô hiệu hóa' : 'kích hoạt'} nguồn "${source.name}"?`)) return
    try {
      await api.delete(`/recruitment/sources/${source.id}`)
      toast.success('Đã cập nhật trạng thái')
      loadSources()
    } catch { toast.error('Có lỗi xảy ra') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingSource) {
        await api.patch(`/recruitment/sources/${editingSource.id}`, formData)
        toast.success('Cập nhật thành công')
      } else {
        await api.post('/recruitment/sources', formData)
        toast.success('Tạo mới thành công')
      }
      setShowModal(false)
      loadSources()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSubmitting(false) }
  }

  const filteredSources = sources.filter(s => {
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase()) && !s.code.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterStatus === 'active' && !s.isActive) return false
    if (filterStatus === 'inactive' && s.isActive) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Nguồn tuyển dụng</h3>
          <p className="text-sm text-gray-500">Quản lý các nguồn tuyển dụng (Facebook, Job Board, Referral...)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-kfc-red text-white rounded-md hover:bg-red-700 text-sm font-medium">
          <Icon name="plus" size={18} /> Thêm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icon name="search" size={18} className="text-gray-400" /></div>
          <input type="text" placeholder="Tìm theo mã hoặc tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-kfc-red focus:border-kfc-red outline-none sm:text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md sm:text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Đã vô hiệu hóa</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filteredSources.length} nguồn</span>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kfc-red"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-32">Mã</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tên nguồn</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Mô tả</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-32">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSources.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400"><Icon name="link" size={48} className="mb-2 opacity-20 mx-auto" /><p>Không tìm thấy nguồn nào</p></td></tr>
              ) : (
                filteredSources.map((source, idx) => (
                  <tr key={source.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 text-sm font-bold text-kfc-red">{source.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {source.name}
                      {source.isActive === false && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">INACTIVE</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{source.description || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${source.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {source.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right space-x-3">
                      <button onClick={() => openEdit(source)} className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded" title="Chỉnh sửa"><Icon name="pencil" size={16} /></button>
                      <button onClick={() => handleDelete(source)} className="text-gray-400 hover:text-kfc-red p-1 hover:bg-red-50 rounded" title={source.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}><Icon name="trash" size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="bg-kfc-red/10 p-2 rounded-lg text-kfc-red"><Icon name={editingSource ? 'pencil' : 'plus'} size={20} /></div>
              {editingSource ? 'Chỉnh sửa nguồn' : 'Tạo nguồn mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mã nguồn <span className="text-red-500">*</span></Label>
                <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required placeholder="VD: FACEBOOK" />
              </div>
              <div>
                <Label>Tên nguồn <span className="text-red-500">*</span></Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="VD: Facebook Ads" />
              </div>
            </div>
            <div>
              <Label>Mô tả</Label>
              <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Mô tả ngắn..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4" />
              <span className="text-sm text-gray-700">Hoạt động</span>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Hủy bỏ</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-kfc-red text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50">
                {submitting ? 'Đang xử lý...' : (editingSource ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
