// Frontend permission utilities
export type UserRole = 'ADMIN' | 'RECRUITER' | 'AM' | 'SM'

export const PERMISSIONS = {
  // User Management
  USER_CREATE: ['ADMIN'],
  USER_UPDATE: ['ADMIN'],
  USER_DELETE: ['ADMIN'],
  USER_VIEW_ALL: ['ADMIN', 'RECRUITER'],
  USER_VIEW_OWN: ['ADMIN', 'RECRUITER', 'AM', 'SM'],

  // Requests Module
  REQUEST_CREATE: ['ADMIN', 'RECRUITER', 'AM', 'SM'],
  REQUEST_VIEW_ALL: ['ADMIN', 'RECRUITER', 'AM'],
  REQUEST_VIEW_OWN: ['ADMIN', 'RECRUITER', 'AM', 'SM'],
  REQUEST_APPROVE: ['ADMIN', 'RECRUITER', 'AM'],
  REQUEST_UPDATE: ['ADMIN', 'RECRUITER'],
  REQUEST_DELETE: ['ADMIN', 'RECRUITER'],

  // Recruitment Module
  RECRUITMENT_FORM_CREATE: ['ADMIN', 'RECRUITER'],
  RECRUITMENT_FORM_UPDATE: ['ADMIN', 'RECRUITER'],
  RECRUITMENT_FORM_DELETE: ['ADMIN'],
  RECRUITMENT_CAMPAIGN_CREATE: ['ADMIN', 'RECRUITER', 'AM'],
  RECRUITMENT_CAMPAIGN_UPDATE: ['ADMIN', 'RECRUITER', 'AM'],
  RECRUITMENT_CANDIDATE_VIEW_ALL: ['ADMIN', 'RECRUITER', 'AM'],
  RECRUITMENT_CANDIDATE_CREATE: ['ADMIN', 'RECRUITER', 'AM'],
  RECRUITMENT_CANDIDATE_UPDATE: ['ADMIN', 'RECRUITER', 'AM'],
  RECRUITMENT_CANDIDATE_DELETE: ['ADMIN', 'RECRUITER'],
  RECRUITMENT_PROPOSAL_APPROVE: ['ADMIN', 'RECRUITER', 'AM'],
  RECRUITMENT_HEADCOUNT_CREATE: ['ADMIN', 'RECRUITER'],
  RECRUITMENT_HEADCOUNT_UPDATE: ['ADMIN', 'RECRUITER'],
  RECRUITMENT_DASHBOARD_VIEW: ['ADMIN', 'RECRUITER', 'AM'],

  // Employees Module
  EMPLOYEE_CREATE: ['ADMIN', 'RECRUITER'],
  EMPLOYEE_UPDATE: ['ADMIN', 'RECRUITER', 'AM'],
  EMPLOYEE_VIEW_ALL: ['ADMIN', 'RECRUITER', 'AM'],
  EMPLOYEE_VIEW_OWN: ['ADMIN', 'RECRUITER', 'AM', 'SM'],
  EMPLOYEE_DELETE: ['ADMIN'],
  EMPLOYEE_DASHBOARD_VIEW: ['ADMIN', 'RECRUITER', 'AM'],

  // Contracts Module
  CONTRACT_CREATE: ['ADMIN', 'RECRUITER'],
  CONTRACT_UPDATE: ['ADMIN', 'RECRUITER'],
  CONTRACT_DELETE: ['ADMIN'],
  CONTRACT_VIEW_ALL: ['ADMIN', 'RECRUITER', 'AM'],
  CONTRACT_VIEW_OWN: ['ADMIN', 'RECRUITER', 'AM', 'SM'],

  // Decisions Module
  DECISION_CREATE: ['ADMIN', 'RECRUITER'],
  DECISION_UPDATE: ['ADMIN', 'RECRUITER'],
  DECISION_DELETE: ['ADMIN'],
  DECISION_VIEW_ALL: ['ADMIN', 'RECRUITER', 'AM'],
  DECISION_VIEW_OWN: ['ADMIN', 'RECRUITER', 'AM', 'SM'],

  // Timekeeping Module
  TIMEKEEPING_CREATE: ['ADMIN', 'RECRUITER', 'AM', 'SM'],
  TIMEKEEPING_VIEW_ALL: ['ADMIN', 'RECRUITER', 'AM'],
  TIMEKEEPING_VIEW_OWN: ['ADMIN', 'RECRUITER', 'AM', 'SM'],
  TIMEKEEPING_UPDATE: ['ADMIN', 'RECRUITER', 'AM'],

  // Payroll Module
  PAYROLL_VIEW_ALL: ['ADMIN', 'RECRUITER', 'AM'],
  PAYROLL_VIEW_OWN: ['ADMIN', 'RECRUITER', 'AM', 'SM'],
  PAYROLL_CALCULATE: ['ADMIN', 'RECRUITER'],
  PAYROLL_UPDATE: ['ADMIN', 'RECRUITER'],

  // Types Management
  TYPE_CREATE: ['ADMIN'],
  TYPE_UPDATE: ['ADMIN'],
  TYPE_DELETE: ['ADMIN'],
} as const

export function hasPermission(userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(userRole)
}

export function hasAnyPermission(
  userRole: UserRole,
  permissions: Array<keyof typeof PERMISSIONS>
): boolean {
  return permissions.some(permission => (PERMISSIONS[permission] as readonly string[]).includes(userRole))
}

export function hasAllPermissions(
  userRole: UserRole,
  permissions: Array<keyof typeof PERMISSIONS>
): boolean {
  return permissions.every(permission => (PERMISSIONS[permission] as readonly string[]).includes(userRole))
}

