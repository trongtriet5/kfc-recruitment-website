/**
 * Candidate status codes used throughout the application
 * Centralized constants for maintainability
 */

// Status codes that represent candidates who passed interviews/offer stages
export const PASSED_STATUS_CODES = [
  'HR_INTERVIEW_PASSED',
  'SM_AM_INTERVIEW_PASSED',
  'OM_PV_INTERVIEW_PASSED',
  'OFFER_SENT',
  'OFFER_ACCEPTED',
  'WAITING_ONBOARDING',
  'ONBOARDING_ACCEPTED',
] as const;

// Status code for candidates who have been onboarded
export const ONBOARDED_STATUS_CODE = 'ONBOARDING_ACCEPTED';

// Status code for initial CV filtering stage
export const CV_FILTERING_STATUS_CODE = 'CV_FILTERING';

// Status code for offer sent
export const OFFER_SENT_STATUS_CODE = 'OFFER_SENT';

// Status code for offer accepted
export const OFFER_ACCEPTED_STATUS_CODE = 'OFFER_ACCEPTED';

// Type for passed status codes
export type PassedStatusCode = (typeof PASSED_STATUS_CODES)[number];

// Helper function to check if a status code is a passed status
export function isPassedStatus(statusCode: string | null | undefined): boolean {
  if (!statusCode) return false;
  return PASSED_STATUS_CODES.includes(statusCode as PassedStatusCode);
}

// Helper function to count passed candidates
export function countPassedCandidates<T extends { status?: { code?: string } }>(
  candidates: T[],
): number {
  return candidates.filter((c) => isPassedStatus(c.status?.code)).length;
}
