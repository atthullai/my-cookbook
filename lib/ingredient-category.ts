// Resolves an ingredient name → ShoppingCategory using the ingredient library
// (name_en + synonyms + category), so the pantry form can auto-categorize what
// the curated PANTRY_CATEGORIES list doesn't cover (tomato, paneer, salmon…).
import { supabase } from "@/lib/supabase";
import type { ShoppingCategory } from "@/types";

// ingredients.category (seed taxonomy) → our ShoppingCategory
const ING_CAT_MAP: Record<string, ShoppingCategory> = {
  vegetables: "produce", fruits: "produce", aromatics: "produce",
  herbs: "fresh-herbs",
  dairy: "dairy", cheese: "dairy",
  proteins: "meat", // refined by name below (fish/seafood, paneer/tofu)
  grains: "grains-pulses", dals: "grains-pulses", flour: "grains-pulses",
  spices_whole: "spices", spices_powder: "spices",
  nuts: "nuts-seeds",
  oils: "oils",
  baking: "canned-dried", pantry: "canned-dried",
  sweet: "other", flavouring: "sauces-pastes", acids: "sauces-pastes",
  other: "other",
};

const FISH_RE = /fish|prawn|shrimp|salmon|tuna|mackerel|sardine|anchov|squid|octopus|crab|lobster|mussel|oyster|scallop|trout|cod|pomfret|rohu|herring/i;
const VEG_PROTEIN_RE = /paneer|tofu|tempeh|seitan|halloumi/i;

export interface CategoryEntry { name: string; synonyms: string[]; category: ShoppingCategory }

function mapCategory(name: string, ingCat: string): ShoppingCategory {
  if (FISH_RE.test(name)) return "fish-seafood";
  if (VEG_PROTEIN_RE.test(name)) return "dairy"; // paneer/halloumi → dairy; tofu/tempeh closest
  return ING_CAT_MAP[ingCat] ?? "other";
}

let cached: Promise<CategoryEntry[]> | null = null;

export function getCategoryIndex(): Promise<CategoryEntry[]> {
  if (!cached) {
    cached = (async () => {
      try {
        const { data } = await supabase.from("ingredients").select("name_en, synonyms, category");
        return (data ?? [])
          .map((r) => ({
            name: String(r.name_en ?? "").toLowerCase(),
            synonyms: ((r.synonyms as string[] | null) ?? []).map((s) => s.toLowerCase()),
            category: mapCategory(String(r.name_en ?? ""), String(r.category ?? "")),
          }))
          .filter((e) => e.name);
      } catch {
        return [];
      }
    })();
  }
  return cached;
}

/** Best ShoppingCategory for a typed name, or null if the library doesn't know it. */
export function resolveCategory(name: string, index: CategoryEntry[]): ShoppingCategory | null {
  const q = name.toLowerCase().trim();
  if (!q || index.length === 0) return null;
  const exact = index.find((e) => e.name === q || e.synonyms.includes(q));
  if (exact) return exact.category;
  // word-boundary containment, longest name first ("cherry tomatoes" → tomato)
  const sorted = [...index].sort((a, b) => b.name.length - a.name.length);
  for (const e of sorted) {
    if (e.name.length < 3) continue;
    if (new RegExp(`(^|\\W)${e.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(s?)(\\W|$)`).test(q)) return e.category;
  }
  return null;
}
