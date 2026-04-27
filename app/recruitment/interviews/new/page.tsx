'use client'

import CreateInterviewForm from '@/components/recruitment/CreateInterviewForm'
import { useRouter } from 'next/navigation'

export default function NewInterviewPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <CreateInterviewForm
        onSuccess={() => router.push('/recruitment/interviews')}
        onCancel={() => router.push('/recruitment/dashboard')}
      />
    </div>
  )
}