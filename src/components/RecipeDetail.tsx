"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecipeRecord } from "@/lib/recipe-types";
import IngredientImage from "@/components/IngredientImage";
import { decimalToFraction } from "@/lib/fractionConverter";
import { formatIngredient } from "@/lib/formatIngredient";
import { StarRating } from "@/components/StarRating";
import { RecipeRating } from "@/components/RecipeRating";
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
  const router = useRouter();
  const [rating, setRating] = useState<number>(recipe.myRating?.rating ?? 0);
  const [comment, setComment] = useState<string>(recipe.myRating?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sessionRole, setSessionRole] = useState<"user" | "admin" | null | undefined>(
    undefined
  );
  const hasRatingSelected = rating >= 0.5;
  const hasExistingRating = !!recipe.myRating;
  const formattedRating = rating.toFixed(1).replace(".", ",");

  const instructionSteps = useMemo(
    () =>
      recipe.instructions
        .split(/\n|\\n/)
        .map((line) => line.replace(/^\s*\d+\.\s*/, "").trim())
        .filter(Boolean),
    [recipe.instructions]
  );

  async function resolveSessionRole() {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) return null;

      const data = await res.json();
      const role = data?.user?.role;
      return role === "admin" || role === "user" ? role : null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    resolveSessionRole().then((role) => setSessionRole(role));
  }, []);

  async function saveRating() {
    if (rating < 0.5) return;

    const currentRole = sessionRole ?? (await resolveSessionRole());
    setSessionRole(currentRole);

    if (currentRole !== "user") {
      if (currentRole === null) {
        router.push("/login");
      }
      return;
    }

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
          
          <div className={styles.headerMeta}>
            {onToggleFavorite && (
              <span>
                <button
                  type="button"
                  className={`${styles.favoriteBtn} ${recipe.isFavorite ? styles.favoriteActive : ""}`}
                  onClick={() => onToggleFavorite(recipe)}
                >
                  {recipe.isFavorite ? (
                    <>
                      <i className="fa-solid fa-heart"></i>
                    </>
                  ) : (
                    <>
                      <i className="fa-regular fa-heart"></i>
                    </>
                  )}
                </button>
              </span>
            )}
            <span className={`${styles.difficulty} ${styles[recipe.difficulty]}`}>
              {formatDifficulty(recipe.difficulty)}
            </span>
          </div>
        </div>

        <div className={styles.ratingSummary}>
          <RecipeRating averageRating={recipe.averageRating} /> ({recipe.ratingsCount})
        </div>

        <p className={styles.description}>{recipe.description}</p>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            
            <strong><i className="fa-solid fa-stopwatch"></i> Tiempo</strong>
            <span>{recipe.timeMinutes} minutos</span>
          </div>

          <div className={styles.metaItem}>
            <strong><i className="fa-solid fa-user-group"></i> Porciones</strong>
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
          <h3>Instrucciones</h3>

          <ol className={styles.instructionsList}>
            {instructionSteps.map((instruction, idx) => (
              <li key={idx}><strong>{idx + 1}.</strong> {instruction}</li>
            ))}
          </ol>
        </div>

        {sessionRole !== "admin" && (
          <div className={styles.section}>
            <div className={styles.ratingCard}>
              {/* Si el usuario aún no ha calificado */}
              {!hasExistingRating && (
                <>
                  <div className={styles.ratingHeader}>
                    <p className={styles.ratingLead}>¿Qué te pareció esta receta?</p>
                    <span
                      className={`${styles.ratingPill} ${hasRatingSelected ? styles.ratingPillActive : ""}`}
                    >
                      {hasRatingSelected ? `${formattedRating} / 5` : "Sin nota"}
                    </span>
                  </div>

                  <p className={styles.ratingHint}>Tu opinión ayuda a otros usuarios a elegir mejor.</p>

                  <div className={`${styles.ratingStarsWrap} ${saving ? styles.ratingDisabled : ""}`}>
                    <StarRating
                      initialRating={rating}
                      onChange={(value) => setRating(value)}
                    />
                  </div>

                  {/* Solo mostrar textarea y botón si hay calificación seleccionada */}
                  {hasRatingSelected && (
                    <>
                      <label className={styles.commentLabel} htmlFor={`rating-comment-${recipe.id}`}>
                        Comentario
                      </label>

                      <textarea
                        id={`rating-comment-${recipe.id}`}
                        className={styles.commentInput}
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Escribe un comentario (opcional)"
                        rows={3}
                      />

                      <div className={styles.ratingActions}>
                        <button
                          type="button"
                          className={styles.primaryAction}
                          onClick={saveRating}
                          disabled={saving}
                        >
                          {saving ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Si el usuario ya ha calificado */}
              {hasExistingRating && !isEditing && (
                <>
                  <div className={styles.ratingHeader}>
                    <p className={styles.ratingLead}>Tu calificación</p>
                    <span className={`${styles.ratingPill} ${styles.ratingPillActive}`}>
                      {rating.toFixed(1).replace(".", ",")} / 5
                    </span>
                  </div>

                  <p className={styles.ratingHint}>Tu opinión ayuda a otros usuarios a elegir mejor.</p>

                  <div className={styles.ratingStarsWrap}>
                    <StarRating
                      initialRating={rating}
                      onChange={() => {}} // Deshabilitado en modo lectura
                    />
                  </div>

                  {recipe.myRating?.comment && (
                    <>
                      <label className={styles.commentLabel}>Comentario</label>
                      <div className={styles.commentDisplay}>
                        {recipe.myRating.comment}
                      </div>
                    </>
                  )}

                  <div className={styles.ratingActions}>
                    <button
                      type="button"
                      className={styles.primaryAction}
                      onClick={() => setIsEditing(true)}
                      disabled={saving}
                    >
                      Modificar
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryAction}
                      onClick={removeRating}
                      disabled={saving}
                    >
                      {saving ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </>
              )}

              {/* Si el usuario está en modo edición */}
              {hasExistingRating && isEditing && (
                <>
                  <div className={styles.ratingHeader}>
                    <p className={styles.ratingLead}>Modificar calificación</p>
                    <span
                      className={`${styles.ratingPill} ${hasRatingSelected ? styles.ratingPillActive : ""}`}
                    >
                      {hasRatingSelected ? `${formattedRating} / 5` : "Sin nota"}
                    </span>
                  </div>

                  <p className={styles.ratingHint}>Actualiza tu opinión sobre esta receta.</p>

                  <div className={`${styles.ratingStarsWrap} ${saving ? styles.ratingDisabled : ""}`}>
                    <StarRating
                      initialRating={rating}
                      onChange={(value) => setRating(value)}
                    />
                  </div>

                  <label className={styles.commentLabel} htmlFor={`rating-comment-${recipe.id}`}>
                    Comentario
                  </label>

                  <textarea
                    id={`rating-comment-${recipe.id}`}
                    className={styles.commentInput}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Escribe un comentario (opcional)"
                    rows={3}
                  />

                  <div className={styles.ratingActions}>
                    <button
                      type="button"
                      className={styles.primaryAction}
                      onClick={saveRating}
                      disabled={saving}
                    >
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                    <button
                      type="button"
                      className={styles.tertiaryAction}
                      onClick={() => {
                        setIsEditing(false);
                        setRating(recipe.myRating?.rating ?? 0);
                        setComment(recipe.myRating?.comment ?? "");
                      }}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}