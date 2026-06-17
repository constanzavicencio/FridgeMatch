"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import styles from "./admin-recipes.module.css";
import { slugifyRecipeTitle } from "@/lib/supabase/recipe-images";

type User = { id: number; username: string; role: "user" | "admin" };

type IngredientDefinition = { id: number; name: string; allowedUnits: string[] };

type RecipeIngredientInput = { productId: number; quantityRequired: string; unit: string };

type RecipeSummary = {
  id: number;
  title: string;
  description: string;
  instructions: string;
  difficulty: "facil" | "medio" | "dificil";
  timeMinutes: number;
  servings: number;
  ingredients: Array<{ productId: number; quantityRequired: number; unit: string; name?: string }>;
  imageUrl?: string | null;
};

function emptyRow(): RecipeIngredientInput {
  return { productId: 0, quantityRequired: "", unit: "" };
}

function difficultyLabel(d: string) {
  if (d === "facil") return "Fácil";
  if (d === "dificil") return "Difícil";
  return "Medio";
}

export default function AdminRecipesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");

  const [catalogIngredients, setCatalogIngredients] = useState<IngredientDefinition[]>([]);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);

  // Form fields
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [difficulty, setDifficulty] = useState<"facil" | "medio" | "dificil">("medio");
  const [timeMinutes, setTimeMinutes] = useState("30");
  const [servings, setServings] = useState("2");
  const [rows, setRows] = useState<RecipeIngredientInput[]>([emptyRow()]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const ingredientMap = useMemo(
    () => new Map(catalogIngredients.map((item) => [item.id, item])),
    [catalogIngredients]
  );

  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (!sessionRes.ok) { router.push("/login"); return; }
        const sessionBody = await sessionRes.json();
        if (!sessionBody.user || sessionBody.user.role !== "admin") { router.push("/"); return; }

        const [ingRes, recipeRes] = await Promise.all([
          fetch("/api/admin/ingredients", { credentials: "include" }),
          fetch("/api/recipes", { credentials: "include", cache: "no-store" }),
        ]);

        const ingData = await ingRes.json();
        const recipeData = await recipeRes.json();
        setCatalogIngredients(ingData.ingredients ?? []);
        setRecipes(recipeData.recipes ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo iniciar");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  function startEdit(recipe: RecipeSummary) {
    setEditingId(recipe.id);
    setTitle(recipe.title);
    setDescription(recipe.description);
    setInstructions(recipe.instructions);
    setDifficulty(recipe.difficulty);
    setTimeMinutes(String(recipe.timeMinutes));
    setServings(String(recipe.servings));
    setRows(
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((ing) => ({
            productId: ing.productId,
            quantityRequired: String(ing.quantityRequired),
            unit: ing.unit,
          }))
        : [emptyRow()]
    );
    setImageFile(null);
    setImagePreview(recipe.imageUrl ?? "");
    setError("");
    setImageError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle(""); setDescription(""); setInstructions("");
    setDifficulty("medio"); setTimeMinutes("30"); setServings("2");
    setRows([emptyRow()]);
    setImageFile(null); setImagePreview("");
    setError(""); setImageError("");
  }

  function updateRow(index: number, patch: Partial<RecipeIngredientInput>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setImageFile(file); setImageError("");
    if (!file) { setImagePreview(""); return; }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setImageError("Solo se permiten imágenes JPG o PNG");
      setImageFile(null); setImagePreview(""); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError("La imagen no puede superar 2 MB");
      setImageFile(null); setImagePreview(""); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadImage(recipeTitle: string, file: File) {
    const fd = new FormData();
    fd.append("title", recipeTitle);
    fd.append("image", file);
    const res = await fetch("/api/admin/recipe-image", { method: "POST", credentials: "include", body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setImageError(d.error || "La receta se guardó pero la imagen no se pudo subir");
    }
  }

  async function submitRecipe(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setImageError("");

    const payload = {
      title, description, instructions, difficulty,
      timeMinutes: Number(timeMinutes), servings: Number(servings),
      ingredients: rows.map((r) => ({
        productId: Number(r.productId),
        quantityRequired: Number(r.quantityRequired),
        unit: r.unit,
      })),
    };

    try {
      const url = editingId ? `/api/admin/recipes/${editingId}` : "/api/recipes";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar la receta");

      if (imageFile) await uploadImage(title, imageFile);

      // Reload recipe list
      const recipeRes = await fetch("/api/recipes", { credentials: "include", cache: "no-store" });
      const recipeData = await recipeRes.json();
      setRecipes(recipeData.recipes ?? []);

      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, recipeTitle: string) {
    if (!confirm(`¿Eliminar "${recipeTitle}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/recipes/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) cancelEdit();
    } else {
      setError("No se pudo eliminar la receta");
    }
  }

  if (loading) return <main><Card><p>Cargando panel de recetas...</p></Card></main>;

  return (
    <main className={styles.page}>
      <Card className={styles.headerCard}>
        <h1>Recetas</h1>
        <p>Publica, edita o elimina recetas de la comunidad.</p>
      </Card>

      {/* ── Formulario crear / editar ── */}
      <Card className={styles.formCard}>
        <h2 style={{ marginTop: 0, color: "var(--jumbo-green-dark)" }}>
          {editingId ? "Editar receta" : "Nueva receta"}
        </h2>

        <form onSubmit={submitRecipe} className={styles.formGrid}>
          <div>
            <label className={styles.fieldLabel}>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%" }} placeholder="Ej: Pasta Primavera" />
            {title && (
              <p className={styles.hint}>
                Imagen esperada: <code>recetas/{slugifyRecipeTitle(title)}.jpg</code>
              </p>
            )}
          </div>

          <div>
            <label className={styles.fieldLabel}>Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: "100%" }} />
          </div>

          <div>
            <label className={styles.fieldLabel}>Instrucciones <span className={styles.hint} style={{ display: "inline" }}>(una por línea)</span></label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={6} style={{ width: "100%" }} />
          </div>

          <div>
            <label className={styles.fieldLabel}>Imagen de la receta</label>
            <input type="file" accept="image/jpeg,image/png" onChange={handleImageChange} style={{ width: "100%" }} />
            <p className={styles.hint}>JPG o PNG · máx. 2 MB · el nombre se genera del título</p>
            {imagePreview && <img src={imagePreview} alt="Vista previa" className={styles.imagePreview} />}
            {imageError && <p className={styles.formError} style={{ marginTop: "0.3rem" }}>{imageError}</p>}
          </div>

          <div className={styles.colsThree}>
            <div>
              <label className={styles.fieldLabel}>Dificultad</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} style={{ width: "100%" }}>
                <option value="facil">Fácil</option>
                <option value="medio">Medio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
            <div>
              <label className={styles.fieldLabel}>Tiempo (min)</label>
              <input type="number" min="1" value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div>
              <label className={styles.fieldLabel}>Porciones</label>
              <input type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} style={{ width: "100%" }} />
            </div>
          </div>

          <div className={styles.ingredientGrid}>
            <div className={styles.ingredientRowHeader}>
              <label className={styles.fieldLabel} style={{ margin: 0 }}>Ingredientes</label>
              <button type="button" className={styles.addBtn} onClick={() => setRows((prev) => [...prev, emptyRow()])}>
                + Agregar
              </button>
            </div>

            {rows.map((row, index) => {
              const selected = ingredientMap.get(Number(row.productId));
              const allowedUnits = selected?.allowedUnits ?? [];
              return (
                <div key={index} className={styles.ingredientRow}>
                  <select value={row.productId || ""} onChange={(e) => {
                    const nextId = Number(e.target.value);
                    const firstUnit = ingredientMap.get(nextId)?.allowedUnits?.[0] ?? "";
                    updateRow(index, { productId: nextId, unit: firstUnit });
                  }}>
                    <option value="">Selecciona ingrediente</option>
                    {catalogIngredients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <input type="number" min="0.01" step="0.01" value={row.quantityRequired} onChange={(e) => updateRow(index, { quantityRequired: e.target.value })} placeholder="Cantidad" />
                  <select value={row.unit} onChange={(e) => updateRow(index, { unit: e.target.value })}>
                    <option value="">Unidad</option>
                    {allowedUnits.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  {rows.length > 1 && (
                    <button type="button" className={styles.removeBtn} onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}>
                      Quitar
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          <div className={styles.formActions}>
            <button type="submit" disabled={saving} className={styles.submitBtn}>
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Publicar receta"}
            </button>
            {editingId && (
              <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>Cancelar</button>
            )}
          </div>
        </form>
      </Card>

      {/* ── Lista de recetas ── */}
      <Card className={styles.listCard}>
        <h2 style={{ marginTop: 0, color: "var(--jumbo-green-dark)" }}>
          Recetas publicadas
          <span style={{ marginLeft: "0.6rem", fontWeight: 400, fontSize: "1rem", color: "var(--muted)" }}>
            ({recipes.length})
          </span>
        </h2>

        {recipes.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No hay recetas publicadas aún.</p>
        ) : (
          <div className={styles.recipeList}>
            {recipes.map((recipe) => (
              <article key={recipe.id} className={styles.recipeItem}>
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.title} className={styles.recipeThumb} />
                ) : (
                  <div className={styles.recipeThumbPlaceholder}><i className="fa-solid fa-utensils" /></div>
                )}
                <div className={styles.recipeInfo}>
                  <h3 className={styles.recipeTitle}>{recipe.title}</h3>
                  <p className={styles.recipeMeta}>
                    <span className={`${styles.diffBadge} ${styles[recipe.difficulty]}`}>
                      {difficultyLabel(recipe.difficulty)}
                    </span>
                    {" · "}{recipe.timeMinutes} min · {recipe.servings} porciones · {recipe.ingredients.length} ingredientes
                  </p>
                  {recipe.description && (
                    <p className={styles.recipeMeta} style={{ marginTop: "0.2rem" }}>{recipe.description}</p>
                  )}
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.editBtn} onClick={() => startEdit(recipe)}>
                    <i className="fa-solid fa-pen" /> Editar
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(recipe.id, recipe.title)}>
                    <i className="fa-solid fa-trash" /> Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}