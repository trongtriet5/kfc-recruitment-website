import Layout from '@/components/Layout'
import TypesManagement from '@/components/settings/TypesManagement'

export default function TypesPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý loại và trạng thái</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý các loại hợp đồng, trạng thái, và các loại khác trong hệ thống
          </p>
        </div>
        <TypesManagement />
      </div>
    </Layout>
  )
}

