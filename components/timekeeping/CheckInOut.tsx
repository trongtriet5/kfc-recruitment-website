'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function CheckInOut() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [location, setLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          setMessage('Không thể lấy vị trí GPS')
        }
      )
    } else {
      setMessage('Trình duyệt không hỗ trợ GPS')
    }
  }, [])

  const handleCheckIn = async () => {
    if (!location) {
      setMessage('Đang lấy vị trí GPS...')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      await api.post('/timekeeping', {
        type: 'CHECKIN',
        lat: location.lat,
        lng: location.lng,
      })
      setMessage('Check-in thành công!')
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.response?.data?.error || 'Check-in thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!location) {
      setMessage('Đang lấy vị trí GPS...')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      await api.post('/timekeeping', {
        type: 'CHECKOUT',
        lat: location.lat,
        lng: location.lng,
      })
      setMessage('Check-out thành công!')
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Check-out thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Check-in / Check-out
      </h3>
      {location ? (
        <div className="mb-4 text-sm text-gray-600">
          Vị trí: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      ) : (
        <div className="mb-4 text-sm text-yellow-600">
          Đang lấy vị trí GPS...
        </div>
      )}
      <div className="flex gap-4">
        <button
          onClick={handleCheckIn}
          disabled={loading || !location}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? 'Đang xử lý...' : 'Check-in'}
        </button>
        <button
          onClick={handleCheckOut}
          disabled={loading || !location}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? 'Đang xử lý...' : 'Check-out'}
        </button>
      </div>
      {message && (
        <div
          className={`mt-4 p-3 rounded-md ${
            message.includes('thành công')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  )
}

