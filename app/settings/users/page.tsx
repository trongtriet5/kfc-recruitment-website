'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'

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
          <button onClick={() => { setEditingUser(null); setFormData({ fullName: '', email: '', phone: '', password: '', role: 'USER', isActive: true }); setShowModal(true) }} className="flex items-center gap-2 px-4 py-2 bg-kfc-red text-white text-sm font-medium rounded-md hover:bg-red-700">
            <Icon name="plus" size={18} />Tạo tài khoản
          </button>
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
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Chưa có tài khoản nào</td></tr>
              ) : (
                users.map((user) => (
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold">{editingUser ? 'Cập nhật tài khoản' : 'Tạo mới tài khoản'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><Icon name="x" size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="block text-sm font-semibold mb-1">Họ và tên <span className="text-red-500">*</span></label><input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-kfc-red outline-none" /></div>
                <div><label className="block text-sm font-semibold mb-1">Email <span className="text-red-500">*</span></label><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!editingUser} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-kfc-red outline-none disabled:bg-gray-100" /></div>
                <div><label className="block text-sm font-semibold mb-1">Số điện thoại</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-kfc-red outline-none" /></div>
                <div><label className="block text-sm font-semibold mb-1">Quyền truy cập</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-kfc-red outline-none"><option value="USER">User (Recruiter / TA)</option><option value="ADMIN">Admin (Quản trị viên)</option></select></div>
                <div><label className="block text-sm font-semibold mb-1">Mật khẩu {editingUser ? '(Bỏ trống nếu không đổi)' : <span className="text-red-500">*</span>}</label><input type="text" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingUser ? "••••••••" : "Ví dụ: kfc@123"} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-kfc-red outline-none" /></div>
                <div className="pt-4 flex justify-end gap-3 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Hủy bỏ</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-kfc-red text-white rounded-md hover:bg-red-700">{submitting ? 'Đang xử lý...' : 'Lưu tài khoản'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}