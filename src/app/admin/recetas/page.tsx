"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";

type User = {
  id: number;
  username: string;
  role: "user" | "admin";
};

type IngredientDefinition = {
  id: number;
  name: string;
  allowedUnits: string[];
};

type RecipeIngredientInput = {
  productId: number;
  quantityRequired: string;
  unit: string;
};

function emptyRow(): RecipeIngredientInput {
  return {
    productId: 0,
    quantityRequired: "",
    unit: "",
  };
}

export default function AdminRecipesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ingredients, setIngredients] = useState<IngredientDefinition[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [difficulty, setDifficulty] = useState<"facil" | "medio" | "dificil">("medio");
  const [timeMinutes, setTimeMinutes] = useState("30");
  const [servings, setServings] = useState("2");
  const [rows, setRows] = useState<RecipeIngredientInput[]>([emptyRow()]);
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");

  const ingredientMap = useMemo(() => {
    return new Map(ingredients.map((item) => [item.id, item]));
  }, [ingredients]);

  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!sessionRes.ok) {
          router.push("/login");
          return;
        }

        const sessionBody = await sessionRes.json();
        const currentUser = (sessionBody.user ?? null) as User | null;

        if (!currentUser || currentUser.role !== "admin") {
          router.push("/");
          return;
        }

        const ingRes = await fetch("/api/admin/ingredients", {
          method: "GET",
          credentials: "include",
        });

        const ingData = await ingRes.json();

        if (!ingRes.ok) {
          throw new Error(ingData.error || "No se pudo cargar ingredientes");
        }

        setIngredients(ingData.ingredients ?? []);
      } catch (initError) {
        setError(initError instanceof Error ? initError.message : "No se pudo iniciar");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  function updateRow(index: number, patch: Partial<RecipeIngredientInput>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitRecipe(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setImageError("");

    try {
      const payload = {
        title,
        description,
        instructions,
        difficulty,
        timeMinutes: Number(timeMinutes),
        servings: Number(servings),
        ingredients: rows.map((row) => ({
          productId: Number(row.productId),
          quantityRequired: Number(row.quantityRequired),
          unit: row.unit,
        })),
      };

      const res = await fetch("/api/recipes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear la receta");
      }

      setTitle("");
      setDescription("");
      setInstructions("");
      setDifficulty("medio");
      setTimeMinutes("30");
      setServings("2");
      setRows([emptyRow()]);
      setImageFile(null);
      setImagePreview("");
      setImageError("");

      // Sube la imagen si se seleccionó una (no bloquea la publicación)
      if (imageFile) {
        const fd = new FormData();
        fd.append("title", title);
        fd.append("image", imageFile);
        const imgRes = await fetch("/api/admin/recipe-image", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!imgRes.ok) {
          const imgData = await imgRes.json().catch(() => ({}));
          setImageError(imgData.error || "La receta se publicó pero la imagen no se pudo subir");
        }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la receta");
    } finally {
      setSaving(false);
    }
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setImageFile(file);
    setImageError("");

    if (!file) {
      setImagePreview("");
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setImageError("Solo se permiten imágenes JPG o PNG");
      setImageFile(null);
      setImagePreview("");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError("La imagen no puede superar 2 MB");
      setImageFile(null);
      setImagePreview("");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <main>
        <Card>
          <p>Cargando panel de recetas...</p>
        </Card>
      </main>
    );
  }

  return (
    <main>
      <Card>
        <h1>Subir receta</h1>
        <p>Publica nuevas recetas para la comunidad.</p>
      </Card>

      <Card style={{ marginTop: "2rem" }}>
        <form onSubmit={submitRecipe} style={{ display: "grid", gap: "1rem" }}>
          <label>
            <strong>Título</strong>
            <input value={title} onChange={(event) => setTitle(event.target.value)} style={{ width: "100%" }} />
          </label>

          <label>
            <strong>Descripción</strong>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            <strong>Instrucciones (una por línea)</strong>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              rows={6}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            <strong>Imagen de la receta</strong>
            <small style={{ display: "block", color: "var(--muted)", marginBottom: "0.4rem" }}>
              JPG o PNG · máx. 2 MB · el nombre se genera automáticamente del título
            </small>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              style={{ width: "100%" }}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Vista previa"
                style={{ marginTop: "0.5rem", maxHeight: "180px", borderRadius: "8px", objectFit: "cover" }}
              />
            )}
            {imageError && <p style={{ color: "#b00020", margin: "0.25rem 0 0" }}>{imageError}</p>}
          </label>

          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <label>
              <strong>Dificultad</strong>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as "facil" | "medio" | "dificil")} style={{ width: "100%" }}>
                <option value="facil">Fácil</option>
                <option value="medio">Medio</option>
                <option value="dificil">Difícil</option>
              </select>
            </label>
            <label>
              <strong>Tiempo (min)</strong>
              <input type="number" min="1" value={timeMinutes} onChange={(event) => setTimeMinutes(event.target.value)} style={{ width: "100%" }} />
            </label>
            <label>
              <strong>Porciones</strong>
              <input type="number" min="1" value={servings} onChange={(event) => setServings(event.target.value)} style={{ width: "100%" }} />
            </label>
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Ingredientes</strong>
              <button type="button" onClick={addRow}>Agregar ingrediente</button>
            </div>

            {rows.map((row, index) => {
              const selected = ingredientMap.get(Number(row.productId));
              const allowedUnits = selected?.allowedUnits ?? [];

              return (
                <div key={index} style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "2fr 1fr 1fr auto", alignItems: "center" }}>
                  <select
                    value={row.productId || ""}
                    onChange={(event) => {
                      const nextProductId = Number(event.target.value);
                      const firstUnit = ingredientMap.get(nextProductId)?.allowedUnits?.[0] ?? "";
                      updateRow(index, { productId: nextProductId, unit: firstUnit });
                    }}
                  >
                    <option value="">Selecciona ingrediente</option>
                    {ingredients.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={row.quantityRequired}
                    onChange={(event) => updateRow(index, { quantityRequired: event.target.value })}
                    placeholder="Cantidad"
                  />

                  <select value={row.unit} onChange={(event) => updateRow(index, { unit: event.target.value })}>
                    <option value="">Unidad</option>
                    {allowedUnits.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>

                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(index)}>
                      Quitar
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p style={{ color: "#b00020", margin: 0 }}>{error}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Publicar receta"}
          </button>
        </form>
      </Card>
    </main>
  );
}
