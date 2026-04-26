'use client'

import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { useClickOutside } from '@/hooks/useClickOutside'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  entityType?: string
  entityId?: string
  isRead: boolean
  readAt?: string
  actionUrl?: string
  createdAt: string
}

const NOTIFICATION_ICONS: Record<string, string> = {
  SLA_BREACH: 'alert-triangle',
  STATUS_CHANGE: 'refresh-cw',
  PROPOSAL_APPROVAL: 'check-circle',
  INTERVIEW_REMINDER: 'clock',
  OFFER_ACCEPTED: 'award',
  OFFER_EXPIRING: 'alert-circle',
  CANDIDATE_BLACKLIST: 'shield-off',
  CAMPAIGN_COMPLETED: 'flag',
}

const NOTIFICATION_COLORS: Record<string, string> = {
  SLA_BREACH: 'text-red-600 bg-red-50',
  STATUS_CHANGE: 'text-blue-600 bg-blue-50',
  PROPOSAL_APPROVAL: 'text-green-600 bg-green-50',
  INTERVIEW_REMINDER: 'text-amber-600 bg-amber-50',
  OFFER_ACCEPTED: 'text-emerald-600 bg-emerald-50',
  OFFER_EXPIRING: 'text-orange-600 bg-orange-50',
  CANDIDATE_BLACKLIST: 'text-slate-600 bg-slate-50',
  CAMPAIGN_COMPLETED: 'text-purple-600 bg-purple-50',
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen)

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      // This endpoint would need to be implemented in the backend
      // For now, using mock data structure
      const res = await api.get('/notifications').catch(() => ({ data: [] }))
      const data = res.data || []
      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length)
    } catch (err) {
      console.error('Error loading notifications:', err)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`)
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  const handleAction = (notification: Notification) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Thông báo"
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-300 mb-2 flex justify-center">
                  <Icon name="bell-off" size={32} />
                </div>
                <p className="text-sm text-gray-500">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleAction(notification)}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        NOTIFICATION_COLORS[notification.type] || 'text-gray-600 bg-gray-50'
                      }`}
                    >
                      <Icon name={NOTIFICATION_ICONS[notification.type] || 'bell'} size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                        {!notification.isRead && (
                          <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  // Navigate to full notifications page
                  window.location.href = '/notifications'
                }}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

