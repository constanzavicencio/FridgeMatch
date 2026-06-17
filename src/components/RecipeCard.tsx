"use client";

import type { RecipeRecord } from "@/lib/recipe-types";
import styles from "./RecipeCard.module.css";
import { RecipeRating } from "@/components/RecipeRating";
import Image from "next/image";

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
      <div className={styles.imageWrap}>
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            unoptimized
            className={styles.recipeImage}
            sizes="(max-width: 640px) 100vw, 320px"
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true">
            <i className="fa-solid fa-utensils"></i>
          </div>
        )}
      </div>

      <div className={styles.header}>
        <h3>{recipe.title}</h3>

        <span className={`${styles.difficulty} ${styles[recipe.difficulty]}`}>
          {formatDifficulty(recipe.difficulty)}
        </span>
      </div>

      <div className={styles.ratingLine}>
        <RecipeRating averageRating={recipe.averageRating} />
        <span>({recipe.ratingsCount})</span>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <i className="fa-solid fa-stopwatch"></i> {recipe.timeMinutes} min
        </div>

        <div className={styles.metaItem}>
          <i className="fa-solid fa-user-group"></i> {recipe.servings} porciones
        </div>

        <div className={styles.metaItem}>
          <i className="fa-solid fa-carrot"></i>{" "}
          {recipe.ingredients.length}{" "}
          {recipe.ingredients.length === 1 ? "ingrediente" : "ingredientes"}
        </div>
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
          {recipe.isFavorite ? (
                <>
                  <i className="fa-solid fa-heart"></i> En favoritos
                </>
              ) : (
                <>
                  <i className="fa-regular fa-heart"></i> Agregar a favoritos
                </>
              )}
        </button>
      )}
    </div>
  );
}