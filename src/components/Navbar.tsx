"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./Navbar.module.css";

type User = {
  id?: number;
  username: string;
  role?: "user" | "admin";
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  async function syncUser() {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const body = await res.json();
      setUser(body.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    syncUser();

    window.addEventListener("fm-auth-change", syncUser);

    return () => {
      window.removeEventListener("fm-auth-change", syncUser);
    };
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/me", {
        method: "DELETE",
        credentials: "include",
      });
    } finally {
      setUser(null);
      window.dispatchEvent(new Event("fm-auth-change"));
      window.location.href = "/";
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Link href="/">
          <Image
            loading="eager"
            src="/logo_nuevoo.png"
            alt="FridgeMatch"
            width={100}
            height={50}
            className={styles.logo}
          />
        </Link>
      </div>

      <nav className={styles.nav}>
        {!user && <Link href="/">Inicio</Link>}

        <Link href="/recetas">Recetas</Link>

        {user?.role === "user" && <Link href="/fridge">Mi Refrigerador</Link>}

        {user?.role === "user" && <Link href="/favoritas">Recetas Favoritas</Link>}

        {user?.role === "user" && (
          <Link href="/mis-calificaciones">Mis Calificaciones</Link>
        )}

        {user?.role === "admin" && (
          <Link href="/admin/ingredientes">Ingredientes admin</Link>
        )}

        {user?.role === "admin" && <Link href="/admin/recetas">Subir Receta</Link>}

        {user && <Link href="/perfil">Perfil</Link>}
      </nav>

      <div className={styles.actions}>
        {loadingUser ? null : user ? (
          <>
            <span className={styles.user}>
              Hola, {user.username} {user.role === "admin" ? "(admin)" : ""}
            </span>

            <button className={styles.btn} onClick={logout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link href="/login" className={styles.link}>
            Ingresar
          </Link>
        )}
      </div>
    </header>
  );
}