'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Store {
  id: string
  name: string
  code: string
}

interface CreateCandidateFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function CreateCandidateForm({ onSuccess, onCancel }: CreateCandidateFormProps) {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cvUrl: '',
    position: '',
    storeId: '',
    campaignId: '',
    status: '',
    picId: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [storesRes, statusesRes, campaignsRes, usersRes] = await Promise.all([
        api.get('/stores').catch(() => ({ data: [] })),
        api.get('/types/by-category/CANDIDATE_STATUS').catch(() => ({ data: [] })),
        api.get('/recruitment/campaigns').catch(() => ({ data: [] })),
        api.get('/users/select').catch(() => ({ data: [] })),
      ])

      setStores(storesRes.data)
      setStatuses(statusesRes.data)
      setCampaigns(campaignsRes.data)
      setUsers(usersRes.data)

      const defaultStatus = statusesRes.data.find((s: any) => s.code === 'CV_FILTERING')
      if (defaultStatus) {
        setFormData((prev) => ({ ...prev, status: defaultStatus.code }))
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

    if (!formData.status) {
      setError('Vui lòng chọn trạng thái')
      return
    }

    setSubmitting(true)

    try {
      const payload: any = {
        fullName: formData.fullName,
        phone: formData.phone,
        status: formData.status,
      }

      if (formData.email) payload.email = formData.email
      if (formData.cvUrl) payload.cvUrl = formData.cvUrl
      if (formData.position) payload.position = formData.position
      if (formData.storeId) payload.storeId = formData.storeId
      if (formData.campaignId) payload.campaignId = formData.campaignId
      if (formData.notes) payload.notes = formData.notes

      const res = await api.post('/recruitment/candidates', payload)
      toast.success('Thêm ứng viên thành công')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard/recruitment/candidates/${res.data.id}`)
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi tạo ứng viên'
      toast.error(errorMsg)
      setError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Thêm ứng viên mới</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên <span className="text-red-500">*</span>
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
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              Vị trí ứng tuyển
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Ví dụ: Nhân viên cửa hàng"
            />
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
                  {store.code} - {store.name}
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
            >
              <option value="">Chọn chiến dịch (tùy chọn)</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            >
              <option value="">Chọn trạng thái</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.code}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người phụ trách (TA)
            </label>
            <select
              value={formData.picId}
              onChange={(e) => setFormData({ ...formData, picId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">-- Chọn TA phụ trách --</option>
              {users.map((user) => (
                <option key={typeof user === 'object' && user !== null && 'id' in user ? user.id : ''} value={typeof user === 'object' && user !== null && 'id' in user ? user.id : ''}>
                  {typeof user === 'object' && user !== null && 'fullName' in user ? String(user.fullName || 'Unknown') : 'Unknown'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link CV
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
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => onCancel ? onCancel() : router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo ứng viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}