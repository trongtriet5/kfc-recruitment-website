
'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'

interface Role {
  id: string
  name: string
  code: string
  description: string | null
  permissions: string[]
  isSystem: boolean
  isActive: boolean
}

export default function RolesManager() {
  const [roles, setRoles] = useState<Role[]>([])
  const [allPermissions, setAllPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions/metadata')
      ])
      setRoles(rolesRes.data)
      setAllPermissions(permsRes.data)
    } catch (error) {
      console.error(error)
      toast.error('Không thể tải dữ liệu vai trò')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingRole({
      name: '',
      code: '',
      description: '',
      permissions: [],
      isSystem: false,
      isActive: true
    })
    setIsModalOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingRole({ ...role })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!editingRole?.name || !editingRole?.code) {
      toast.error('Vui lòng nhập tên và mã vai trò')
      return
    }

    setSaving(true)
    try {
      if (editingRole.id) {
        await api.patch(`/roles/${editingRole.id}`, editingRole)
        toast.success('Cập nhật vai trò thành công')
      } else {
        await api.post('/roles', editingRole)
        toast.success('Tạo vai trò thành công')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vai trò này?')) return

    try {
      await api.delete(`/roles/${id}`)
      toast.success('Xóa vai trò thành công')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa vai trò')
    }
  }

  const togglePermission = (perm: string) => {
    if (!editingRole) return
    const current = editingRole.permissions || []
    if (current.includes(perm)) {
      setEditingRole({ ...editingRole, permissions: current.filter(p => p !== perm) })
    } else {
      setEditingRole({ ...editingRole, permissions: [...current, perm] })
    }
  }

  // Define friendly labels for permissions
  const PERMISSION_LABELS: Record<string, string> = {
    'REPORT_VIEW': 'Xem báo cáo thống kê',
    'REPORT_EXPORT': 'Xuất dữ liệu báo cáo',
    'CANDIDATE_READ': 'Xem danh sách ứng viên',
    'CANDIDATE_CREATE': 'Tạo mới ứng viên',
    'CANDIDATE_UPDATE': 'Cập nhật ứng viên',
    'CANDIDATE_DELETE': 'Xóa ứng viên',
    'CANDIDATE_STATUS_CHANGE': 'Thay đổi trạng thái',
    'CANDIDATE_ASSIGN_PIC': 'Gán người phụ trách',
    'CANDIDATE_TRANSFER_CAMPAIGN': 'Chuyển đổi chiến dịch',
    'CANDIDATE_BLACKLIST': 'Quản lý danh sách đen',
    'PROPOSAL_READ': 'Xem danh sách đề xuất',
    'PROPOSAL_CREATE': 'Tạo đề xuất mới',
    'PROPOSAL_UPDATE': 'Sửa đổi đề xuất',
    'PROPOSAL_DELETE': 'Xóa bỏ đề xuất',
    'PROPOSAL_SUBMIT': 'Gửi duyệt đề xuất',
    'PROPOSAL_REVIEW': 'Xem xét/Đánh giá đề xuất',
    'PROPOSAL_APPROVE': 'Phê duyệt đề xuất',
    'PROPOSAL_REJECT': 'Từ chối đề xuất',
    'PROPOSAL_CANCEL': 'Hủy bỏ đề xuất',
    'CAMPAIGN_READ': 'Xem danh sách chiến dịch',
    'CAMPAIGN_CREATE': 'Tạo chiến dịch mới',
    'CAMPAIGN_UPDATE': 'Sửa chiến dịch',
    'CAMPAIGN_DELETE': 'Xóa chiến dịch',
    'CAMPAIGN_MANAGE': 'Quản lý vận hành chiến dịch',
    'INTERVIEW_READ': 'Xem lịch phỏng vấn',
    'INTERVIEW_CREATE': 'Tạo lịch phỏng vấn',
    'INTERVIEW_UPDATE': 'Cập nhật kết quả phỏng vấn',
    'INTERVIEW_DELETE': 'Xóa lịch phỏng vấn',
    'OFFER_READ': 'Xem danh sách offer',
    'OFFER_CREATE': 'Tạo offer mới',
    'OFFER_UPDATE': 'Cập nhật offer',
    'OFFER_DELETE': 'Xóa offer',
    'OFFER_SEND': 'Gửi offer cho ứng viên',
    'SETTINGS_MANAGE': 'Quản lý cài đặt & Form',
    'USER_MANAGE': 'Quản lý người dùng & Vai trò',
  };

  // Explicitly group permissions as requested
  const permissionGroups = [
    { 
      name: 'Dashboard', 
      icon: 'layout',
      perms: allPermissions.filter(p => p.startsWith('REPORT')) 
    },
    { 
      name: 'Ứng viên', 
      icon: 'users',
      perms: allPermissions.filter(p => p.startsWith('CANDIDATE')) 
    },
    { 
      name: 'Form tuyển dụng', 
      icon: 'file-text',
      perms: allPermissions.filter(p => p.startsWith('SETTINGS') || p.startsWith('USER')) 
    },
    { 
      name: 'Đề xuất', 
      icon: 'clipboard-list',
      perms: allPermissions.filter(p => p.startsWith('PROPOSAL')) 
    },
    { 
      name: 'Chiến dịch', 
      icon: 'target',
      perms: allPermissions.filter(p => p.startsWith('CAMPAIGN')) 
    },
    { 
      name: 'Phỏng vấn', 
      icon: 'calendar',
      perms: allPermissions.filter(p => p.startsWith('INTERVIEW') || p.startsWith('OFFER')) 
    },
  ];

  // Check for any leftover permissions
  const assigned = new Set<string>();
  permissionGroups.forEach(g => g.perms.forEach(p => assigned.add(p)));
  const remaining = allPermissions.filter(p => !assigned.has(p));
  if (remaining.length > 0) {
    permissionGroups.push({ name: 'Khác', icon: 'shield', perms: remaining });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quản lý Vai trò</h3>
          <p className="text-sm text-gray-500">Định nghĩa vai trò và phân quyền chi tiết cho người dùng</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          <Icon name="plus" size={18} />
          <span>Thêm vai trò</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl border border-gray-200"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      {role.name}
                    </h4>
                    <code className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">{role.code}</code>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(role)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    {!role.isSystem && (
                      <button 
                        onClick={() => handleDelete(role.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                  {role.description || 'Chưa có mô tả cho vai trò này.'}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-green-50 text-green-600 rounded-md">
                      <Icon name="shield" size={14} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{role.permissions?.length || 0} quyền hạn</span>
                  </div>
                  <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${role.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {role.isActive ? 'Hoạt động' : 'Tạm khóa'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !saving && setIsModalOpen(false)}
          title={editingRole?.id ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Tên vai trò <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingRole?.name}
                  onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                  placeholder="VD: Trưởng phòng tuyển dụng"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-kfc-red/20 focus:border-kfc-red outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Mã định danh <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingRole?.code}
                  onChange={e => setEditingRole({ ...editingRole, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  disabled={!!editingRole?.id && editingRole?.isSystem}
                  placeholder="VD: HEAD_RECRUITER"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-kfc-red/20 focus:border-kfc-red outline-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Mô tả</label>
              <textarea
                value={editingRole?.description || ''}
                onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-kfc-red/20 focus:border-kfc-red outline-none"
                placeholder="Nhập mô tả ngắn về vai trò này..."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">Bảng phân quyền chi tiết</label>
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => setEditingRole({ ...editingRole, permissions: [...allPermissions] })}
                    className="text-xs text-blue-600 hover:underline font-medium"
                   >
                     Chọn tất cả
                   </button>
                   <button 
                    onClick={() => setEditingRole({ ...editingRole, permissions: [] })}
                    className="text-xs text-gray-500 hover:underline font-medium"
                   >
                     Bỏ chọn hết
                   </button>
                </div>
              </div>

              <div className="max-h-[450px] overflow-y-auto pr-2 space-y-6 custom-scrollbar pb-6">
                {permissionGroups.filter(g => g.perms.length > 0).map((group) => (
                  <div key={group.name} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-1 bg-gray-100"></div>
                      <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        {group.name}
                      </h5>
                      <div className="h-[1px] flex-1 bg-gray-100"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.perms.map(perm => {
                        const isSelected = editingRole?.permissions?.includes(perm);
                        return (
                          <label 
                            key={perm} 
                            className={`
                              flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none
                              ${isSelected 
                                ? 'bg-gray-50 border-gray-900 text-gray-900 shadow-sm' 
                                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}
                            `}
                          >
                            <div className={`
                              w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-all flex-shrink-0
                              ${isSelected 
                                ? 'bg-gray-900 border-gray-900 text-white' 
                                : 'bg-white border-gray-300 text-transparent'}
                            `}>
                              <Icon name="check" size={10} />
                            </div>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isSelected}
                              onChange={() => togglePermission(perm)}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className={`text-sm font-semibold leading-snug ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                {PERMISSION_LABELS[perm] || perm}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>



            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={editingRole?.isActive}
                  onChange={e => setEditingRole({ ...editingRole, isActive: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">Kích hoạt vai trò này</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-2 bg-kfc-red text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {editingRole?.id ? 'Lưu thay đổi' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
