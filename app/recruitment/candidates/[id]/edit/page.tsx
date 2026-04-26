'use client'

import { use } from 'react'
import EditCandidateForm from '@/components/recruitment/EditCandidateForm'

export default function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  
  return (
    <div className="p-6">
      <EditCandidateForm
        candidateId={unwrappedParams.id}
        onSuccess={() => window.location.href = `/recruitment/candidates/${unwrappedParams.id}`}
        onCancel={() => window.history.back()}
      />
    </div>
  )
}