import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Candidate } from '@/types/recruitment'

interface UseCandidateActionsOptions {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function useCandidateActions(options: UseCandidateActionsOptions = {}) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const updateStatus = useCallback(async (candidateId: string, statusCode: string) => {
    setLoading(true)
    try {
      await api.patch(`/recruitment/candidates/${candidateId}`, { status: statusCode })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      options.onSuccess?.()
    } catch (error) {
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [queryClient, options])

  const assignPIC = useCallback(async (candidateId: string, picId: string) => {
    setLoading(true)
    try {
      await api.patch(`/recruitment/candidates/${candidateId}/assign-pic`, { picId })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      options.onSuccess?.()
    } catch (error) {
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [queryClient, options])

  const transferCampaign = useCallback(async (candidateId: string, campaignId: string) => {
    setLoading(true)
    try {
      await api.post(`/recruitment/candidates/${candidateId}/transfer`, { campaignId })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      options.onSuccess?.()
    } catch (error) {
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [queryClient, options])

  const deleteCandidate = useCallback(async (candidateId: string) => {
    setLoading(true)
    try {
      await api.delete(`/recruitment/candidates/${candidateId}`)
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      options.onSuccess?.()
    } catch (error) {
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [queryClient, options])

  return {
    loading,
    updateStatus,
    assignPIC,
    transferCampaign,
    deleteCandidate,
  }
}