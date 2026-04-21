'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Position {
  id: string
  name: string
  code: string
  description: string | null
  isActive: boolean
}

interface User {
  role: string
}

export default function PositionsManagement() {
  const [user, setUser] = useState<User | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
  })

  useEffect(() => {
    loadUser()
    loadPositions()
  }, [])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadPositions = () => {
    api
      .get('/positions?all=true')
      .then((res) => setPositions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleEdit = (pos: Position) => {
    setEditingPosition(pos)
    setFormData({
      code: pos.code,
      name: pos.name,
      description: pos.description || '',
      isActive: pos.isActive,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingPosition) {
        await api.patch(`/positions/${editingPosition.id}`, formData)
      } else {
        await api.post('/positions', formData)
      }
      setShowForm(false)
      setEditingPosition(null)
      setFormData({ code: '', name: '', description: '', isActive: true })
      loadPositions()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vị trí này?')) return
    try {
      await api.delete(`/positions/${id}`)
      loadPositions()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const isAdmin = user && user.role === 'ADMIN'

  if (loading) return <div className="text-center py-4">Đang tải...</div>

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Chỉ quản trị viên mới có thể quản lý vị trí</p>
        </div>
      )}

      {isAdmin && (
        <>
          {showForm && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">
                {editingPosition ? 'Sửa' : 'Tạo mới'} vị trí
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã vị trí <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên vị trí <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Kích hoạt</span>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingPosition(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    {editingPosition ? 'Lưu' : 'Tạo'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingPosition(null)
                setFormData({ code: '', name: '', description: '', isActive: true })
                setShowForm(true)
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Tạo vị trí mới
            </button>
          </div>
        </>
      )}

      {/* List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {positions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Không có dữ liệu</td>
              </tr>
            ) : (
              positions.map((pos) => (
                <tr key={pos.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pos.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>{pos.name}</div>
                    <div className="text-xs text-gray-400">{pos.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pos.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {pos.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(pos)} className="text-yellow-600 hover:text-yellow-900">
                          Sửa
                        </button>
                        <button onClick={() => handleDelete(pos.id)} className="text-red-600 hover:text-red-900">
                          Xóa
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
