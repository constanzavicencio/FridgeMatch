"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "No se pudo completar el registro");
        return;
      }

      window.dispatchEvent(new Event("fm-auth-change"));
      router.push("/sesion");
      router.refresh();
    } catch {
      setError("No se pudo completar el registro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Registro</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </form>
    </main>
  );
}