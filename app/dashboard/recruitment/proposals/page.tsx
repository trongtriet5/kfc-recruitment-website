import Layout from '@/components/Layout'
import ProposalsList from '@/components/recruitment/ProposalsList'
import Link from 'next/link'
import Icon from '@/components/icons/Icon'

export default function ProposalsPage() {
    return (
        <Layout>
            <div className="px-4 py-6 sm:px-0">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Link href="/dashboard/recruitment" className="hover:text-yellow-600">Tuyển dụng</Link>
                            <span>/</span>
                            <span className="text-gray-900">Đề xuất</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Đề xuất tuyển dụng</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Quản lý các đề xuất tuyển dụng từ các phòng ban và cửa hàng
                        </p>
                    </div>
                </div>
                <ProposalsList />
            </div>
        </Layout>
    )
}
