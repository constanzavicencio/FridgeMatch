import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getIngredientSignedImageUrl,
  uploadIngredientImage,
} from "@/lib/supabase/ingredient-images";

type IngredientEquivalenceInput = {
  fromQuantity?: string | number;
  fromUnit?: string;
  toQuantity?: string | number;
  toUnit?: string;
  note?: string;

  // Compatibilidad con equivalencias antiguas del seed:
  from?: string;
  to?: string;
  factor?: string | number;
};

type IngredientCatalogRow = {
  id: number;
  name: string;
  allowed_units: unknown;
  equivalences: unknown;
  image_path: string | null;
  created_by: string;
  created_at: string;
};

function normalizeList(values: unknown) {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function safeParseJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeEquivalences(values: unknown) {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => {
      if (!value || typeof value !== "object") return null;

      const equivalence = value as IngredientEquivalenceInput;

      /**
       * Formato nuevo esperado desde el admin:
       * {
       *   fromQuantity: 1,
       *   fromUnit: "taza",
       *   toQuantity: 185,
       *   toUnit: "g"
       * }
       */
      if (
        equivalence.fromQuantity !== undefined ||
        equivalence.toQuantity !== undefined ||
        equivalence.fromUnit !== undefined ||
        equivalence.toUnit !== undefined
      ) {
        const fromQuantity = Number(equivalence.fromQuantity);
        const toQuantity = Number(equivalence.toQuantity);
        const fromUnit = String(equivalence.fromUnit || "").trim();
        const toUnit = String(equivalence.toUnit || "").trim();
        const note = String(equivalence.note || "").trim();

        if (
          !Number.isFinite(fromQuantity) ||
          !Number.isFinite(toQuantity) ||
          !fromUnit ||
          !toUnit
        ) {
          return null;
        }

        return {
          fromQuantity,
          fromUnit,
          toQuantity,
          toUnit,
          note: note || undefined,
        };
      }

      /**
       * Formato antiguo del seed:
       * {
       *   from: "taza",
       *   to: "g",
       *   factor: 185
       * }
       */
      const from = String(equivalence.from || "").trim();
      const to = String(equivalence.to || "").trim();
      const factor = Number(equivalence.factor);

      if (!from || !to || !Number.isFinite(factor)) {
        return null;
      }

      return {
        fromQuantity: 1,
        fromUnit: from,
        toQuantity: factor,
        toUnit: to,
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

async function requireAdmin() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return {
      user: null,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  if (sessionUser.role !== "admin") {
    return {
      user: null,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }

  return {
    user: sessionUser,
    response: null,
  };
}

async function formatCatalogRow(row: IngredientCatalogRow) {
  return {
    id: row.id,
    name: row.name,
    allowedUnits: normalizeList(row.allowed_units),
    equivalences: normalizeEquivalences(row.equivalences),
    imagePath: row.image_path,
    imageUrl: await getIngredientSignedImageUrl(row.image_path),
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const { response } = await requireAdmin();

  if (response) return response;

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ingredient_catalog")
    .select("id, name, allowed_units, equivalences, image_path, created_by, created_at")
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar el catálogo" },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as IngredientCatalogRow[];
  const formattedRows = await Promise.all(rows.map(formatCatalogRow));

  return NextResponse.json({
    ingredients: formattedRows,
  });
}

export async function POST(req: Request) {
  const { user, response } = await requireAdmin();

  if (response) return response;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  const name = String(formData.get("name") || "").trim();
  const allowedUnitsRaw = safeParseJson(formData.get("allowedUnits"));
  const equivalencesRaw = safeParseJson(formData.get("equivalences"));
  const imageFile = formData.get("image");

  if (!name) {
    return NextResponse.json(
      { error: "Se requiere nombre" },
      { status: 400 }
    );
  }

  const allowedUnits = normalizeList(allowedUnitsRaw);
  const equivalences = normalizeEquivalences(equivalencesRaw);

  if (allowedUnitsRaw === null && formData.get("allowedUnits")) {
    return NextResponse.json(
      { error: "allowedUnits debe ser un JSON válido" },
      { status: 400 }
    );
  }

  if (equivalencesRaw === null && formData.get("equivalences")) {
    return NextResponse.json(
      { error: "equivalences debe ser un JSON válido" },
      { status: 400 }
    );
  }

  let imagePath: string | null = null;

  if (imageFile instanceof File && imageFile.size > 0) {
    if (imageFile.type !== "image/png") {
      return NextResponse.json(
        { error: "Solo se permiten imágenes PNG" },
        { status: 400 }
      );
    }

    if (imageFile.size > 500 * 1024) {
      return NextResponse.json(
        { error: "La imagen no puede superar 500KB" },
        { status: 400 }
      );
    }

    try {
      imagePath = await uploadIngredientImage({
        ingredientName: name,
        file: imageFile,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen al storage";

      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const supabase = createSupabaseAdminClient();

  /**
   * Si el ingrediente ya existe y no subiste una imagen nueva,
   * conservamos su image_path anterior para no dejarlo en null.
   */
  const { data: existing } = await supabase
    .from("ingredient_catalog")
    .select("image_path")
    .ilike("name", name)
    .maybeSingle();

  const finalImagePath =
    imagePath ?? (existing as { image_path: string | null } | null)?.image_path ?? null;

  const { data, error } = await supabase
    .from("ingredient_catalog")
    .upsert(
      {
        name,
        allowed_units: allowedUnits,
        equivalences,
        image_path: finalImagePath,
        created_by: user.username,
      },
      { onConflict: "name" }
    )
    .select("id, name, allowed_units, equivalences, image_path, created_by, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "No se pudo guardar el ingrediente" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ingredient: await formatCatalogRow(data as IngredientCatalogRow),
  }, { status: 201 });
}