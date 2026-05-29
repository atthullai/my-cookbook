/**
 * German Pfand (deposit) detection and recycling disposal logic.
 * Rules current as of 2024 (including dairy Einweg since Jan 2024).
 */

export type PfandType =
  | "einweg"      // €0.25 single-use PET / aluminium can
  | "mehrweg"     // €0.08–0.15 refillable glass/plastic
  | "crate"       // €1.50 bottle crate
  | "none";       // No deposit

export type DisposalBin =
  | "pfandautomat"     // Return to supermarket machine
  | "altglas-weiss"    // Clear/white glass bin
  | "altglas-braun"    // Brown glass bin
  | "altglas-gruen"    // Green glass bin
  | "gelbe-tonne"      // Yellow bin (Tetra Pak, plastic packaging)
  | "blaue-tonne"      // Blue bin (cardboard/paper)
  | "restmuell";       // Grey bin (ceramics, crystal, mirrors)

export interface PfandResult {
  pfandType: PfandType;
  /** Deposit amount in euros, 0 if none */
  deposit: number;
  containerType: string;
  disposal: DisposalBin;
  disposalLabel: string;
  note?: string;
}

// ── Keyword lists ─────────────────────────────────────────────────────────────

const EINWEG_KEYWORDS = [
  // Water & soda (PET)
  "water", "wasser", "mineralwasser", "sparkling", "sprudel", "still water",
  "soda", "cola", "pepsi", "fanta", "sprite", "7up", "limonade", "limo",
  "ice tea", "eistee", "iced tea",
  // Juice (PET)
  "juice", "saft", "nektar",
  // Energy / sports
  "energy drink", "red bull", "monster", "rockstar", "relentless", "burn",
  "sports drink", "isotonic", "powerade", "gatorade",
  // Aluminium cans
  "dose", "can ", " can", "aluminium", "aluminum",
  // Dairy in single-use plastic (since Jan 2024)
  "milch pet", "müller milch", "muller milch", "landliebe", "weihenstephan pet",
  "frische milch flasche", "milchflasche",
];

const MEHRWEG_KEYWORDS = [
  // Refillable beer glass
  "bier flasche", "bierflasche", "weizenbier", "weißbier", "weissbier",
  "hefeweizen", "pils flasche", "lager flasche",
  "mehrweg", "pfandflasche",
  // Some mineral water brands in glass Mehrweg
  "gerolsteiner glas", "apollinaris glas", "volvic glas",
];

const CRATE_KEYWORDS = [
  "kasten", "kiste", "crate", "träger", "trager", "bierkasten",
  "flaschenkasten", "20er", "24er",
];

const NO_PFAND_WINE = [
  "wine", "wein", "weißwein", "weisswein", "rotwein", "rosé", "rose",
  "sekt", "prosecco", "champagne", "champagner", "cava", "crémant", "cremant",
];
const NO_PFAND_SPIRITS = [
  "whisky", "whiskey", "vodka", "gin", "rum", "tequila", "cognac", "brandy",
  "schnapps", "schnaps", "liqueur", "likör", "likor", "sambuca", "baileys",
  "amaretto", "absinthe", "absinth",
];
const NO_PFAND_OIL_SAUCE = [
  "olive oil", "olivenöl", "olivenoel", "sunflower oil", "sonnenblumenöl",
  "rapeseed oil", "rapsöl", "rapsoel", "oil", "öl", "vinegar", "essig",
  "soy sauce", "sojasoße", "sojasosse", "worcester", "ketchup jar",
  "mayonnaise jar", "sauce jar",
];
const NO_PFAND_CARTON = [
  "carton", "tetra", "tetra pak", "oat milk", "hafermilch", "soy milk",
  "sojamilch", "almond milk", "mandelmilch", "rice milk", "reismilch",
  "oatly", "alpro", "kokosmilch", "coconut milk",
  "juice carton", "saftkarton", "milchkarton", "milch karton",
  // Yoghurt/quark pots (no Pfand, gelbe Tonne)
  "yoghurt pot", "joghurt", "quark", "skyr",
];
const NO_PFAND_JAR = [
  "jam", "marmelade", "marmalade", "honey", "honig", "nutella", "spread jar",
  "pickle", "gurken", "cornichon", "olives jar", "kapern", "senf", "mustard",
  "pesto jar", "pasta sauce jar", "tomato sauce jar",
];

// ── Helper ────────────────────────────────────────────────────────────────────

