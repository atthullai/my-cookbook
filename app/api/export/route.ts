import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// GET /api/export — downloads all of the authenticated user's recipes as JSON.
// This is the cookbook backup — if Supabase data is ever lost, this JSON contains everything.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = {
    exported_at: new Date().toISOString(),
    user_email: user.email,
    recipe_count: (recipes ?? []).length,
    recipes: recipes ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cookbook-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
