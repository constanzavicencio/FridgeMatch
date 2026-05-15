"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

type User = {
  username: string;
  role?: string;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    function syncUser() {
      const raw = localStorage.getItem("fm_token_user");
      if (!raw) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(raw));
      } catch (e) {
        setUser(null);
      }
    }

    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("fm-auth-change", syncUser as EventListener);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("fm-auth-change", syncUser as EventListener);
    };
  }, []);

  function logout() {
    localStorage.removeItem("fm_token");
    localStorage.removeItem("fm_token_user");
    setUser(null);
    window.dispatchEvent(new Event("fm-auth-change"));
    location.href = "/";
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Link href={user ? "/sesion" : "/"}>
          <img src="/logo.png" alt="FridgeMatch" className={styles.logo} />
        </Link>
      </div>
      <nav className={styles.nav}>
        {!user && <Link href="/">Inicio</Link>}
        <Link href="/recetas">Recetas</Link>
        {user && user.role === "user" && <Link href="/fridge">Mi Refrigerador</Link>}
        {user && <Link href="/perfil">Perfil</Link>}
      </nav>
      <div className={styles.actions}>
        {user ? (
          <>
            <span className={styles.user}>Hola, {user.username} {user.role === "admin" ? "(admin)" : ""}</span>
            <button className={styles.btn} onClick={logout}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.link}>Iniciar</Link>
            <Link href="/register" className={styles.link}>Registro</Link>
          </>
        )}
      </div>
    </header>
  );
}
