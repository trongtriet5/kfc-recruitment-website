'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

// Map each tab href to the permission(s) that grant access
const TAB_PERMISSION_MAP: { href: string; permissions: string[] }[] = [
  { href: '/recruitment/dashboard', permissions: ['REPORT_VIEW', 'REPORT_EXPORT'] },
  { href: '/recruitment/candidates', permissions: ['CANDIDATE_READ', 'CANDIDATE_CREATE'] },
  { href: '/recruitment/forms', permissions: ['FORM_READ', 'FORM_CREATE', 'FORM_DESIGN', 'FORM_UPDATE'] },
  { href: '/recruitment/proposals', permissions: ['PROPOSAL_READ', 'PROPOSAL_CREATE'] },
  { href: '/recruitment/campaigns', permissions: ['CAMPAIGN_READ', 'CAMPAIGN_CREATE'] },
  { href: '/recruitment/interviews', permissions: ['INTERVIEW_READ', 'INTERVIEW_CREATE'] },
]

const FULL_ACCESS_ROLES = ['ADMIN', 'RECRUITER']

export default function RecruitmentPage() {
  const router = useRouter()

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        const role: string = res.data.role || ''
        const permissions: string[] = res.data.permissions || []

        if (FULL_ACCESS_ROLES.includes(role)) {
          router.replace('/recruitment/dashboard')
          return
        }

        // Find first tab this user has access to
        const firstAccessible = TAB_PERMISSION_MAP.find(tab =>
          tab.permissions.some(p => permissions.includes(p))
        )

        if (firstAccessible) {
          router.replace(firstAccessible.href)
        } else {
          // No accessible tab — stay and show empty state
          router.replace('/recruitment/dashboard')
        }
      })
      .catch(() => {
        router.replace('/recruitment/dashboard')
      })
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kfc-red" />
    </div>
  )
}