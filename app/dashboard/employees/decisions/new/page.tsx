import Layout from '@/components/Layout'
import CreateDecisionForm from '@/components/employees/CreateDecisionForm'

export default function NewDecisionPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <CreateDecisionForm />
      </div>
    </Layout>
  )
}

