import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getRecipesWithUserData } from "@/lib/recipes-db";

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const recipes = await getRecipesWithUserData({ username: sessionUser.username });
    const rated = recipes.filter((recipe) => recipe.myRating !== null);

    return NextResponse.json({ recipes: rated });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudieron cargar tus calificaciones",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
