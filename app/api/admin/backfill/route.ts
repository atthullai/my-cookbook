import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { matchToLibrary } from "@/lib/ingredient-matcher";

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, ingredients");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  let linked = 0;
  let skipped = 0;

  for (const recipe of recipes ?? []) {
    const items: Record<string, unknown>[] = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : [];

    let changed = false;

    for (const item of items) {
      if (item.libraryId) {
        skipped++;
        continue;
      }

      const name = typeof item.name_en === "string" ? item.name_en : "";
      if (!name) {
        skipped++;
        continue;
      }

      const match = await matchToLibrary(name, supabase);
      if (match.libraryId) {
        item.libraryId = match.libraryId;
        item.weightConfidence = match.confidence;
        linked++;
        changed = true;
      } else {
        skipped++;
      }
    }

    if (changed) {
      const { error: updateError } = await supabase
        .from("recipes")
        .update({ ingredients: items })
        .eq("id", recipe.id);

      if (updateError) {
        console.error(`Failed to update recipe ${recipe.id}:`, updateError.message);
      } else {
        updated++;
      }
    }
  }

  return NextResponse.json({ updated, linked, skipped });
}
