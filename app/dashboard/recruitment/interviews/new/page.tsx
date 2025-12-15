import Layout from '@/components/Layout'
import CreateInterviewForm from '@/components/recruitment/CreateInterviewForm'

export default function NewInterviewPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tạo lịch phỏng vấn</h1>
          <p className="mt-2 text-sm text-gray-600">
            Điền thông tin để tạo lịch phỏng vấn mới
          </p>
        </div>
        <CreateInterviewForm />
      </div>
    </Layout>
  )
}

