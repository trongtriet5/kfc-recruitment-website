'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold text-gray-900">Đã xảy ra lỗi!</h2>
      <p className="text-gray-500">Vui lòng thử lại hoặc liên hệ quản trị viên.</p>
      {error.message && (
        <p className="text-sm text-red-500 max-w-md text-center">{error.message}</p>
      )}
      <Button onClick={() => reset()}>Thử lại</Button>
    </div>
  )
}