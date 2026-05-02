'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Icon from '@/components/icons/Icon'
import api from '@/lib/api'

const tabs = [
  { id: 'users', label: 'Tài khoản', icon: 'user', href: '/settings/users' },
  { id: 'sources', label: 'Nguồn tuyển dụng', icon: 'link', href: '/settings/sources' },
  { id: 'statuses', label: 'Trạng thái', icon: 'GitBranch', href: '/settings/statuses' },
]

function getTabFromPath(pathname: string): string {
  const currentTab = tabs.find(tab => pathname.startsWith(tab.href))
  return currentTab?.id || 'users'
}

export default function SettingsTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('users')
  const [user, setUser] = useState<any>(null)
  const [filteredTabs, setFilteredTabs] = useState<typeof tabs>(tabs)

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data)
        const role = res.data.role

        let available = tabs
        if (role !== 'ADMIN' && role !== 'HEAD_OF_DEPARTMENT' && role !== 'RECRUITER') {
          available = tabs.filter(t => t.id === 'users')
        }

        setFilteredTabs(available)
        setActiveTab(getTabFromPath(pathname))
      })
      .catch(console.error)
  }, [pathname])

  const handleTabClick = (href: string) => {
    router.push(href)
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Cài đặt</h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý tài khoản, nguồn tuyển dụng và trạng thái ứng viên
          </p>
        </div>
        <div className="bg-gray-50/30 px-2 sm:px-6">
          <nav className="flex space-x-2 overflow-x-auto hide-scrollbar" aria-label="Tabs">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.href)}
                className={`
                  ${activeTab === tab.id
                    ? 'border-kfc-red text-kfc-red bg-white shadow-sm'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  }
                  whitespace-nowrap py-3.5 px-4 my-2 border-b-2 rounded-t-xl font-medium text-sm flex items-center gap-2 transition-all group
                `}
              >
                <div className={`
                  ${activeTab === tab.id ? 'text-kfc-red' : 'text-gray-400 group-hover:text-gray-600'}
                  transition-colors
                `}>
                  <Icon name={tab.icon} size={18} />
                </div>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
