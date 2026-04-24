import Layout from '@/components/Layout'
import RecruitmentTabs from '@/components/recruitment/RecruitmentTabs'

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <RecruitmentTabs />
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-6 p-6 sm:p-8">
        {children}
      </div>
    </Layout>
  )
}