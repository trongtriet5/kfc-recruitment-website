import Layout from '@/components/Layout'
import InterviewsCalendar from '@/components/recruitment/InterviewsCalendar'
import Link from 'next/link'

export default function InterviewsPage() {
    return (
        <Layout>
            <div className="px-4 py-6 sm:px-0">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Link href="/dashboard/recruitment" className="hover:text-yellow-600">Tuyển dụng</Link>
                            <span>/</span>
                            <span className="text-gray-900">Lịch phỏng vấn</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Lịch phỏng vấn</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Quản lý và theo dõi lịch phỏng vấn ứng viên
                        </p>
                    </div>
                </div>
                <InterviewsCalendar />
            </div>
        </Layout>
    )
}
