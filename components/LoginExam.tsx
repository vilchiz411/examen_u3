"use client";

import { useMemo, useState, useEffect } from "react";
import {
  autenticarUsuario,
  cerrarSesionUsuario,
  configurarPersistencia,
} from "@/firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";

type AuthUser = {
  email: string;
};

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export default function LoginExam() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [recordarme, setRecordarme] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState<AuthUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuario({ email: user.email || "" });
      } else {
        setUsuario(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const tituloBoton = useMemo(() => {
    return cargando ? "Entrando..." : "Entrar";
  }, [cargando]);

  async function procesarAcceso(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      const correoLimpio = correo.trim();
      const contrasenaLimpia = contrasena.trim();

      if (!correoLimpio || !contrasenaLimpia) {
        setError("Todos los campos son obligatorios");
        return;
      }

      if (!esCorreoValido(correoLimpio)) {
        setError("El correo no es válido");
        return;
      }

      setCargando(true);

      await configurarPersistencia(recordarme);

      const userCredential = await autenticarUsuario(
        correoLimpio,
        contrasenaLimpia
      );

      setUsuario({ email: userCredential.user.email || "" });

    } catch (error: unknown) {
      setError("Correo o contraseña incorrectos");
    } finally {
      setCargando(false);
    }
  }

  async function salir() {
    await cerrarSesionUsuario();
    setUsuario(null);
    setCorreo("");
    setContrasena("");
    setError("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
        
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold mb-2 text-center">
            Acceso escolar
          </h1>
          <p className="text-gray-500 text-center mb-4">
            Completa la funcionalidad de inicio de sesión.
          </p>
        </div>

        {!usuario ? (
          <form onSubmit={procesarAcceso}>
            
            {/* CORREO */}
            <div>
              <label className="block text-sm font-medium">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                className="w-full border rounded px-3 py-2 mt-1 mb-3"
                value={correo}
                onChange={(event) => {
                  setCorreo(event.target.value);
                  setError("");
                }}
                placeholder="alumno@correo.com"
              />
            </div>

            {/* CONTRASEÑA */}
            <div>
              <label className="block text-sm font-medium">Contraseña</label>
              <input
                id="contrasena"
                type="password"
                className="w-full border rounded px-3 py-2 mt-1 mb-3"
                value={contrasena}
                onChange={(event) => {
                  setContrasena(event.target.value);
                  setError("");
                }}
                placeholder="******"
              />
            </div>

            {/* CHECKBOX */}
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(event) => setRecordarme(event.target.checked)}
              />
              Recordarme
            </label>

            {/* ERROR */}
            {error && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
                {error}
              </div>
            )}

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              {tituloBoton}
            </button>
          </form>
        ) : (
          <div className="text-center">
            
            {/* ÉXITO */}
            <p className="text-green-600 font-semibold mb-2">
              Inicio de sesión correcto
            </p>
            <h2 className="mb-4">Bienvenido, {usuario.email}</h2>

            {/* LOGOUT */}
            <button
              type="button"
              onClick={salir}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </section>
    </main>
  );
}