import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type IngredientSearchResult = {
  id: string;
  name_en: string;
  name_de: string;
  default_unit: string | null;
  category: string | null;
};

type LibraryRow = IngredientSearchResult & { synonyms: string[] };

// Module-level cache so the full library is fetched once per cold start.
// 355 rows ≈ 50 KB — cheap to hold in memory and cheap to scan.
let cachedLibrary: LibraryRow[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async function getLibrary(): Promise<LibraryRow[]> {
  const now = Date.now();
  if (cachedLibrary && now - cacheTime < CACHE_TTL_MS) return cachedLibrary;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ingredients")
    .select("id, name_en, name_de, default_unit, category, synonyms")
    .order("name_en");

  cachedLibrary = (data ?? []) as LibraryRow[];
  cacheTime = now;
  return cachedLibrary;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const library = await getLibrary();

  // Score each row: prefix on name_en scores highest, then substring on name_en, then synonym match
  type Scored = { row: LibraryRow; score: number };
  const scored: Scored[] = [];

  const wordBoundary = (text: string) => new RegExp(`(^|\\s)${q}`, "i").test(text);

  for (const row of library) {
    const name = row.name_en.toLowerCase();
    const syns = row.synonyms ?? [];
    let score = 0;

    if (wordBoundary(row.name_en)) score += 4;
    else if (name.startsWith(q)) score += 3;
    else if (name.includes(q)) score += 2;

    if (syns.some((s) => wordBoundary(s))) score += 2;
    else if (syns.some((s) => s.toLowerCase().includes(q))) score += 1;

    if (score > 0) scored.push({ row, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.row.name_en.localeCompare(b.row.name_en);
  });

  const results: IngredientSearchResult[] = scored.slice(0, 8).map(({ row }) => ({
    id: row.id,
    name_en: row.name_en,
    name_de: row.name_de,
    default_unit: row.default_unit,
    category: row.category,
  }));

  return NextResponse.json(results);
}
