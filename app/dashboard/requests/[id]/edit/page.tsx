import Layout from '@/components/Layout'
import EditRequestForm from '@/components/requests/EditRequestForm'

export default function EditRequestPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sửa đơn từ</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cập nhật thông tin đơn từ
          </p>
        </div>
        <EditRequestForm requestId={params.id} />
      </div>
    </Layout>
  )
}

