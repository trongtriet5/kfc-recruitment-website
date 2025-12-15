import Layout from '@/components/Layout'
import DecisionDetail from '@/components/employees/DecisionDetail'

export default function DecisionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <DecisionDetail decisionId={params.id} />
      </div>
    </Layout>
  )
}

