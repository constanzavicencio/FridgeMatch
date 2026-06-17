"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetail from "@/components/RecipeDetail";
import type { RecipeRecord } from "@/lib/recipe-types";

export default function FavoritasPage() {
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [selected, setSelected] = useState<RecipeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFavorites() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recipes?favorites=1", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar favoritas");
      }

      setRecipes(data.recipes ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  async function toggleFavorite(recipe: RecipeRecord) {
    const method = recipe.isFavorite ? "DELETE" : "POST";
    const res = await fetch(`/api/recipes/${recipe.id}/favorite`, {
      method,
      credentials: "include",
    });

    if (!res.ok) return;

    setRecipes((prev) => prev.filter((item) => item.id !== recipe.id));
    if (selected?.id === recipe.id) {
      setSelected(null);
    }
  }

  return (
    <main>
      <Card>
        <h1>Recetas Favoritas</h1>
        <p>Aquí ves todas las recetas que marcaste con corazón.</p>
      </Card>

      {loading && (
        <Card style={{ marginTop: "2rem" }}>
          <p>Cargando favoritas...</p>
        </Card>
      )}

      {error && (
        <Card style={{ marginTop: "2rem" }}>
          <p>{error}</p>
        </Card>
      )}

      {!loading && recipes.length === 0 && (
        <Card style={{ marginTop: "2rem" }}>
          <p>No tienes recetas favoritas aún.</p>
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
          onRatingSaved={loadFavorites}
        />
      )}
    </main>
  );
}
