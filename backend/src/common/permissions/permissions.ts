import { UserRole } from '@prisma/client';

// Permission definitions for each module
export const PERMISSIONS = {
  // User Management
  USER_CREATE: [UserRole.ADMIN],
  USER_UPDATE: [UserRole.ADMIN],
  USER_DELETE: [UserRole.ADMIN],
  USER_VIEW_ALL: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  USER_VIEW_OWN: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.USER],

  // Requests Module
  REQUEST_CREATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.USER],
  REQUEST_VIEW_ALL: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],
  REQUEST_VIEW_OWN: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.USER],
  REQUEST_APPROVE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],
  REQUEST_UPDATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  REQUEST_DELETE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],

  // Recruitment Module
  RECRUITMENT_FORM_CREATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  RECRUITMENT_FORM_UPDATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  RECRUITMENT_FORM_DELETE: [UserRole.ADMIN],
  RECRUITMENT_CAMPAIGN_CREATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],
  RECRUITMENT_CAMPAIGN_UPDATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],
  RECRUITMENT_CANDIDATE_VIEW_ALL: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR],
  RECRUITMENT_CANDIDATE_CREATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],
  RECRUITMENT_CANDIDATE_UPDATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR],
  RECRUITMENT_CANDIDATE_DELETE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  RECRUITMENT_PROPOSAL_APPROVE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],
  RECRUITMENT_HEADCOUNT_CREATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  RECRUITMENT_HEADCOUNT_UPDATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  RECRUITMENT_DASHBOARD_VIEW: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],

  // Employees Module
  EMPLOYEE_CREATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  EMPLOYEE_UPDATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],
  EMPLOYEE_VIEW_ALL: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR],
  EMPLOYEE_VIEW_OWN: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.USER],
  EMPLOYEE_DELETE: [UserRole.ADMIN],
  EMPLOYEE_DASHBOARD_VIEW: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],

  // Contracts Module
  CONTRACT_CREATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  CONTRACT_UPDATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  CONTRACT_DELETE: [UserRole.ADMIN],
  CONTRACT_VIEW_ALL: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],
  CONTRACT_VIEW_OWN: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.USER],

  // Decisions Module
  DECISION_CREATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  DECISION_UPDATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  DECISION_DELETE: [UserRole.ADMIN],
  DECISION_VIEW_ALL: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR],
  DECISION_VIEW_OWN: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.USER],

  // Timekeeping Module
  TIMEKEEPING_CREATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.USER],
  TIMEKEEPING_VIEW_ALL: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR],
  TIMEKEEPING_VIEW_OWN: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.USER],
  TIMEKEEPING_UPDATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],

  // Payroll Module
  PAYROLL_VIEW_ALL: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER],
  PAYROLL_VIEW_OWN: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.USER],
  PAYROLL_CALCULATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],
  PAYROLL_UPDATE: [UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT],

  // Types Management (System Configuration)
  TYPE_CREATE: [UserRole.ADMIN],
  TYPE_UPDATE: [UserRole.ADMIN],
  TYPE_DELETE: [UserRole.ADMIN],
} as const;

// Helper function to check if user has permission
export function hasPermission(userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
  return allowedRoles.includes(userRole);
}

// Helper function to check if user has any of the permissions
export function hasAnyPermission(userRole: UserRole, permissions: Array<keyof typeof PERMISSIONS>): boolean {
  return permissions.some(permission => {
    const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
    return allowedRoles.includes(userRole);
  });
}

// Helper function to check if user has all permissions
export function hasAllPermissions(userRole: UserRole, permissions: Array<keyof typeof PERMISSIONS>): boolean {
  return permissions.every(permission => {
    const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
    return allowedRoles.includes(userRole);
  });
}

