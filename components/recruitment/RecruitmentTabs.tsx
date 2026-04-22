'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import CandidatesList from './CandidatesList'
import FormsAndLinksManager from './FormsAndLinksManager'
import CampaignsList from './CampaignsList'
import ProposalsList from './ProposalsList'
import InterviewsCalendar from './InterviewsCalendar'
import HeadcountList from './HeadcountList'
import RecruitmentDashboard from './RecruitmentDashboard'
import Icon from '@/components/icons/Icon'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/recruitment/dashboard' },
  { id: 'candidates', label: 'Ứng viên', icon: 'users', href: '/recruitment/candidates' },
  { id: 'forms-links', label: 'Form tuyển dụng', icon: 'document', href: '/recruitment/forms' },
  { id: 'proposals', label: 'Đề xuất', icon: 'clipboard', href: '/recruitment/proposals' },
  { id: 'campaigns', label: 'Chiến dịch', icon: 'megaphone', href: '/recruitment/campaigns' },
  { id: 'interviews', label: 'Phỏng vấn', icon: 'calendar', href: '/recruitment/interviews' },
  { id: 'headcount', label: 'Định biên', icon: 'users', href: '/recruitment/headcount' },
]

function getTabFromPath(pathname: string): string {
  if (pathname === '/recruitment' || pathname === '/recruitment/dashboard') return 'dashboard'
  if (pathname === '/recruitment/candidates') return 'candidates'
  if (pathname === '/recruitment/forms') return 'forms-links'
  if (pathname === '/recruitment/proposals') return 'proposals'
  if (pathname === '/recruitment/campaigns') return 'campaigns'
  if (pathname === '/recruitment/interviews') return 'interviews'
  if (pathname === '/recruitment/headcount') return 'headcount'
  return 'dashboard'
}

export default function RecruitmentTabs() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    setActiveTab(getTabFromPath(pathname))
  }, [pathname])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Quản lý tuyển dụng</h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý phễu ứng viên, chiến dịch tuyển dụng và phỏng vấn
          </p>
        </div>
        <div className="bg-gray-50/30 px-2 sm:px-6">
          <nav className="flex space-x-2 overflow-x-auto hide-scrollbar" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  ${
                    activeTab === tab.id
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

      <div className="mt-6">
        {activeTab === 'dashboard' && <RecruitmentDashboard />}
        {activeTab === 'candidates' && <CandidatesList />}
        {activeTab === 'forms-links' && <FormsAndLinksManager />}
        {activeTab === 'campaigns' && <CampaignsList />}
        {activeTab === 'proposals' && <ProposalsList />}
        {activeTab === 'interviews' && <InterviewsCalendar />}
        {activeTab === 'headcount' && <HeadcountList />}
      </div>
    </div>
  )
}

