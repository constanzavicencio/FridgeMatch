"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Usuario o contraseña incorrectos");
        return;
      }

      window.dispatchEvent(new Event("fm-auth-change"));
      router.push("/sesion");
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Iniciar sesión</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </form>
    </main>
  );
}