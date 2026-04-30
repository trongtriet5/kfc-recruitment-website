/**
 * Centralized Constraint Definitions for Recruitment System
 *
 * This file serves as the single source of truth for all business constraints:
 * - RBAC (Role-Based Access Control) permissions
 * - Status transition rules
 * - Store-user hierarchy relationships
 * - Proposal workflow rules
 *
 * Usage:
 *   import { PERMISSIONS, STATUS_TRANSITIONS, STORE_HIERARCHY } from './constraints';
 */

// ============================================================
// 1. RBAC PERMISSION MATRIX
// ============================================================

// Define PermissionAction here to avoid circular dependency
export type PermissionAction =
  | 'CANDIDATE_CREATE'
  | 'CANDIDATE_READ'
  | 'CANDIDATE_UPDATE'
  | 'CANDIDATE_DELETE'
  | 'CANDIDATE_STATUS_CHANGE'
  | 'CANDIDATE_ASSIGN_PIC'
  | 'CANDIDATE_TRANSFER_CAMPAIGN'
  | 'CANDIDATE_BLACKLIST'
  | 'PROPOSAL_CREATE'
  | 'PROPOSAL_READ'
  | 'PROPOSAL_UPDATE'
  | 'PROPOSAL_DELETE'
  | 'PROPOSAL_SUBMIT'
  | 'PROPOSAL_REVIEW'
  | 'PROPOSAL_APPROVE'
  | 'PROPOSAL_REJECT'
  | 'PROPOSAL_CANCEL'
  | 'CAMPAIGN_CREATE'
  | 'CAMPAIGN_READ'
  | 'CAMPAIGN_UPDATE'
  | 'CAMPAIGN_DELETE'
  | 'CAMPAIGN_MANAGE'
  | 'INTERVIEW_CREATE'
  | 'INTERVIEW_READ'
  | 'INTERVIEW_UPDATE'
  | 'INTERVIEW_DELETE'
  | 'OFFER_CREATE'
  | 'OFFER_READ'
  | 'OFFER_UPDATE'
  | 'OFFER_DELETE'
  | 'OFFER_SEND'
  | 'REPORT_VIEW'
  | 'REPORT_EXPORT'
  | 'SETTINGS_MANAGE'
  | 'USER_MANAGE';

export type Role = 'ADMIN' | 'HEAD_OF_DEPARTMENT' | 'RECRUITER' | 'MANAGER' | 'USER';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  HEAD_OF_DEPARTMENT: 'Trưởng phòng',
  RECRUITER: 'Nhân viên tuyển dụng',
  MANAGER: 'Quản lý khu vực (AM)',
  USER: 'Quản lý cửa hàng (SM)',
};

