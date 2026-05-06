import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { ApiResponse, PaginatedResponse } from '@/lib/api'
import { Candidate, Campaign, RecruitmentForm, CandidateStatus, Store, User, RecruitmentProposal, Position } from '@/types/recruitment'

// Query Keys
export const queryKeys = {
  candidates: ['candidates'] as const,
  candidate: (id: string) => ['candidates', id] as const,
  campaigns: ['campaigns'] as const,
  campaign: (id: string) => ['campaigns', id] as const,
  forms: ['forms'] as const,
  form: (id: string) => ['forms', id] as const,
  statuses: ['statuses'] as const,
  stores: ['stores'] as const,
  users: ['users'] as const,
  tas: ['tas'] as const,
  proposals: ['proposals'] as const,
  proposal: (id: string) => ['proposals', id] as const,
  dashboard: (filters?: Record<string, unknown>) => ['dashboard', filters] as const,
}

// Candidate Hooks
export function useCandidates(params?: Record<string, unknown>) {
  return useQuery<PaginatedResponse<Candidate>>({
    queryKey: [...queryKeys.candidates, params],
    queryFn: () => api.get('/recruitment/candidates', { params }).then(res => res.data),
  })
}

export function useCandidate(id: string) {
  return useQuery<Candidate>({
    queryKey: queryKeys.candidate(id),
    queryFn: () => api.get(`/recruitment/candidates/${id}`).then(res => res.data),
    enabled: !!id,
  })
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Candidate> }) =>
      api.patch(`/recruitment/candidates/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates })
      queryClient.invalidateQueries({ queryKey: queryKeys.candidate(id) })
    },
  })
}

// Campaign Hooks
export function useCampaigns() {
  return useQuery<Campaign[]>({
    queryKey: queryKeys.campaigns,
    queryFn: () => api.get('/recruitment/campaigns').then(res => res.data),
  })
}

export function useCampaign(id: string) {
  return useQuery<Campaign>({
    queryKey: queryKeys.campaign(id),
    queryFn: () => api.get(`/recruitment/campaigns/${id}`).then(res => res.data),
    enabled: !!id,
  })
}

// Form Hooks
export function useForms() {
  return useQuery<RecruitmentForm[]>({
    queryKey: queryKeys.forms,
    queryFn: () => api.get('/recruitment/forms').then(res => res.data),
  })
}

export function useForm(id: string) {
  return useQuery<RecruitmentForm>({
    queryKey: queryKeys.form(id),
    queryFn: () => api.get(`/recruitment/forms/${id}`).then(res => res.data),
    enabled: !!id,
  })
}

// Status Hooks
export function useStatuses() {
  return useQuery<CandidateStatus[]>({
    queryKey: queryKeys.statuses,
    queryFn: () => api.get('/recruitment/types/by-category/CANDIDATE_STATUS').then(res => res.data),
  })
}

// Store Hooks
export function useStores() {
  return useQuery<Store[]>({
    queryKey: queryKeys.stores,
    queryFn: () => api.get('/recruitment/public/stores').then(res => res.data),
  })
}

// User Hooks
export function useUsers() {
  return useQuery<User[]>({
    queryKey: queryKeys.users,
    queryFn: () => api.get('/users').then(res => res.data),
  })
}

export type RecruitmentUserSelect = {
  id: string
  fullName: string
  email: string | null
  role: string
}

// Recruitment-friendly select list (does not require USER_MANAGE)
export function useUsersForRecruitmentSelect(role?: string) {
  return useQuery<RecruitmentUserSelect[]>({
    queryKey: ['recruitment', 'users', 'select', role] as const,
    queryFn: () =>
      api
        .get('/recruitment/users/select', { params: role ? { role } : undefined })
        .then(res => res.data),
  })
}

export function useTAs() {
  return useQuery<User[]>({
    queryKey: queryKeys.tas,
    queryFn: () => api.get('/recruitment/users/tas').then(res => res.data),
  })
}

// Proposal Hooks
export function useProposals() {
  return useQuery<RecruitmentProposal[]>({
    queryKey: queryKeys.proposals,
    queryFn: () => api.get('/recruitment/proposals').then(res => res.data),
  })
}

// Dashboard Hooks
export function useDashboard(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.dashboard(filters),
    queryFn: () => api.get('/recruitment/dashboard', { params: filters }).then(res => res.data),
  })
}
