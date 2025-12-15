'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { getBrandLabel } from '@/lib/brand-utils'

interface RecruitmentForm {
  id: string
  title: string
  description: string | null
  brand: string
  source: string
  link: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    campaigns: number
    candidates: number
  }
}

export default function ApplicationFormsList() {
  const router = useRouter()
  const [forms, setForms] = useState<RecruitmentForm[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState<RecruitmentForm | null>(null)
  const [showPreview, setShowPreview] = useState(false)

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

  const getFormUrl = (link: string) => {
    return `${window.location.origin}/apply?link=${encodeURIComponent(link)}`
  }

  const copyLink = (link: string) => {
    const fullUrl = getFormUrl(link)
    navigator.clipboard.writeText(fullUrl)
    alert('Đã copy link!')
  }

  const previewForm = (form: RecruitmentForm) => {
    setSelectedForm(form)
    setShowPreview(true)
  }

  const openForm = (link: string) => {
    window.open(getFormUrl(link), '_blank')
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Form ứng tuyển</h2>
        <p className="mt-1 text-sm text-gray-600">
          Xem và quản lý các form ứng tuyển công khai
        </p>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedForm.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedForm.description}</p>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSelectedForm(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <iframe
                src={getFormUrl(selectedForm.link)}
                className="w-full h-[600px] border border-gray-300 rounded-md"
                title="Form Preview"
              />
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => openForm(selectedForm.link)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                >
                  Mở trong tab mới
                </button>
                <button
                  onClick={() => copyLink(selectedForm.link)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Copy link
                </button>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSelectedForm(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forms List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {forms.length === 0 ? (
            <li className="px-4 py-5 text-center text-gray-500">
              Chưa có form ứng tuyển nào
            </li>
          ) : (
            forms.map((form) => (
              <li key={form.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">{form.title}</h3>
                      {form.isActive ? (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Tạm dừng
                        </span>
                      )}
                    </div>
                    {form.description && (
                      <p className="mt-1 text-sm text-gray-500">{form.description}</p>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Brand: {getBrandLabel(form.brand)}</span>
                      <span>Nguồn: {form.source}</span>
                      <span>Link: {form.link}</span>
                      {form._count && (
                        <>
                          <span>{form._count.candidates} ứng viên</span>
                          <span>{form._count.campaigns} chiến dịch</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <button
                      onClick={() => previewForm(form)}
                      className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50"
                    >
                      <Icon name="eye" size={16} />
                      Xem
                    </button>
                    <button
                      onClick={() => copyLink(form.link)}
                      className="text-sm text-yellow-600 hover:text-yellow-700 px-3 py-1 border border-yellow-300 rounded-md hover:bg-yellow-50"
                    >
                      <Icon name="copy" size={16} />
                      Copy
                    </button>
                    <button
                      onClick={() => openForm(form.link)}
                      className="text-sm text-green-600 hover:text-green-700 px-3 py-1 border border-green-300 rounded-md hover:bg-green-50"
                    >
                      🔗 Mở
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Statistics */}
      {forms.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Tổng số form</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{forms.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Form đang hoạt động</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {forms.filter((f) => f.isActive).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Tổng ứng viên</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {forms.reduce((sum, f) => sum + (f._count?.candidates || 0), 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

