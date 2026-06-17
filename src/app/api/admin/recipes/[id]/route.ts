import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RecipeDifficulty } from "@/lib/recipe-types";

type RouteContext = { params: Promise<{ id: string }> };

type RecipeIngredientInput = {
  productId?: number;
  quantityRequired?: number;
  unit?: string;
};

async function requireAdmin() {
  const sessionUser = await getSessionUser();
  if (!sessionUser)
    return { user: null, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (sessionUser.role !== "admin")
    return { user: null, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { user: sessionUser, response: null };
}

export async function PATCH(req: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  const recipeId = Number(id);
  if (!Number.isFinite(recipeId))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();

  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const instructions = String(body.instructions || "").trim();
  const difficulty = String(body.difficulty || "medio") as RecipeDifficulty;
  const timeMinutes = Number(body.timeMinutes || 0);
  const servings = Number(body.servings || 0);
  const ingredients: RecipeIngredientInput[] = Array.isArray(body.ingredients)
    ? body.ingredients
    : [];

  if (!title || !instructions)
    return NextResponse.json({ error: "Se requieren título e instrucciones" }, { status: 400 });

  if (!["facil", "medio", "dificil"].includes(difficulty))
    return NextResponse.json({ error: "Dificultad inválida" }, { status: 400 });

  if (!Number.isFinite(timeMinutes) || timeMinutes <= 0)
    return NextResponse.json({ error: "Tiempo inválido" }, { status: 400 });

  if (!Number.isFinite(servings) || servings <= 0)
    return NextResponse.json({ error: "Porciones inválidas" }, { status: 400 });

  const normalizedIngredients = ingredients
    .map((item) => ({
      productId: Number(item.productId),
      quantityRequired: Number(item.quantityRequired),
      unit: String(item.unit || "").trim(),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.productId) &&
        Number.isFinite(item.quantityRequired) &&
        item.quantityRequired > 0 &&
        item.unit
    );

  if (normalizedIngredients.length === 0)
    return NextResponse.json({ error: "Ingredientes inválidos" }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  const { error: recipeError } = await supabase
    .from("recipes")
    .update({ title, description, instructions, difficulty, time_minutes: timeMinutes, servings })
    .eq("id", recipeId);

  if (recipeError)
    return NextResponse.json({ error: "No se pudo actualizar la receta" }, { status: 500 });

  // Reemplazar ingredientes: borrar los viejos e insertar los nuevos
  await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);

  const { error: ingError } = await supabase.from("recipe_ingredients").insert(
    normalizedIngredients.map((item) => ({
      recipe_id: recipeId,
      product_id: item.productId,
      quantity_required: item.quantityRequired,
      unit: item.unit,
    }))
  );

  if (ingError)
    return NextResponse.json({ error: "No se pudieron actualizar los ingredientes" }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  const recipeId = Number(id);
  if (!Number.isFinite(recipeId))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

  if (error)
    return NextResponse.json({ error: "No se pudo eliminar la receta" }, { status: 500 });

  return NextResponse.json({ success: true });
}
