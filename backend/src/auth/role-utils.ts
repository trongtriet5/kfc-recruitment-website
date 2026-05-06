import { Role } from '../recruitment/constraints';

/**
 * Normalize legacy role codes stored in DB/JWT.
 * - USER historically means SM
 * - MANAGER historically means AM
 */
export function normalizeRole(role?: string | null): Role | null {
  if (!role) return null;
  if (role === 'USER') return 'SM';
  if (role === 'MANAGER') return 'AM';
  if (role === 'ADMIN' || role === 'RECRUITER' || role === 'AM' || role === 'SM') return role;
  return null;
}
