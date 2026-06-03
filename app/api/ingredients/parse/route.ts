import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { buildIndex, parseLine } from "@/lib/ingredient-resolver";
import type { IngredientRecord } from "@/lib/ingredient-resolver";

// Module-level cache — same pattern as /api/ingredients/search
let cachedIndex: ReturnType<typeof buildIndex> | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getIndex() {
  const now = Date.now();
  if (cachedIndex && now - cacheTime < CACHE_TTL_MS) return cachedIndex;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ingredients")
    .select("id, name_en, name_de, synonyms, category, default_unit");

  const records = (data ?? []) as IngredientRecord[];
  cachedIndex = buildIndex(records);
  cacheTime = now;
  return cachedIndex;
}

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text?.trim()) return NextResponse.json([]);

    const index = await getIndex();
    const entries = parseLine(text, index);
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "parse failed" }, { status: 500 });
  }
}
