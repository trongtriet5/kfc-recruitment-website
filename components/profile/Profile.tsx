'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'

interface User {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: string
  department: { id: string; name: string } | null
  position: { id: string; name: string } | null
  employee: { id: string; employeeCode: string } | null
  createdAt: string
  updatedAt: string
}

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await api.get('/auth/me')
      const userData = res.data
      setUser(userData)
      setFormData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validate password if changing
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('Vui lòng nhập mật khẩu hiện tại')
        return
      }
      if (formData.newPassword.length < 6) {
        setError('Mật khẩu mới phải có ít nhất 6 ký tự')
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
      }

      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword
        payload.newPassword = formData.newPassword
      }

      await api.patch('/auth/profile', payload)
      setSuccess('Đã cập nhật thông tin thành công!')
      setEditing(false)
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      loadProfile() // Reload to get updated data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin')
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Quản trị viên',
      HR: 'Nhân sự',
      MANAGER: 'Quản lý',
      EMPLOYEE: 'Nhân viên',
    }
    return labels[role] || role
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Đang tải...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600">Không thể tải thông tin profile</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.fullName || 'Unknown'}</h1>
                <p className="text-sm text-gray-600">{getRoleLabel(user.role)}</p>
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
              >
                <Icon name="edit" size={18} />
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              ) : (
                <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">{user.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              {editing ? (
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              ) : (
                <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">{user.email || 'N/A'}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              {editing ? (
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              ) : (
                <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">
                  {user.phone || 'Chưa có'}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">
                {getRoleLabel(user.role)}
              </p>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
              <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">
                {user.department?.name || 'Chưa có'}
              </p>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
              <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">
                {user.position?.name || 'Chưa có'}
              </p>
            </div>

            {/* Employee Code */}
            {user.employee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân viên</label>
                <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">
                  {user.employee.employeeCode}
                </p>
              </div>
            )}

            {/* Created At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo tài khoản</label>
              <p className="px-3 py-2 text-gray-900 bg-gray-50 rounded-md">
                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Password Change Section */}
          {editing && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Đổi mật khẩu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Chỉ điền nếu muốn đổi mật khẩu"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Để trống nếu không muốn đổi mật khẩu
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {editing && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setError(null)
                  setSuccess(null)
                  loadProfile() // Reset form
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Icon name="check" size={18} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

