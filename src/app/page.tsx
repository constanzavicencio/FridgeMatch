"use client";

import Button from "@/components/Button";
import Card from "@/components/Card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("fm_token");
    if (token) {
      router.replace("/sesion");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return <main />;
  }

  return (
    <main>
      <Card>
        <h1>Bienvenido a FridgeMatch</h1>
        <p className="lead">Tu asistente inteligente para preparar recetas con los ingredientes que tienes en casa</p>
        
        <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem" }}>¿Cómo funciona?</h2>
            <ol style={{ lineHeight: "1.8", color: "var(--muted)" }}>
              <li>Regístrate o inicia sesión</li>
              <li>Ingresa los ingredientes disponibles en tu refrigerador</li>
              <li>Recibe recomendaciones de recetas personalizadas</li>
              <li>Identifica los ingredientes que te faltan</li>
              <li>Realiza compras sugeridas en Jumbo</li>
            </ol>
          </div>
          
          <div>
            <h2 style={{ fontSize: "1.2rem" }}>Comienza ahora</h2>
            <p style={{ color: "var(--muted)" }}>Accede a tu cuenta o crea una nueva para empezar</p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <Link href="/login">
                <Button>Iniciar sesión</Button>
              </Link>
              <Link href="/register">
                <Button>Crear cuenta</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}