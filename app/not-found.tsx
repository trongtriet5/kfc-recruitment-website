import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy</h2>
      <p className="text-gray-500">Trang bạn đang tìm kiếm không tồn tại.</p>
      <Link href="/">
        <Button>Về trang chủ</Button>
      </Link>
    </div>
  )
}