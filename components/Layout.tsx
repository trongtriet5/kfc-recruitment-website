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

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoError, setLogoError] = useState(false)

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
      name: 'Đơn từ',
      href: '/dashboard/requests',
      icon: 'clipboard',
    },
    {
      name: 'Tuyển dụng',
      href: '/dashboard/recruitment',
      icon: 'users',
    },
    {
      name: 'Nhân sự',
      href: '/dashboard/employees',
      icon: 'users',
    },
    {
      name: 'Chấm công',
      href: '/dashboard/timekeeping',
      icon: 'clock',
    },
    {
      name: 'Bảng lương',
      href: '/dashboard/payroll',
      icon: 'document',
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            name: 'Quản lý người dùng',
            href: '/dashboard/users',
            icon: 'users',
          },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm min-h-screen flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            {/* Logo */}
            {!logoError && (
              <div className="flex-shrink-0">
                <img
                  src="/images/logo.png"
                  alt="Tịnh Thế Vinh Hoa Logo"
                  className="h-10 w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
            <h1 className="text-l font-bold text-yellow-600">
              Tịnh Thế Vinh Hoa
            </h1>
          </div>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith(item.href)
                  ? 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500'
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
        <div className="p-4 border-t bg-white">
          <Link
            href="/dashboard/profile"
            className="block mb-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role}
                </p>
              </div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Icon name="x" size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}

