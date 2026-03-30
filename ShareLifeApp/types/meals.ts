export interface MealIngredient {
  name: string;
  quantity: string;
  unit?: string;
}

export interface MealVote {
  id: string;
  user: { id: string; firstName: string };
  dayOfWeek: number;
  meal: { id: string; name: string };
}

export interface WeeklyMeal {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  ingredients: MealIngredient[];
  weekNumber: number;
  year: number;
  proposedBy?: { id: string; firstName: string } | null;
  votes?: MealVote[];
}

export interface CatalogMeal {
  name: string;
  description?: string;
  ingredients: MealIngredient[];
  tags: string[];
}

export interface SearchResult {
  externalId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  ingredients: MealIngredient[];
}
