"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth-pages.module.css";

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
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.authMain}>
      <section className={styles.authCard}>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Ingresa con tu cuenta para guardar tus recetas favoritas y calificarlas.</p>

        <form onSubmit={submit} className={styles.form}>
          <input
            id="login-username"
            className={styles.input}
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <input
            id="login-password"
            className={styles.input}
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {error && <div className={styles.error}>{error}</div>}
        </form>

        <p className={styles.switchText}>
          ¿Aún no estás registrado? <Link href="/register" className={styles.switchLink}>Únete ahora</Link>
        </p>
      </section>
    </main>
  );
}