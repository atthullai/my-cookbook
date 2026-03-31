import { NextResponse } from "next/server";

type NutritionRecipeIngredient = {
  amount?: string | number | null;
  unit?: string | null;
  name_en?: string | null;
};

type NutritionRecipeGroup = {
  items?: NutritionRecipeIngredient[] | null;
};

type NutritionRecipePayload = {
  title_en?: string;
  servings?: number | null;
  ingredients?: NutritionRecipeGroup[] | null;
};

function toIngredientLine(item: NutritionRecipeIngredient): string {
  return [item.amount ?? "", item.unit ?? "", item.name_en ?? ""]
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(" ");
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    recipe?: NutritionRecipePayload;
  };

  const recipe = body.recipe;
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;

  if (!recipe) {
    return NextResponse.json({ error: "Recipe payload is required." }, { status: 400 });
  }

  if (!appId || !appKey) {
    return NextResponse.json(
      { error: "Nutrition API is not configured yet. Add EDAMAM_APP_ID and EDAMAM_APP_KEY." },
      { status: 503 }
    );
  }

  const ingredientLines =
    recipe.ingredients?.flatMap((group) => (group.items ?? []).map(toIngredientLine).filter(Boolean)) ?? [];

  if (ingredientLines.length === 0) {
    return NextResponse.json({ error: "Recipe needs ingredients before nutrition can be calculated." }, { status: 400 });
  }

  const response = await fetch(
    `https://api.edamam.com/api/nutrition-details?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: recipe.title_en || "Recipe",
        ingr: ingredientLines,
        yield: recipe.servings || 1,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          typeof data?.message === "string"
            ? data.message
            : "Nutrition calculation failed for this recipe.",
      },
      { status: response.status }
    );
  }

  return NextResponse.json({
    calories: data.calories ?? 0,
    totalWeight: data.totalWeight ?? 0,
    yield: data.yield ?? recipe.servings ?? 1,
    dietLabels: data.dietLabels ?? [],
    healthLabels: data.healthLabels ?? [],
    totalNutrients: data.totalNutrients ?? {},
    totalDaily: data.totalDaily ?? {},
  });
}
