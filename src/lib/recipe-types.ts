export type RecipeDifficulty = "facil" | "medio" | "dificil";

export type RecipeIngredientItem = {
  id: number;
  productId: number;
  name: string;
  quantityRequired: number;
  unit: string;
};

export type RecipeRating = {
  recipeId: number;
  username: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecipeRecord = {
  id: number;
  title: string;
  description: string;
  instructions: string;
  difficulty: RecipeDifficulty;
  timeMinutes: number;
  servings: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredientItem[];
  averageRating: number;
  ratingsCount: number;
  isFavorite: boolean;
  myRating: RecipeRating | null;
};
