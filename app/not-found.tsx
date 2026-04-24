'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-red-500">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mt-4">Trang không tồn tại</h2>
        <p className="text-gray-500 mt-2">Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}