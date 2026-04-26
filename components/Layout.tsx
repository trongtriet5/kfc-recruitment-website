'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Icon from '@/components/icons/Icon'

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
  isRead: boolean
  createdAt: string
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
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
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
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                showNotifications
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
        {/* Notification Modal - expands from sidebar to cover main content */}
        {showNotifications && (
          <div className="fixed left-64 top-0 right-0 bottom-0 bg-white z-40 overflow-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <span className="font-semibold">Thông báo</span>
              <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <Icon name="narrow-back" size={18} />
              </button>
            </div>
            <div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">Không có thông báo</div>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!n.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${NOTIFICATION_COLORS[n.type] || 'bg-gray-100 text-gray-600'} flex-shrink-0`}>
                        <Icon name="bell" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-sm text-gray-500">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(n.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      {!n.isRead && <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="py-8 px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32 w-full max-w-[1600px] mx-auto pt-20">
          {children}
        </div>
      </main>
    </div>
  )
}