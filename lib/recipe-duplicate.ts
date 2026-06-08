// Fork-on-edit: copy a recipe into the current user's account so they can edit
// their own version. The original (someone else's) is never modified.
import { supabase } from "@/lib/supabase";
import { saveRecipeDb } from "@/lib/library";
import { isCreator } from "@/lib/creator";

/** Duplicates a recipe into the current user's account; returns the new recipe id. */
export async function duplicateRecipe(recipeId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in");

  const { data: row, error } = await supabase.from("recipes").select("*").eq("id", parseInt(recipeId, 10)).single();
  if (error || !row) throw new Error(error?.message ?? "Recipe not found");

  const copy: Record<string, unknown> = { ...row };
  delete copy.id;
  delete copy.created_at;
  copy.user_id = user.id;
  copy.is_public = isCreator(user.id); // non-creators' copies stay private
  copy.title_en = row.title_en ? `${row.title_en} (copy)` : "Recipe (copy)";

  const { data: inserted, error: insErr } = await supabase.from("recipes").insert([copy]).select("id").single();
  if (insErr || !inserted) throw new Error(insErr?.message ?? "Could not duplicate recipe");

  const newId = String(inserted.id);
  await saveRecipeDb(newId); // add the copy to the user's Library
  return newId;
}
