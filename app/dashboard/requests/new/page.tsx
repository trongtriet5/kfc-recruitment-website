import Layout from '@/components/Layout'
import CreateRequestForm from '@/components/requests/CreateRequestForm'

export default function NewRequestPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tạo đơn mới</h1>
          <p className="mt-2 text-sm text-gray-600">
            Điền thông tin để tạo đơn từ mới
          </p>
        </div>
        <CreateRequestForm />
      </div>
    </Layout>
  )
}

