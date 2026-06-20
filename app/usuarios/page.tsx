'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/api/fetchWithAuth';
import { USER_ROLES, UserRole } from '@/lib/auth/roles';
import { SessionUser } from '@/lib/auth/roles';

const createApiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:8080';
  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(USER_ROLES.ADMIN);
  const [repartidorId, setRepartidorId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authFetch(createApiUrl('api/users'));
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'No se pudieron cargar los usuarios');
      }
      setUsers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await authFetch(createApiUrl('api/users'), {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          role,
          repartidor_id: role === USER_ROLES.REPARTIDOR ? repartidorId || null : null,
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
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios del sistema</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestión de cuentas con roles Repartidor, Admin y Superadmin.
        </p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreate} className="p-6 space-y-4 bg-white rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Crear usuario</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
            minLength={6}
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-2 rounded-lg border"
          >
            <option value={USER_ROLES.REPARTIDOR}>Repartidor</option>
            <option value={USER_ROLES.ADMIN}>Admin</option>
            <option value={USER_ROLES.SUPERADMIN}>Superadmin</option>
          </select>
          {role === USER_ROLES.REPARTIDOR && (
            <input
              type="text"
              placeholder="ID repartidor (UUID, opcional)"
              value={repartidorId}
              onChange={(e) => setRepartidorId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
            />
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>

        <div className="p-6 bg-white rounded-xl shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Usuarios existentes</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-600">{user.role_label}</p>
                  {user.repartidor_id && (
                    <p className="text-xs text-gray-500">Repartidor: {user.repartidor_id}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
