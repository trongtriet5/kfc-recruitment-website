import Layout from '@/components/Layout'
import RecruitmentTabs from '@/components/recruitment/RecruitmentTabs'

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <RecruitmentTabs />
      {children}
    </Layout>
  )
}