import Layout from '@/components/Layout'
import EditCandidateForm from '@/components/recruitment/EditCandidateForm'

export default function EditCandidatePage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <EditCandidateForm candidateId={params.id} />
      </div>
    </Layout>
  )
}

