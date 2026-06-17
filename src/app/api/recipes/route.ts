import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRecipesWithUserData } from "@/lib/recipes-db";
import type { RecipeDifficulty } from "@/lib/recipe-types";

type RecipeIngredientInput = {
  productId?: number;
  quantityRequired?: number;
  unit?: string;
};

export async function GET(req: Request) {
  const sessionUser = await getSessionUser();
  const url = new URL(req.url);
  const favoritesOnly = url.searchParams.get("favorites") === "1";

  if (favoritesOnly && !sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const recipes = await getRecipesWithUserData({
      username: sessionUser?.username,
      favoritesOnly,
    });

    return NextResponse.json({ recipes });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudieron cargar las recetas",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (sessionUser.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const instructions = String(body.instructions || "").trim();
  const difficulty = String(body.difficulty || "medio") as RecipeDifficulty;
  const timeMinutes = Number(body.timeMinutes || 0);
  const servings = Number(body.servings || 0);
  const ingredients = Array.isArray(body.ingredients)
    ? (body.ingredients as RecipeIngredientInput[])
    : [];

  if (!title || !instructions) {
    return NextResponse.json(
      { error: "Se requieren titulo e instrucciones" },
      { status: 400 }
    );
  }

  if (!["facil", "medio", "dificil"].includes(difficulty)) {
    return NextResponse.json(
      { error: "Dificultad invalida" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(timeMinutes) || timeMinutes <= 0) {
    return NextResponse.json(
      { error: "Tiempo invalido" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(servings) || servings <= 0) {
    return NextResponse.json(
      { error: "Porciones invalidas" },
      { status: 400 }
    );
  }

  if (ingredients.length === 0) {
    return NextResponse.json(
      { error: "La receta debe incluir ingredientes" },
      { status: 400 }
    );
  }

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

  if (normalizedIngredients.length === 0) {
    return NextResponse.json(
      { error: "Ingredientes invalidos" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      title,
      description,
      instructions,
      difficulty,
      time_minutes: timeMinutes,
      servings,
      created_by: sessionUser.username,
    })
    .select("id")
    .single();

  if (recipeError || !recipe) {
    return NextResponse.json(
      { error: "No se pudo crear la receta" },
      { status: 500 }
    );
  }

  const recipeId = Number(recipe.id);

  const { error: recipeIngredientsError } = await supabase
    .from("recipe_ingredients")
    .insert(
      normalizedIngredients.map((item) => ({
        recipe_id: recipeId,
        product_id: item.productId,
        quantity_required: item.quantityRequired,
        unit: item.unit,
      }))
    );

  if (recipeIngredientsError) {
    await supabase.from("recipes").delete().eq("id", recipeId);

    return NextResponse.json(
      { error: "No se pudieron guardar los ingredientes de la receta" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, recipeId }, { status: 201 });
}
