"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecipeRecord } from "@/lib/recipe-types";
import IngredientImage from "@/components/IngredientImage";
import { formatIngredient } from "@/lib/formatIngredient";
import { normalizeIngredientName } from "@/lib/normalizeIngredientName";
import { StarRating } from "@/components/StarRating";
import { RecipeRating } from "@/components/RecipeRating";
import { Sparkles } from "lucide-react";
import PurchaseAssistantChat from "@/components/PurchaseAssistantChat";
import styles from "./RecipeDetail.module.css";

type RecipeDetailProps = {
  recipe: RecipeRecord;
  onClose: () => void;
  onToggleFavorite?: (recipe: RecipeRecord) => void;
  onRatingSaved?: () => void;
};

type FridgeIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

function formatDifficulty(difficulty: string) {
  if (difficulty === "facil") return "Fácil";
  if (difficulty === "dificil") return "Difícil";
  return "Medio";
}

const MASS_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  l: 1000,
  cucharada: 15,
  cucharadita: 5,
  taza: 240,
};

function normalizeUnit(unit: string): string {
  const normalized = unit.trim().toLowerCase();

  if (["g", "gr", "gramo", "gramos"].includes(normalized)) return "g";
  if (["kg", "kilo", "kilos", "kilogramo", "kilogramos"].includes(normalized)) return "kg";
  if (["ml", "mililitro", "mililitros"].includes(normalized)) return "ml";
  if (["l", "lt", "litro", "litros"].includes(normalized)) return "l";
  if (["cucharada", "cucharadas", "cda", "cdas"].includes(normalized)) return "cucharada";
  if (["cucharadita", "cucharaditas", "cdta", "cdtas"].includes(normalized)) return "cucharadita";
  if (["taza", "tazas"].includes(normalized)) return "taza";
  if (["unidad", "unidades"].includes(normalized)) return "unidad";
  if (["diente", "dientes"].includes(normalized)) return "diente";
  if (["pizca", "pizcas"].includes(normalized)) return "pizca";
  if (normalized === "al gusto") return "al gusto";

  return normalized;
}

function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number | null {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (!Number.isFinite(quantity) || quantity < 0) return null;
  if (from === to) return quantity;

  if (from in MASS_TO_GRAMS && to in MASS_TO_GRAMS) {
    const inGrams = quantity * MASS_TO_GRAMS[from];
    return inGrams / MASS_TO_GRAMS[to];
  }

  if (from in VOLUME_TO_ML && to in VOLUME_TO_ML) {
    const inMl = quantity * VOLUME_TO_ML[from];
    return inMl / VOLUME_TO_ML[to];
  }

  return null;
}

function hasEnoughIngredient(
  requiredQuantity: number,
  requiredUnit: string,
  fridgeMatches: FridgeIngredient[]
): boolean {
  const availableInRequiredUnit = fridgeMatches.reduce((sum, ingredient) => {
    const converted = convertQuantity(ingredient.quantity, ingredient.unit, requiredUnit);
    if (converted === null) return sum;
    return sum + converted;
  }, 0);

  return availableInRequiredUnit + 1e-6 >= requiredQuantity;
}

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
  const [fridgeIngredients, setFridgeIngredients] = useState<FridgeIngredient[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
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

  useEffect(() => {
    if (sessionRole !== "user") {
      setFridgeIngredients([]);
      return;
    }

    let cancelled = false;

    async function loadFridgeIngredients() {
      try {
        const res = await fetch("/api/ingredients", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();
        const items = Array.isArray(data?.ingredients)
          ? data.ingredients
              .map((item: { name?: string; quantity?: number; unit?: string }) => {
                const normalizedName = item?.name
                  ? normalizeIngredientName(item.name)
                  : "";
                const quantity = Number(item?.quantity);
                const unit = String(item?.unit ?? "").trim();

                if (!normalizedName || !Number.isFinite(quantity) || quantity <= 0 || !unit) {
                  return null;
                }

                return {
                  name: normalizedName,
                  quantity,
                  unit,
                } as FridgeIngredient;
              })
                .filter((item: FridgeIngredient | null): item is FridgeIngredient => item !== null)
          : [];

        if (!cancelled) {
          setFridgeIngredients(items);
        }
      } catch {
        // noop
      }
    }

    loadFridgeIngredients();

    return () => {
      cancelled = true;
    };
  }, [sessionRole]);

  const missingIngredientsCount = useMemo(() => {
    if (sessionRole !== "user") return 0;

    const groupedByName = fridgeIngredients.reduce((acc, ingredient) => {
      const current = acc.get(ingredient.name) ?? [];
      current.push(ingredient);
      acc.set(ingredient.name, current);
      return acc;
    }, new Map<string, FridgeIngredient[]>());

    return recipe.ingredients.reduce((count, ingredient) => {
      const normalizedRecipeIngredient = normalizeIngredientName(ingredient.name);
      const fridgeMatches = groupedByName.get(normalizedRecipeIngredient) ?? [];

      if (fridgeMatches.length === 0) return count + 1;

      return hasEnoughIngredient(
        ingredient.quantityRequired,
        ingredient.unit,
        fridgeMatches
      )
        ? count
        : count + 1;
    }, 0);
  }, [fridgeIngredients, recipe.ingredients, sessionRole]);

  const chatEnabled = missingIngredientsCount > 0;

  function openPurchaseChat() {
    if (!chatEnabled) return;
    setChatOpen(true);
  }

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

        {sessionRole === "user" && (
          <div className={styles.missingBannerWrap}>
            <button
              type="button"
              className={`${styles.missingBanner} ${!chatEnabled ? styles.missingBannerDisabled : ""}`}
              onClick={openPurchaseChat}
              disabled={!chatEnabled}
            >
              <span className={styles.missingIcon}>
                <Sparkles size={18} aria-hidden="true" />
              </span>
              <span className={styles.missingText}>
                {chatEnabled ? (
                  <>
                    Te faltan <strong>{missingIngredientsCount}</strong> ingredientes para poder hacer esta receta
                  </>
                ) : (
                  <>Ya tienes todos los ingredientes para esta receta.</>
                )}
              </span>
            </button>
          </div>
        )}

        {chatOpen && sessionRole === "user" && (
          <PurchaseAssistantChat
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            missingIngredientsCount={missingIngredientsCount}
          />
        )}

      </div>
    </div>
  );
}