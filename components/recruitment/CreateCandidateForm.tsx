'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getBrandLabel } from '@/lib/brand-utils'

interface Store {
  id: string
  name: string
}

export default function CreateCandidateForm() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cvUrl: '',
    position: '',
    brand: '' as 'MAYCHA' | 'TAM_HAO' | 'BOTH' | '',
    storeId: '',
    formId: '',
    campaignId: '',
    statusId: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [storesRes, statusesRes, formsRes, campaignsRes] = await Promise.all([
        api.get('/stores').catch(() => ({ data: [] })),
        api.get('/types/by-category/CANDIDATE_STATUS').catch(() => ({ data: [] })),
        api.get('/recruitment/forms').catch(() => ({ data: [] })),
        api.get('/recruitment/campaigns').catch(() => ({ data: [] })),
      ])

      setStores(storesRes.data)
      setStatuses(statusesRes.data)
      setForms(formsRes.data)
      setCampaigns(campaignsRes.data)

      // Set default status (CV_FILTERING)
      const defaultStatus = statusesRes.data.find((s: any) => s.code === 'CV_FILTERING')
      if (defaultStatus) {
        setFormData((prev) => ({ ...prev, statusId: defaultStatus.id }))
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.statusId) {
      setError('Vui lòng chọn trạng thái')
      return
    }

    setSubmitting(true)

    try {
      const payload: any = {
        fullName: formData.fullName,
        phone: formData.phone,
        statusId: formData.statusId,
      }

      if (formData.email) payload.email = formData.email
      if (formData.cvUrl) payload.cvUrl = formData.cvUrl
      if (formData.position) payload.position = formData.position
      if (formData.brand) payload.brand = formData.brand
      if (formData.storeId) payload.storeId = formData.storeId
      if (formData.formId) payload.formId = formData.formId
      if (formData.campaignId) payload.campaignId = formData.campaignId
      if (formData.notes) payload.notes = formData.notes

      const res = await api.post('/recruitment/candidates', payload)
      router.push(`/dashboard/recruitment/candidates/${res.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo ứng viên')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thêm ứng viên mới</h1>
        <p className="mt-2 text-sm text-gray-600">
          Nhập thông tin ứng viên mới vào hệ thống
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL CV
            </label>
            <input
              type="url"
              value={formData.cvUrl}
              onChange={(e) => setFormData({ ...formData, cvUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vị trí
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Vị trí ứng tuyển"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Chọn brand</option>
              <option value="MAYCHA">Maycha</option>
              <option value="TAM_HAO">Tam Hảo</option>
              <option value="BOTH">Cả hai</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cửa hàng
            </label>
            <select
              value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Chọn cửa hàng</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.statusId}
              onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            >
              <option value="">Chọn trạng thái</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form tuyển dụng
            </label>
            <select
              value={formData.formId}
              onChange={(e) => setFormData({ ...formData, formId: e.target.value, campaignId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Chọn form (tùy chọn)</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.title} ({getBrandLabel(form.brand)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chiến dịch
            </label>
            <select
              value={formData.campaignId}
              onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={!formData.formId}
            >
              <option value="">Chọn chiến dịch (tùy chọn)</option>
              {campaigns
                .filter((campaign) => !formData.formId || campaign.formId === formData.formId)
                .map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Ghi chú về ứng viên..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/dashboard/recruitment')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang tạo...' : 'Tạo ứng viên'}
          </button>
        </div>
      </form>
    </div>
  )
}

