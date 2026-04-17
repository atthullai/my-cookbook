import { NextResponse } from "next/server";
import { estimateNutritionFromIngredients } from "@/lib/nutrition-usda";
import type { IngredientGroupDraft } from "@/lib/recipe-types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    ingredientGroups?: unknown;
    servings?: unknown;
  };

  const ingredientGroups = Array.isArray(body.ingredientGroups) ? (body.ingredientGroups as IngredientGroupDraft[]) : [];
  const servings = typeof body.servings === "string" ? body.servings : "";

  if (ingredientGroups.length === 0) {
    return NextResponse.json({ error: "Please add ingredients first." }, { status: 400 });
  }

  try {
    const nutrition = await estimateNutritionFromIngredients({
      ingredientGroups,
      servings,
    });

    return NextResponse.json({ nutrition });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not estimate nutrition.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
