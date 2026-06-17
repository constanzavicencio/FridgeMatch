"use client";

import { useMemo, useState } from "react";
import type { RecipeRecord } from "@/lib/recipe-types";
import IngredientImage from "@/components/IngredientImage";
import { decimalToFraction } from "@/lib/fractionConverter";
import { formatIngredient } from "@/lib/formatIngredient";
import styles from "./RecipeDetail.module.css";

type RecipeDetailProps = {
  recipe: RecipeRecord;
  onClose: () => void;
  onToggleFavorite?: (recipe: RecipeRecord) => void;
  onRatingSaved?: () => void;
};

function formatDifficulty(difficulty: string) {
  if (difficulty === "facil") return "Fácil";
  if (difficulty === "dificil") return "Difícil";
  return "Medio";
}

const STAR_VALUES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export default function RecipeDetail({
  recipe,
  onClose,
  onToggleFavorite,
  onRatingSaved,
}: RecipeDetailProps) {
  const [rating, setRating] = useState<number>(recipe.myRating?.rating ?? 0);
  const [comment, setComment] = useState<string>(recipe.myRating?.comment ?? "");
  const [saving, setSaving] = useState(false);

  const instructionSteps = useMemo(
    () =>
      recipe.instructions
        .split("\n")
        .map((line) => line.replace(/^\s*\d+\.\s*/, "").trim())
        .filter(Boolean),
    [recipe.instructions]
  );

  async function saveRating() {
    if (rating < 0.5) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/recipes/${recipe.id}/rating`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo guardar la calificación");
      }

      onRatingSaved?.();
    } catch {
      // noop
    } finally {
      setSaving(false);
    }
  }

  async function removeRating() {
    setSaving(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/rating`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setRating(0);
        setComment("");
        onRatingSaved?.();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <div className={styles.header}>
          <h2>{recipe.title}</h2>

          <span className={`${styles.difficulty} ${styles[recipe.difficulty]}`}>
            {formatDifficulty(recipe.difficulty)}
          </span>
        </div>

        <p className={styles.ratingSummary}>
          ⭐ {recipe.averageRating.toFixed(1)} promedio ({recipe.ratingsCount} votos)
        </p>

        <p className={styles.description}>{recipe.description}</p>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <strong>⏱️ Tiempo</strong>
            <span>{recipe.timeMinutes} minutos</span>
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
                <IngredientImage
                  name={ing.name}
                  className={styles.ingredientImage}
                  placeholderClassName={styles.ingredientImagePlaceholder}
                />

                <span>
                  {" "}
                  {formatIngredient(ing.quantityRequired, ing.unit, ing.name)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Favorito</h3>
          {onToggleFavorite ? (
            <button
              type="button"
              className={`${styles.favoriteBtn} ${recipe.isFavorite ? styles.favoriteActive : ""}`}
              onClick={() => onToggleFavorite(recipe)}
            >
              {recipe.isFavorite ? "❤ En favoritos" : "♡ Marcar como favorito"}
            </button>
          ) : (
            <p className={styles.textMuted}>Inicia sesión para guardar favoritos.</p>
          )}
        </div>

        <div className={styles.section}>
          <h3>Tu calificación</h3>
          <div className={styles.starsGrid}>
            {STAR_VALUES.map((value) => (
              <button
                type="button"
                key={value}
                className={`${styles.starBtn} ${rating >= value ? styles.starSelected : ""}`}
                onClick={() => setRating(value)}
                disabled={saving}
              >
                ★ {value.toFixed(1)}
              </button>
            ))}
          </div>

          <textarea
            className={styles.commentInput}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Comentario opcional"
            rows={3}
          />

          <div className={styles.ratingActions}>
            <button type="button" onClick={saveRating} disabled={saving || rating < 0.5}>
              Guardar calificación
            </button>
            {recipe.myRating && (
              <button type="button" onClick={removeRating} disabled={saving}>
                Eliminar calificación
              </button>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3>Instrucciones</h3>

          <ol className={styles.instructionsList}>
            {instructionSteps.map((instruction, idx) => (
              <li key={idx}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}