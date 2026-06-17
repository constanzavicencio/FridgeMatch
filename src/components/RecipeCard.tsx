"use client";

import type { RecipeRecord } from "@/lib/recipe-types";
import IngredientImage from "@/components/IngredientImage";
import styles from "./RecipeCard.module.css";
import { RecipeRating } from "@/components/RecipeRating";

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
  const visibleIngredients = recipe.ingredients.slice(0, 3);
  const emptyIngredientRows = Math.max(0, 3 - visibleIngredients.length);
  const hasMoreIngredients = recipe.ingredients.length > 3;

  return (
    <div className={styles.card} onClick={() => onClick?.(recipe)}>
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
      </div>

      <div className={styles.ingredients}>
        <strong>Ingredientes:</strong>

        <ul>
          {visibleIngredients.map((ing, idx) => (
            <li key={`${ing.productId}-${idx}`} className={styles.ingredientItem}>
              <IngredientImage
                name={ing.name}
                className={styles.ingredientImage}
                placeholderClassName={styles.ingredientImagePlaceholder}
              />

              <span>{ing.name}</span>
            </li>
          ))}

          {Array.from({ length: emptyIngredientRows }).map((_, idx) => (
            <li
              key={`ingredient-empty-${idx}`}
              className={`${styles.ingredientItem} ${styles.ingredientItemEmpty}`}
              aria-hidden="true"
            >
              <span>&nbsp;</span>
            </li>
          ))}

          {hasMoreIngredients ? (
            <li className={styles.moreIngredients}>+{recipe.ingredients.length - 3} más</li>
          ) : (
            <li className={styles.moreIngredientsPlaceholder} aria-hidden="true">
              &nbsp;
            </li>
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