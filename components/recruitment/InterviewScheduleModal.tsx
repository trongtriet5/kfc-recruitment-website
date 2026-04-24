'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'

interface Candidate {
  id: string
  fullName: string
  phone: string
  store?: { id: string; name: string }
}

interface Proposal {
  id: string
  title: string
  store?: { id: string; name: string; code: string }
  position?: { id: string; name: string }
  requester?: { id: string; fullName: string }
}

interface User {
  id: string
  fullName: string
  email: string
}

interface InterviewScheduleModalProps {
  candidate: Candidate
  proposal?: Proposal
  onClose: () => void
  onSuccess: () => void
}

export default function InterviewScheduleModal({ candidate, proposal, onClose, onSuccess }: InterviewScheduleModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fromTime: '09:00',
    toTime: '10:00',
    interviewerId: proposal?.requester?.id || '',
    location: proposal?.store?.name || '',
    notes: '',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await api.get('/users/select')
      setUsers(res.data)
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const scheduledAt = new Date(`${formData.date}T${formData.fromTime}:00`)
      const interviewData = {
        candidateId: candidate.id,
        interviewerId: formData.interviewerId || proposal?.requester?.id,
        scheduledAt: scheduledAt.toISOString(),
        location: formData.location,
        notes: formData.notes,
      }

      await api.post('/recruitment/interviews', interviewData)
      onSuccess()
      onClose()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Tao lich phong van</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="x" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600">Ung vien</div>
            <div className="font-medium">{candidate.fullName}</div>
            <div className="text-sm text-gray-500">{candidate.phone}</div>
          </div>

          {proposal && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">De xuat</div>
              <div className="font-medium">{proposal.title}</div>
              <div className="text-sm text-gray-500">
                {proposal.store?.name} - {proposal.position?.name}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngay phong van <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tu gio <span className="text-red-500">*</span>
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
                Den gio <span className="text-red-500">*</span>
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
              Nguoi phong van
            </label>
            <select
              value={formData.interviewerId}
              onChange={(e) => setFormData({ ...formData, interviewerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Mac dinh: {proposal?.requester && typeof proposal.requester === 'object' && 'fullName' in proposal.requester ? String(proposal.requester.fullName || 'Nguoi tao de xuat') : 'Nguoi tao de xuat'}</option>
              {users.map((user) => (
                <option key={typeof user === 'object' && user !== null && 'id' in user ? user.id : ''} value={typeof user === 'object' && user !== null && 'id' in user ? user.id : ''}>
                  {typeof user === 'object' && user !== null && 'fullName' in user ? String(user.fullName || 'Unknown') : 'Unknown'} ({typeof user === 'object' && user !== null && 'email' in user ? String(user.email || '') : ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dia diem
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder={proposal?.store?.name || 'Nhap dia diem'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chu
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Ghi chu them ve buoi phong van..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Dang xu ly...' : 'Tao lich'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}