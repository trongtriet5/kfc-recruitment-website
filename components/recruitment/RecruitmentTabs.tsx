'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Icon from '@/components/icons/Icon'
import api from '@/lib/api'

// Map each tab to the permission(s) required to see it.
// Any one of the listed permissions is sufficient.
const ALL_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    href: '/recruitment/dashboard',
    permissions: ['REPORT_VIEW', 'REPORT_EXPORT'],
  },
  {
    id: 'candidates',
    label: 'Ứng viên',
    icon: 'users',
    href: '/recruitment/candidates',
    permissions: ['CANDIDATE_READ', 'CANDIDATE_CREATE'],
  },
  {
    id: 'forms-links',
    label: 'Form tuyển dụng',
    icon: 'document',
    href: '/recruitment/forms',
    permissions: ['FORM_READ', 'FORM_CREATE', 'FORM_VIEW'],
  },
  {
    id: 'proposals',
    label: 'Đề xuất',
    icon: 'clipboard',
    href: '/recruitment/proposals',
    permissions: ['PROPOSAL_READ', 'PROPOSAL_CREATE'],
  },
  {
    id: 'campaigns',
    label: 'Chiến dịch',
    icon: 'megaphone',
    href: '/recruitment/campaigns',
    permissions: ['CAMPAIGN_READ', 'CAMPAIGN_CREATE'],
  },
  {
    id: 'interviews',
    label: 'Phỏng vấn',
    icon: 'calendar',
    href: '/recruitment/interviews',
    permissions: ['INTERVIEW_READ', 'INTERVIEW_CREATE'],
  },
]

// Roles that bypass permission-based filtering (full access)
const FULL_ACCESS_ROLES = ['ADMIN', 'RECRUITER']

function getTabFromPath(pathname: string, availableTabs: typeof ALL_TABS): string {
  const currentTab = availableTabs.find(tab => pathname.startsWith(tab.href))
  return currentTab?.id || (availableTabs.length > 0 ? availableTabs[0].id : 'dashboard')
}

export default function RecruitmentTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [filteredTabs, setFilteredTabs] = useState<typeof ALL_TABS>([])

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        const role: string = res.data.role || ''
        const permissions: string[] = res.data.permissions || []

        let available: typeof ALL_TABS

        if (FULL_ACCESS_ROLES.includes(role)) {
          // Full access roles see all tabs
          available = ALL_TABS
        } else {
          // Filter tabs based on actual DB permissions
          available = ALL_TABS.filter(tab =>
            tab.permissions.some(p => permissions.includes(p))
          )
        }

        setFilteredTabs(available)

        // If current path is not accessible, redirect to first available tab
        const currentTabInAvailable = available.find(t => pathname.startsWith(t.href))
        if (!currentTabInAvailable && available.length > 0) {
          router.replace(available[0].href)
        }

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
