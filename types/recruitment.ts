// Candidate types
export interface Candidate {
  id: string
  full_name: string
  email?: string
  phone: string
  cvUrl?: string
  campaignId?: string
  storeId?: string
  statusId?: string
  picId?: string
  brand?: string
  position?: string
  createdAt: string
  updatedAt: string
  // Relations
  campaign?: Campaign
  store?: Store
  status?: CandidateStatus
  pic?: { id: string; full_name: string; email: string } | null
}

export interface CandidateStatus {
  id: string
  name: string
  code: string
  color?: string
  group?: string
  order: number
}

// Campaign types
export interface Campaign {
  id: string
  name: string
  description?: string
  formId: string
  storeId?: string
  link?: string
  startDate?: string
  endDate?: string
  isActive: boolean
  status?: string
  targetQty: number
  fulfilledQty: number
  createdAt: string
  // Relations
  form?: RecruitmentForm
  store?: Store
  candidates?: Candidate[]
}

// Form types
export interface RecruitmentForm {
  id: string
  title: string
  description?: string
  brand?: string
  source?: string
  link: string
  formTitle?: string
  formContent?: string
  bannerUrl?: string
  isActive: boolean
  createdAt: string
  // Relations
  fields?: FormField[]
}

export interface FormField {
  id?: string
  formId?: string
  name: string
  label: string
  type: string
  placeholder?: string
  required: boolean
  order: number
  options?: any
  width?: string
  helpText?: string
  isActive?: boolean
}

// Store types
export interface Store {
  id: string
  name: string
  code: string
  address?: string
  city?: string
  zone?: string
  brand?: string
  isActive: boolean
  smId?: string
  amId?: string
  sm?: { id: string; full_name: string } | null
  am?: { id: string; full_name: string } | null
}

// User types
export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: string
  isActive: boolean
  managedStore?: { id: string; name: string; code: string } | null
  amStores?: { id: string; name: string; code: string }[]
}

// Proposal types
export interface RecruitmentProposal {
  id: string
  title: string
  description?: string
  storeId?: string
  positionId?: string
  quantity: number
  status: string
  urgency?: string
  requestedById?: string
  createdAt: string
  // Relations
  store?: Store
  position?: Position
  requestedBy?: User
}

export interface Position {
  id: string
  name: string
  code: string
  description?: string
}

// Source types
export interface Source {
  id: string
  name: string
  code: string
  description?: string
  link?: string
  isActive: boolean
}

// Interview types
export interface Interview {
  id: string
  candidateId: string
  interviewerId: string
  type?: string
  result?: string
  scheduledAt: string
  location?: string
  notes?: string
  candidate?: Candidate
  interviewer?: User
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  statusCode: number
}

// Utility types
export type AsyncFunction<T = unknown> = (...args: any[]) => Promise<T>

export type FormSubmitHandler<T = unknown> = (data: T) => Promise<void>

export type ErrorHandler = (error: unknown) => void

export interface SelectOption {
  value: string
  label: string
}

export interface FilterParams {
  page?: number
  limit?: number
  search?: string
  statusId?: string
  storeId?: string
  campaignId?: string
  dateFrom?: string
  dateTo?: string
}

export interface DashboardStats {
  totalCandidates: number
  newCandidatesThisMonth: number
  activeCampaigns: number
  totalCampaigns: number
  totalForms: number
  totalProposals: number
}