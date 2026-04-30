'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import toast from 'react-hot-toast'

interface Candidate {
  id: string
  fullName: string
  phone: string
  store?: { id: string; name: string }
}

interface Store {
  id: string
  name: string
  code: string
}

interface Campaign {
  id: string
  name: string
  store?: { id: string; name: string; code: string }
  position?: { id: string; name: string }
  pic?: { id: string; fullName: string }
  recruiter?: { id: string; fullName: string }
}

interface InterviewScheduleModalProps {
  candidate: Candidate
  campaign: Campaign | null
  onClose: () => void
  onSuccess: () => void
}

export default function InterviewScheduleModal({ candidate, campaign, onClose, onSuccess }: InterviewScheduleModalProps) {
  const [users, setUsers] = useState<any[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fromTime: '09:00',
    toTime: '10:00',
    interviewerId: campaign?.recruiter?.id || campaign?.pic?.id || '',
    location: campaign?.store?.id || '',
    notes: '',
  })

  useEffect(() => {
    loadUsers()
    loadStores()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data || [])
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }

  const loadStores = async () => {
    try {
      const res = await api.get('/stores')
      // Sort by store code ascending
      const sorted = (res.data || []).sort((a: Store, b: Store) => a.code.localeCompare(b.code))
      setStores(sorted)
    } catch (err) {
      console.error('Error loading stores:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formData.toTime <= formData.fromTime) {
        toast.error('Giờ kết thúc phải lớn hơn giờ bắt đầu')
        setLoading(false)
        return
      }
      const scheduledAt = new Date(`${formData.date}T${formData.fromTime}:00`)
      
      // Map store ID to "CODE - Name" format
      const selectedStore = stores.find(s => s.id === formData.location)
      const locationValue = selectedStore ? `${selectedStore.code} - ${selectedStore.name}` : formData.location
      
      const interviewData = {
        candidateId: candidate.id,
        interviewerId: formData.interviewerId || campaign?.recruiter?.id || campaign?.pic?.id,
        scheduledAt: scheduledAt.toISOString(),
        location: locationValue,
        notes: formData.notes,
      }

      await api.post('/recruitment/interviews', interviewData)
      toast.success('Tạo lịch phỏng vấn thành công')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  if (!campaign) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center">
            <Icon name="alert-circle" size={48} className="mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không thể tạo lịch phỏng vấn</h3>
            <p className="text-gray-600 mb-4">Ứng viên chưa được gán vào chiến dịch tuyển dụng nào.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Tạo lịch phỏng vấn</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="x" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600">Ứng viên</div>
            <div className="font-medium">{candidate.fullName}</div>
            <div className="text-sm text-gray-500">{candidate.phone}</div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600">Chiến dịch</div>
            <div className="font-medium">{campaign.name}</div>
            <div className="text-sm text-gray-500">
              {campaign.store?.name} - {campaign.position?.name}
            </div>
            {(campaign.pic || campaign.recruiter) && (
              <div className="text-sm text-gray-500 mt-1">
                Người phỏng vấn: {campaign.recruiter?.fullName || campaign.pic?.fullName}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày phỏng vấn <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ giờ <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.fromTime}
                onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến giờ <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.toTime}
                onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người phỏng vấn
            </label>
            <select
              value={formData.interviewerId}
              onChange={(e) => setFormData({ ...formData, interviewerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Mặc định: {campaign.recruiter?.fullName || campaign.pic?.fullName || 'Người lọc hồ sơ'}</option>
              {users.filter(u => ['ADMIN', 'RECRUITER', 'HEAD_OF_DEPARTMENT', 'MANAGER', 'USER'].includes(u.role)).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa điểm phỏng vấn
            </label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Ghi chú thêm về buổi phỏng vấn..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Tạo lịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

