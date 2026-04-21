import Layout from '@/components/Layout'
import CampaignsList from '@/components/recruitment/CampaignsList'
import Link from 'next/link'

export default function CampaignsPage() {
    return (
        <Layout>
            <div className="px-4 py-6 sm:px-0">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Link href="/dashboard/recruitment" className="hover:text-yellow-600">Tuyển dụng</Link>
                            <span>/</span>
                            <span className="text-gray-900">Chiến dịch</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Chiến dịch tuyển dụng</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Quản lý các chiến dịch tuyển dụng và link form ứng tuyển
                        </p>
                    </div>
                </div>
                <CampaignsList />
            </div>
        </Layout>
    )
}
