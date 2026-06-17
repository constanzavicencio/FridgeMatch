"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import styles from "./admin-ingredients.module.css";

type Equivalence = {
  fromQuantity: string;
  fromUnit: string;
  toQuantity: string;
  toUnit: string;
  note: string;
};

type IngredientDefinition = {
  id: number;
  name: string;
  allowedUnits: string[];
  equivalences: Array<{
    fromQuantity: number;
    fromUnit: string;
    toQuantity: number;
    toUnit: string;
    note?: string;
  }>;
  imagePath?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
};

const emptyEquivalence = (): Equivalence => ({
  fromQuantity: "1",
  fromUnit: "",
  toQuantity: "",
  toUnit: "",
  note: "",
});

function formatEquivalence(eq: IngredientDefinition["equivalences"][number]) {
  const note = eq.note ? ` - ${eq.note}` : "";
  return `${eq.fromQuantity} ${eq.fromUnit} = ${eq.toQuantity} ${eq.toUnit}${note}`;
}

function toEquivForm(eq: IngredientDefinition["equivalences"][number]): Equivalence {
  return {
    fromQuantity: String(eq.fromQuantity),
    fromUnit: eq.fromUnit,
    toQuantity: String(eq.toQuantity),
    toUnit: eq.toUnit,
    note: eq.note ?? "",
  };
}