export const PERMISSIONS: Record<Role, PermissionAction[]> = {
  ADMIN: [
    'CANDIDATE_CREATE', 'CANDIDATE_READ', 'CANDIDATE_UPDATE', 'CANDIDATE_DELETE',
    'CANDIDATE_STATUS_CHANGE', 'CANDIDATE_ASSIGN_PIC', 'CANDIDATE_TRANSFER_CAMPAIGN', 'CANDIDATE_BLACKLIST',
    'PROPOSAL_CREATE', 'PROPOSAL_READ', 'PROPOSAL_UPDATE', 'PROPOSAL_DELETE',
    'PROPOSAL_SUBMIT', 'PROPOSAL_REVIEW', 'PROPOSAL_APPROVE', 'PROPOSAL_REJECT', 'PROPOSAL_CANCEL',
    'CAMPAIGN_CREATE', 'CAMPAIGN_READ', 'CAMPAIGN_UPDATE', 'CAMPAIGN_DELETE', 'CAMPAIGN_MANAGE',
    'INTERVIEW_CREATE', 'INTERVIEW_READ', 'INTERVIEW_UPDATE', 'INTERVIEW_DELETE',
    'OFFER_CREATE', 'OFFER_READ', 'OFFER_UPDATE', 'OFFER_DELETE', 'OFFER_SEND',
    'REPORT_VIEW', 'REPORT_EXPORT',
    'SETTINGS_MANAGE', 'USER_MANAGE',
  ],
  HEAD_OF_DEPARTMENT: [
    'CANDIDATE_CREATE', 'CANDIDATE_READ', 'CANDIDATE_UPDATE',
    'CANDIDATE_STATUS_CHANGE', 'CANDIDATE_ASSIGN_PIC', 'CANDIDATE_TRANSFER_CAMPAIGN',
    'PROPOSAL_CREATE', 'PROPOSAL_READ', 'PROPOSAL_UPDATE',
    'PROPOSAL_SUBMIT', 'PROPOSAL_REVIEW', 'PROPOSAL_APPROVE', 'PROPOSAL_REJECT',
    'CAMPAIGN_CREATE', 'CAMPAIGN_READ', 'CAMPAIGN_UPDATE', 'CAMPAIGN_MANAGE',
    'INTERVIEW_CREATE', 'INTERVIEW_READ', 'INTERVIEW_UPDATE',
    'OFFER_CREATE', 'OFFER_READ', 'OFFER_UPDATE', 'OFFER_SEND',
    'REPORT_VIEW', 'REPORT_EXPORT',
  ],
  RECRUITER: [
    'CANDIDATE_CREATE', 'CANDIDATE_READ', 'CANDIDATE_UPDATE',
    'CANDIDATE_STATUS_CHANGE', 'CANDIDATE_ASSIGN_PIC', 'CANDIDATE_TRANSFER_CAMPAIGN',
    'PROPOSAL_READ',
    'CAMPAIGN_CREATE', 'CAMPAIGN_READ', 'CAMPAIGN_UPDATE', 'CAMPAIGN_MANAGE',
    'INTERVIEW_CREATE', 'INTERVIEW_READ', 'INTERVIEW_UPDATE',
    'OFFER_CREATE', 'OFFER_READ', 'OFFER_UPDATE', 'OFFER_SEND',
    'REPORT_VIEW',
  ],
  MANAGER: [
    'CANDIDATE_READ', 'CANDIDATE_UPDATE',
    'CANDIDATE_STATUS_CHANGE',
    'PROPOSAL_CREATE', 'PROPOSAL_READ', 'PROPOSAL_UPDATE',
    'PROPOSAL_SUBMIT', 'PROPOSAL_REVIEW', 'PROPOSAL_APPROVE', 'PROPOSAL_REJECT', 'PROPOSAL_CANCEL',
    'CAMPAIGN_READ',
    'INTERVIEW_CREATE', 'INTERVIEW_READ', 'INTERVIEW_UPDATE',
    'OFFER_READ',
    'REPORT_VIEW',
  ],
  USER: [
    'CANDIDATE_READ',
    'CANDIDATE_STATUS_CHANGE',
    'PROPOSAL_CREATE', 'PROPOSAL_READ', 'PROPOSAL_UPDATE',
    'PROPOSAL_SUBMIT', 'PROPOSAL_CANCEL',
    'CAMPAIGN_READ',
    'INTERVIEW_READ',
    'OFFER_READ',
    'REPORT_VIEW',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, action: PermissionAction): boolean {
  return PERMISSIONS[role]?.includes(action) ?? false;
}

// ============================================================
// 2. STATUS TRANSITION RULES
// ============================================================

export interface TransitionRule {
  from: string[];      // '*' means any status
  to: string;
  allowedRoles: Role[];
  requiresReason?: boolean;
  conditions?: TransitionCondition[];
}

export interface TransitionCondition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'notIn' | 'gt' | 'lt';
  value: any;
}

export const STATUS_TRANSITIONS: TransitionRule[] = [
  // Application stage - HR/Recruiter only
  { from: ['*'], to: 'CV_FILTERING', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['CV_FILTERING'], to: 'WAITING_INTERVIEW', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['CV_FILTERING'], to: 'BLACKLIST', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT'], requiresReason: true },
  { from: ['CV_FILTERING'], to: 'CANNOT_CONTACT', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['CV_FILTERING'], to: 'AREA_NOT_RECRUITING', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },

  // Interview stage - HR schedules, SM/AM/OM updates
  { from: ['WAITING_INTERVIEW'], to: 'HR_INTERVIEW_PASSED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['WAITING_INTERVIEW'], to: 'HR_INTERVIEW_FAILED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'], requiresReason: true },

  // SM/AM Interview - Store managers can update
  { from: ['HR_INTERVIEW_PASSED'], to: 'SM_AM_INTERVIEW_PASSED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER', 'USER'] },
  { from: ['HR_INTERVIEW_PASSED'], to: 'SM_AM_INTERVIEW_FAILED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER', 'USER'], requiresReason: true },
  { from: ['HR_INTERVIEW_PASSED'], to: 'SM_AM_NO_SHOW', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER', 'USER'] },

  // OM Interview - AM/Admin only
  { from: ['SM_AM_INTERVIEW_PASSED'], to: 'OM_PV_INTERVIEW_PASSED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER'] },
  { from: ['SM_AM_INTERVIEW_PASSED'], to: 'OM_PV_INTERVIEW_FAILED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER'], requiresReason: true },
  { from: ['SM_AM_INTERVIEW_PASSED'], to: 'OM_PV_NO_SHOW', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER'] },

  // Offer stage - HR only
  { from: ['OM_PV_INTERVIEW_PASSED'], to: 'OFFER_SENT', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['OFFER_SENT'], to: 'OFFER_ACCEPTED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['OFFER_SENT'], to: 'OFFER_REJECTED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'], requiresReason: true },

  // Onboarding stage
  { from: ['OFFER_ACCEPTED'], to: 'WAITING_ONBOARDING', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['WAITING_ONBOARDING'], to: 'ONBOARDING_ACCEPTED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER', 'MANAGER', 'USER'] },
  { from: ['WAITING_ONBOARDING'], to: 'ONBOARDING_REJECTED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'], requiresReason: true },

  // Revert rules (ADMIN & RECRUITER)
  { from: ['*'], to: 'CV_FILTERING', allowedRoles: ['ADMIN', 'RECRUITER'] },
];

