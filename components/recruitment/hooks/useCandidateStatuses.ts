import { useState, useEffect, useCallback } from 'react'
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
  const [error, setError] = useState<string | null>(null)

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/types/by-category/CANDIDATE_STATUS')
      setDbStatuses(res.data)
      setError(null)
    } catch (err) {
      setError('Failed to load statuses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  const dynamicGroups: Record<string, { label: string, statuses: { value: string, label: string }[] }> = {}
  
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

  Object.keys(dynamicGroups).forEach(key => {
    if (dynamicGroups[key].statuses.length === 0) {
      delete dynamicGroups[key]
    }
  })

  return { 
    dbStatuses, 
    dynamicGroups, 
    loading,
    error,
    refetch: fetchStatuses
  }
}