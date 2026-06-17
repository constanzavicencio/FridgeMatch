"use client";

import type { RecipeRecord } from "@/lib/recipe-types";
import IngredientImage from "@/components/IngredientImage";
import styles from "./RecipeCard.module.css";

type RecipeCardProps = {
  recipe: RecipeRecord;
  onClick?: (recipe: RecipeRecord) => void;
  onToggleFavorite?: (recipe: RecipeRecord) => void;
};

function formatDifficulty(difficulty: string) {
  if (difficulty === "facil") return "Fácil";
  if (difficulty === "dificil") return "Difícil";
  return "Medio";
}

export default function RecipeCard({
  recipe,
  onClick,
  onToggleFavorite,
}: RecipeCardProps) {
  return (
    <div className={styles.card} onClick={() => onClick?.(recipe)}>
      <div className={styles.header}>
        <h3>{recipe.title}</h3>

        <span className={`${styles.difficulty} ${styles[recipe.difficulty]}`}>
          {formatDifficulty(recipe.difficulty)}
        </span>
      </div>

      <div className={styles.ratingLine}>
        <span>⭐ {recipe.averageRating.toFixed(1)}</span>
        <span>({recipe.ratingsCount} calificaciones)</span>
      </div>

      <p className={styles.description}>{recipe.description}</p>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <strong>⏱️</strong> {recipe.timeMinutes} min
        </div>

        <div className={styles.metaItem}>
          <strong>👥</strong> {recipe.servings} porciones
        </div>
      </div>

      <div className={styles.ingredients}>
        <strong>Ingredientes principales:</strong>

        <ul>
          {recipe.ingredients.slice(0, 3).map((ing, idx) => (
            <li key={`${ing.productId}-${idx}`} className={styles.ingredientItem}>
              <IngredientImage
                name={ing.name}
                className={styles.ingredientImage}
                placeholderClassName={styles.ingredientImagePlaceholder}
              />

              <span>{ing.name}</span>
            </li>
          ))}

          {recipe.ingredients.length > 3 && (
            <li>+{recipe.ingredients.length - 3} más</li>
          )}
        </ul>
      </div>

      {onToggleFavorite && (
        <button
          type="button"
          className={`${styles.favoriteBtn} ${recipe.isFavorite ? styles.favoriteActive : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(recipe);
          }}
        >
          {recipe.isFavorite ? "❤ Quitar de favoritos" : "♡ Agregar a favoritos"}
        </button>
      )}
    </div>
  );
}