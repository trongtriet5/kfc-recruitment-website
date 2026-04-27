'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string
  cvUrl: string | null
  position: string | null
  notes: string | null
  status: { id: string; name: string; code: string } | null
  store: { id: string; name: string } | null
  pic?: { id: string; fullName: string } | null
}

interface Store {
  id: string
  name: string
  code: string
}

export default function EditCandidateForm({ 
  candidateId, 
  onSuccess, 
  onCancel 
}: { 
  candidateId: string, 
  onSuccess?: () => void, 
  onCancel?: () => void 
}) {
  const router = useRouter()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
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
    status: '',
    picId: '',
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
        fullName: String(candidateData.fullName || ''),
        email: String(candidateData.email || ''),
        phone: String(candidateData.phone || ''),
        cvUrl: String(candidateData.cvUrl || ''),
        position: String(candidateData.position || ''),
        storeId: String(candidateData.store?.id || ''),
        picId: String(candidateData.pic?.id || ''),
        status: String(candidateData.status?.code || candidateData.status || ''),
        notes: String(candidateData.notes || ''),
      })

      // Load stores and statuses (optional, don't fail if these fail)
      try {
        const storesRes = await api.get('/stores')
        let storesData = Array.isArray(storesRes.data) ? storesRes.data : []
        // Filter to only include objects with id and name
        storesData = storesData.filter(store => 
          typeof store === 'object' && 
          store !== null && 
          'id' in store && 
          'name' in store
        )
        setStores(storesData)
      } catch (err) {
        console.error('Error loading stores:', err)
        setStores([])
      }

      try {
        const statusesRes = await api.get('/types/by-category/CANDIDATE_STATUS')
        let statusesData = Array.isArray(statusesRes.data) ? statusesRes.data : []
        // Filter to only include objects with id, code, and name
        statusesData = statusesData.filter(status => 
          typeof status === 'object' && 
          status !== null && 
          'id' in status && 
          'code' in status && 
          'name' in status
        )
        setStatuses(statusesData)
      } catch (err) {
        console.error('Error loading statuses:', err)
        setStatuses([])
      }

      try {
        const usersRes = await api.get('/users/select')
        // Ensure users is an array and filter to only valid user objects
        let usersData = Array.isArray(usersRes.data) ? usersRes.data : []
        // Filter to only include objects with both id and fullName
        usersData = usersData.filter(user => 
          typeof user === 'object' && 
          user !== null && 
          'id' in user && 
          'fullName' in user
        )
        setUsers(usersData)
      } catch (err) {
        console.error('Error loading users:', err)
        setUsers([])
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
      toast.success('Cập nhật ứng viên thành công')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/recruitment/candidates/${candidateId}`)
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật ứng viên'
      toast.error(errorMsg)
      setError(errorMsg)
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
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onCancel || (() => router.push('/recruitment/dashboard'))}
          className="text-slate-600 hover:text-slate-700"
        >
          Quay lại
        </button>
      </div>
    )
  }

  return (
    <div className={onSuccess ? "" : "bg-white shadow rounded-lg p-6"}>
      {!onSuccess && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa ứng viên</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cập nhật thông tin ứng viên: {candidate?.fullName}
          </p>
        </div>
      )}

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
              Cửa hàng
            </label>
            <select
              value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Chọn cửa hàng</option>
              {Array.isArray(stores) && stores.length > 0 && stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {String(store.code || '')} - {String(store.name || '')}
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
              {Array.isArray(statuses) && statuses.length > 0 && statuses.map((status) => (
                <option key={status.id} value={status.code}>
                  {String(status.name || '')}
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
              {Array.isArray(users) && users.length > 0 && users.map((user) => (
                <option key={user.id} value={user.id}>
                  {String(user.fullName || '')}
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
            onClick={onCancel || (() => router.push(`/recruitment/candidates/${candidateId}`))}
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