// Status groups for UI organization
export const STATUS_GROUPS: Record<string, string> = {
  CV_FILTERING: 'application',
  BLACKLIST: 'application',
  CANNOT_CONTACT: 'application',
  AREA_NOT_RECRUITING: 'application',

  WAITING_INTERVIEW: 'interview',
  HR_INTERVIEW_PASSED: 'interview',
  HR_INTERVIEW_FAILED: 'interview',
  SM_AM_INTERVIEW_PASSED: 'interview',
  SM_AM_INTERVIEW_FAILED: 'interview',
  SM_AM_NO_SHOW: 'interview',
  OM_PV_INTERVIEW_PASSED: 'interview',
  OM_PV_INTERVIEW_FAILED: 'interview',
  OM_PV_NO_SHOW: 'interview',

  OFFER_SENT: 'offer',
  OFFER_ACCEPTED: 'offer',
  OFFER_REJECTED: 'offer',

  WAITING_ONBOARDING: 'onboarding',
  ONBOARDING_ACCEPTED: 'onboarding',
  ONBOARDING_REJECTED: 'onboarding',
};

export const TERMINAL_STATUSES = [
  'BLACKLIST',
  'HR_INTERVIEW_FAILED',
  'SM_AM_INTERVIEW_FAILED',
  'OM_PV_INTERVIEW_FAILED',
  'OFFER_REJECTED',
  'ONBOARDING_REJECTED',
  'ONBOARDING_ACCEPTED'
];

// Terminal statuses for proposals (no further transitions allowed)
export const TERMINAL_PROPOSAL_STATUSES: ProposalStatus[] = [
  'REJECTED',
  'CANCELLED',
  'APPROVED'  // APPROVED can only be cancelled
];

/**
 * Check if a status transition is allowed
 */
export function canTransition(
  fromStatus: string | null,
  toStatus: string,
  role: Role
): { allowed: boolean; requiresReason?: boolean } {
  const rule = STATUS_TRANSITIONS.find((r) => {
    const matchFrom = r.from.includes('*') || r.from.includes(fromStatus || '');
    const matchTo = r.to === toStatus;
    const matchRole = r.allowedRoles.includes(role);
    return matchFrom && matchTo && matchRole;
  });

  if (!rule) {
    return { allowed: false };
  }

  return { allowed: true, requiresReason: rule.requiresReason };
}

/**
 * Get all allowed next statuses for a role and current status
 */
export function getAllowedTransitions(fromStatus: string | null, role: Role): string[] {
  const codes = new Set<string>();

  for (const rule of STATUS_TRANSITIONS) {
    const matchFrom = rule.from.includes('*') || rule.from.includes(fromStatus || '');
    const matchRole = rule.allowedRoles.includes(role);
    if (matchFrom && matchRole) {
      codes.add(rule.to);
    }
  }

  return Array.from(codes);
}

// ============================================================
// 3. PROPOSAL WORKFLOW RULES
// ============================================================

export type ProposalStatus = 'DRAFT' | 'SUBMITTED' | 'AM_REVIEWED' | 'HR_ACCEPTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ProposalAction {
  name: string;
  fromStatus: ProposalStatus[];
  allowedRoles: Role[];
  nextStatus: ProposalStatus;
  requiresNotes?: boolean;
}

