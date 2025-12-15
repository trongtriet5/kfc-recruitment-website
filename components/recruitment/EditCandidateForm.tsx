'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string
  cvUrl: string | null
  position: string | null
  brand: string | null
  notes: string | null
  status: { id: string; name: string; code: string } | null
  store: { id: string; name: string } | null
}

interface Store {
  id: string
  name: string
}

export default function EditCandidateForm({ candidateId }: { candidateId: string }) {
  const router = useRouter()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
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
    statusId: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [candidateId])

  const loadData = async () => {
    try {
      // Load candidate first (required)
      const candidateRes = await api.get(`/recruitment/candidates/${candidateId}`)
      const candidateData = candidateRes.data
      setCandidate(candidateData)

      setFormData({
        fullName: candidateData.fullName || '',
        email: candidateData.email || '',
        phone: candidateData.phone || '',
        cvUrl: candidateData.cvUrl || '',
        position: candidateData.position || '',
        brand: (candidateData.brand as any) || '',
        storeId: candidateData.store?.id || '',
        statusId: candidateData.status?.id || '',
        notes: candidateData.notes || '',
      })

      // Load stores and statuses (optional, don't fail if these fail)
      try {
        const storesRes = await api.get('/stores')
        setStores(storesRes.data)
      } catch (err) {
        console.error('Error loading stores:', err)
        // Continue without stores
      }

      try {
        const statusesRes = await api.get('/types/by-category/CANDIDATE_STATUS')
        setStatuses(statusesRes.data)
      } catch (err) {
        console.error('Error loading statuses:', err)
        // Continue without statuses
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin ứng viên')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await api.patch(`/recruitment/candidates/${candidateId}`, formData)
      router.push(`/dashboard/recruitment/candidates/${candidateId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật ứng viên')
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

  if (error && !candidate) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/recruitment')}
            className="text-yellow-600 hover:text-yellow-700"
          >
            Quay lại danh sách ứng viên
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa ứng viên</h1>
        <p className="mt-2 text-sm text-gray-600">
          Cập nhật thông tin ứng viên: {candidate?.fullName}
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
            onClick={() => router.push(`/dashboard/recruitment/candidates/${candidateId}`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  )
}

