'use client'

import { Suspense } from 'react'
import PublicApplicationForm from '@/components/recruitment/PublicApplicationForm'

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <PublicApplicationForm />
    </Suspense>
  )
}