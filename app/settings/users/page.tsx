'use client'

import { useState, useEffect, useRef, createContext, useContext } from 'react'
import readXlsxFile from 'read-excel-file'
import writeXlsxFile from 'write-excel-file'
import { toast } from 'sonner'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
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
  managedStore?: { id: string; name: string; code: string } | null
  managedStores?: { id: string; name: string; code: string }[]
}

const ROLE_LABELS: Record<string, string> = {
  USER: 'User (TA)',
  SM: 'SM',
  AM: 'AM',
  MANAGER: 'AM',
  RECRUITER: 'Recruiter',
  HEAD_OF_DEPARTMENT: 'Head of Dept',
  ADMIN: 'Admin',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  AM: 'bg-blue-100 text-blue-800',
  USER: 'bg-gray-100 text-gray-800',
  SM: 'bg-gray-100 text-gray-800',
  RECRUITER: 'bg-green-100 text-green-800',
  HEAD_OF_DEPARTMENT: 'bg-orange-100 text-orange-800',
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', role: 'USER', isActive: true,
    storeId: '', storeIds: [] as string[],
  })
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

  useEffect(() => { loadUsers(); loadStores() }, [])

  const loadUsers = async () => {
    setLoading(true)
    try { const res = await api.get('/users'); setUsers(res.data) }
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
  const storesByCity = stores.reduce((acc, s) => {
    const city = s.city || 'Khác'
    if (!acc[city]) acc[city] = []
    acc[city].push(s)
    return acc
  }, {} as Record<string, Store[]>)

  const openCreate = () => {
    setEditingUser(null)
    setFormData({ fullName: '', email: '', phone: '', password: '', role: 'USER', isActive: true, storeId: '', storeIds: [] })
    setShowModal(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      isActive: user.isActive,
      storeId: user.managedStore?.id || '',
      storeIds: user.managedStores?.map(s => s.id) || [],
    })
    setShowModal(true)
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

  const handleExport = () => {
    void (async () => {
      try {
        const headers = ['Email', 'Họ và tên', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Cửa hàng']
        const data = filteredUsers.map(u => [
          u.email, u.fullName, u.phone || '',
          ROLE_LABELS[u.role] || u.role,
          u.isActive ? 'Hoạt động' : 'Đã khóa',
          u.managedStore?.code || u.managedStores?.map(s => s.code).join(', ') || '',
        ])
        const rows = [headers, ...data].map(row => row.map(value => ({ value })))
        await writeXlsxFile(rows, { fileName: `users_${new Date().toISOString().split('T')[0]}.xlsx` })
        toast.success(`Đã export ${filteredUsers.length} tài khoản`)
      } catch { toast.error('Không thể export') }
    })()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    try {
      const fileRows = await readXlsxFile(file)
      const headers = fileRows[0].map(v => String(v).trim())
      const roleMap: Record<string, string> = { 'user': 'USER', 'ta': 'USER', 'sm': 'USER', 'am': 'MANAGER', 'admin': 'ADMIN', 'recruiter': 'RECRUITER' }
      const usersToImport = fileRows.slice(1).filter(row => row.some(v => v)).map(row => {
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = String(row[i] || '').trim() })
        const roleKey = (obj['Vai trò'] || obj['role'] || '').toLowerCase()
        return {
          email: obj['Email'] || obj['email'],
          fullName: obj['Họ và tên'] || obj['fullName'] || obj['name'],
          phone: obj['Số điện thoại'] || obj['phone'] || '',
          role: roleMap[roleKey] || roleMap[roleKey.split('(')[0].trim()] || 'USER',
          isActive: !obj['Trạng thái'] || obj['Trạng thái'].toLowerCase() === 'hoạt động',
        }
      }).filter(u => u.email)
      const res = await api.post('/users/import', { users: usersToImport })
      setImportSummary(res.data)
      if (res.data.success > 0) toast.success(`Import thành công ${res.data.success} tài khoản`)
      loadUsers()
    } catch { toast.error('Lỗi khi đọc file Excel') }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const filteredUsers = users.filter(u => {
    if (filterRole && u.role !== filterRole) return false
    if (filterStatus === 'active' && !u.isActive) return false
    if (filterStatus === 'inactive' && u.isActive) return false
    return true
  })

  const isSMRole = formData.role === 'USER' || formData.role === 'SM'
  const isAMRole = formData.role === 'MANAGER' || formData.role === 'AM'

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Icon name="settings" size={24} className="text-gray-500" />Quản lý tài khoản
            </h2>
            <p className="text-sm text-gray-500 mt-1">Quản lý và phân quyền tài khoản, gán cửa hàng cho SM/AM</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
              <Icon name="download" size={18} /> Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer text-sm font-medium">
              <Icon name="upload" size={18} /> {importing ? 'Đang import...' : 'Import'}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-kfc-red text-white text-sm font-medium rounded-md hover:bg-red-700">
              <Icon name="plus" size={18} />Tạo tài khoản
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">Tất cả vai trò</option>
            <option value="USER">User / SM</option>
            <option value="MANAGER">AM (Manager)</option>
            <option value="RECRUITER">Recruiter</option>
            <option value="HEAD_OF_DEPARTMENT">Head of Dept</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
          <span className="text-sm text-gray-500 ml-auto">{filteredUsers.length} tài khoản</span>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tên tài khoản</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cửa hàng quản lý</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Đang tải...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Chưa có tài khoản nào</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onContextMenu={(e) => handleContextMenu(e, user)}
                    onClick={() => openEdit(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold">{user.fullName}</div>
                          <div className="text-xs text-gray-500">{user.phone || 'Chưa có SĐT'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
                <DialogTitle>{editingUser ? 'Cập nhật tài khoản' : 'Tạo mới tài khoản'}</DialogTitle>
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
                  <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v, storeId: '', storeIds: [] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User / SM (Store Manager)</SelectItem>
                      <SelectItem value="MANAGER">AM (Area Manager)</SelectItem>
                      <SelectItem value="RECRUITER">Recruiter (Tuyển dụng viên)</SelectItem>
                      <SelectItem value="HEAD_OF_DEPARTMENT">Head of Department</SelectItem>
                      <SelectItem value="ADMIN">Admin (Quản trị viên)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* SM: single store picker — grouped by city */}
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
                        {Object.entries(
                          availableForSM.reduce((acc, s) => {
                            const city = s.city || 'Khác'
                            if (!acc[city]) acc[city] = []
                            acc[city].push(s)
                            return acc
                          }, {} as Record<string, Store[]>)
                        ).sort(([a], [b]) => a.localeCompare(b)).map(([city, cityStores]) => (
                          <SelectGroup key={city}>
                            <SelectLabel className="font-bold text-gray-900 bg-gray-50 px-2 py-1.5 text-xs uppercase tracking-wide">
                              {city}
                            </SelectLabel>
                            {[...cityStores].sort((a, b) => a.code.localeCompare(b.code)).map(s => (
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
                      Vai trò <strong>{ROLE_LABELS[formData.role] || formData.role}</strong> có toàn quyền trên tất cả cửa hàng, không cần gán cụ thể.
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
                      {Object.entries(storesByCity).sort(([a], [b]) => a.localeCompare(b)).map(([city, cityStores]) => (
                        <div key={city}>
                          <div className="px-3 py-1.5 bg-gray-50 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700 uppercase">{city}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const ids = cityStores.map(s => s.id)
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
                              {cityStores.every(s => formData.storeIds.includes(s.id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                          </div>
                          {cityStores.map(s => (
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
                                  AM: {s.am.fullName.split(' ').pop()}
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
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Hủy bỏ</Button>
                  <Button type="submit" disabled={submitting} className="bg-kfc-red hover:bg-red-700">
                    {submitting ? 'Đang xử lý...' : 'Lưu tài khoản'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
              <Button onClick={() => setImportSummary(null)} className="bg-kfc-red hover:bg-red-700">Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  )
}