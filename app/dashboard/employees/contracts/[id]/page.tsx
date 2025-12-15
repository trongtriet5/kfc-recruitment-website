import Layout from '@/components/Layout'
import ContractDetail from '@/components/employees/ContractDetail'

export default function ContractDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <ContractDetail contractId={params.id} />
      </div>
    </Layout>
  )
}

