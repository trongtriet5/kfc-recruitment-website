'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { getBrandLabel } from '@/lib/brand-utils'

interface Store {
  id: string
  name: string
  code: string
  address: string
  brand: 'MAYCHA' | 'TAM_HAO' | 'BOTH'
  isActive: boolean
}

interface User {
  role: string
}

export default function StoresManagement() {
  const [user, setUser] = useState<User | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    brand: 'MAYCHA' as 'MAYCHA' | 'TAM_HAO' | 'BOTH',
    isActive: true,
  })

  useEffect(() => {
    loadUser()
    loadStores()
  }, [])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadStores = () => {
    api
      .get('/stores?all=true')
      .then((res) => setStores(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleEdit = (store: Store) => {
    setEditingStore(store)
    setFormData({
      code: store.code,
      name: store.name,
      address: store.address,
      brand: store.brand,
      isActive: store.isActive,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingStore) {
        await api.patch(`/stores/${editingStore.id}`, formData)
      } else {
        await api.post('/stores', formData)
      }
      setShowForm(false)
      setEditingStore(null)
      setFormData({ code: '', name: '', address: '', brand: 'MAYCHA', isActive: true })
      loadStores()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cửa hàng này?')) return
    try {
      await api.delete(`/stores/${id}`)
      loadStores()
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
          <p className="text-yellow-800">Chỉ quản trị viên mới có thể quản lý cửa hàng</p>
        </div>
      )}

      {isAdmin && (
        <>
          {showForm && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">
                {editingStore ? 'Sửa' : 'Tạo mới'} cửa hàng
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã cửa hàng <span className="text-red-500">*</span>
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
                      Tên cửa hàng <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thương hiệu <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
<option value="TAM_HAO">Tam hảo</option>
                    <option value="BOTH">Cả hai</option>
                  </select>
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
                      setEditingStore(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    {editingStore ? 'Lưu' : 'Tạo'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingStore(null)
                setFormData({ code: '', name: '', address: '', brand: 'MAYCHA', isActive: true })
                setShowForm(true)
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Tạo cửa hàng mới
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên & Địa chỉ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thương hiệu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stores.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Không có dữ liệu</td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr key={store.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{store.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>{store.name}</div>
                    <div className="text-xs text-gray-400">{store.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getBrandLabel(store.brand)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {store.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(store)} className="text-yellow-600 hover:text-yellow-900">
                          Sửa
                        </button>
                        <button onClick={() => handleDelete(store.id)} className="text-red-600 hover:text-red-900">
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
