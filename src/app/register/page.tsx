"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../auth-pages.module.css";

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
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo completar el registro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.authMain}>
      <section className={styles.authCard}>
        <h1 className={styles.title}>Registro</h1>
        <p className={styles.subtitle}>Crea tu cuenta para guardar recetas favoritas y personalizar tu experiencia.</p>

        <form onSubmit={submit} className={styles.form}>
          <input
            id="register-username"
            className={styles.input}
            placeholder="Elige un usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <input
            id="register-password"
            className={styles.input}
            placeholder="Crea una contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          {error && <div className={styles.error}>{error}</div>}
        </form>

        <p className={styles.switchText}>
          ¿Ya tienes cuenta? <Link href="/login" className={styles.switchLink}>Ingresa aquí</Link>
        </p>
      </section>
    </main>
  );
}