function matchesAny(name: string, keywords: string[]): boolean {
  const lower = name.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function guessGlassColor(name: string): DisposalBin {
  const lower = name.toLowerCase();
  if (matchesAny(lower, ["weißwein", "weisswein", "white wine", "weiß", "weiss", "sekt", "prosecco", "champagne", "clear", "klar"]))
    return "altglas-weiss";
  if (matchesAny(lower, ["rotwein", "red wine", "rot", "braun", "brown"]))
    return "altglas-braun";
  // Default: green bin for mixed/unknown
  return "altglas-gruen";
}

const DISPOSAL_LABELS: Record<DisposalBin, string> = {
  pfandautomat: "Return to Pfandautomat",
  "altglas-weiss": "Altglas — white/clear bin",
  "altglas-braun": "Altglas — brown bin",
  "altglas-gruen": "Altglas — green bin",
  "gelbe-tonne": "Gelbe Tonne (yellow bin)",
  "blaue-tonne": "Blaue Tonne (blue bin)",
  restmuell: "Restmüll (grey bin)",
};

// ── Main export ───────────────────────────────────────────────────────────────

export function detectPfand(itemName: string): PfandResult {
  const name = itemName.trim();

  // 1. Crate first (highest value)
  if (matchesAny(name, CRATE_KEYWORDS)) {
    return {
      pfandType: "crate",
      deposit: 1.5,
      containerType: "Bottle crate",
      disposal: "pfandautomat",
      disposalLabel: DISPOSAL_LABELS.pfandautomat,
      note: "Return full crate to shop. Wooden crates may vary (€1.50–€5.00).",
    };
  }

  // 2. Carton / Tetra Pak → no Pfand
  if (matchesAny(name, NO_PFAND_CARTON)) {
    return {
      pfandType: "none",
      deposit: 0,
      containerType: "Carton / Tetra Pak",
      disposal: "gelbe-tonne",
      disposalLabel: DISPOSAL_LABELS["gelbe-tonne"],
    };
  }

  // 3. Wine / spirits → no Pfand, Altglas
  if (matchesAny(name, NO_PFAND_WINE) || matchesAny(name, NO_PFAND_SPIRITS)) {
    const bin = guessGlassColor(name);
    return {
      pfandType: "none",
      deposit: 0,
      containerType: "Glass bottle",
      disposal: bin,
      disposalLabel: DISPOSAL_LABELS[bin],
      note: "Remove lid before disposal. No glass before 8 AM.",
    };
  }

  // 4. Oil / sauce / jar → no Pfand, Altglas
  if (matchesAny(name, NO_PFAND_OIL_SAUCE) || matchesAny(name, NO_PFAND_JAR)) {
    return {
      pfandType: "none",
      deposit: 0,
      containerType: "Glass jar / bottle",
      disposal: "altglas-gruen",
      disposalLabel: DISPOSAL_LABELS["altglas-gruen"],
      note: "Remove metal lid → Gelbe Tonne. No glass before 8 AM.",
    };
  }

  // 5. Mehrweg refillable
  if (matchesAny(name, MEHRWEG_KEYWORDS)) {
    return {
      pfandType: "mehrweg",
      deposit: 0.08,
      containerType: "Mehrweg glass bottle",
      disposal: "pfandautomat",
      disposalLabel: DISPOSAL_LABELS.pfandautomat,
      note: "€0.08 standard; €0.15 if resealable cap.",
    };
  }

  // 6. Einweg (PET / can)
  if (matchesAny(name, EINWEG_KEYWORDS)) {
    return {
      pfandType: "einweg",
      deposit: 0.25,
      containerType: "PET bottle / aluminium can",
      disposal: "pfandautomat",
      disposalLabel: DISPOSAL_LABELS.pfandautomat,
      note: "Look for DPG logo to confirm.",
    };
  }

  // 7. Fallback — unknown
  return {
    pfandType: "none",
    deposit: 0,
    containerType: "Unknown",
    disposal: "restmuell",
    disposalLabel: DISPOSAL_LABELS.restmuell,
    note: "Could not determine container type — check packaging.",
  };
}

export function pfandBadgeLabel(result: PfandResult): string | null {
  if (result.pfandType === "none") return null;
  if (result.pfandType === "crate") return "🧺 €1.50";
  if (result.pfandType === "mehrweg") return "♻️ €0.08";
  return "♻️ €0.25";
}

export function disposalEmoji(bin: DisposalBin): string {
  const map: Record<DisposalBin, string> = {
    pfandautomat: "🔄",
    "altglas-weiss": "⬜",
    "altglas-braun": "🟫",
    "altglas-gruen": "🟩",
    "gelbe-tonne": "🟡",
    "blaue-tonne": "🔵",
    restmuell: "⬛",
  };
  return map[bin];
}
