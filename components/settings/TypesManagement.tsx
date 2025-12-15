'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface TypeCategory {
  id: string
  code: string
  name: string
  description: string | null
  module: string
  isActive: boolean
  types: Type[]
  _count: { types: number }
}

interface Type {
  id: string
  code: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  order: number
  isDefault: boolean
  isActive: boolean
  metadata: any
}

interface User {
  role: string
}

const MODULES = [
  'EMPLOYEE',
  'REQUEST',
  'CONTRACT',
  'DECISION',
  'CANDIDATE',
  'INTERVIEW',
  'PROPOSAL',
  'TIMEKEEPING',
  'PAYROLL',
]

export default function TypesManagement() {
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<TypeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<TypeCategory | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    code: '',
    name: '',
    description: '',
    module: 'EMPLOYEE',
    isActive: true,
  })
  const [typeForm, setTypeForm] = useState({
    code: '',
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '',
    order: 0,
    isDefault: false,
    isActive: true,
  })

  useEffect(() => {
    loadUser()
    loadCategories()
  }, [])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadCategories = () => {
    api
      .get('/types/categories')
      .then((res) => setCategories(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/types/categories', categoryForm)
      setShowCategoryForm(false)
      setCategoryForm({
        code: '',
        name: '',
        description: '',
        module: 'EMPLOYEE',
        isActive: true,
      })
      loadCategories()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) return

    try {
      await api.post('/types/types', {
        ...typeForm,
        categoryId: selectedCategory.id,
      })
      setShowTypeForm(false)
      setTypeForm({
        code: '',
        name: '',
        description: '',
        color: '#3B82F6',
        icon: '',
        order: 0,
        isDefault: false,
        isActive: true,
      })
      loadCategories()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return
    try {
      await api.delete(`/types/categories/${id}`)
      loadCategories()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDeleteType = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa loại này?')) return
    try {
      await api.delete(`/types/types/${id}`)
      loadCategories()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const isAdmin = user && user.role === 'ADMIN'

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Chỉ quản trị viên mới có thể quản lý các loại và trạng thái
          </p>
        </div>
      )}

      {isAdmin && (
        <>
          {/* Create Category Form */}
          {showCategoryForm && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Tạo danh mục mới</h3>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã danh mục <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm.code}
                      onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                      placeholder="EMPLOYEE_STATUS"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên danh mục <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={categoryForm.module}
                      onChange={(e) => setCategoryForm({ ...categoryForm, module: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      {MODULES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Tạo
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Create Type Form */}
          {showTypeForm && selectedCategory && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">
                Tạo loại mới cho: {selectedCategory.name}
              </h3>
              <form onSubmit={handleCreateType} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã loại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={typeForm.code}
                      onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên loại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={typeForm.name}
                      onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                    <input
                      type="color"
                      value={typeForm.color}
                      onChange={(e) => setTypeForm({ ...typeForm, color: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                    <input
                      type="number"
                      value={typeForm.order}
                      onChange={(e) => setTypeForm({ ...typeForm, order: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    value={typeForm.description}
                    onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={typeForm.isDefault}
                      onChange={(e) => setTypeForm({ ...typeForm, isDefault: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Mặc định</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={typeForm.isActive}
                      onChange={(e) => setTypeForm({ ...typeForm, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Kích hoạt</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTypeForm(false)
                      setSelectedCategory(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Tạo
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowCategoryForm(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Tạo danh mục mới
            </button>
          </div>
        </>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500">
                  {category.code} • Module: {category.module} • {category._count.types} loại
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(category)
                      setShowTypeForm(true)
                    }}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Thêm loại
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.types.map((type) => (
                  <div
                    key={type.id}
                    className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {type.color && (
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: type.color }}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.name}</div>
                        <div className="text-xs text-gray-500">{type.code}</div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteType(type.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))}
                {category.types.length === 0 && (
                  <div className="text-sm text-gray-500 col-span-full">
                    Chưa có loại nào trong danh mục này
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">Chưa có danh mục nào</p>
          {isAdmin && (
            <button
              onClick={() => setShowCategoryForm(true)}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Tạo danh mục đầu tiên
            </button>
          )}
        </div>
      )}
    </div>
  )
}

