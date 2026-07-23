'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { authFetch } from '@/lib/api/fetchWithAuth';
import {
  USER_ROLES,
  UserRole,
  SessionUser,
  assignableRolesFor,
  roleLabel,
} from '@/lib/auth/roles';
import { useAuth } from '@/contexts/AuthContext';

const createApiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:8080';
  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
};

interface RepartidorOption {
  id: string;
  nombre: string;
  zona_reparto?: string;
  activo?: boolean;
}

interface EditFormState {
  role: UserRole;
  repartidor_id: string;
  solo_clientes_propios: boolean;
}

const roleBadgeClass: Record<UserRole, string> = {
  [USER_ROLES.SUPERADMIN]: 'bg-purple-100 text-purple-800',
  [USER_ROLES.ADMIN]: 'bg-teal-100 text-teal-800',
  [USER_ROLES.REPARTIDOR]: 'bg-amber-100 text-amber-800',
};

function parseRepartidoresList(payload: unknown): RepartidorOption[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] })?.data)
      ? (payload as { data: unknown[] }).data
      : [];

  const result: RepartidorOption[] = [];

  for (const item of list) {
    const row = item as Record<string, unknown>;
    const id = row.id != null ? String(row.id) : '';
    const nombre = typeof row.nombre === 'string' ? row.nombre.trim() : '';
    if (!id || !nombre) continue;

    result.push({
      id,
      nombre,
      zona_reparto: typeof row.zona_reparto === 'string' ? row.zona_reparto : undefined,
      activo: row.activo === true || row.activo === 1,
    });
  }

  return result;
}

