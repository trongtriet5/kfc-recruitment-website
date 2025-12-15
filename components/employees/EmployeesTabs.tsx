'use client'

import { useState } from 'react'
import EmployeesDashboard from './Dashboard'
import EmployeesList from './List'
import ContractsList from './ContractsList'
import DecisionsList from './DecisionsList'
import Icon from '@/components/icons/Icon'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'employees', label: 'Nhân sự', icon: 'users' },
  { id: 'contracts', label: 'Hợp đồng', icon: 'document' },
  { id: 'decisions', label: 'Quyết định', icon: 'clipboard' },
]

export default function EmployeesTabs() {
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
        {activeTab === 'dashboard' && <EmployeesDashboard />}
        {activeTab === 'employees' && <EmployeesList />}
        {activeTab === 'contracts' && <ContractsList />}
        {activeTab === 'decisions' && <DecisionsList />}
      </div>
    </div>
  )
}

