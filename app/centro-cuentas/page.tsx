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
  password: string;
}

const roleBadgeClass: Record<UserRole, string> = {
  [USER_ROLES.SUPERADMIN]: 'bg-purple-100 text-purple-800',
  [USER_ROLES.ADMIN]: 'bg-teal-100 text-teal-800',
  [USER_ROLES.REPARTIDOR]: 'bg-amber-100 text-amber-800',
};

export default function CentroCuentasPage() {
  const { user: currentUser, isSuperAdmin, canManageAccounts } = useAuth();

  const [users, setUsers] = useState<SessionUser[]>([]);
  const [repartidores, setRepartidores] = useState<RepartidorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(USER_ROLES.ADMIN);
  const [repartidorId, setRepartidorId] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingUser, setEditingUser] = useState<SessionUser | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    role: USER_ROLES.ADMIN,
    repartidor_id: '',
    password: '',
  });
  const [updating, setUpdating] = useState(false);

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

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, repartidoresResponse] = await Promise.all([
        authFetch(createApiUrl('api/users')),
        authFetch(createApiUrl('api/repartidores')),
      ]);

      const usersData = await usersResponse.json();
      const repartidoresData = await repartidoresResponse.json();

      if (!usersResponse.ok) {
        throw new Error(usersData.message || 'No se pudieron cargar los usuarios');
      }

      setUsers(usersData.data || []);

      if (Array.isArray(repartidoresData)) {
        setRepartidores(repartidoresData);
      } else if (Array.isArray(repartidoresData?.data)) {
        setRepartidores(repartidoresData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
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
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo crear el usuario');
      }

      setEmail('');
      setPassword('');
      setRepartidorId('');
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
      password: '',
    });
    setError('');
    setSuccess('');
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditForm({ role: USER_ROLES.ADMIN, repartidor_id: '', password: '' });
  };

  const canEditUser = (user: SessionUser): boolean => {
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
      const payload: Record<string, string> = {
        role: editForm.role,
      };

      if (editForm.role === USER_ROLES.REPARTIDOR) {
        payload.repartidor_id = editForm.repartidor_id;
      }

      if (editForm.password.trim()) {
        payload.password = editForm.password;
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
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Centro de cuentas</h1>
        <p className="mt-2 text-sm text-gray-600">
          Creá y administrá los accesos al sistema: repartidores, administradores
          {isSuperAdmin ? ' y superadministradores' : ''}.
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

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={handleCreate} className="p-6 space-y-4 bg-white rounded-xl shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-900">Nuevo acceso</h2>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Rol</label>
            <select
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
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Repartidor</label>
              <select
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
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Rol</th>
                    <th className="py-3 pr-4 font-medium">Repartidor</th>
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
                      <td className="py-3 pr-4 text-gray-600">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('es-AR')
                          : '—'}
                      </td>
                      <td className="py-3">
                        {canEditUser(user) ? (
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
                          >
                            Editar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Sin permiso</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <label className="block mb-1 text-sm font-medium text-gray-700">Rol</label>
              <select
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
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Repartidor</label>
                <select
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
            )}

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Nueva contraseña (opcional)
              </label>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
                minLength={6}
                placeholder="Dejar vacío para no cambiar"
              />
            </div>

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
    </div>
  );
}
