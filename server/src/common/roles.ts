export const Roles = {
  WAREHOUSE: 1,
  PACKER: 2,
  DRIVER: 4,
  DISPATCHER: 8,
  ACCOUNTANT: 16,
  MANAGER: 32,
  DIRECTOR: 64,
} as const;

export type RoleMask = (typeof Roles)[keyof typeof Roles];

export const hasRole = (roleMask: number, role: number) => (roleMask & role) !== 0;
export const isManager = (roleMask: number) => hasRole(roleMask, Roles.MANAGER) || hasRole(roleMask, Roles.DIRECTOR);
export const isDirector = (roleMask: number) => hasRole(roleMask, Roles.DIRECTOR);
