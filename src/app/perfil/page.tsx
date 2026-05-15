"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";

type User = {
  id: number;
  username: string;
  role: "user" | "admin";
};

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("fm_token");
    const userStr = localStorage.getItem("fm_token_user");
    
    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading || !user) {
    return (
      <main>
        <Card>
          <p>Cargando perfil...</p>
        </Card>
      </main>
    );
  }

  return (
    <main>
      <Card>
        <h1>Mi Perfil</h1>
        <p>Información de tu cuenta</p>
      </Card>

      <Card style={{ marginTop: "2rem" }}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <strong style={{ color: "var(--jumbo-green)" }}>Usuario:</strong>
            <p style={{ margin: "0.5rem 0 0 0" }}>{user.username}</p>
          </div>

          <div>
            <strong style={{ color: "var(--jumbo-green)" }}>Tipo:</strong>
            <p style={{ margin: "0.5rem 0 0 0", textTransform: "capitalize" }}>
              {user.role === "admin" ? "Administrador" : "Usuario"}
            </p>
          </div>

          <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(10, 137, 32, 0.05)", borderRadius: "8px" }}>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
              {user.role === "admin"
                ? "Tienes acceso a funciones administrativas"
                : "Puedes gestionar tus ingredientes y acceder a recetas personalizadas"}
            </p>
          </div>
        </div>
      </Card>
    </main>
  );
}