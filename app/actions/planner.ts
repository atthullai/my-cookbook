"use server";

/**
 * Server actions for the meal planner.
 * Uses @supabase/ssr server client so auth session is available server-side.
 */
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { convertToBase } from "@/lib/conversion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecipeIngredientRow {
  name:       string;
  quantity:   number | null;
  unit:       string | null;
  pantry_ref: string | null;
}

// ── markMealCooked ────────────────────────────────────────────────────────────

export async function markMealCooked(
  mealPlanId:        string,
  servingsMultiplier: number,
  skipDeduction:     boolean
): Promise<{ ok: boolean; pfandCreated: { name: string; amount: number }[] }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const pfandCreated: { name: string; amount: number }[] = [];

  if (!skipDeduction) {
    // 1. Fetch the planned meal + its recipe
    const { data: meal, error: mealErr } = await supabase
      .from("planned_meals")
      .select("id, servings, recipe_id")
      .eq("id", mealPlanId)
      .eq("user_id", user.id)
      .single();

    if (mealErr || !meal) throw new Error("Meal not found");

    // 2. Fetch recipe base servings
    const { data: recipe, error: recipeErr } = await supabase
      .from("recipes")
      .select("servings, title")
      .eq("id", meal.recipe_id)
      .single();

    if (recipeErr || !recipe) throw new Error("Recipe not found");

    // 3. Fetch ingredients from recipe_ingredients table
    const { data: ingredients, error: ingErr } = await supabase
      .from("recipe_ingredients")
      .select("name, quantity, unit, pantry_ref")
      .eq("recipe_id", meal.recipe_id);

    if (ingErr) throw new Error("Failed to fetch ingredients");

    const baseServings = (recipe.servings as number) ?? 1;
    const scale = (meal.servings / baseServings) * servingsMultiplier;
    const mealName = (recipe.title as string) ?? "";

    // 4. FIFO deduct each ingredient via RPC
    for (const ing of (ingredients ?? []) as RecipeIngredientRow[]) {
      const ref = ing.pantry_ref ?? ing.name;
      if (!ref) continue;

      const qty = (ing.quantity ?? 1) * scale;
      const { base, tier } = convertToBase(qty, ing.unit ?? "", ing.name);

      if (tier === 3 || base <= 0) continue;

      const { data: rpcResult } = await supabase.rpc("deduct_pantry_fifo", {
        p_user_id:     user.id,
        p_pantry_ref:  ref,
        p_needed_base: base,
        p_meal_name:   mealName,
      });

      // Collect any Pfand records auto-created by RPC
      if (rpcResult?.pfand_created?.length) {
        pfandCreated.push(...(rpcResult.pfand_created as { name: string; amount: number }[]));
      }
    }
  }

  // 5. Mark meal as cooked
  const { error: updateErr } = await supabase
    .from("planned_meals")
    .update({
      cooked:             true,
      cooked_at:          new Date().toISOString(),
      skipped_deduction:  skipDeduction,
    })
    .eq("id", mealPlanId)
    .eq("user_id", user.id);

  if (updateErr) throw new Error("Failed to mark meal as cooked");

  revalidatePath("/planner");
  revalidatePath("/pantry");
  revalidatePath("/pfand");

  return { ok: true, pfandCreated };
}
