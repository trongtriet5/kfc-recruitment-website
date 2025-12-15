import Layout from '@/components/Layout'
import CreateCandidateForm from '@/components/recruitment/CreateCandidateForm'

export default function CreateCandidatePage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <CreateCandidateForm />
      </div>
    </Layout>
  )
}

