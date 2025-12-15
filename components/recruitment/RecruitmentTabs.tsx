'use client'

import { useState } from 'react'
import CandidatesList from './CandidatesList'
import FormsAndLinksManager from './FormsAndLinksManager'
import CampaignsList from './CampaignsList'
import ProposalsList from './ProposalsList'
import InterviewsCalendar from './InterviewsCalendar'
import HeadcountList from './HeadcountList'
import RecruitmentDashboard from './RecruitmentDashboard'
import Icon from '@/components/icons/Icon'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'candidates', label: 'Ứng viên', icon: 'users' },
  { id: 'forms-links', label: 'Form tuyển dụng', icon: 'document' },
  { id: 'campaigns', label: 'Chiến dịch', icon: 'megaphone' },
  { id: 'proposals', label: 'Đề xuất', icon: 'clipboard' },
  { id: 'interviews', label: 'Phỏng vấn', icon: 'calendar' },
  { id: 'headcount', label: 'Định biên', icon: 'dashboard' },
]

export default function RecruitmentTabs() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                ${
                  activeTab === tab.id
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              `}
            >
              <Icon name={tab.icon} size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
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

