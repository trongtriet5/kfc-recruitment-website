'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface Store {
  id: string
  name: string
  code: string
  city: string | null
  zone: string | null
  group: string | null
  smId: string | null
  amId: string | null
  sm: { id: string; fullName: string } | null
  am: { id: string; fullName: string } | null
}

interface User {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  roleId?: string | null
  roleObj?: { id: string; name: string; code: string } | null
  managedStore?: { id: string; name: string; code: string } | null
  managedStores?: { id: string; name: string; code: string }[]
}

interface Role {
  id: string
  name: string
  code: string
  isActive: boolean
}

const ROLE_LABELS: Record<string, string> = {
  AM: 'AM',
  SM: 'SM',
  RECRUITER: 'Recruiter',
  ADMIN: 'Admin',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  AM: 'bg-blue-100 text-blue-800',
  SM: 'bg-gray-100 text-gray-800',
  RECRUITER: 'bg-green-100 text-green-800',
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', roleId: '', isActive: true,
    storeId: '', storeIds: [] as string[],
  })
  const [dbRoles, setDbRoles] = useState<Role[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; user: User } | null>(null)

  // Determine if user has full access (Admin, Recruiter)
  const hasFullAccess = (role: string) => ['ADMIN', 'RECRUITER'].includes(role)

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, user: User) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, user })
  }

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => { loadUsers(); loadStores(); loadRoles() }, [])

  const loadRoles = async () => {
    try {
      const res = await api.get('/roles')
      setDbRoles(res.data.filter((r: Role) => r.isActive))
    } catch (error) {
      console.error('Cannot load roles', error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try { 
      const res = await api.get('/users')
      // Transform fullName to fullName for UI
      const transformed = res.data.map((u: any) => ({
        ...u,
        fullName: u.fullName,
      }))
      setUsers(transformed) 
    }
    catch { toast.error('Không thể tải danh sách tài khoản') }
    finally { setLoading(false) }
  }

  const loadStores = async () => {
    try { const res = await api.get('/users/stores-for-assign'); setStores(res.data) }
    catch { console.error('Cannot load stores') }
  }

  // Stores available for SM: unassigned OR currently assigned to this user
  const availableForSM = stores.filter(s => !s.smId || s.smId === editingUser?.id)
  // Stores available for AM: any active store
  const storesByProvince = stores.reduce((acc, s) => {
    const province = s.city || 'Khác'
    if (!acc[province]) acc[province] = []
    acc[province].push(s)
    return acc
  }, {} as Record<string, Store[]>)

  const openCreate = () => {
    setEditingUser(null)
    setFormData({ fullName: '', email: '', phone: '', password: '', roleId: dbRoles.find(r => r.code === 'SM')?.id || '', isActive: true, storeId: '', storeIds: [] })
    setShowModal(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      password: '',
      roleId: user.roleId || '',
      isActive: user.isActive,
      storeId: user.managedStore?.id || '',
      storeIds: user.managedStores?.map(s => s.id) || [],
    })
    setShowModal(true)
  }

  const handleDuplicate = (user: User) => {
    setEditingUser(null)
    setFormData({
      fullName: `${user.fullName} (Copy)`,
      email: '',
      phone: user.phone || '',
      password: '',
      role: user.role,
      isActive: true,
      storeId: user.managedStore?.id || '',
      storeIds: user.managedStores?.map(s => s.id) || [],
    })
    setShowModal(true)
    setContextMenu(null)
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Bạn có chắc muốn ${user.isActive ? 'khóa' : 'mở khóa'} tài khoản ${user.fullName}?`)) return
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive })
      toast.success('Đã cập nhật trạng thái')
      loadUsers()
    } catch { toast.error('Có lỗi xảy ra') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: any = { ...formData }
      // SM role → storeId, AM/MANAGER role → storeIds
      if (payload.role === 'USER' || payload.role === 'SM') delete payload.storeIds
      else delete payload.storeId
      if (!payload.password) delete payload.password

      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, payload)
        toast.success('Cập nhật tài khoản thành công')
      } else {
        await api.post('/users', payload)
        toast.success('Tạo tài khoản thành công')
      }
      setShowModal(false)
      loadUsers()
      loadStores()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSubmitting(false) }
  }

  const toggleStoreId = (id: string) => {
    setFormData(prev => ({
      ...prev,
      storeIds: prev.storeIds.includes(id)
        ? prev.storeIds.filter(s => s !== id)
        : [...prev.storeIds, id],
    }))
  }

  const handleExport = async () => {
    try {
      const res = await api.get('/users/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Đã export danh sách tài khoản')
    } catch { toast.error('Không thể export') }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/users/import-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImportSummary(res.data)
      if (res.data.success > 0) toast.success(`Import thành công ${res.data.success} tài khoản`)
      loadUsers()
    } catch (err: any) { 
      toast.error(err.response?.data?.message || 'Lỗi khi import file Excel') 
    }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const filteredUsers = users.filter(u => {
    if (filterRole && u.role !== filterRole) return false
    if (filterStatus === 'active' && !u.isActive) return false
    if (filterStatus === 'inactive' && u.isActive) return false
    return true
  })

  const selectedRoleCode = dbRoles.find(r => r.id === formData.roleId)?.code || ''
  const isSMRole = selectedRoleCode === 'SM'
  const isAMRole = selectedRoleCode === 'AM'

  return (
    <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quản lý tài khoản</h3>
            <p className="text-sm text-gray-500">Quản lý và phân quyền tài khoản, gán cửa hàng cho SM/AM</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
              <Icon name="download" size={18} /> Export Excel
            </button>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer text-sm font-medium">
              <Icon name="upload" size={18} /> {importing ? 'Đang import...' : 'Import Excel'}
              <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-kfc-red text-white rounded-md hover:bg-red-700 text-sm font-medium">
              <Icon name="plus" size={18} /> Tạo tài khoản
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md sm:text-sm">
            <option value="">Tất cả vai trò</option>
            {dbRoles.map(role => (
              <option key={role.id} value={role.code}>{role.name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md sm:text-sm">
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
          <span className="text-sm text-gray-500 ml-auto">{filteredUsers.length} tài khoản</span>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tên tài khoản</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Vai trò</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Cửa hàng quản lý</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kfc-red mx-auto"></div></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400"><Icon name="user" size={48} className="mb-2 opacity-20 mx-auto" /><p>Không tìm thấy tài khoản nào</p></td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 cursor-pointer group"
                    onContextMenu={(e) => handleContextMenu(e, user)}
                    onClick={() => openEdit(user)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {user.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{user.fullName}</div>
                          <div className="text-xs text-gray-500">{user.phone || 'Chưa có SĐT'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}`}>
                        {user.roleObj?.name || ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {hasFullAccess(user.role) ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium">
                          <Icon name="shield" size={12} />Toàn quyền
                        </span>
                      ) : user.managedStore ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-medium">
                          <Icon name="store" size={12} />{user.managedStore.code} – {user.managedStore.name}
                        </span>
                      ) : user.managedStores && user.managedStores.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.managedStores.slice(0, 3).map(s => (
                            <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                              {s.code}
                            </span>
                          ))}
                          {user.managedStores.length > 3 && (
                            <span className="text-xs text-gray-400">+{user.managedStores.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Chưa gán</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="bg-kfc-red/10 p-2 rounded-lg text-kfc-red"><Icon name={editingUser ? 'pencil' : 'plus'} size={20} /></div>
                  {editingUser ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Họ và tên <span className="text-red-500">*</span></Label>
                  <Input required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                </div>
                <div>
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Vai trò</Label>
                  <Select 
                    value={formData.roleId} 
                    onValueChange={v => {
                      const selectedRole = dbRoles.find(r => r.id === v);
                      setFormData({ ...formData, roleId: v, storeId: '', storeIds: [] });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                    <SelectContent>
                      {dbRoles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name} ({role.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SM: single store picker — grouped by province */}
                {isSMRole && (
                  <div>
                    <Label className="flex items-center gap-1">
                      <Icon name="store" size={14} />
                      Cửa hàng quản lý
                    </Label>
                    <Select value={formData.storeId || '__none__'} onValueChange={v => setFormData({ ...formData, storeId: v === '__none__' ? '' : v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn cửa hàng..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Không gán —</SelectItem>
                        {Object.entries(storesByProvince).sort(([a], [b]) => a.localeCompare(b)).map(([province, provinceStores]) => (
                          <SelectGroup key={province}>
                            <SelectLabel className="font-bold text-gray-900 bg-gray-50 px-2 py-1.5 text-xs uppercase tracking-wide">
                              {province}
                            </SelectLabel>
                            {[...provinceStores].sort((a, b) => a.code.localeCompare(b.code)).map(s => (
                              <SelectItem key={s.id} value={s.id} className="pl-4">
                                {s.code} – {s.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400 mt-1">
                      Chỉ hiển thị cửa hàng chưa có SM. Mỗi SM quản lý 1 cửa hàng.
                    </p>
                  </div>
                )}

                {/* Roles with full access: no store picker needed */}
                {!isSMRole && !isAMRole && (
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700">
                      Vai trò <strong>{dbRoles.find(r => r.id === formData.roleId)?.name || 'Chưa chọn'}</strong> có toàn quyền trên tất cả cửa hàng, không cần gán cụ thể.
                    </p>
                  </div>
                )}

                {/* AM: multi-checkbox grouped by city */}
                {isAMRole && (
                  <div>
                    <Label className="flex items-center gap-1 mb-2">
                      <Icon name="store" size={14} />
                      Cửa hàng quản lý ({formData.storeIds.length} đã chọn)
                    </Label>
                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-100">
                      {Object.entries(storesByProvince).sort(([a], [b]) => a.localeCompare(b)).map(([province, provinceStores]) => (
                        <div key={province}>
                          <div className="px-3 py-1.5 bg-gray-50 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700 uppercase">{province}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const ids = provinceStores.map(s => s.id)
                                const allSelected = ids.every(id => formData.storeIds.includes(id))
                                setFormData(prev => ({
                                  ...prev,
                                  storeIds: allSelected
                                    ? prev.storeIds.filter(id => !ids.includes(id))
                                    : [...new Set([...prev.storeIds, ...ids])],
                                }))
                              }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {provinceStores.every(s => formData.storeIds.includes(s.id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                          </div>
                          {provinceStores.map(s => (
                            <label key={s.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.storeIds.includes(s.id)}
                                onChange={() => toggleStoreId(s.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm flex-1">
                                <span className="font-medium">{s.code}</span>
                                <span className="text-gray-500"> – {s.name}</span>
                              </span>
                              {s.am && s.am.id !== editingUser?.id && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                  AM: {s.am.fullName?.split(' ').pop() || 'N/A'}
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">AM có thể quản lý nhiều cửa hàng trong cùng khu vực.</p>
                  </div>
                )}

                <div>
                  <Label>Mật khẩu {editingUser ? '(Bỏ trống nếu không đổi)' : <span className="text-red-500">*</span>}</Label>
                  <Input
                    type="text"
                    required={!editingUser}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? '••••••••' : 'Ví dụ: kfc@123'}
                  />
                </div>

                <DialogFooter>
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Hủy bỏ</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-kfc-red text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50">
                    {submitting ? 'Đang xử lý...' : (editingUser ? 'Cập nhật' : 'Tạo mới')}
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => { openEdit(contextMenu.user); setContextMenu(null) }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Icon name="edit" size={14} /> Chỉnh sửa
          </button>
          <button
             onClick={() => handleDuplicate(contextMenu.user)}
             className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
           >
             <Icon name="copy" size={14} /> Nhân bản tài khoản
           </button>
           {contextMenu.user.email !== 'thinh.nguyenthevinh@kfcvietnam.com.vn' && (
             <button
               onClick={() => { handleDelete(contextMenu.user); setContextMenu(null) }}
               className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${contextMenu.user.isActive ? 'text-red-600' : 'text-green-600'}`}
             >
               <Icon name={contextMenu.user.isActive ? 'trash' : 'check'} size={14} />
               {contextMenu.user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
             </button>
           )}
        </div>
      )}

      {importSummary && (
        <Dialog open={!!importSummary} onOpenChange={() => setImportSummary(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Kết quả Import</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="rounded-lg bg-green-50 px-4 py-3">
                <div className="text-xs uppercase font-semibold text-green-700">Thành công</div>
                <div className="mt-1 text-2xl font-bold text-green-800">{importSummary.success}</div>
              </div>
              <div className="rounded-lg bg-red-50 px-4 py-3">
                <div className="text-xs uppercase font-semibold text-red-700">Lỗi</div>
                <div className="mt-1 text-2xl font-bold text-red-800">{importSummary.failed}</div>
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => setImportSummary(null)} className="px-4 py-2 bg-kfc-red text-white text-sm font-medium rounded-md hover:bg-red-700">Đóng</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}