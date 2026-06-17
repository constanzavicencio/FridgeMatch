"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import IngredientForm from "@/components/IngredientForm";
import IngredientList from "@/components/IngredientList";

type Ingredient = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  imagePath?: string | null;
  imageUrl?: string | null;
};

export default function FridgePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function checkSessionAndLoad() {
      try {
        const sessionRes = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!sessionRes.ok) {
          router.push("/login");
          return;
        }

        await fetchIngredients();
      } finally {
        setCheckingSession(false);
      }
    }

    checkSessionAndLoad();
  }, [router]);

  async function fetchIngredients() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ingredients", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al cargar ingredientes");

      const data = await res.json();
      setIngredients(data.ingredients);
    } catch {
      setError("Error al cargar ingredientes");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(name: string, quantity: number, unit: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, quantity, unit }),
      });

      if (!res.ok) throw new Error("Error al agregar ingrediente");

      const data = await res.json();

      setIngredients((prev) => {
        const exists = prev.some((i) => i.id === data.ingredient.id);

        if (exists) {
          return prev.map((i) =>
            i.id === data.ingredient.id ? data.ingredient : i
          );
        }

        return [...prev, data.ingredient];
      });
    } catch {
      setError("Error al agregar ingrediente");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id: number, quantity: number, unit: string) {
    setLoading(true);
    setError("");

    try {
      const ingredient = ingredients.find((i) => i.id === id);

      if (!ingredient) {
        throw new Error("Ingrediente no encontrado");
      }

      const res = await fetch("/api/ingredients", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id,
          name: ingredient.name,
          quantity,
          unit,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar ingrediente");

      const data = await res.json();

      setIngredients((prev) =>
        prev.map((i) => (i.id === id ? data.ingredient : i))
      );
    } catch {
      setError("Error al actualizar ingrediente");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ingredients", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Error al eliminar ingrediente");

      setIngredients((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Error al eliminar ingrediente");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) return <div>Cargando...</div>;

  return (
    <main>
      <Card>
        <h1>Mi Refrigerador</h1>
        <p>Agrega los ingredientes disponibles en tu hogar</p>
      </Card>

      <Card style={{ marginTop: "2rem" }}>
        <IngredientForm onAdd={handleAdd} isLoading={loading} />
      </Card>

      <Card style={{ marginTop: "2rem" }}>
        {error && (
          <div style={{ color: "crimson", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <IngredientList
          ingredients={ingredients}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </Card>
    </main>
  );
}