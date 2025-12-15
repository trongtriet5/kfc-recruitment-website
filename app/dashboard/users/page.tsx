import Layout from '@/components/Layout'
import UsersList from '@/components/users/UsersList'

export default function UsersPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <UsersList />
      </div>
    </Layout>
  )
}

