'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from '@heroui/react';
import Link from 'next/link';
import { getDefaultRouteForRole, SessionUser } from '@/lib/auth/roles';
import { useAuth } from '@/contexts/AuthContext';

const createApiUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${baseUrl}/${cleanPath}`;
};

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(createApiUrl('api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Credenciales incorrectas. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      const user = data.user as SessionUser;
      login(data.token, user);
      router.push(getDefaultRouteForRole(user.role));
    } catch {
      setError('Ocurrió un error. Intenta de nuevo más tarde.');
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center h-screen font-serif antialiased md:flex-row">
      <div className=" relative w-full h-screen  lg:block md:w-1/2 xl:w-2/3">
        <Image
          src="/images/soderiabg.jpeg"
          alt="Background Empresa"
          fill
          objectFit="cover"
          style={{ objectPosition: '50% 80%' }}
          priority
        />
      </div>

      <div className="flex relative flex-col justify-center items-center px-6 w-full h-screen bg-white md:max-w-md lg:max-w-full md:w-1/2 xl:w-1/3 lg:px-16 xl:px-12">
        <Image src="/images/soderialogo.png" alt="Logo Empresa" width={500} height={500} />

        <div className="mt-16 w-full">
          <h1 className="mt-12 text-2xl font-bold leading-tight text-center">
            Inicia sesión en tu cuenta
          </h1>

          {error && (
            <div className="px-4 py-3 mt-4 text-red-700 bg-red-100 rounded border border-red-400">
              {error}
            </div>
          )}

          <form className="mt-6 z-40" onSubmit={handleSubmit}>
            <div className="mt-4">
              <label htmlFor="email" className="block text-gray-700">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                placeholder="Ingresa tu correo electrónico"
                className=" px-4 py-3 mt-2 w-full rounded-lg border focus:border-yellow-500 focus:bg-white focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mt-4">
              <label htmlFor="password" className="block text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                placeholder="Ingresa tu contraseña"
                minLength={6}
                className="px-4 py-3 mt-2 w-full rounded-lg border focus:border-yellow-500 focus:bg-white focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="hidden mt-2 text-right">
              <Link
                href="/recuperar-password"
                className="text-sm font-semibold text-gray-700 hover:text-yellow-600"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className="px-4 py-3 mt-6 w-full font-semibold text-white bg-red-700 rounded-lg transition duration-300 hover:bg-red-600"
              disabled={loading}
            >
              {loading ? <Spinner color="white" size="sm" /> : 'Iniciar Sesión'}
            </button>
          </form>

          <hr className="my-6 w-full border-gray-300" />
        </div>
      </div>
    </section>
  );
};
