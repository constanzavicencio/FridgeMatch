"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";

type User = {
  id: number;
  username: string;
  role: "user" | "admin";
};

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

export default function AdminIngredientsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ingredients, setIngredients] = useState<IngredientDefinition[]>([]);
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
        const currentUser = (sessionBody.user ?? null) as User | null;

        if (!currentUser || currentUser.role !== "admin") {
          router.push("/");
          return;
        }

        setUser(currentUser);
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
    setError("");
    try {
      const res = await fetch("/api/admin/ingredients", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("No se pudo cargar el catálogo");

      const data = await res.json();
      setIngredients(data.ingredients ?? []);
    } catch {
      setError("No se pudo cargar el catálogo de ingredientes");
    }
  }

  function updateEquivalence(index: number, field: keyof Equivalence, value: string) {
    setEquivalences((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  }

  function addEquivalenceRow() {
    setEquivalences((prev) => [...prev, emptyEquivalence()]);
  }

  function removeEquivalenceRow(index: number) {
    setEquivalences((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (file.type !== "image/png") {
      setError("Solo se permiten imágenes PNG");
      return;
    }
    if (file.size > 500 * 1024) {
      setError("La imagen no puede superar 500KB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Ingresa el nombre del ingrediente");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", normalizedName);
      formData.append(
        "allowedUnits",
        JSON.stringify(
          allowedUnitsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );
      formData.append(
        "equivalences",
        JSON.stringify(
          equivalences.filter((item) => item.fromQuantity && item.fromUnit && item.toQuantity && item.toUnit)
        )
      );
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/admin/ingredients", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar el ingrediente");
      }

      setIngredients((prev) => [data.ingredient, ...prev]);
      setName("");
      setAllowedUnitsText("kg, g, unidad");
      setEquivalences([emptyEquivalence()]);
      setImageFile(null);
      setImagePreview("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar el ingrediente");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <main>
        <Card>
          <p>Cargando panel de administrador...</p>
        </Card>
      </main>
    );
  }

  return (
    <main>
      <Card>
        <h1>Ingredientes administrables</h1>
        <p>Define ingredientes, unidades válidas y equivalencias para que el resto del sistema los use de forma consistente.</p>
      </Card>

      <Card style={{ marginTop: "2rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Nombre del ingrediente</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: Arroz"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Unidades permitidas</label>
            <input
              type="text"
              value={allowedUnitsText}
              onChange={(event) => setAllowedUnitsText(event.target.value)}
              placeholder="kg, g, unidad"
              style={{ width: "100%" }}
            />
            <p style={{ margin: "0.5rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
              Separa las unidades con coma. Ejemplo: kg, g, unidad, taza.
            </p>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>Imagen del ingrediente</label>
            <input
              type="file"
              accept="image/png"
              onChange={handleImageChange}
              style={{ width: "100%", padding: "0.5rem" }}
            />
            <p style={{ margin: "0.5rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
              PNG. Máximo 500KB.
            </p>
            {imagePreview && (
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Vista previa:</p>
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px" }}
                />
              </div>
            )}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
              <label style={{ fontWeight: 600 }}>Equivalencias</label>
              <button type="button" onClick={addEquivalenceRow}>Agregar equivalencia</button>
            </div>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {equivalences.map((equivalence, index) => (
                <div key={`${index}-${equivalence.fromUnit}`} style={{ display: "grid", gap: "0.75rem", padding: "0.75rem", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "12px" }}>
                  <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "0.5fr 1fr 1fr 1fr", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center" }}>1</div>
                    <select
                      value={equivalence.fromUnit}
                      onChange={(event) => updateEquivalence(index, "fromUnit", event.target.value)}
                    >
                      <option value="">Selecciona unidad</option>
                      <option value="taza">taza</option>
                      <option value="cda.">cda.</option>
                      <option value="cdta.">cdta.</option>
                      <option value="unidad">unidad</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="200"
                      value={equivalence.toQuantity}
                      onChange={(event) => updateEquivalence(index, "toQuantity", event.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="g"
                      value={equivalence.toUnit}
                      onChange={(event) => updateEquivalence(index, "toUnit", event.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Nota opcional, por ejemplo: arroz crudo"
                    value={equivalence.note}
                    onChange={(event) => updateEquivalence(index, "note", event.target.value)}
                  />
                  {equivalences.length > 1 && (
                    <button type="button" onClick={() => removeEquivalenceRow(index)} style={{ justifySelf: "start" }}>
                      Quitar equivalencia
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar ingrediente"}
            </button>
            {error && <span style={{ color: "crimson" }}>{error}</span>}
          </div>
        </form>
      </Card>

      <Card style={{ marginTop: "2rem" }}>
        <h2>Ingredientes registrados</h2>
        {ingredients.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Aún no has agregado ingredientes al catálogo.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            {ingredients.map((ingredient) => (
              <article key={ingredient.id} style={{ padding: "1rem", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  {ingredient.imageUrl && (
                    <img
                      src={ingredient.imageUrl}
                      alt={ingredient.name}
                      style={{ width: "80px", height: "80px", objectFit: "contain", borderRadius: "8px" }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0 }}>{ingredient.name}</h3>
                    <p style={{ marginBottom: "0.5rem" }}>
                      <strong>Unidades permitidas:</strong> {ingredient.allowedUnits.length > 0 ? ingredient.allowedUnits.join(", ") : "Sin unidades definidas"}
                    </p>
                    <div>
                      <strong>Equivalencias:</strong>
                      {ingredient.equivalences.length === 0 ? (
                        <p style={{ marginTop: "0.5rem", color: "var(--muted)" }}>Sin equivalencias registradas.</p>
                      ) : (
                        <ul style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                          {ingredient.equivalences.map((equivalence, index) => (
                            <li key={`${ingredient.id}-${index}`}>{formatEquivalence(equivalence)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
