import Layout from '@/components/Layout'
import EmployeesTabs from '@/components/employees/EmployeesTabs'

export default function EmployeesPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Nhân sự</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý thông tin nhân sự, hợp đồng và quyết định
          </p>
        </div>
        <EmployeesTabs />
      </div>
    </Layout>
  )
}
