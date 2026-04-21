'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'

interface RecruitmentForm {
  id: string
  title: string
  description: string | null
  source: string
  link: string
  isActive: boolean
  createdAt: string
  _count?: {
    campaigns: number
    candidates: number
  }
}

export default function RecruitmentFormsList() {
  const router = useRouter()
  const [forms, setForms] = useState<RecruitmentForm[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source: '',
    link: '',
    isActive: true,
  })

  useEffect(() => {
    loadForms()
  }, [])

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
      setFormData({
        title: '',
        description: '',
        source: '',
        link: '',
        isActive: true,
      })
      loadForms()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const getFormUrl = (link: string) => {
    return `${window.location.origin}/apply?link=${encodeURIComponent(link)}`
  }

  const copyLink = (link: string) => {
    const fullUrl = getFormUrl(link)
    navigator.clipboard.writeText(fullUrl)
    alert('Đã copy link!')
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Link tuyển dụng</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Tạo link mới
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Tạo link tuyển dụng mới</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề <span className="text-red-500">*</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nguồn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Ví dụ: Facebook, Website..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://..."
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Kích hoạt
              </label>
            </div>
            <div className="flex justify-end space-x-3">
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
                Tạo
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {forms.length === 0 ? (
            <li className="px-4 py-5 text-center text-gray-500">Chưa có link tuyển dụng nào</li>
          ) : (
            forms.map((form) => (
              <li key={form.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">{form.title}</h3>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          form.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {form.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{form.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>Nguồn: {form.source}</span>
                      {form._count && (
                        <>
                          <span>Chiến dịch: {form._count.campaigns}</span>
                          <span>Ứng viên: {form._count.candidates}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <button
                      onClick={() => copyLink(form.link)}
                      className="text-sm text-yellow-600 hover:text-yellow-700"
                    >
                      Copy link
                    </button>
                    <a
                      href={getFormUrl(form.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-yellow-600 hover:text-yellow-700"
                    >
                      Mở
                    </a>
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