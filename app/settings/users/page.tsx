'use client'

import { useState, useEffect, useRef } from 'react'
import readXlsxFile from 'read-excel-file'
import writeXlsxFile from 'write-excel-file'
import { toast } from 'sonner'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface User {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', role: 'USER', isActive: true })
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch (error) { toast.error('Không thể tải danh sách tài khoản') }
    finally { setLoading(false) }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({ fullName: user.fullName, email: user.email, phone: user.phone || '', password: '', role: user.role, isActive: user.isActive })
    setShowModal(true)
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Bạn có chắc chắn muốn vô hiệu hóa tài khoản của ${user.fullName}?`)) return
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive })
      toast.success(`Đã cập nhật trạng thái tài khoản ${user.fullName}`)
      loadUsers()
    } catch (error) { toast.error('Có lỗi xảy ra') }
  }

  const handleExport = () => {
    void (async () => {
      try {
        const roleLabels: Record<string, string> = { USER: 'User (TA)', SM: 'SM (Store Manager)', AM: 'AM (Area Manager)', ADMIN: 'Admin' }
        const headers = ['Email', 'Họ và tên', 'Số điện thoại', 'Vai trò', 'Trạng thái']
        const data = filteredUsers.map((u) => [u.email, u.fullName, u.phone || '', roleLabels[u.role] || u.role, u.isActive ? 'Hoạt động' : 'Đã khóa'])
        const exportRows = [headers, ...data].map((row) => row.map((value) => ({ value })))
        await writeXlsxFile(exportRows, { fileName: `users_${new Date().toISOString().split('T')[0]}.xlsx` })
        toast.success(`Đã export ${filteredUsers.length} tài khoản`)
      } catch (err) { toast.error('Không thể export file Excel') }
    })()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const fileRows = await readXlsxFile(file)
      const headers = fileRows[0].map((v) => String(v).trim())
      const roleMap: Record<string, string> = { 'user': 'USER', 'ta': 'USER', 'sm': 'SM', 'am': 'AM', 'admin': 'ADMIN' }
      const usersToImport = fileRows.slice(1).filter((row) => row.some((v) => v)).map((row) => {
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = String(row[i] || '').trim() })
        const roleKey = (obj['Vai trò'] || obj['role'] || '').toLowerCase()
        return {
          email: obj['Email'] || obj['email'],
          fullName: obj['Họ và tên'] || obj['fullName'] || obj['Họ tên'] || obj['name'],
          phone: obj['Số điện thoại'] || obj['phone'] || obj['SDT'] || '',
          role: roleMap[roleKey] || roleMap[roleKey.split('(')[0].trim()] || 'USER',
          isActive: !obj['Trạng thái'] || obj['Trạng thái'].toLowerCase() === 'hoạt động' || obj['status']?.toLowerCase() === 'active',
        }
      }).filter((u) => u.email)
      const res = await api.post('/users/import', { users: usersToImport })
      setImportSummary(res.data)
      if (res.data.success > 0) toast.success(`Import thành công ${res.data.success} tài khoản`)
      loadUsers()
    } catch (err) { toast.error('Lỗi khi đọc file Excel') }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const filteredUsers = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false
    if (filterStatus === 'active' && !u.isActive) return false
    if (filterStatus === 'inactive' && u.isActive) return false
    return true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, formData)
        toast.success('Cập nhật tài khoản thành công')
      } else {
        await api.post('/users', formData)
        toast.success('Tạo tài khoản mới thành công')
      }
      setShowModal(false)
      loadUsers()
    } catch (error: any) { toast.error(error.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSubmitting(false) }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Icon name="settings" size={24} className="text-gray-500" />Cấu hình hệ thống</h2>
            <p className="text-sm text-gray-500 mt-1">Quản lý và phân quyền tài khoản truy cập hệ thống</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
              <Icon name="download" size={18} /> Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer text-sm font-medium">
              <Icon name="upload" size={18} /> {importing ? 'Đang import...' : 'Import'}
              <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={() => { setEditingUser(null); setFormData({ fullName: '', email: '', phone: '', password: '', role: 'USER', isActive: true }); setShowModal(true) }} className="flex items-center gap-2 px-4 py-2 bg-kfc-red text-white text-sm font-medium rounded-md hover:bg-red-700">
              <Icon name="plus" size={18} />Tạo tài khoản
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">Tất cả vai trò</option>
            <option value="USER">User (TA)</option>
            <option value="SM">SM (Store Manager)</option>
            <option value="AM">AM (Area Manager)</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tên tài khoản</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vai trò</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Đang tải...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Chưa có tài khoản nào</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{user.fullName.charAt(0)}</div><div><div className="text-sm font-bold">{user.fullName}</div><div className="text-xs text-gray-500">{user.phone || 'Chưa cập nhật SĐT'}</div></div></div></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{user.role}</span></td>
                    <td className="px-6 py-4 text-center"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.isActive ? 'Hoạt động' : 'Đã khóa'}</span></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-md"><Icon name="edit" size={16} /></button>
                      {user.email !== 'thinh.nguyenthevinh@kfcvietnam.com.vn' && <button onClick={() => handleDelete(user)} className={`p-2 rounded-md ${user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}><Icon name={user.isActive ? "trash" : "check"} size={16} /></button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Cập nhật tài khoản' : 'Tạo mới tài khoản'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Họ và tên <span className="text-red-500">*</span></Label><Input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
                <div><Label>Email <span className="text-red-500">*</span></Label><Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!editingUser} /></div>
                <div><Label>Số điện thoại</Label><Input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div><Label>Quyền truy cập</Label>
                  <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User (TA - Tuyển dụng viên)</SelectItem>
                      <SelectItem value="SM">SM (Store Manager - Quản lý cửa hàng)</SelectItem>
                      <SelectItem value="AM">AM (Area Manager - Quản lý khu vực)</SelectItem>
                      <SelectItem value="ADMIN">Admin (Quản trị viên)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Mật khẩu {editingUser ? '(Bỏ trống nếu không đổi)' : <span className="text-red-500">*</span>}</Label><Input type="text" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingUser ? "••••••••" : "Ví dụ: kfc@123"} /></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Hủy bỏ</Button>
                  <Button type="submit" disabled={submitting} className="bg-kfc-red hover:bg-red-700">{submitting ? 'Đang xử lý...' : 'Lưu tài khoản'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {importSummary && (
          <Dialog open={!!importSummary} onOpenChange={() => setImportSummary(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kết quả Import</DialogTitle>
              </DialogHeader>
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