export default function CentroCuentasPage() {
  const { user: currentUser, isSuperAdmin, canManageAccounts } = useAuth();

  const [users, setUsers] = useState<SessionUser[]>([]);
  const [repartidores, setRepartidores] = useState<RepartidorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [repartidoresError, setRepartidoresError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(USER_ROLES.ADMIN);
  const [repartidorId, setRepartidorId] = useState('');
  const [createSoloClientesPropios, setCreateSoloClientesPropios] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingUser, setEditingUser] = useState<SessionUser | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    role: USER_ROLES.ADMIN,
    repartidor_id: '',
    solo_clientes_propios: false,
  });
  const [updating, setUpdating] = useState(false);

  const [passwordChangeUser, setPasswordChangeUser] = useState<SessionUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const assignableRoles = useMemo(
    () => (currentUser?.role ? assignableRolesFor(currentUser.role) : []),
    [currentUser?.role]
  );

  const repartidorNombre = useCallback(
    (id?: string | null) => {
      if (!id) return '—';
      const repartidor = repartidores.find((item) => item.id === id);
      return repartidor ? repartidor.nombre : id;
    },
    [repartidores]
  );

  const loadRepartidores = async () => {
    setRepartidoresError('');
    try {
      const response = await authFetch(createApiUrl('api/repartidores?todos=1'));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudieron cargar los repartidores');
      }

      const lista = parseRepartidoresList(data);
      setRepartidores(lista);

      if (lista.length === 0) {
        setRepartidoresError('No hay repartidores activos registrados. Creá uno en Ventas > Repartidor.');
      }
    } catch (err) {
      setRepartidores([]);
      setRepartidoresError(
        err instanceof Error ? err.message : 'Error al cargar repartidores'
      );
    }
  };

  const loadUsers = async () => {
    const response = await authFetch(createApiUrl('api/users'));
    const data = await response.json();

    if (!response.ok) {
      const message = data.message || 'No se pudieron cargar los usuarios';
      if (response.status === 403) {
        throw new Error(
          `${message}. Tu rol actual: ${currentUser?.role_label || 'desconocido'}. Cerrá sesión e ingresá de nuevo.`
        );
      }
      throw new Error(message);
    }

    setUsers(data.data || []);
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    setRepartidoresError('');

    await loadRepartidores();

    try {
      await loadUsers();
    } catch (err) {
      setUsers([]);
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageAccounts) {
      void loadData();
    }
  }, [canManageAccounts]);

  useEffect(() => {
    if (!assignableRoles.includes(role)) {
      setRole(assignableRoles[0] ?? USER_ROLES.ADMIN);
    }
  }, [assignableRoles, role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await authFetch(createApiUrl('api/users'), {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          role,
          repartidor_id: role === USER_ROLES.REPARTIDOR ? repartidorId : null,
          solo_clientes_propios:
            role === USER_ROLES.REPARTIDOR ? createSoloClientesPropios : false,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo crear el usuario');
      }

      setEmail('');
      setPassword('');
      setRepartidorId('');
      setCreateSoloClientesPropios(false);
      setRole(USER_ROLES.ADMIN);
      setSuccess('Usuario creado correctamente.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user: SessionUser) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      repartidor_id: user.repartidor_id || '',
      solo_clientes_propios: Boolean(user.solo_clientes_propios),
    });
    setError('');
    setSuccess('');
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditForm({
      role: USER_ROLES.ADMIN,
      repartidor_id: '',
      solo_clientes_propios: false,
    });
  };

  const openPasswordChange = (user: SessionUser) => {
    setPasswordChangeUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const closePasswordChange = () => {
    setPasswordChangeUser(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const canManageUser = (user: SessionUser): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === USER_ROLES.SUPERADMIN) return true;
    return user.role !== USER_ROLES.SUPERADMIN;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const payload: Record<string, string | boolean | null> = {
        role: editForm.role,
      };

      if (editForm.role === USER_ROLES.REPARTIDOR) {
        payload.repartidor_id = editForm.repartidor_id;
        payload.solo_clientes_propios = editForm.solo_clientes_propios;
      } else {
        payload.solo_clientes_propios = false;
      }

      const response = await authFetch(createApiUrl(`api/users/${editingUser.id}`), {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo actualizar el usuario');
      }

      setSuccess('Usuario actualizado correctamente.');
      closeEdit();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordChangeUser) return;

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setChangingPassword(true);
    setError('');
    setSuccess('');

    try {
      const response = await authFetch(createApiUrl(`api/users/${passwordChangeUser.id}`), {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo cambiar la contraseña');
      }

      setSuccess(`Contraseña actualizada para ${passwordChangeUser.email}.`);
      closePasswordChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!canManageAccounts) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Acceso restringido</h1>
        <p className="mt-2 text-sm text-gray-600">
          Solo administradores pueden acceder al Centro de cuentas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 bg-white rounded-xl shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Centro de cuentas</h1>
        <p className="mt-2 text-sm text-gray-600">
          Creá y administrá los accesos al sistema: repartidores, administradores
          {isSuperAdmin ? ' y superadministradores' : ''}. En cada cuenta de repartidor
          podés definir si ve todos los clientes o solo los propios.
        </p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 text-sm text-green-700 bg-green-50 rounded-xl border border-green-200">
          {success}
        </div>
      )}

      {repartidoresError && (
        <div className="p-4 text-sm text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
          {repartidoresError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={handleCreate} className="p-6 space-y-4 bg-white rounded-xl shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-900">Nuevo acceso</h2>

          <div>
            <label htmlFor="create-email" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label htmlFor="create-password" className="block mb-1 text-sm font-medium text-gray-700">Contraseña</label>
            <input
              id="create-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              minLength={6}
              required
            />
          </div>

          <div>
            <label htmlFor="create-role" className="block mb-1 text-sm font-medium text-gray-700">Rol</label>
            <select
              id="create-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {assignableRoles.map((item) => (
                <option key={item} value={item}>
                  {roleLabel(item)}
                </option>
              ))}
            </select>
          </div>

          {role === USER_ROLES.REPARTIDOR && (
            <>
              <div>
                <label htmlFor="create-repartidor" className="block mb-1 text-sm font-medium text-gray-700">Repartidor</label>
                <select
                  id="create-repartidor"
                  value={repartidorId}
                  onChange={(e) => setRepartidorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Seleccionar repartidor</option>
                  {repartidores.map((repartidor) => (
                    <option key={repartidor.id} value={repartidor.id}>
                      {repartidor.nombre}
                      {repartidor.zona_reparto ? ` (${repartidor.zona_reparto})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 items-start p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  id="create-solo-clientes"
                  type="checkbox"
                  className="mt-1"
                  checked={createSoloClientesPropios}
                  onChange={(e) => setCreateSoloClientesPropios(e.target.checked)}
                />
                <label htmlFor="create-solo-clientes" className="cursor-pointer">
                  <span className="block text-sm font-medium text-gray-900">
                    Solo clientes propios
                  </span>
                  <span className="block mt-0.5 text-xs text-gray-600">
                    Ideal para empleados. Desactivado = ve todos (dueño). Activado = solo los asignados a él.
                  </span>
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2 font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Creando...' : 'Crear acceso'}
          </button>
        </form>

        <div className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Accesos existentes</h2>
            <span className="text-sm text-gray-500">{users.length} usuarios</span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no hay usuarios registrados.</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {users.map((user) => (
                  <div key={user.id} className="mobile-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.email}</p>
                        {currentUser?.id === user.id && (
                          <span className="text-xs text-gray-500">Tu cuenta</span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleBadgeClass[user.role]}`}
                      >
                        {user.role_label}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium text-gray-700">Repartidor:</span> {repartidorNombre(user.repartidor_id)}</p>
                      {user.role === USER_ROLES.REPARTIDOR && (
                        <p>
                          <span className="font-medium text-gray-700">Clientes:</span>{' '}
                          {user.solo_clientes_propios ? 'Solo propios' : 'Todos'}
                        </p>
                      )}
                      <p>
                        <span className="font-medium text-gray-700">Alta:</span>{' '}
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('es-AR')
                          : '—'}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      {canManageUser(user) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => openPasswordChange(user)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            Cambiar contraseña
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Sin permiso para editar</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block table-scroll">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Rol</th>
                    <th className="py-3 pr-4 font-medium">Repartidor</th>
                    <th className="py-3 pr-4 font-medium">Clientes</th>
                    <th className="py-3 pr-4 font-medium">Alta</th>
                    <th className="py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{user.email}</p>
                        {currentUser?.id === user.id && (
                          <span className="text-xs text-gray-500">Tu cuenta</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleBadgeClass[user.role]}`}
                        >
                          {user.role_label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {repartidorNombre(user.repartidor_id)}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {user.role === USER_ROLES.REPARTIDOR ? (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.solo_clientes_propios
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {user.solo_clientes_propios ? 'Solo propios' : 'Todos'}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('es-AR')
                          : '—'}
                      </td>
                      <td className="py-3">
                        {canManageUser(user) ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(user)}
                              className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => openPasswordChange(user)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                              Cambiar contraseña
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin permiso</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-md p-6 space-y-4 bg-white rounded-xl shadow-xl"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Editar acceso</h3>
              <p className="text-sm text-gray-600">{editingUser.email}</p>
            </div>

            <div>
              <label htmlFor="edit-role" className="block mb-1 text-sm font-medium text-gray-700">Rol</label>
              <select
                id="edit-role"
                value={editForm.role}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, role: e.target.value as UserRole }))
                }
                disabled={currentUser?.id === editingUser.id}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100"
              >
                {assignableRoles.map((item) => (
                  <option key={item} value={item}>
                    {roleLabel(item)}
                  </option>
                ))}
              </select>
              {currentUser?.id === editingUser.id && (
                <p className="mt-1 text-xs text-gray-500">No podés cambiar tu propio rol.</p>
              )}
            </div>

            {editForm.role === USER_ROLES.REPARTIDOR && (
              <>
                <div>
                  <label htmlFor="edit-repartidor" className="block mb-1 text-sm font-medium text-gray-700">Repartidor</label>
                  <select
                    id="edit-repartidor"
                    value={editForm.repartidor_id}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, repartidor_id: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    required
                  >
                    <option value="">Seleccionar repartidor</option>
                    {repartidores.map((repartidor) => (
                      <option key={repartidor.id} value={repartidor.id}>
                        {repartidor.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <input
                    id="edit-solo-clientes"
                    type="checkbox"
                    className="mt-1"
                    checked={editForm.solo_clientes_propios}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        solo_clientes_propios: e.target.checked,
                      }))
                    }
                  />
                  <label htmlFor="edit-solo-clientes" className="cursor-pointer">
                    <span className="block text-sm font-medium text-gray-900">
                      Solo clientes propios
                    </span>
                    <span className="block mt-0.5 text-xs text-gray-600">
                      Ideal para empleados. Desactivado = ve todos (dueño). Activado = solo los asignados a él.
                    </span>
                  </label>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeEdit}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex-1 px-4 py-2 font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-60"
              >
                {updating ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {passwordChangeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form
            onSubmit={handlePasswordChange}
            className="w-full max-w-md p-6 space-y-4 bg-white rounded-xl shadow-xl"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cambiar contraseña</h3>
              <p className="text-sm text-gray-600">{passwordChangeUser.email}</p>
            </div>

            <div>
              <label htmlFor="new-password" className="block mb-1 text-sm font-medium text-gray-700">
                Nueva contraseña
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block mb-1 text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closePasswordChange}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={changingPassword}
                className="flex-1 px-4 py-2 font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-60"
              >
                {changingPassword ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
