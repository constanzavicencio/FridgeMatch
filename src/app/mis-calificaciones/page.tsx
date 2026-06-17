"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetail from "@/components/RecipeDetail";
import type { RecipeRecord } from "@/lib/recipe-types";

export default function MisCalificacionesPage() {
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [selected, setSelected] = useState<RecipeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMyRatings() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recipes/my-ratings", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar tus calificaciones");
      }

      setRecipes(data.recipes ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyRatings();
  }, []);

  async function toggleFavorite(recipe: RecipeRecord) {
    const method = recipe.isFavorite ? "DELETE" : "POST";
    const res = await fetch(`/api/recipes/${recipe.id}/favorite`, {
      method,
      credentials: "include",
    });

    if (!res.ok) return;

    setRecipes((prev) =>
      prev.map((item) =>
        item.id === recipe.id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );

    setSelected((prev) =>
      prev && prev.id === recipe.id ? { ...prev, isFavorite: !prev.isFavorite } : prev
    );
  }

  return (
    <main>
      <Card>
        <h1>Mis Calificaciones</h1>
        <p>Revisa y actualiza las recetas que ya calificaste.</p>
      </Card>

      {loading && (
        <Card style={{ marginTop: "2rem" }}>
          <p>Cargando calificaciones...</p>
        </Card>
      )}

      {error && (
        <Card style={{ marginTop: "2rem" }}>
          <p>{error}</p>
        </Card>
      )}

      {!loading && recipes.length === 0 && (
        <Card style={{ marginTop: "2rem" }}>
          <p>Aún no calificaste recetas.</p>
        </Card>
      )}

      <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onClick={setSelected} onToggleFavorite={toggleFavorite} />
        ))}
      </div>

      {selected && (
        <RecipeDetail
          recipe={selected}
          onClose={() => setSelected(null)}
          onToggleFavorite={toggleFavorite}
          onRatingSaved={loadMyRatings}
        />
      )}
    </main>
  );
}
