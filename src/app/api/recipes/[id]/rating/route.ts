import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ id: string }>;
};

function isValidHalfStep(value: number) {
  return Number.isFinite(value) && value >= 0.5 && value <= 5 && Number.isInteger(value * 2);
}

export async function POST(req: Request, context: Params) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const recipeId = Number(id);

  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return NextResponse.json({ error: "invalid_recipe_id" }, { status: 400 });
  }

  const body = await req.json();
  const rating = Number(body.rating);
  const comment = body.comment == null ? null : String(body.comment).trim();

  if (!isValidHalfStep(rating)) {
    return NextResponse.json(
      { error: "La calificacion debe estar entre 0.5 y 5 en pasos de 0.5" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("recipe_ratings").upsert(
    {
      recipe_id: recipeId,
      username: sessionUser.username,
      rating,
      comment,
    },
    { onConflict: "recipe_id,username" }
  );

  if (error) {
    return NextResponse.json(
      {
        error: "No se pudo guardar la calificacion",
        detail: error.message,
      },
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
    .from("recipe_ratings")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("username", sessionUser.username);

  if (error) {
    return NextResponse.json(
      {
        error: "No se pudo eliminar la calificacion",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
