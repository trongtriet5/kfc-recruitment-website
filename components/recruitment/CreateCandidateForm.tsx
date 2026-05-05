'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { SearchableSelect } from '@/components/ui/select-searchable'

interface Store {
  id: string
  name: string
  code: string
  city?: string
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
  const [proposals, setProposals] = useState<any[]>([])
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
    proposalId: '',
    status: '',
    picId: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [storesRes, statusesRes, campaignsRes, usersRes, proposalsRes] = await Promise.all([
        api.get('/stores').catch(() => ({ data: [] })),
        api.get('/types/by-category/CANDIDATE_STATUS').catch(() => ({ data: [] })),
        api.get('/recruitment/campaigns').catch(() => ({ data: [] })),
        api.get('/users/select').catch(() => ({ data: [] })),
        api.get('/recruitment/proposals').catch(() => ({ data: { data: [] } })),
      ])

      setStores(storesRes.data)
      setStatuses(statusesRes.data)
      setCampaigns(campaignsRes.data)
      setUsers(usersRes.data)
      setProposals(proposalsRes.data.data || [])

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
      if (formData.proposalId) payload.proposalId = formData.proposalId
      if (formData.notes) payload.notes = formData.notes

      const res = await api.post('/recruitment/candidates', payload)
      toast.success('Thêm ứng viên thành công')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/recruitment/candidates/${res.data.id}`)
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Ví dụ: Nhân viên cửa hàng"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cửa hàng
            </label>
            <SearchableSelect
              options={stores
                .sort((a, b) => (a.city || '').localeCompare(b.city || '') || (a.code || '').localeCompare(b.code || ''))
                .map(s => ({ 
                  id: s.id, 
                  name: `${s.code} - ${s.name}`,
                  group: s.city || 'Khác'
                }))}
              value={formData.storeId}
              onChange={(val) => setFormData({ ...formData, storeId: val })}
              placeholder="Chọn cửa hàng"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chiến dịch
            </label>
            <SearchableSelect
              options={campaigns.map(c => ({ id: c.id, name: c.name }))}
              value={formData.campaignId}
              onChange={(val) => setFormData({ ...formData, campaignId: val })}
              placeholder="Chọn chiến dịch"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đề xuất tuyển dụng
            </label>
            <SearchableSelect
              options={proposals.filter(p => p.status === 'APPROVED').map(p => ({ 
                id: p.id, 
                name: `${p.title} - ${p.quantity} người` 
              }))}
              value={formData.proposalId}
              onChange={(val) => setFormData({ ...formData, proposalId: val })}
              placeholder="Chọn đề xuất"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={statuses.map(s => ({ id: s.code, name: s.name }))}
              value={formData.status}
              onChange={(val) => setFormData({ ...formData, status: val })}
              placeholder="Chọn trạng thái"
              error={!formData.status && error && error.includes('trạng thái') ? error : ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người phụ trách (PIC)
            </label>
            <SearchableSelect
              options={users.map(u => ({ id: u.id, name: u.fullName }))}
              value={formData.picId}
              onChange={(val) => setFormData({ ...formData, picId: val })}
              placeholder="Chọn người phụ trách"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link CV
            </label>
            <input
              type="url"
              value={formData.cvUrl}
              onChange={(e) => setFormData({ ...formData, cvUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
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
              className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo ứng viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}