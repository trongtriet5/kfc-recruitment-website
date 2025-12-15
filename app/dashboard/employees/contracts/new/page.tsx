import Layout from '@/components/Layout'
import CreateContractForm from '@/components/employees/CreateContractForm'

export default function NewContractPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <CreateContractForm />
      </div>
    </Layout>
  )
}

