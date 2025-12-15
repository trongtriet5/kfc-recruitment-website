import Layout from '@/components/Layout'
import PayrollList from '@/components/payroll/List'

export default function PayrollPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bảng lương</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý bảng lương nhân viên
          </p>
        </div>
        <PayrollList />
      </div>
    </Layout>
  )
}