export default function AdminIngredientsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ingredients, setIngredients] = useState<IngredientDefinition[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [allowedUnitsText, setAllowedUnitsText] = useState("kg, g, unidad");
  const [equivalences, setEquivalences] = useState<Equivalence[]>([emptyEquivalence()]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function checkSessionAndLoad() {
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
        const currentUser = sessionBody.user ?? null;

        if (!currentUser || currentUser.role !== "admin") {
          router.push("/");
          return;
        }

        await loadIngredients();
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    checkSessionAndLoad();
  }, [router]);

  async function loadIngredients() {
    const res = await fetch("/api/admin/ingredients", { credentials: "include" });
    const data = await res.json();
    if (res.ok) setIngredients(data.ingredients ?? []);
    else setError("No se pudo cargar el catálogo");
  }

  function startEdit(ing: IngredientDefinition) {
    setEditingId(ing.id);
    setName(ing.name);
    setAllowedUnitsText(ing.allowedUnits.join(", "));
    setEquivalences(ing.equivalences.length > 0 ? ing.equivalences.map(toEquivForm) : [emptyEquivalence()]);
    setImageFile(null);
    setImagePreview(ing.imageUrl ?? "");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setAllowedUnitsText("kg, g, unidad");
    setEquivalences([emptyEquivalence()]);
    setImageFile(null);
    setImagePreview("");
    setError("");
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") { setError("Solo se permiten imágenes PNG"); return; }
    if (file.size > 500 * 1024) { setError("La imagen no puede superar 500KB"); return; }
    setImageFile(file);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function updateEquivalence(index: number, field: keyof Equivalence, value: string) {
    setEquivalences((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  async function handleDelete(id: number, ingredientName: string) {
    if (!confirm(`¿Eliminar "${ingredientName}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/ingredients/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setIngredients((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
    } else {
      setError("No se pudo eliminar el ingrediente");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) { setError("Ingresa el nombre del ingrediente"); return; }

    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("name", normalizedName);
    formData.append("allowedUnits", JSON.stringify(
      allowedUnitsText.split(",").map((u) => u.trim()).filter(Boolean)
    ));
    formData.append("equivalences", JSON.stringify(
      equivalences.filter((eq) => eq.fromUnit && eq.toQuantity && eq.toUnit)
    ));
    if (imageFile) {
      formData.append("image", imageFile);
    }
    const url = editingId ? `/api/admin/ingredients/${editingId}` : "/api/admin/ingredients";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, { method, credentials: "include", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");

      if (editingId) {
        setIngredients((prev) => prev.map((item) => (item.id === editingId ? data.ingredient : item)));
      } else {
        setIngredients((prev) => [data.ingredient, ...prev]);
      }
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main><Card><p>Cargando panel de administrador...</p></Card></main>;
  }

  return (
    <main className={styles.page}>
      <Card className={styles.headerCard}>
        <h1>Ingredientes</h1>
        <p>Gestiona el catálogo de ingredientes, sus unidades permitidas y equivalencias.</p>
      </Card>

      <Card className={styles.formCard}>
        <h2 style={{ marginTop: 0, color: "var(--jumbo-green-dark)" }}>
          {editingId ? "Editar ingrediente" : "Nuevo ingrediente"}
        </h2>

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div>
            <label className={styles.fieldLabel}>Nombre del ingrediente</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Arroz" style={{ width: "100%" }} />
          </div>

          <div>
            <label className={styles.fieldLabel}>Unidades permitidas</label>
            <input type="text" value={allowedUnitsText} onChange={(e) => setAllowedUnitsText(e.target.value)} placeholder="kg, g, unidad" style={{ width: "100%" }} />
            <p className={styles.hint}>Separa con coma. Ej: kg, g, unidad, taza.</p>
          </div>

          <div>
            <label className={styles.fieldLabel}>Imagen del ingrediente</label>
            <input type="file" accept="image/png" onChange={handleImageChange} style={{ width: "100%" }} />
            <p className={styles.hint}>PNG · máx. 500 KB</p>
            {imagePreview && <img src={imagePreview} alt="Vista previa" className={styles.imagePreview} />}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <label className={styles.fieldLabel} style={{ margin: 0 }}>Equivalencias</label>
              <button type="button" className={styles.addBtn} onClick={() => setEquivalences((prev) => [...prev, emptyEquivalence()])}>
                + Agregar
              </button>
            </div>

            <div style={{ display: "grid", gap: "0.6rem" }}>
              {equivalences.map((eq, idx) => (
                <div key={idx} className={styles.equivBlock}>
                  <div className={styles.equivRow}>
                    <span className={styles.equivLabel}>1</span>
                    <select value={eq.fromUnit} onChange={(e) => updateEquivalence(idx, "fromUnit", e.target.value)}>
                      <option value="">Unidad origen</option>
                      {["taza", "cda.", "cdta.", "unidad"].map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input type="number" min="0" step="0.01" placeholder="Cantidad destino" value={eq.toQuantity} onChange={(e) => updateEquivalence(idx, "toQuantity", e.target.value)} />
                    <input type="text" placeholder="Unidad destino (g)" value={eq.toUnit} onChange={(e) => updateEquivalence(idx, "toUnit", e.target.value)} />
                  </div>
                  {equivalences.length > 1 && (
                    <button type="button" className={styles.removeBtn} onClick={() => setEquivalences((prev) => prev.filter((_, i) => i !== idx))}>
                      Quitar equivalencia
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          <div className={styles.formActions}>
            <button type="submit" disabled={saving} className={styles.submitBtn}>
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar ingrediente"}
            </button>
            {editingId && (
              <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card className={styles.listCard}>
        <h2 style={{ marginTop: 0, color: "var(--jumbo-green-dark)" }}>
          Ingredientes registrados
          <span style={{ marginLeft: "0.6rem", fontWeight: 400, fontSize: "1rem", color: "var(--muted)" }}>
            ({ingredients.length})
          </span>
        </h2>

        {ingredients.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Aún no hay ingredientes en el catálogo.</p>
        ) : (
          <div className={styles.ingredientList}>
            {ingredients.map((ing) => (
              <article key={ing.id} className={styles.ingredientItem}>
                {ing.imageUrl ? (
                  <img src={ing.imageUrl} alt={ing.name} className={styles.ingredientThumb} />
                ) : (
                  <div className={styles.ingredientThumbPlaceholder}><i className="fa-solid fa-seedling" /></div>
                )}
                <div className={styles.ingredientInfo}>
                  <h3 className={styles.ingredientName}>{ing.name}</h3>
                  <p className={styles.ingredientMeta}>
                    <strong>Unidades:</strong> {ing.allowedUnits.length > 0 ? ing.allowedUnits.join(", ") : "—"}
                  </p>
                  {ing.equivalences.length > 0 && (
                    <p className={styles.ingredientMeta}>
                      <strong>Equivalencias:</strong>{" "}
                      {ing.equivalences.map((eq) => `${eq.fromQuantity} ${eq.fromUnit} = ${eq.toQuantity} ${eq.toUnit}`).join(" · ")}
                    </p>
                  )}
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.editBtn} onClick={() => startEdit(ing)}>
                    <i className="fa-solid fa-pen" /> Editar
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(ing.id, ing.name)}>
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
