import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getIngredientSignedImageUrl,
  uploadIngredientImage,
} from "@/lib/supabase/ingredient-images";

type IngredientCatalogRow = {
  id: number;
  name: string;
  allowed_units: unknown;
  equivalences: unknown;
  image_path: string | null;
  created_by: string;
  created_at: string;
};

type RouteContext = { params: Promise<{ id: string }> };

function normalizeList(values: unknown) {
  if (!Array.isArray(values)) return [];
  return values.map((v) => String(v).trim()).filter(Boolean);
}

function safeParseJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return null; }
}

async function requireAdmin() {
  const sessionUser = await getSessionUser();
  if (!sessionUser)
    return { user: null, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (sessionUser.role !== "admin")
    return { user: null, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { user: sessionUser, response: null };
}

export async function PATCH(req: Request, context: RouteContext) {
  const { response, user } = await requireAdmin();
  if (response) return response;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const ingredientId = Number(id);
  if (!Number.isFinite(ingredientId))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const formData = await req.formData();
  const name = String(formData.get("name") || "").trim();
  const allowedUnitsRaw = safeParseJson(formData.get("allowedUnits"));
  const equivalencesRaw = safeParseJson(formData.get("equivalences"));
  const imageFile = formData.get("image");

  if (!name)
    return NextResponse.json({ error: "Se requiere nombre" }, { status: 400 });

  const allowedUnits = normalizeList(allowedUnitsRaw);

  const supabase = createSupabaseAdminClient();

  // Obtener imagen actual para no perderla si no se sube una nueva
  const { data: existing } = await supabase
    .from("ingredient_catalog")
    .select("image_path")
    .eq("id", ingredientId)
    .maybeSingle();

  let imagePath: string | null =
    (existing as { image_path: string | null } | null)?.image_path ?? null;

  if (imageFile instanceof File && imageFile.size > 0) {
    if (imageFile.type !== "image/png")
      return NextResponse.json({ error: "Solo se permiten imágenes PNG" }, { status: 400 });
    if (imageFile.size > 500 * 1024)
      return NextResponse.json({ error: "La imagen no puede superar 500KB" }, { status: 400 });

    const uploaded = await uploadIngredientImage({ ingredientName: name, file: imageFile });
    if (uploaded) imagePath = uploaded;
  }

  const { data, error } = await supabase
    .from("ingredient_catalog")
    .update({
      name,
      allowed_units: allowedUnits,
      equivalences: equivalencesRaw ?? [],
      image_path: imagePath,
    })
    .eq("id", ingredientId)
    .select("id, name, allowed_units, equivalences, image_path, created_by, created_at")
    .single();

  if (error || !data)
    return NextResponse.json({ error: "No se pudo actualizar el ingrediente" }, { status: 500 });

  const row = data as IngredientCatalogRow;
  return NextResponse.json({
    ingredient: {
      id: row.id,
      name: row.name,
      allowedUnits: normalizeList(row.allowed_units),
      equivalences: row.equivalences,
      imagePath: row.image_path,
      imageUrl: await getIngredientSignedImageUrl(row.image_path),
      createdBy: row.created_by,
      createdAt: row.created_at,
    },
  });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  const ingredientId = Number(id);
  if (!Number.isFinite(ingredientId))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("ingredient_catalog")
    .delete()
    .eq("id", ingredientId);

  if (error)
    return NextResponse.json({ error: "No se pudo eliminar el ingrediente" }, { status: 500 });

  return NextResponse.json({ success: true });
}
