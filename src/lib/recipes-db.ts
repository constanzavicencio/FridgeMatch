import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  RecipeDifficulty,
  RecipeIngredientItem,
  RecipeRating,
  RecipeRecord,
} from "@/lib/recipe-types";

type RecipeRow = {
  id: number;
  title: string;
  description: string;
  instructions: string;
  difficulty: RecipeDifficulty;
  time_minutes: number;
  servings: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type RecipeIngredientRow = {
  id: number;
  recipe_id: number;
  product_id: number;
  quantity_required: number | string;
  unit: string;
};

type CatalogRow = {
  id: number;
  name: string;
};

type RatingRow = {
  recipe_id: number;
  username: string;
  rating: number | string;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

type FavoriteRow = {
  recipe_id: number;
};

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export async function getRecipesWithUserData(options?: {
  username?: string;
  favoritesOnly?: boolean;
}) {
  const supabase = createSupabaseAdminClient();

  let recipeIdsFilter: number[] | null = null;

  if (options?.favoritesOnly && options.username) {
    const { data: favoriteRows, error: favoriteError } = await supabase
      .from("recipe_favorites")
      .select("recipe_id")
      .eq("username", options.username);

    if (favoriteError) {
      throw new Error("No se pudieron cargar los favoritos");
    }

    recipeIdsFilter = (favoriteRows ?? []).map((row) =>
      Number((row as FavoriteRow).recipe_id)
    );

    if (recipeIdsFilter.length === 0) {
      return [] as RecipeRecord[];
    }
  }

  let recipeQuery = supabase
    .from("recipes")
    .select(
      "id, title, description, instructions, difficulty, time_minutes, servings, created_by, created_at, updated_at"
    )
    .order("id", { ascending: false });

  if (recipeIdsFilter) {
    recipeQuery = recipeQuery.in("id", recipeIdsFilter);
  }

  const { data: recipeData, error: recipeError } = await recipeQuery;

  if (recipeError) {
    throw new Error("No se pudieron cargar las recetas");
  }

  const recipeRows = (recipeData ?? []) as RecipeRow[];

  if (recipeRows.length === 0) {
    return [] as RecipeRecord[];
  }

  const recipeIds = recipeRows.map((row) => row.id);

  const [{ data: ingredientData, error: ingredientError }, { data: ratingData, error: ratingError }, { data: favoriteData, error: favoriteError }] =
    await Promise.all([
      supabase
        .from("recipe_ingredients")
        .select("id, recipe_id, product_id, quantity_required, unit")
        .in("recipe_id", recipeIds),
      supabase
        .from("recipe_ratings")
        .select("recipe_id, username, rating, comment, created_at, updated_at")
        .in("recipe_id", recipeIds),
      options?.username
        ? supabase
            .from("recipe_favorites")
            .select("recipe_id")
            .eq("username", options.username)
            .in("recipe_id", recipeIds)
        : Promise.resolve({ data: [], error: null } as {
            data: FavoriteRow[];
            error: null;
          }),
    ]);

  if (ingredientError) {
    throw new Error("No se pudieron cargar los ingredientes de receta");
  }

  if (ratingError) {
    throw new Error("No se pudieron cargar las calificaciones");
  }

  if (favoriteError) {
    throw new Error("No se pudieron cargar los favoritos");
  }

  const ingredientRows = (ingredientData ?? []) as RecipeIngredientRow[];
  const ratingRows = (ratingData ?? []) as RatingRow[];
  const favoriteRows = (favoriteData ?? []) as FavoriteRow[];

  const productIds = [...new Set(ingredientRows.map((row) => row.product_id))];

  let catalogById = new Map<number, CatalogRow>();

  if (productIds.length > 0) {
    const { data: catalogData, error: catalogError } = await supabase
      .from("ingredient_catalog")
      .select("id, name")
      .in("id", productIds);

    if (catalogError) {
      throw new Error("No se pudo cargar el catalogo de ingredientes");
    }

    catalogById = new Map(
      ((catalogData ?? []) as CatalogRow[]).map((item) => [item.id, item])
    );
  }

  const ingredientsByRecipe = new Map<number, RecipeIngredientItem[]>();

  for (const row of ingredientRows) {
    const existing = ingredientsByRecipe.get(row.recipe_id) ?? [];
    const catalog = catalogById.get(row.product_id);

    existing.push({
      id: Number(row.id),
      productId: Number(row.product_id),
      name: catalog?.name ?? "Ingrediente",
      quantityRequired: Number(row.quantity_required),
      unit: row.unit,
    });

    ingredientsByRecipe.set(row.recipe_id, existing);
  }

  const ratingsByRecipe = new Map<number, RatingRow[]>();
  for (const row of ratingRows) {
    const existing = ratingsByRecipe.get(row.recipe_id) ?? [];
    existing.push(row);
    ratingsByRecipe.set(row.recipe_id, existing);
  }

  const favoriteRecipeIds = new Set(favoriteRows.map((row) => Number(row.recipe_id)));

  const recipes = recipeRows.map((row): RecipeRecord => {
    const recipeRatings = ratingsByRecipe.get(row.id) ?? [];
    const ratingsCount = recipeRatings.length;
    const averageRating =
      ratingsCount === 0
        ? 0
        : roundToOneDecimal(
            recipeRatings.reduce((acc, item) => acc + Number(item.rating), 0) /
              ratingsCount
          );

    const myRatingRow = options?.username
      ? recipeRatings.find((item) => item.username === options.username) ?? null
      : null;

    const myRating: RecipeRating | null = myRatingRow
      ? {
          recipeId: Number(myRatingRow.recipe_id),
          username: myRatingRow.username,
          rating: Number(myRatingRow.rating),
          comment: myRatingRow.comment,
          createdAt: myRatingRow.created_at,
          updatedAt: myRatingRow.updated_at,
        }
      : null;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      instructions: row.instructions,
      difficulty: row.difficulty,
      timeMinutes: row.time_minutes,
      servings: row.servings,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ingredients: ingredientsByRecipe.get(row.id) ?? [],
      averageRating,
      ratingsCount,
      isFavorite: favoriteRecipeIds.has(row.id),
      myRating,
    };
  });

  return recipes;
}
