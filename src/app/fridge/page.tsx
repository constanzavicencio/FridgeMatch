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
};

export default function FridgePage() {
  const [token, setToken] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("fm_token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
    fetchIngredients(t);
  }, [router]);

  async function fetchIngredients(t: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ingredients", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setIngredients(data.ingredients);
    } catch (err) {
      setError("Error al cargar ingredientes");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(name: string, quantity: number, unit: string) {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, quantity, unit }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const data = await res.json();
      setIngredients([...ingredients, data.ingredient]);
    } catch (err) {
      setError("Error al agregar ingrediente");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id: number, quantity: number, unit: string) {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const ingredient = ingredients.find((i) => i.id === id);
      if (!ingredient) throw new Error("Not found");
      const res = await fetch("/api/ingredients", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, name: ingredient.name, quantity, unit }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setIngredients(ingredients.map((i) => (i.id === id ? data.ingredient : i)));
    } catch (err) {
      setError("Error al actualizar ingrediente");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ingredients", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setIngredients(ingredients.filter((i) => i.id !== id));
    } catch (err) {
      setError("Error al eliminar ingrediente");
    } finally {
      setLoading(false);
    }
  }

  if (!token) return <div>Cargando...</div>;

  return (
    <main>
      <Card>
        <h1>Mi Refrigerador</h1>
        <p>Gestiona los ingredientes disponibles en tu hogar</p>
      </Card>

      <Card style={{ marginTop: "2rem" }}>
        <IngredientForm onAdd={handleAdd} isLoading={loading} />
      </Card>

      <Card style={{ marginTop: "2rem" }}>
        {error && <div style={{ color: "crimson", marginBottom: "1rem" }}>{error}</div>}
        <IngredientList
          ingredients={ingredients}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </Card>
    </main>
  );
}
