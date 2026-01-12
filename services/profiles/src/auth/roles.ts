export type Role = 'PATIENT' | 'STAFF' | 'ADMIN';

export function hasRole(userRole: string, allowed: Role[]) {
  return allowed.includes(userRole as Role);
}