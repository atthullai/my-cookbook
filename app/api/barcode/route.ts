/**
 * GET /api/barcode?code=<UPC/EAN>
 *
 * Looks up a product barcode via Open Food Facts (free, no key needed).
 * Returns a partial PantryItem-shaped object so the client can auto-fill
 * the Add Item form.
 *
 * Translation priority for non-English product names:
 *   1. product_name_en from Open Food Facts (best)
 *   2. DeepL  — if DEEPL_API_KEY is set in env
 *   3. MyMemory  — free fallback, uses the product's `lang` tag for accuracy
 */
import { NextRequest, NextResponse } from "next/server";
import type { ShoppingCategory } from "@/types";

// Map Open Food Facts PNNS groups / categories → our ShoppingCategory slugs
const OFF_CATEGORY_MAP: { pattern: RegExp; category: ShoppingCategory }[] = [
  { pattern: /fruit|vegetable|produce|salad/i,                  category: "produce"       },
  { pattern: /herb|sprig|basil|mint|coriander|parsley/i,        category: "fresh-herbs"   },
  { pattern: /milk|dairy|cheese|yogurt|cream|butter|paneer/i,   category: "dairy"         },
  { pattern: /egg/i,                                             category: "eggs"          },
  { pattern: /meat|beef|pork|lamb|chicken|poultry|mutton/i,     category: "meat"          },
  { pattern: /fish|seafood|prawn|shrimp|tuna|salmon/i,          category: "fish-seafood"  },
  { pattern: /spice|condiment|salt|pepper|cumin|masala/i,       category: "spices"        },
  { pattern: /cereal|grain|rice|pasta|bread|flour|pulse|legume|lentil|dal|chickpea/i, category: "grains-pulses" },
  { pattern: /nut|seed|almond|cashew|walnut|peanut/i,           category: "nuts-seeds"    },
  { pattern: /canned|tinned|preserve|pickle|conserve/i,         category: "canned-dried"  },
  { pattern: /bakery|biscuit|cookie|cake|pastry|snack/i,        category: "bakery"        },
  { pattern: /sauce|paste|ketchup|mustard|mayo|chutney|dip/i,   category: "sauces-pastes" },
  { pattern: /oil|fat|ghee/i,                                    category: "oils"          },
  { pattern: /frozen|ice cream/i,                                category: "frozen"        },
  { pattern: /beverage|drink|juice|water|soda|coffee|tea|wine|beer/i, category: "beverages" },
];

function mapCategory(tags: string[]): ShoppingCategory {
  const haystack = tags.join(" ").toLowerCase();
  for (const { pattern, category } of OFF_CATEGORY_MAP) {
    if (pattern.test(haystack)) return category;
  }
  return "other";
}

interface OFFProduct {
  product_name?: string;
  product_name_en?: string;
  lang?: string;                       // e.g. "de", "fr", "it"
  brands?: string;
  quantity?: string;
  categories_tags?: string[];
  pnns_groups_1?: string;
  pnns_groups_2?: string;
  image_front_url?: string;
}

interface OFFResponse {
  status: number;
  product?: OFFProduct;
}

/** Translate text → English via DeepL (preferred) or MyMemory (fallback). */
async function toEnglish(text: string, sourceLang?: string): Promise<string> {
  if (!text.trim()) return text;

  // ── 1. DeepL (if key available) ──────────────────────────────────────────
  const deeplKey = process.env.DEEPL_API_KEY;
  if (deeplKey) {
    try {
      const endpoint = deeplKey.endsWith(":fx")
        ? "https://api-free.deepl.com/v2/translate"
        : "https://api.deepl.com/v2/translate";

      const body: Record<string, unknown> = {
        text: [text],
        target_lang: "EN",
        preserve_formatting: true,
      };
      if (sourceLang) body.source_lang = sourceLang.toUpperCase();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${deeplKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json() as { translations?: Array<{ text?: string }> };
        const translated = data.translations?.[0]?.text?.trim();
        if (translated) return translated;
      }
    } catch {
      // fall through to MyMemory
    }
  }

  // ── 2. MyMemory (free, no key needed) ────────────────────────────────────
  try {
    const langpair = sourceLang ? `${sourceLang}|en` : `autodetect|en`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return text;
    const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };

    // MyMemory returns status 200 even for errors; responseStatus 200 = success
    if (data.responseStatus !== 200) return text;

    const translated = data.responseData?.translatedText?.trim();
    // Guard against MyMemory echoing the input unchanged
    return translated && translated.toLowerCase() !== text.toLowerCase()
      ? translated
      : text;
  } catch {
    return text; // translation is always best-effort
  }
}

function parseQuantity(raw: string | undefined): { quantity: number; unit: string } | null {
  if (!raw) return null;
  const m = raw.trim().match(/^([\d.,]+)\s*([a-zA-Z]+)?$/);
  if (!m) return null;
  const qty = parseFloat(m[1].replace(",", "."));
  return {
    quantity: isNaN(qty) ? 1 : qty,
    unit: (m[2] ?? "no.").toLowerCase().replace("cl", "ml"),
  };
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json` +
      `?fields=product_name,product_name_en,lang,brands,quantity,categories_tags,pnns_groups_1,pnns_groups_2,image_front_url`,
      { headers: { "User-Agent": "Atthuzhai-Cookbook/1.0 (family recipe app)" }, next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);

    const data: OFFResponse = await res.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    const p = data.product;

    // Use the English name if OFF has it; otherwise translate the raw name
    const rawName  = (p.product_name ?? "").trim();
    const engName  = (p.product_name_en ?? "").trim();
    const prodLang = p.lang?.toLowerCase();  // "de", "fr", etc.

    const name = engName
      ? engName
      : prodLang && prodLang !== "en"
        ? await toEnglish(rawName, prodLang)
        : rawName;

    const brand     = p.brands?.split(",")[0].trim() ?? "";
    const qtyParsed = parseQuantity(p.quantity);

    const categoryTags = [
      ...(p.categories_tags ?? []),
      p.pnns_groups_1 ?? "",
      p.pnns_groups_2 ?? "",
    ];
    const category = mapCategory(categoryTags);

    return NextResponse.json({
      found: true,
      name,
      brand,
      category,
      quantity: qtyParsed?.quantity ?? 1,
      unit:     qtyParsed?.unit     ?? "no.",
      imageUrl: p.image_front_url   ?? null,
    });
  } catch (err) {
    console.error("[barcode]", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
