'use client'

import EditCandidateForm from '@/components/recruitment/EditCandidateForm'

export default function EditCandidatePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <EditCandidateForm
        candidateId={params.id}
        onSuccess={() => window.location.href = `/recruitment/candidates/${params.id}`}
        onCancel={() => window.history.back()}
      />
    </div>
  )
}