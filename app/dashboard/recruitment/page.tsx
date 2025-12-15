import Layout from '@/components/Layout'
import RecruitmentTabs from '@/components/recruitment/RecruitmentTabs'

export default function RecruitmentPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tuyển dụng</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý tuyển dụng và ứng viên
          </p>
        </div>
        <RecruitmentTabs />
      </div>
    </Layout>
  )
}
