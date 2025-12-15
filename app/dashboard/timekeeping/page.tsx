import Layout from '@/components/Layout'
import TimekeepingList from '@/components/timekeeping/List'
import CheckInOut from '@/components/timekeeping/CheckInOut'

export default function TimekeepingPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chấm công</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý chấm công và check-in/out
          </p>
        </div>
        <CheckInOut />
        <div className="mt-8">
          <TimekeepingList />
        </div>
      </div>
    </Layout>
  )
}

