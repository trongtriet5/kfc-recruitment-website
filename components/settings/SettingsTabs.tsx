'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SettingsTabs() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Phòng ban', href: '/dashboard/settings/departments' },
    { name: 'Vị trí', href: '/dashboard/settings/positions' },
    { name: 'Cửa hàng', href: '/dashboard/settings/stores' },
    { name: 'Loại và trạng thái', href: '/dashboard/settings/types' },
  ]

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  isActive
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
