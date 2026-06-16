"use client";

import { Recipe } from "@/lib/recipes";
import IngredientImage from "@/components/IngredientImage";
import styles from "./RecipeCard.module.css";

type RecipeCardProps = {
  recipe: Recipe;
  onClick?: (recipe: Recipe) => void;
};

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <div className={styles.card} onClick={() => onClick?.(recipe)}>
      <div className={styles.header}>
        <h3>{recipe.name}</h3>
        <span className={`${styles.difficulty} ${styles[recipe.difficulty]}`}>
          {recipe.difficulty}
        </span>
      </div>
      
      <p className={styles.description}>{recipe.description}</p>
      
      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <strong>⏱️</strong> {recipe.time} min
        </div>
        <div className={styles.metaItem}>
          <strong>👥</strong> {recipe.servings} porciones
        </div>
      </div>
      
      <div className={styles.ingredients}>
        <strong>Ingredientes principales:</strong>
        <ul>
          {recipe.ingredients.slice(0, 3).map((ing, idx) => (
            <li key={idx} className={styles.ingredientItem}>
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
    </div>
  );
}
