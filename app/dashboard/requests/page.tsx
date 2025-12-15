'use client'

import { useRef } from 'react'
import Layout from '@/components/Layout'
import RequestsDashboard, { RequestsDashboardRef } from '@/components/requests/Dashboard'
import RequestsList, { RequestsListRef } from '@/components/requests/List'

export default function RequestsPage() {
  const dashboardRef = useRef<RequestsDashboardRef>(null)
  const listRef = useRef<RequestsListRef>(null)

  const handleRefresh = () => {
    dashboardRef.current?.refresh()
    listRef.current?.refresh()
  }
  
  const handleListRefresh = () => {
    dashboardRef.current?.refresh()
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Đơn từ</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý các đơn từ của nhân viên
          </p>
        </div>
        <RequestsDashboard ref={dashboardRef} />
        <div className="mt-8">
          <RequestsList ref={listRef} onRefresh={handleListRefresh} />
        </div>
      </div>
    </Layout>
  )
}

