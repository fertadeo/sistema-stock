import { SessionUser, USER_ROLES } from '@/lib/auth/roles';

/** Compara nombres de repartidor (incluye alias parcial para David). */
export const coincideRepartidorNombre = (
  clienteRepartidor: string | null | undefined,
  repartidorNombre: string | null | undefined
): boolean => {
  if (!repartidorNombre?.trim() || !clienteRepartidor?.trim()) return false;

  if (
    repartidorNombre.toLowerCase().includes('david') &&
    clienteRepartidor.toLowerCase().includes('david')
  ) {
    return true;
  }

  return clienteRepartidor.trim().toLowerCase() === repartidorNombre.trim().toLowerCase();
};

/**
 * Un repartidor puede modificar si el cliente no tiene asignado
 * o está asignado a él. Admin/superadmin siempre pueden.
 */
export const puedeModificarCliente = (
  cliente: { repartidor?: string | null },
  user: SessionUser | null | undefined
): boolean => {
  if (!user) return false;
  if (user.role !== USER_ROLES.REPARTIDOR) return true;

  const asignado = cliente.repartidor?.trim() || '';
  if (!asignado) return true;

  return coincideRepartidorNombre(asignado, user.repartidor_nombre);
};