export const PROPOSAL_WORKFLOW: ProposalAction[] = [
  // Submit proposal - from Draft
  { name: 'SUBMIT', fromStatus: ['DRAFT'], allowedRoles: ['USER', 'MANAGER', 'ADMIN'], nextStatus: 'SUBMITTED' },

  // AM Review
  { name: 'REVIEW', fromStatus: ['SUBMITTED'], allowedRoles: ['MANAGER', 'ADMIN'], nextStatus: 'AM_REVIEWED' },
  { name: 'REJECT', fromStatus: ['SUBMITTED', 'AM_REVIEWED'], allowedRoles: ['MANAGER', 'ADMIN'], nextStatus: 'REJECTED', requiresNotes: true },

  // HR Accept
  { name: 'HR_ACCEPT', fromStatus: ['AM_REVIEWED', 'SUBMITTED'], allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT'], nextStatus: 'HR_ACCEPTED' },

  // Final Approval
  { name: 'APPROVE', fromStatus: ['HR_ACCEPTED', 'AM_REVIEWED'], allowedRoles: ['MANAGER', 'ADMIN'], nextStatus: 'APPROVED' },

  // Cancel
  { name: 'CANCEL', fromStatus: ['DRAFT', 'SUBMITTED'], allowedRoles: ['USER', 'MANAGER', 'ADMIN'], nextStatus: 'CANCELLED' },
];

/**
 * Check if a proposal action is allowed
 */
export function canPerformProposalAction(
  action: string,
  currentStatus: ProposalStatus,
  role: Role
): { allowed: boolean; requiresNotes?: boolean; nextStatus?: ProposalStatus } {
  const workflowAction = PROPOSAL_WORKFLOW.find((a) => {
    const matchAction = a.name === action;
    const matchStatus = a.fromStatus.includes(currentStatus);
    const matchRole = a.allowedRoles.includes(role);
    return matchAction && matchStatus && matchRole;
  });

  if (!workflowAction) {
    return { allowed: false };
  }

  return {
    allowed: true,
    requiresNotes: workflowAction.requiresNotes,
    nextStatus: workflowAction.nextStatus,
  };
}

/**
 * Get allowed proposal actions for a role and current status
 */
export function getAllowedProposalActions(
  currentStatus: ProposalStatus,
  role: Role
): { action: string; nextStatus: ProposalStatus; requiresNotes?: boolean }[] {
  const allowed: { action: string; nextStatus: ProposalStatus; requiresNotes?: boolean }[] = [];

  for (const workflowAction of PROPOSAL_WORKFLOW) {
    const matchStatus = workflowAction.fromStatus.includes(currentStatus);
    const matchRole = workflowAction.allowedRoles.includes(role);
    if (matchStatus && matchRole) {
      allowed.push({
        action: workflowAction.name,
        nextStatus: workflowAction.nextStatus,
        requiresNotes: workflowAction.requiresNotes,
      });
    }
  }

  return allowed;
}

// ============================================================
// 4. STORE-USER HIERARCHY
// ============================================================

export interface StoreHierarchyConfig {
  storeRelation: 'managedStore' | 'managedStores' | 'all' | 'none';
  canViewOtherAMStores?: boolean;  // For USER role - can view all stores under their AM
}

export const STORE_HIERARCHY: Record<Role, StoreHierarchyConfig> = {
  ADMIN: {
    storeRelation: 'all',  // Can access all stores
  },
  HEAD_OF_DEPARTMENT: {
    storeRelation: 'all',
  },
  RECRUITER: {
    storeRelation: 'all',
  },
  MANAGER: {
    storeRelation: 'managedStores',  // AM's stores
  },
  USER: {
    storeRelation: 'managedStore',   // SM's single store
    canViewOtherAMStores: true,       // Can view all stores under their AM
  },
};

/**
 * Get the store access level for a role
 */
export function getStoreAccessConfig(role: Role): StoreHierarchyConfig {
  return STORE_HIERARCHY[role] || { storeRelation: 'none' };
}

// ============================================================
// 5. INTERVIEW RESULT CONSTRAINTS
// ============================================================

export interface InterviewResultConfig {
  allowedResults: string[];
  isAdmin: boolean;  // Admin can set any result
}

export const INTERVIEW_RESULTS: Record<Role, InterviewResultConfig> = {
  ADMIN: {
    allowedResults: ['PASSED', 'FAILED', 'PENDING'],
    isAdmin: true,
  },
  HEAD_OF_DEPARTMENT: {
    allowedResults: ['PASSED', 'FAILED', 'PENDING'],
    isAdmin: true,
  },
  RECRUITER: {
    allowedResults: ['PASSED', 'FAILED', 'PENDING'],
    isAdmin: true,
  },
  MANAGER: {
    allowedResults: ['SM_AM_PASSED', 'SM_AM_FAILED', 'SM_AM_NO_SHOW', 'OM_PV_PASSED', 'OM_PV_FAILED', 'OM_PV_NO_SHOW'],
    isAdmin: false,
  },
  USER: {
    allowedResults: ['SM_AM_PASSED', 'SM_AM_FAILED', 'SM_AM_NO_SHOW', 'OM_PV_PASSED', 'OM_PV_FAILED', 'OM_PV_NO_SHOW'],
    isAdmin: false,
  },
};

/**
 * Check if user role can set a specific interview result
 */
export function canSetInterviewResult(role: Role, result: string): boolean {
  const constraint = INTERVIEW_RESULTS[role];
  if (!constraint) return false;
  if (constraint.isAdmin) return true;
  return constraint.allowedResults.includes(result);
}

/**
 * Get allowed interview results for a role
 */
export function getAllowedInterviewResults(role: Role): { code: string; name: string }[] {
  const constraint = INTERVIEW_RESULTS[role];
  if (!constraint) return [];

  if (constraint.isAdmin) {
    return [
      { code: 'PASSED', name: 'Đạt' },
      { code: 'FAILED', name: 'Không đạt' },
      { code: 'PENDING', name: 'Chờ kết quả' },
    ];
  }

  const labels: Record<string, string> = {
    SM_AM_PASSED: 'SM/AM PV Đạt',
    SM_AM_FAILED: 'SM/AM PV Loại',
    SM_AM_NO_SHOW: 'Không đến phỏng vấn',
    OM_PV_PASSED: 'OM PV Đạt',
    OM_PV_FAILED: 'OM PV Loại',
    OM_PV_NO_SHOW: 'Không đến phỏng vấn',
  };

  return constraint.allowedResults.map((code) => ({
    code,
    name: labels[code] || code,
  }));
}

// ============================================================
// 6. CAMPAIGN CONSTRAINTS
// ============================================================

export const CAMPAIGN_CONSTRAINTS = {
  // Campaign status transitions
  canCreate: (role: Role): boolean => hasPermission(role, 'CAMPAIGN_CREATE'),

  canUpdate: (role: Role): boolean => hasPermission(role, 'CAMPAIGN_UPDATE'),

  canDelete: (role: Role): boolean => hasPermission(role, 'CAMPAIGN_DELETE'),

  // Candidate assignment constraints
  canAssignCandidateToCampaign: (role: Role, campaignStatus: string): boolean => {
    if (!hasPermission(role, 'CANDIDATE_UPDATE')) return false;
    return campaignStatus === 'ACTIVE';
  },

  // Fulfillment auto-complete
  autoCompleteWhenFilled: true,

  // Status values
  STATUS_ACTIVE: 'ACTIVE',
  STATUS_PAUSED: 'PAUSED',
  STATUS_COMPLETED: 'COMPLETED',
  STATUS_CANCELLED: 'CANCELLED',
};

// ============================================================
// 7. EXPORT UTILITY FUNCTIONS
// ============================================================

/**
 * Validate all constraints for a status transition
 */
export function validateStatusTransition(
  fromStatus: string | null,
  toStatus: string,
  role: Role,
  options?: { reason?: string }
): { valid: boolean; error?: string } {
  const result = canTransition(fromStatus, toStatus, role);

  if (!result.allowed) {
    return {
      valid: false,
      error: `Không được phép chuyển từ "${fromStatus || 'Mới'}" sang "${toStatus}" với vai trò ${ROLE_LABELS[role]}`,
    };
  }

  if (result.requiresReason && !options?.reason) {
    return {
      valid: false,
      error: `Chuyển trạng thái sang "${toStatus}" yêu cầu nhập lý do`,
    };
  }

  return { valid: true };
}

/**
 * Validate all constraints for a proposal action
 */
export function validateProposalAction(
  action: string,
  currentStatus: ProposalStatus,
  role: Role,
  options?: { notes?: string }
): { valid: boolean; error?: string; nextStatus?: ProposalStatus } {
  const result = canPerformProposalAction(action, currentStatus, role);

  if (!result.allowed) {
    return {
      valid: false,
      error: `Không được phép thực hiện "${action}" khi đề xuất đang ở trạng thái "${currentStatus}" với vai trò ${ROLE_LABELS[role]}`,
    };
  }

  if (result.requiresNotes && !options?.notes) {
    return {
      valid: false,
      error: `Thực hiện "${action}" yêu cầu nhập ghi chú`,
    };
  }

  return { valid: true, nextStatus: result.nextStatus };
}