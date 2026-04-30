'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDate, formatDateTime } from '@/lib/utils'
import { socket } from '@/src/socket'

interface User {
  id: string
  email: string
  fullName: string
  role: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
  actionUrl?: string
  recipientId?: string
}

const NOTIFICATION_COLORS: Record<string, string> = {
  SLA_BREACH: 'text-red-600 bg-red-50',
  STATUS_CHANGE: 'text-blue-600 bg-blue-50',
  PROPOSAL_APPROVAL: 'text-green-600 bg-green-50',
  INTERVIEW_REMINDER: 'text-amber-600 bg-amber-50',
  OFFER_ACCEPTED: 'text-emerald-600 bg-emerald-50',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoError, setLogoError] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  const loadNotifications = () => {
    if (!user) return
    api.get('/recruitment/notifications')
      .then(res => {
        setNotifications(res.data.notifications || [])
        setUnreadCount(res.data.unreadCount || 0)
      })
      .catch(console.error)
  }

  const markAsRead = async (id: string) => {
    await api.patch(`/recruitment/notifications/${id}/read`)
    loadNotifications()
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    setShowNotifications(false)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      router.push('/login')
      setLoading(false)
      return
    }

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data)
      })
      .catch(() => {
        localStorage.removeItem('token')
        router.push('/login')
      })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    if (user) loadNotifications()
  }, [user])

  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!user) return

    const onNewNotification = (notification: Notification) => {
      // Check if notification is for this user (recipientId match)
      // Note: user.id might be stored in the 'user' state
      if (notification.recipientId && notification.recipientId !== user.id) return;

      setNotifications(prev => [notification, ...prev].slice(0, 50))
      setUnreadCount(prev => prev + 1)
    }

    socket.on('notification_received', onNewNotification)

    return () => {
      socket.off('notification_received', onNewNotification)
    }
  }, [user])

  const handleLogout = async () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang tải...</div>
      </div>
    )
  }

  const menuItems = [
    {
      name: 'Tuyển dụng',
      href: '/recruitment',
      icon: 'users',
    },
    ...(user?.role === 'ADMIN'
      ? [
        {
          name: 'Cửa hàng',
          href: '/stores',
          icon: 'store',
        },
        {
          name: 'Cấu hình',
          href: '/settings/users',
          icon: 'settings',
        },
      ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm h-screen flex flex-col fixed top-0 left-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            {!logoError && (
              <div className="flex-shrink-0">
                <img
                  src="/images/logo.svg"
                  alt="KFC Logo"
                  className="h-10 w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
            <h1 className="text-l font-bold text-kfc-red">KFC</h1>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                  ? 'bg-kfc-red text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <span className="mr-3">
                <Icon name={item.icon} size={20} />
              </span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Notification in sidebar */}
        {user && (
          <div className="p-4 border-t">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${showNotifications
                  ? 'bg-kfc-red text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <span className="mr-3">
                <Icon name="bell" size={20} />
              </span>
              Thông báo
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        )}

        {user && typeof user === 'object' && 'fullName' in user && (
          <div className="p-4 border-t bg-white mt-auto mb-4">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 bg-kfc-red rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <Icon name="x" size={16} />
              Đăng xuất
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50 ml-64">
        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thông báo</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Không có thông báo</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.slice(0, 20).map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg mb-2 ${!n.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${NOTIFICATION_COLORS[n.type] || 'bg-gray-100 text-gray-600'} flex-shrink-0`}>
                          <Icon name="bell" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!n.isRead ? 'text-blue-900' : 'text-gray-900'}`}>{n.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDateTime(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="py-8 px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32 w-full max-w-[1600px] mx-auto pt-20">
          {children}
        </div>
      </main>
    </div>
  )
}