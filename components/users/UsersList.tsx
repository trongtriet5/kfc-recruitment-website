'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { useClickOutside } from '@/hooks/useClickOutside'

interface User {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: string
  department: { id: string; name: string } | null
  position: { id: string; name: string } | null
  employee: { id: string; employeeCode: string } | null
  isActive: boolean
  createdAt: string
}

interface Department {
  id: string
  name: string
}

interface Position {
  id: string
  name: string
}

interface Employee {
  id: string
  employeeCode: string
  fullName: string
}

export default function UsersList() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'USER' as 'ADMIN' | 'HEAD_OF_DEPARTMENT' | 'MANAGER' | 'SUPERVISOR' | 'USER',
    departmentId: '',
    positionId: '',
    employeeId: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  useClickOutside(formRef, () => {
    if (showCreateForm || editingUser) {
      setShowCreateForm(false)
      setEditingUser(null)
      resetForm()
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersRes, departmentsRes, positionsRes, employeesRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/organization/departments'),
        api.get('/organization/positions'),
        api.get('/employees'),
      ])
      setUsers(usersRes.data)
      setDepartments(departmentsRes.data)
      setPositions(positionsRes.data)
      setEmployees(employeesRes.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: 'USER',
      departmentId: '',
      positionId: '',
      employeeId: '',
    })
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '', // Don't pre-fill password
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.role as any,
      departmentId: user.department?.id || '',
      positionId: user.position?.id || '',
      employeeId: user.employee?.id || '',
    })
    setShowCreateForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingUser) {
        // Update user
        const payload: any = {
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          role: formData.role,
          departmentId: formData.departmentId || undefined,
          positionId: formData.positionId || undefined,
          employeeId: formData.employeeId || undefined,
        }
        if (formData.password) {
          payload.password = formData.password
        }
        await api.patch(`/auth/users/${editingUser.id}`, payload)
      } else {
        // Create user
        if (!formData.password) {
          setError('Vui lòng nhập mật khẩu')
          setSubmitting(false)
          return
        }
        await api.post('/auth/users', formData)
      }
      setShowCreateForm(false)
      setEditingUser(null)
      resetForm()
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return
    }

    try {
      await api.delete(`/auth/users/${userId}`)
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa người dùng')
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Quản trị viên',
      HEAD_OF_DEPARTMENT: 'Trưởng phòng',
      MANAGER: 'Quản lý',
      SUPERVISOR: 'Giám sát',
      USER: 'Người dùng',
    }
    return labels[role] || role
  }

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <button
          onClick={() => {
            setShowCreateForm(true)
            setEditingUser(null)
            resetForm()
          }}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
        >
          <Icon name="add" size={18} />
          Thêm người dùng
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            ref={formRef}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'} {!editingUser && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required={!editingUser}
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  >
                    <option value="USER">Người dùng</option>
                    <option value="SUPERVISOR">Giám sát</option>
                    <option value="MANAGER">Quản lý</option>
                    <option value="HEAD_OF_DEPARTMENT">Trưởng phòng</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Chọn phòng ban</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                  <select
                    value={formData.positionId}
                    onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Chọn vị trí</option>
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Chọn nhân viên</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingUser ? 'Cập nhật' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Họ và tên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phòng ban
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vị trí
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.fullName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getRoleLabel(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.department?.name || '--'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.position?.name || '--'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Hoạt động' : 'Vô hiệu'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      <Icon name="edit" size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

