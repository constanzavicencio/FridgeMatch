"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetail from "@/components/RecipeDetail";
import type { RecipeDifficulty, RecipeRecord } from "@/lib/recipe-types";
import styles from "./recipes.module.css";

export default function RecipesPage() {
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeRecord | null>(null);
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | RecipeDifficulty>("all");
  const [canToggleFavorite, setCanToggleFavorite] = useState(false);

  async function loadSessionRole() {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setCanToggleFavorite(false);
        return;
      }

      const data = await res.json();
      setCanToggleFavorite(data?.user?.role === "user");
    } catch {
      setCanToggleFavorite(false);
    }
  }

  async function loadRecipes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recipes", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar las recetas");
      }

      setRecipes(data.recipes ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error de carga");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessionRole();
    loadRecipes();
  }, []);

  async function toggleFavorite(recipe: RecipeRecord) {
    const method = recipe.isFavorite ? "DELETE" : "POST";
    const res = await fetch(`/api/recipes/${recipe.id}/favorite`, {
      method,
      credentials: "include",
    });

    if (!res.ok) {
      return;
    }

    setRecipes((prev) =>
      prev.map((item) =>
        item.id === recipe.id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );

    setSelectedRecipe((prev) =>
      prev && prev.id === recipe.id ? { ...prev, isFavorite: !prev.isFavorite } : prev
    );
  }

  const filteredRecipes =
    filter === "all" ? recipes : recipes.filter((recipe) => recipe.difficulty === filter);

  return (
    <main>
      <Card>
        <h1>Nuestras Recetas</h1>
        <p>Descubre recetas creadas por la comunidad y guarda tus favoritas.</p>
      </Card>

      <Card style={{ marginTop: "2rem" }}>
        <div className={styles.filterContainer}>
          <strong>Filtrar por dificultad:</strong>
          <div className={styles.filters}>
            <button 
              className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
              onClick={() => setFilter("all")}
            >
              Todas
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === "facil" ? styles.active : ""}`}
              onClick={() => setFilter("facil")}
            >
              Fácil
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === "medio" ? styles.active : ""}`}
              onClick={() => setFilter("medio")}
            >
              Medio
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === "dificil" ? styles.active : ""}`}
              onClick={() => setFilter("dificil")}
            >
              Difícil
            </button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card style={{ marginTop: "2rem", textAlign: "center" }}>
          <p>Cargando recetas...</p>
        </Card>
      )}

      {error && (
        <Card style={{ marginTop: "2rem", textAlign: "center" }}>
          <p>{error}</p>
        </Card>
      )}

      <div className={styles.recipesGrid} style={{ marginTop: "2rem" }}>
        {filteredRecipes.map((recipe) => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe}
            onClick={setSelectedRecipe}
            onToggleFavorite={canToggleFavorite ? toggleFavorite : undefined}
          />
        ))}
      </div>

      {!loading && filteredRecipes.length === 0 && (
        <Card style={{ marginTop: "2rem", textAlign: "center" }}>
          <p>No hay recetas disponibles con este filtro</p>
        </Card>
      )}

      {selectedRecipe && (
        <RecipeDetail 
          recipe={selectedRecipe}
          onToggleFavorite={canToggleFavorite ? toggleFavorite : undefined}
          onRatingSaved={loadRecipes}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </main>
  );
}
