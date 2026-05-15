"use client";

import { useState } from "react";
import Card from "@/components/Card";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetail from "@/components/RecipeDetail";
import { recipes, Recipe } from "@/lib/recipes";
import styles from "./recipes.module.css";

export default function RecipesPage() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [filter, setFilter] = useState<"all" | "fácil" | "medio" | "difícil">("all");

  const filteredRecipes = filter === "all" 
    ? recipes 
    : recipes.filter(r => r.difficulty === filter);

  return (
    <main>
      <Card>
        <h1>Nuestras Recetas</h1>
        <p>Descubre deliciosas recetas que puedes preparar con ingredientes simples</p>
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
              className={`${styles.filterBtn} ${filter === "fácil" ? styles.active : ""}`}
              onClick={() => setFilter("fácil")}
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
              className={`${styles.filterBtn} ${filter === "difícil" ? styles.active : ""}`}
              onClick={() => setFilter("difícil")}
            >
              Difícil
            </button>
          </div>
        </div>
      </Card>

      <div className={styles.recipesGrid} style={{ marginTop: "2rem" }}>
        {filteredRecipes.map(recipe => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe}
            onClick={setSelectedRecipe}
          />
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <Card style={{ marginTop: "2rem", textAlign: "center" }}>
          <p>No hay recetas disponibles con este filtro</p>
        </Card>
      )}

      {selectedRecipe && (
        <RecipeDetail 
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </main>
  );
}
