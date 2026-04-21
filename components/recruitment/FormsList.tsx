'use client'

import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import { useClickOutside } from '@/hooks/useClickOutside'
import Icon from '@/components/icons/Icon'
import { getBrandLabel } from '@/lib/brand-utils'

interface Form {
  id: string
  title: string
  description: string | null
  brand: string
  source: string
  link: string
  isActive: boolean
  formTitle: string | null
  formContent: string | null
  primaryColor: string | null
  fields: any[]
}

export default function FormsList() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brand: 'BOTH',
    source: 'Website',
    formTitle: '',
    formContent: '',
    primaryColor: '#F59E0B',
    isActive: true,
  })

  const formRef = useRef<HTMLDivElement>(null)

  useClickOutside(formRef, () => {
    if (showCreateForm) setShowCreateForm(false)
  }, showCreateForm)

  useEffect(() => {
    loadUser()
    loadForms()
  }, [])

  const loadUser = () => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(console.error)
  }

  const loadForms = () => {
    api
      .get('/recruitment/forms')
      .then((res) => setForms(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/recruitment/forms', formData)
      setShowCreateForm(false)
      loadForms()
      // Reset form
      setFormData({
        title: '',
        description: '',
        brand: 'BOTH',
        source: 'Website',
        formTitle: '',
        formContent: '',
        primaryColor: '#F59E0B',
        isActive: true,
      })
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa form này?')) return
    try {
      await api.delete(`/recruitment/forms/${id}`)
      loadForms()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra (có thể form đã được sử dụng)')
    }
  }

  const handleCopyLink = (link: string) => {
    const fullLink = `${window.location.origin}/apply/form/${link}`
    navigator.clipboard.writeText(fullLink)
      .then(() => alert('Đã copy link form ứng tuyển'))
      .catch(() => alert('Lỗi khi copy link'))
  }

  const openFormPreview = (link: string) => {
    window.open(`${window.location.origin}/apply/form/${link}`, '_blank')
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  const canManage = user && (user.role === 'ADMIN' || user.role === 'HEAD_OF_DEPARTMENT')

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tất cả form</h2>
        {canManage && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Tạo Form
          </button>
        )}
      </div>

      {showCreateForm && (
        <div ref={formRef} className="mb-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Tạo Form Ứng Tuyển Mới</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên nội bộ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="MAYCHA">MayCha</option>
                  <option value="TAM_HAO">Tam Hảo</option>
                  <option value="BOTH">Tất cả</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề hiển thị (Public) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.formTitle}
                  onChange={(e) => setFormData({ ...formData, formTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn (Source)</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung mô tả (Public)</label>
              <textarea
                value={formData.formContent}
                onChange={(e) => setFormData({ ...formData, formContent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu chủ đạo (Hex)</label>
                <input
                  type="color"
                  value={formData.primaryColor || '#F59E0B'}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-full cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú nội bộ</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Tạo Form
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {forms.length === 0 ? (
            <li className="px-4 py-5 text-center text-gray-500">Chưa có form nào</li>
          ) : (
            forms.map((form) => (
              <li key={form.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">{form.title}</h3>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getBrandLabel(form.brand)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{form.description}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      <span>Public URL: /apply/form/{form.link}</span>
                      <span className="mx-2">•</span>
                      <span>{form.fields?.length || 0} trường dữ liệu</span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyLink(form.link)}
                      className="text-sm text-yellow-600 hover:text-yellow-700 px-3 py-1 border border-yellow-300 rounded-md hover:bg-yellow-50 flex items-center gap-1"
                    >
                      <Icon name="copy" size={16} /> Copy URL
                    </button>
                    <button
                      onClick={() => openFormPreview(form.link)}
                      className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50 flex items-center gap-1"
                    >
                      <Icon name="eye" size={16} /> Xem trước
                    </button>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(form.id)}
                        className="text-sm text-red-600 hover:text-red-700 px-3 py-1 border border-red-300 rounded-md hover:bg-red-50 flex items-center gap-1"
                      >
                        <Icon name="trash" size={16} /> Xóa
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
