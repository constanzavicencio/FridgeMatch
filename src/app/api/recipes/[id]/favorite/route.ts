import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, context: Params) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const recipeId = Number(id);

  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return NextResponse.json({ error: "invalid_recipe_id" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("recipe_favorites").upsert(
    {
      recipe_id: recipeId,
      username: sessionUser.username,
    },
    { onConflict: "recipe_id,username" }
  );

  if (error) {
    return NextResponse.json(
      { error: "No se pudo marcar favorito", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, context: Params) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const recipeId = Number(id);

  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return NextResponse.json({ error: "invalid_recipe_id" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("recipe_favorites")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("username", sessionUser.username);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo quitar favorito", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
