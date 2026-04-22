import { useState, useEffect } from 'react'
import api from '@/lib/api'

export interface DbCandidateStatus {
  id: string
  code: string
  name: string
  group: string
  order: number
}

const GROUP_LABELS: Record<string, string> = {
  application: 'Ứng tuyển',
  interview: 'Phỏng vấn',
  offer: 'Thư mời',
  onboarding: 'Trúng tuyển'
}

export function useCandidateStatuses() {
  const [dbStatuses, setDbStatuses] = useState<DbCandidateStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/types/by-category/CANDIDATE_STATUS')
      .then(res => setDbStatuses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Re-build STATUS_GROUPS format dynamically based on DB structure
  const dynamicGroups: Record<string, { label: string, statuses: { value: string, label: string }[] }> = {}
  
  // Initialize with labels to preserve order mostly, but only populate if exists
  Object.keys(GROUP_LABELS).forEach(key => {
    dynamicGroups[key] = {
      label: GROUP_LABELS[key],
      statuses: []
    }
  })

  dbStatuses.forEach(status => {
    const groupKey = status.group || 'application'
    if (!dynamicGroups[groupKey]) {
      dynamicGroups[groupKey] = {
        label: GROUP_LABELS[groupKey] || groupKey,
        statuses: []
      }
    }
    dynamicGroups[groupKey].statuses.push({
      value: status.code,
      label: status.name
    })
  })

  // Clean empty groups
  Object.keys(dynamicGroups).forEach(key => {
    if (dynamicGroups[key].statuses.length === 0) {
      delete dynamicGroups[key]
    }
  })

  return { 
    dbStatuses, 
    dynamicGroups, 
    loading 
  }
}
