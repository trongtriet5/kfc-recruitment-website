import Layout from '@/components/Layout'
import CandidateDetail from '@/components/recruitment/CandidateDetail'

export default function CandidateDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <CandidateDetail candidateId={params.id} />
      </div>
    </Layout>
  )
}

