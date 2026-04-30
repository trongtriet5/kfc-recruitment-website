'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Icon from '@/components/icons/Icon'
import api from '@/lib/api'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/recruitment/dashboard' },
  { id: 'candidates', label: 'Ứng viên', icon: 'users', href: '/recruitment/candidates' },
  { id: 'forms-links', label: 'Form tuyển dụng', icon: 'document', href: '/recruitment/forms' },
  { id: 'proposals', label: 'Đề xuất', icon: 'clipboard', href: '/recruitment/proposals' },
  { id: 'campaigns', label: 'Chiến dịch', icon: 'megaphone', href: '/recruitment/campaigns' },
  { id: 'interviews', label: 'Phỏng vấn', icon: 'calendar', href: '/recruitment/interviews' },
]

function getTabFromPath(pathname: string, availableTabs: typeof tabs): string {
  const currentTab = availableTabs.find(tab => pathname.startsWith(tab.href))
  return currentTab?.id || (availableTabs.length > 0 ? availableTabs[0].id : 'dashboard')
}

export default function RecruitmentTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState<any>(null)
  const [filteredTabs, setFilteredTabs] = useState<typeof tabs>([])

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data)
        const role = res.data.role
        let available: typeof tabs = []
        
        if (role === 'ADMIN' || role === 'HEAD_OF_DEPARTMENT') {
          available = tabs
        } else if (role === 'MANAGER' || role === 'USER') {
          available = tabs.filter(t => ['candidates', 'proposals', 'interviews'].includes(t.id))
        } else if (role === 'RECRUITER') {
          available = tabs.filter(t => ['dashboard', 'candidates', 'proposals', 'campaigns', 'interviews'].includes(t.id))
        }
        
        setFilteredTabs(available)
        setActiveTab(getTabFromPath(pathname, available))
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
          <h2 className="text-2xl font-bold text-gray-900">Quản lý tuyển dụng</h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý phễu ứng viên, chiến dịch tuyển dụng và phỏng vấn
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

