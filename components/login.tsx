"use client";
import "../styles/globals.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Spinner } from "@heroui/react";
import Link from "next/link";

// Crear una utilidad para manejar las rutas de la API
const createApiUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, ''); // Elimina las barras finales
  const cleanPath = path.replace(/^\/+/, ''); // Elimina las barras iniciales
  return `${baseUrl}/${cleanPath}`;
};

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);

    setTimeout(async () => {
      try {
        const url = createApiUrl('api/auth/login');
        console.log('URL de login:', url);
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Credenciales incorrectas. Intenta de nuevo.");
          setLoading(false); // Desactiva el spinner si hay error
        } else {
          localStorage.setItem("token", data.token);
          document.cookie = `token=${data.token}; path=/;`;

          // Mantén el spinner y redirige
          router.push("/home");
        }
      } catch (err) {
        setError("Ocurrió un error. Intenta de nuevo más tarde.");
        setLoading(false); // Desactiva el spinner si hay error
      }
    }, 900); // Simula la demora de 2 segundos
  };

  return (
    <section className="flex flex-col items-center h-screen font-serif antialiased md:flex-row">
      <div className=" relative w-full h-screen  lg:block md:w-1/2 xl:w-2/3">
        <Image
          src="/images/soderiabg.jpeg"
          alt="Background Empresa"
          fill
          objectFit="cover"
          style={{
            objectPosition: "50% 80%",
          }}
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
              {loading ? <Spinner color="white" size="sm" /> : "Iniciar Sesión"}
            </button>
          </form>

          <hr className="my-6 w-full border-gray-300" />

          <button
            disabled={true} // Deshabilitado
            type="button"
            className="flex justify-center items-center px-4 py-3 w-full font-semibold text-gray-500 bg-gray-200 rounded-lg border border-gray-300 transition duration-300 cursor-not-allowed"
          >
            <svg
              className="mr-4 w-6 h-6"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
                fill="#D1D5DB"
              />
              <path d="M0 11l17 13 7-6.1L48 14V0H0z" fill="#9CA3AF" />
              <path d="M0 37l30-23 7.9 1L48 0v48H0z" fill="#6B7280" />
              <path d="M48 48L17 24l-4-3 35-10z" fill="#4B5563" />
            </svg>
            Iniciar sesión con Google
          </button>

          <p className="hidden mt-8 text-center">
            ¿Necesitas una cuenta?{" "}
            <Link
              href="#"
              className="font-semibold text-yellow-600 hover:text-yellow-500"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
