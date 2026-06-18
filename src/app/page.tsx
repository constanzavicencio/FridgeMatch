"use client";

import Button from "@/components/Button";
import Card from "@/components/Card";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./home.module.css";

type User = {
  id: number;
  username: string;
  role: "user" | "admin";
};

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (res.ok) {
          const body = await res.json();
          setUser((body.user ?? null) as User | null);
        } else {
          setUser(null);
        }
      } finally {
        setReady(true);
      }
    }

    checkSession();
  }, []);

  if (!ready) {
    return <main />;
  }

  return (
    <main>
      <Card className={styles.heroCard}>
        <div className={styles.heroGrid}>
          <section>
            <h1 className={styles.title}>Bienvenido a FridgeMatch</h1>
            <p className={`${styles.subtitle} lead`}>
              Descubre recetas con lo que ya tienes en casa, ahorra tiempo y cocina con menos desperdicio.
            </p>

            <div className={styles.ctaRow}>
              {user ? (
                <>
                  <Link href="/recetas">
                    <Button className={styles.primaryBtn}>Ver recetas</Button>
                  </Link>
                  {user.role === "user" ? (
                    <Link href="/fridge">
                      <Button className={styles.secondaryBtn}>Ir a mi refrigerador</Button>
                    </Link>
                  ) : (
                    <Link href="/admin/ingredientes">
                      <Button className={styles.secondaryBtn}>Registrar ingredientes</Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/recetas">
                    <Button className={styles.primaryBtn}>Ver recetas</Button>
                  </Link>
                  <Link href="/register">
                    <Button className={styles.secondaryBtn}>Crear cuenta</Button>
                  </Link>
                </>
              )}
            </div>

            <div className={styles.highlight}>
              <span className={styles.dot} aria-hidden="true"></span>
              Tu cocina, mejor organizada
            </div>
          </section>
        </div>

        <div className={styles.blocks}>
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>¿Cómo funciona?</h2>
            <ol className={styles.steps}>
              <li>Inicia sesión o crea tu cuenta.</li>
              <li>Agrega los ingredientes que tienes en tu refrigerador.</li>
              <li>Obtén recetas personalizadas al instante.</li>
              <li>Guarda favoritas y califica tus resultados.</li>
            </ol>
          </section>

          <section className={`${styles.block} ${styles.featureBlock}`}>
            <Image
              src="/fridgiee.png"
              alt="Fridgie asomándose"
              width={160}
              height={200}
              priority
              className={styles.peekMascot}
            />

            <h2 className={styles.blockTitle}>Lo que puedes hacer</h2>

            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <i className={`fa-solid fa-seedling ${styles.featureIcon}`}></i>
                Recomendaciones según tus ingredientes.
              </li>
              <li className={styles.featureItem}>
                <i className={`fa-solid fa-heart ${styles.featureIcon}`}></i>
                Guarda tus recetas favoritas en un clic.
              </li>
              <li className={styles.featureItem}>
                <i className={`fa-solid fa-star ${styles.featureIcon}`}></i>
                Califica recetas y comparte tu experiencia.
              </li>
            </ul>
          </section>
        </div>
      </Card>
    </main>
  );
}