'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useClickOutside } from '@/hooks/useClickOutside'
import FormDesigner from './FormDesigner'
import Icon from '@/components/icons/Icon'

interface FormField {
  id?: string
  name: string
  label: string
  type: "TEXT" | "EMAIL" | "PHONE" | "NUMBER" | "DATE" | "SELECT" | "MULTISELECT" | "TEXTAREA" | "CHECKBOX" | "RADIO" | "FILE"
  placeholder?: string
  required: boolean
  order: number
  options?: Array<{ value: string; label: string }>
  minLength?: number
  maxLength?: number
  pattern?: string
  width?: string
  helpText?: string
  isActive?: boolean
}

interface RecruitmentForm {
  id: string
  title: string
  description: string | null
  source: string
  link: string
  formTitle: string | null
  formContent: string | null
  bannerUrl: string | null
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  fields?: FormField[]
  _count?: {
    campaigns: number
    candidates: number
  }
}

export default function FormsAndLinksManager() {
  const router = useRouter()
  const [forms, setForms] = useState<RecruitmentForm[]>([])
  const [sources, setSources] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingForm, setEditingForm] = useState<RecruitmentForm | null>(null)
  const [selectedForm, setSelectedForm] = useState<RecruitmentForm | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showDesigner, setShowDesigner] = useState(false)
  const [designingForm, setDesigningForm] = useState<RecruitmentForm | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source: '',
    formTitle: '',
    formContent: '',
    bannerUrl: '',
    primaryColor: '#E31837',
    secondaryColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    isActive: true,
  })
  const createFormRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useClickOutside(createFormRef, () => {
    if (showCreateForm && !editingForm) {
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        source: '',
        formTitle: '',
        formContent: '',
        bannerUrl: '',
        primaryColor: '#E31837',
        secondaryColor: '#FFFFFF',
        backgroundColor: '#FFFFFF',
        textColor: '#111827',
        isActive: true,
      })
    }
  }, showCreateForm && !editingForm)

  useClickOutside(previewRef, () => {
    if (showPreview) {
      setShowPreview(false)
      setSelectedForm(null)
    }
  }, showPreview)

  useEffect(() => {
    loadForms()
    loadSources()
  }, [])

  const loadForms = () => {
    api
      .get('/recruitment/forms')
      .then((res) => setForms(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const loadSources = () => {
    api
      .get('/recruitment/sources')
      .then((res) => setSources(res.data))
      .catch(console.error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingForm) {
        await api.patch(`/recruitment/forms/${editingForm.id}`, formData)
      } else {
        await api.post('/recruitment/forms', formData)
      }
      setShowCreateForm(false)
      setEditingForm(null)
      setFormData({
        title: '',
        description: '',
        source: '',
        formTitle: '',
        formContent: '',
        bannerUrl: '',
        primaryColor: '#E31837',
        secondaryColor: '#FFFFFF',
        backgroundColor: '#FFFFFF',
        textColor: '#111827',
        isActive: true,
      })
      loadForms()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const handleDesignSave = async (data: {
    formTitle?: string
    formContent?: string
    bannerUrl?: string
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
    textColor?: string
    fields: FormField[]
  }) => {
    if (!designingForm) return

    try {
      await api.patch(`/recruitment/forms/${designingForm.id}`, {
        formTitle: data.formTitle,
        formContent: data.formContent,
        bannerUrl: data.bannerUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        fields: data.fields,
      })
      setShowDesigner(false)
      setDesigningForm(null)
      loadForms()
      alert('Đã lưu thiết kế form thành công!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thiết kế')
    }
  }

  const handleDesign = (form: RecruitmentForm) => {
    setDesigningForm(form)
    setShowDesigner(true)
  }

  const handleEdit = (form: RecruitmentForm) => {
    setEditingForm(form)
    setFormData({
      title: form.title,
      description: form.description || '',
      source: form.source,
      formTitle: form.formTitle || '',
      formContent: form.formContent || '',
      bannerUrl: form.bannerUrl || '',
      primaryColor: form.primaryColor || '#E31837',
      secondaryColor: form.secondaryColor || '#FFFFFF',
      backgroundColor: form.backgroundColor || '#FFFFFF',
      textColor: form.textColor || '#111827',
      isActive: form.isActive,
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa form này?')) return
    try {
      await api.delete(`/recruitment/forms/${id}`)
      loadForms()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const previewForm = (form: RecruitmentForm) => {
    setSelectedForm(form)
    setShowPreview(true)
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div className="pt-6 space-y-8">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Form tuyển dụng</h1>
        <p className="text-gray-600 mt-2">Quản lý form ứng tuyển (dùng chung cho các chiến dịch)</p>
      </div>

      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={() => {
            setEditingForm(null)
            setFormData({
              title: '',
              description: '',
              source: '',
              formTitle: '',
              formContent: '',
              bannerUrl: '',
              primaryColor: '#E31837',
              secondaryColor: '#FFFFFF',
              backgroundColor: '#FFFFFF',
              textColor: '#111827',
              isActive: true,
            })
            setShowCreateForm(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
        >
          + Tạo form
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div ref={createFormRef} className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingForm ? 'Chỉnh sửa' : 'Tạo mới'} Form
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingForm(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium text-gray-900 mb-3">Thông tin cơ bản</h4>
                <div className="space-y-4">
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
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Chọn nguồn...</option>
                        {sources.map((source) => (
                          <option key={source.id} value={source.name}>
                            {source.name}
                          </option>
                        ))}
                      </select>
                    </div>
                </div>
              </div>

              {/* Form Customization */}
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium text-gray-900 mb-3">Tùy chỉnh Form ứng tuyển</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiêu đề Form
                    </label>
                    <input
                      type="text"
                      value={formData.formTitle}
                      onChange={(e) => setFormData({ ...formData, formTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Để trống sẽ dùng tiêu đề mặc định"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nội dung Form (HTML)
                    </label>
                    <textarea
                      value={formData.formContent}
                      onChange={(e) => setFormData({ ...formData, formContent: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={5}
                      placeholder="Nhập nội dung mô tả form (hỗ trợ HTML)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Banner
                    </label>
                    <input
                      type="url"
                      value={formData.bannerUrl}
                      onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://example.com/banner.jpg"
                    />
                    {formData.bannerUrl && (
                      <img
                        src={formData.bannerUrl}
                        alt="Banner preview"
                        className="mt-2 max-w-full h-32 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingForm(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  {editingForm ? 'Cập nhật' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Designer Modal */}
      {showDesigner && designingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto my-8">
            <FormDesigner
              formId={designingForm.id}
              formData={{
                formTitle: designingForm.formTitle || '',
                formContent: designingForm.formContent || '',
                bannerUrl: designingForm.bannerUrl || '',
                primaryColor: designingForm.primaryColor || '#E31837',
                secondaryColor: designingForm.secondaryColor || '#FFFFFF',
                backgroundColor: designingForm.backgroundColor || '#FFFFFF',
                textColor: designingForm.textColor || '#111827',
              }}
              fields={designingForm.fields || []}
              onSave={handleDesignSave}
              onCancel={() => {
                setShowDesigner(false)
                setDesigningForm(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div ref={previewRef} className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
              <p className="text-gray-600 text-sm mb-4">
                Form này được dùng chung cho các chiến dịch. Dưới đây là link để ứng viên điền thông tin:
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/apply?link=${selectedForm?.link}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/apply?link=${selectedForm?.link}`)
                    alert('Đã copy link!')
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 flex items-center gap-1"
                >
                  <Icon name="copy" size={16} />
                  Copy link
                </button>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end">
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
              Chưa có form hoặc link tuyển dụng nào
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
                      <span>Nguồn: {form.source}</span>
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
                      onClick={() => handleDesign(form)}
                      className="text-sm text-yellow-600 hover:text-yellow-700 px-3 py-1 border border-yellow-300 rounded-md hover:bg-yellow-50 flex items-center gap-1"
                    >
                      <Icon name="edit" size={16} />
                      Thiết kế
                    </button>
                    <button
                      onClick={() => handleEdit(form)}
                      className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50 flex items-center gap-1"
                    >
                      <Icon name="edit" size={16} />
                      Sửa
                    </button>
                    <button
                      onClick={() => previewForm(form)}
                      className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50 flex items-center gap-1"
                    >
                      <Icon name="eye" size={16} />
                      Xem
                    </button>
                    <button
                      onClick={() => handleDelete(form.id)}
                      className="text-sm text-red-600 hover:text-red-700 px-3 py-1 border border-red-300 rounded-md hover:bg-red-50 flex items-center gap-1"
                    >
                      <Icon name="trash" size={16} />
                      Xóa
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

