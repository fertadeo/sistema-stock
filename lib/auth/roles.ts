export const USER_ROLES = {
  REPARTIDOR: 'repartidor',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface SessionUser {
  id: number;
  email: string;
  role: UserRole;
  role_label: string;
  repartidor_id?: string | null;
  repartidor_nombre?: string | null;
  created_at?: string;
}

export const canManageAccounts = (role: UserRole): boolean =>
  role === USER_ROLES.ADMIN || role === USER_ROLES.SUPERADMIN;

export const assignableRolesFor = (role: UserRole): UserRole[] => {
  if (role === USER_ROLES.SUPERADMIN) {
    return [USER_ROLES.REPARTIDOR, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN];
  }
  if (role === USER_ROLES.ADMIN) {
    return [USER_ROLES.REPARTIDOR, USER_ROLES.ADMIN];
  }
  return [];
};

export const roleLabel = (role: UserRole): string => {
  switch (role) {
    case USER_ROLES.REPARTIDOR:
      return 'Repartidor';
    case USER_ROLES.SUPERADMIN:
      return 'Superadmin';
    default:
      return 'Admin';
  }
};

export const isValidRole = (role: string): role is UserRole =>
  Object.values(USER_ROLES).includes(role as UserRole);

export const getDefaultRouteForRole = (role: UserRole): string => {
  if (role === USER_ROLES.REPARTIDOR) {
    return '/repartidor/rapido';
  }
  return '/home';
};

export const canAccessAdminModule = (role: UserRole): boolean =>
  role === USER_ROLES.ADMIN || role === USER_ROLES.SUPERADMIN;

export const canAccessSalubridad = (role: UserRole): boolean =>
  role === USER_ROLES.SUPERADMIN;

export const canAccessRepartidorRapidoOnly = (role: UserRole): boolean =>
  role === USER_ROLES.REPARTIDOR;
