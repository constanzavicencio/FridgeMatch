"use client";

import { Recipe } from "@/lib/recipes";
import { getIngredientImageSrc } from "@/lib/ingredientImage";
import styles from "./RecipeDetail.module.css";

type RecipeDetailProps = {
  recipe: Recipe;
  onClose: () => void;
};

export default function RecipeDetail({ recipe, onClose }: RecipeDetailProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        <div className={styles.header}>
          <h2>{recipe.name}</h2>
          <span className={`${styles.difficulty} ${styles[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
        </div>

        <p className={styles.description}>{recipe.description}</p>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <strong>⏱️ Tiempo</strong>
            <span>{recipe.time} minutos</span>
          </div>
          <div className={styles.metaItem}>
            <strong>👥 Porciones</strong>
            <span>{recipe.servings}</span>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Ingredientes</h3>
          <ul className={styles.ingredientsList}>
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className={styles.ingredientItem}>
                {getIngredientImageSrc(ing.name) ? (
                  <img
                    src={getIngredientImageSrc(ing.name) ?? ""}
                    alt=""
                    className={styles.ingredientImage}
                    aria-hidden="true"
                  />
                ) : (
                  <span className={styles.ingredientImagePlaceholder} aria-hidden="true" />
                )}
                <span>
                  <strong>{ing.quantity}</strong> {ing.unit} de {ing.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Instrucciones</h3>
          <ol className={styles.instructionsList}>
            {recipe.instructions.map((instruction, idx) => (
              <li key={idx}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
