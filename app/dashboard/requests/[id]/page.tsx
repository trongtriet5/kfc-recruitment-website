import Layout from '@/components/Layout'
import RequestDetail from '@/components/requests/RequestDetail'

export default function RequestDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <RequestDetail requestId={params.id} />
      </div>
    </Layout>
  )
}

