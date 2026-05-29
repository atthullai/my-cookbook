/**
 * GET /api/barcode?code=<UPC/EAN>
 *
 * Looks up a product barcode via Open Food Facts (free, no key needed).
 * Returns a partial PantryItem-shaped object so the client can auto-fill
 * the Add Item form.
 */
import { NextRequest, NextResponse } from "next/server";
import type { ShoppingCategory } from "@/types";

// Map Open Food Facts PNNS groups / categories → our ShoppingCategory slugs
const OFF_CATEGORY_MAP: { pattern: RegExp; category: ShoppingCategory }[] = [
  { pattern: /fruit|vegetable|produce|salad|legume/i,        category: "produce"       },
  { pattern: /herb|sprig|basil|mint|coriander|parsley/i,     category: "fresh-herbs"   },
  { pattern: /milk|dairy|cheese|yogurt|cream|butter|paneer/i,category: "dairy"         },
  { pattern: /egg/i,                                          category: "eggs"          },
  { pattern: /meat|beef|pork|lamb|chicken|poultry|mutton/i,  category: "meat"          },
  { pattern: /fish|seafood|prawn|shrimp|tuna|salmon/i,       category: "fish-seafood"  },
  { pattern: /spice|condiment|salt|pepper|cumin|masala/i,    category: "spices"        },
  { pattern: /cereal|grain|rice|pasta|bread|flour|pulse|legume|lentil|dal/i, category: "grains-pulses" },
  { pattern: /nut|seed|almond|cashew|walnut|peanut/i,        category: "nuts-seeds"    },
  { pattern: /canned|tinned|preserve|pickle|conserve/i,      category: "canned-dried"  },
  { pattern: /bakery|biscuit|cookie|cake|pastry|snack/i,     category: "bakery"        },
  { pattern: /sauce|paste|ketchup|mustard|mayo|chutney|dip/i,category: "sauces-pastes" },
  { pattern: /oil|fat|ghee/i,                                 category: "oils"          },
  { pattern: /frozen|ice cream/i,                             category: "frozen"        },
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
  brands?: string;
  quantity?: string;                 // e.g. "500 g" or "1 L"
  categories_tags?: string[];
  pnns_groups_1?: string;
  pnns_groups_2?: string;
  image_front_url?: string;
  nutriscore_grade?: string;
}

interface OFFResponse {
  status: number;                    // 1 = found, 0 = not found
  product?: OFFProduct;
}

function parseQuantity(raw: string | undefined): { quantity: number; unit: string } | null {
  if (!raw) return null;
  const m = raw.trim().match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
  if (!m) return null;
  return {
    quantity: parseFloat(m[1]),
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
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_en,brands,quantity,categories_tags,pnns_groups_1,pnns_groups_2,image_front_url,nutriscore_grade`,
      { headers: { "User-Agent": "Atthuzhai-Cookbook/1.0 (family recipe app)" }, next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);

    const data: OFFResponse = await res.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    const p = data.product;
    const name = p.product_name_en || p.product_name || "";
    const brand = p.brands?.split(",")[0].trim() ?? "";
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
      unit: qtyParsed?.unit ?? "no.",
      imageUrl: p.image_front_url ?? null,
    });
  } catch (err) {
    console.error("[barcode]", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
