/**
 * Canonical equipment library.
 * Each item has bilingual labels, a category, and a path to its image in /public/equipment/.
 * Categories: cookware | appliance | hand_tool | prep | bakeware | specialty
 */

export type EquipmentCategory = "cookware" | "appliance" | "hand_tool" | "prep" | "bakeware" | "specialty";

export type EquipmentItem = {
  name_en: string;
  name_de: string;
  category: EquipmentCategory;
  image: string; // relative to /public, e.g. /equipment/wok.png
  synonyms: string[];
};

export const EQUIPMENT_LIBRARY: EquipmentItem[] = [
  // ─── COOKWARE ────────────────────────────────────────────────────────────────
  {
    name_en: "Wok",
    name_de: "Wok",
    category: "cookware",
    image: "/equipment/wok.png",
    synonyms: ["chinese wok"],
  },
  {
    name_en: "Skillet",
    name_de: "Pfanne",
    category: "cookware",
    image: "/equipment/skillet.png",
    synonyms: ["frying pan", "skillet pan", "saute pan", "sautee pan"],
  },
  {
    name_en: "Saucepan / Pot",
    name_de: "Kochtopf",
    category: "cookware",
    image: "/equipment/saucepan-pot.png",
    synonyms: ["saucepan", "pot", "boiling pot", "cooking pot"],
  },
  {
    name_en: "Stockpot",
    name_de: "Suppentopf",
    category: "cookware",
    image: "/equipment/stockpot.png",
    synonyms: ["stock pot", "large pot", "soup pot"],
  },
  {
    name_en: "Dutch Oven",
    name_de: "Schmortopf",
    category: "cookware",
    image: "/equipment/dutch-oven.png",
    synonyms: ["dutch oven", "casserole dish", "braiser"],
  },
  {
    name_en: "Pressure Cooker",
    name_de: "Schnellkochtopf",
    category: "cookware",
    image: "/equipment/pressure-cooker.png",
    synonyms: ["pressure cooker", "instant pot", "instapot"],
  },
  {
    name_en: "Tawa",
    name_de: "Tawa",
    category: "cookware",
    image: "/equipment/tawa.png",
    synonyms: ["tava", "griddle", "flat pan", "chapati pan"],
  },
  {
    name_en: "Kadai / Deep Fry Pan",
    name_de: "Kadai / Frittiertiegel",
    category: "cookware",
    image: "/equipment/kadai-deep-fry-pan.png",
    synonyms: ["kadai", "karahi", "deep fry pan", "deep-fry pan", "shallow fry pan", "karahi"],
  },
  {
    name_en: "Grill Pan",
    name_de: "Grillpfanne",
    category: "cookware",
    image: "/equipment/grill-pan.png",
    synonyms: ["grill pan", "griddle pan", "ridged pan"],
  },
  {
    name_en: "Crepe Pan",
    name_de: "Crêpepfanne",
    category: "cookware",
    image: "/equipment/crepe-pan.jpg",
    synonyms: ["crepe pan", "crêpe pan", "dosa pan"],
  },
  {
    name_en: "Tempering Pan",
    name_de: "Temperierpfanne",
    category: "cookware",
    image: "/equipment/tempering-pan.png",
    synonyms: ["tadka pan", "tempering pan", "seasoning pan"],
  },
  {
    name_en: "Tagine",
    name_de: "Tajine",
    category: "cookware",
    image: "/equipment/tagine.jpg",
    synonyms: ["tagine", "tajine", "moroccan pot"],
  },

  // ─── APPLIANCE ───────────────────────────────────────────────────────────────
  {
    name_en: "Cooktop",
    name_de: "Kochfeld",
    category: "appliance",
    image: "/equipment/cooktop.png",
    synonyms: ["cooktop", "stove", "stovetop", "hob", "burner", "gas stove", "induction", "induction cooktop", "range"],
  },
  {
    name_en: "Microwave",
    name_de: "Mikrowelle",
    category: "appliance",
    image: "/equipment/microwave.png",
    synonyms: ["microwave", "microwave oven"],
  },
  {
    name_en: "Oven",
    name_de: "Backofen",
    category: "appliance",
    image: "/equipment/oven.png",
    synonyms: ["oven", "electric oven", "conventional oven"],
  },
  {
    name_en: "Air Fryer",
    name_de: "Heißluftfritteuse",
    category: "appliance",
    image: "/equipment/airfryer.png",
    synonyms: ["air fryer", "airfryer", "air frier"],
  },
  {
    name_en: "Mixer Grinder",
    name_de: "Mixer",
    category: "appliance",
    image: "/equipment/mixer-grinder.png",
    synonyms: ["mixer grinder", "mixie", "grinder", "blender jar"],
  },
  {
    name_en: "Hand Blender",
    name_de: "Stabmixer",
    category: "appliance",
    image: "/equipment/hand-blender.png",
    synonyms: ["hand blender", "immersion blender", "stick blender"],
  },
  {
    name_en: "Stand Mixer",
    name_de: "Küchenmaschine",
    category: "appliance",
    image: "/equipment/standmixer-for-baking.png",
    synonyms: ["stand mixer", "kitchen mixer", "kitchenaid"],
  },
  {
    name_en: "Food Processor",
    name_de: "Küchenmaschine",
    category: "appliance",
    image: "/equipment/food-processor.png",
    synonyms: ["food processor", "chopper"],
  },
  {
    name_en: "Wet Grinder",
    name_de: "Nassmühle",
    category: "appliance",
    image: "/equipment/wet-grinder.png",
    synonyms: ["wet grinder", "stone grinder", "table top grinder"],
  },
  {
    name_en: "Rice Cooker",
    name_de: "Reiskocher",
    category: "appliance",
    image: "/equipment/rice-cooker.png",
    synonyms: ["rice cooker", "electric rice cooker"],
  },
  {
    name_en: "Steamer",
    name_de: "Dampfgarer",
    category: "appliance",
    image: "/equipment/steamer.png",
    synonyms: ["steamer", "steam cooker", "idli steamer", "electric steamer"],
  },
  {
    name_en: "Electric Kettle",
    name_de: "Wasserkocher",
    category: "appliance",
    image: "/equipment/electric-kettle.png",
    synonyms: ["electric kettle", "kettle"],
  },

  // ─── HAND TOOL ───────────────────────────────────────────────────────────────
  {
    name_en: "Chef's Knife",
    name_de: "Kochmesser",
    category: "hand_tool",
    image: "/equipment/chefs-knife.png",
    synonyms: ["chef knife", "chefs knife", "cook's knife"],
  },
  {
    name_en: "Bread Knife",
    name_de: "Brotmesser",
    category: "hand_tool",
    image: "/equipment/bread-knife.png",
    synonyms: ["bread knife", "serrated knife"],
  },
  {
    name_en: "Paring Knife",
    name_de: "Schälmesser",
    category: "hand_tool",
    image: "/equipment/paring-knife.png",
    synonyms: ["paring knife", "small knife", "peeling knife"],
  },
  {
    name_en: "Whisk",
    name_de: "Schneebesen",
    category: "hand_tool",
    image: "/equipment/wisk.png",
    synonyms: ["whisk", "balloon whisk", "hand whisk"],
  },
  {
    name_en: "Spatula / Ladle",
    name_de: "Spatel / Schöpfkelle",
    category: "hand_tool",
    image: "/equipment/spatula-laddle.png",
    synonyms: ["spatula", "ladle", "wooden spoon", "stirring spoon", "turner"],
  },
  {
    name_en: "Rolling Pin",
    name_de: "Nudelholz",
    category: "hand_tool",
    image: "/equipment/rolling-pin.png",
    synonyms: ["rolling pin", "chapati roller", "belan"],
  },
  {
    name_en: "Tongs",
    name_de: "Zange",
    category: "hand_tool",
    image: "/equipment/tongs.png",
    synonyms: ["tongs", "kitchen tongs", "grill tongs"],
  },
  {
    name_en: "Box Grater",
    name_de: "Kastenreibe",
    category: "hand_tool",
    image: "/equipment/box-grater.png",
    synonyms: ["box grater", "grater", "cheese grater"],
  },
  {
    name_en: "Peeler",
    name_de: "Sparschäler",
    category: "hand_tool",
    image: "/equipment/peeler.png",
    synonyms: ["peeler", "vegetable peeler", "potato peeler"],
  },
  {
    name_en: "Masher",
    name_de: "Kartoffelstampfer",
    category: "hand_tool",
    image: "/equipment/masher.png",
    synonyms: ["masher", "potato masher"],
  },
  {
    name_en: "Skimmer / Spider",
    name_de: "Schaumkelle / Spinne",
    category: "hand_tool",
    image: "/equipment/skimmer-spider.png",
    synonyms: ["skimmer", "spider strainer", "spider skimmer", "frying spider"],
  },
  {
    name_en: "Chopsticks",
    name_de: "Essstäbchen",
    category: "hand_tool",
    image: "/equipment/chopsticks.png",
    synonyms: ["chopsticks", "cooking chopsticks"],
  },
  {
    name_en: "Press",
    name_de: "Presse",
    category: "hand_tool",
    image: "/equipment/press.png",
    synonyms: ["tortilla press", "roti press", "chapati press", "press"],
  },

  // ─── PREP ────────────────────────────────────────────────────────────────────
  {
    name_en: "Mixing Bowls",
    name_de: "Rührschüsseln",
    category: "prep",
    image: "/equipment/mixing-bowls.png",
    synonyms: ["mixing bowl", "bowl", "large bowl", "salad bowl"],
  },
  {
    name_en: "Chopping Board",
    name_de: "Schneidebrett",
    category: "prep",
    image: "/equipment/chopping-board.png",
    synonyms: ["chopping board", "cutting board", "wooden board", "board"],
  },
  {
    name_en: "Sieve / Strainer",
    name_de: "Sieb",
    category: "prep",
    image: "/equipment/sieve.jpg",
    synonyms: ["strainer", "sieve", "colander", "fine mesh strainer", "filter"],
  },
  {
    name_en: "Mortar and Pestle",
    name_de: "Mörser und Stößel",
    category: "prep",
    image: "/equipment/mortar-and-pestle.png",
    synonyms: ["mortar", "pestle", "mortar and pestle", "ammi", "stone grinder"],
  },
  {
    name_en: "Kitchen Scale",
    name_de: "Küchenwaage",
    category: "prep",
    image: "/equipment/kitschen-scale.png",
    synonyms: ["kitchen scale", "food scale", "weighing scale"],
  },
  {
    name_en: "Measuring Cup & Spoon",
    name_de: "Messbecher & Messlöffel",
    category: "prep",
    image: "/equipment/measuring-cup-and-spoon.png",
    synonyms: ["measuring cup", "measuring spoon", "measuring cups", "measuring spoons"],
  },
  {
    name_en: "Spice Box",
    name_de: "Gewürzbox",
    category: "prep",
    image: "/equipment/spice-box.jpg",
    synonyms: ["spice box", "masala dabba", "spice tin"],
  },

  // ─── BAKEWARE ────────────────────────────────────────────────────────────────
  {
    name_en: "Loaf Pan",
    name_de: "Kastenform",
    category: "bakeware",
    image: "/equipment/loaf-pan.png",
    synonyms: ["loaf pan", "bread pan", "loaf tin"],
  },
  {
    name_en: "Round Pan",
    name_de: "Rundbackform",
    category: "bakeware",
    image: "/equipment/round-pan.png",
    synonyms: ["round pan", "cake tin", "round cake pan", "springform"],
  },
  {
    name_en: "Muffin Tin",
    name_de: "Muffinform",
    category: "bakeware",
    image: "/equipment/muffin-tin.png",
    synonyms: ["muffin tin", "cupcake tin", "muffin tray"],
  },
  {
    name_en: "Tart / Pie Dish",
    name_de: "Tart- / Pieform",
    category: "bakeware",
    image: "/equipment/tart-pie-dish.png",
    synonyms: ["tart dish", "pie dish", "pie tin", "tart tin"],
  },
  {
    name_en: "Ramekin",
    name_de: "Souffléförmchen",
    category: "bakeware",
    image: "/equipment/ramekin.png",
    synonyms: ["ramekin", "ramekins", "souffle dish"],
  },
  {
    name_en: "Piping Bag",
    name_de: "Spritzbeutel",
    category: "bakeware",
    image: "/equipment/piping-bag-with-tip.webp",
    synonyms: ["piping bag", "pastry bag", "icing bag", "piping tip", "round piping tip", "piping nozzle"],
  },
  {
    name_en: "Cooling Rack",
    name_de: "Kuchengitter",
    category: "bakeware",
    image: "/equipment/cooling-rack.png",
    synonyms: ["cooling rack", "wire rack", "baking rack"],
  },

  // ─── SPECIALTY ───────────────────────────────────────────────────────────────
  {
    name_en: "Idli Maker",
    name_de: "Idli-Form",
    category: "specialty",
    image: "/equipment/idli-maker.png",
    synonyms: ["idli maker", "idli stand", "idli mould", "idli pot"],
  },
  {
    name_en: "Appam Pan",
    name_de: "Appam-Pfanne",
    category: "specialty",
    image: "/equipment/appam-pan.png",
    synonyms: ["appam pan", "appa chatti", "string hopper pan"],
  },
  {
    name_en: "Kuzhi Paniyaram Pan",
    name_de: "Kuzhi-Paniyaram-Pfanne",
    category: "specialty",
    image: "/equipment/kuzhi-paniyaram-pan--takoyaki-pan.png",
    synonyms: ["kuzhi paniyaram pan", "takoyaki pan", "paniyaram pan", "appe pan", "æbleskiver pan"],
  },
  {
    name_en: "Tandoor",
    name_de: "Tandoor",
    category: "specialty",
    image: "/equipment/tandoor.jpg",
    synonyms: ["tandoor", "tandoor oven", "clay oven"],
  },
  {
    name_en: "Bamboo Steamer Basket",
    name_de: "Bambusdämpfkorb",
    category: "specialty",
    image: "/equipment/bamboo-steamer-basket.png",
    synonyms: ["bamboo steamer", "bamboo steamer basket", "dim sum steamer"],
  },
  {
    name_en: "Sushi Mat",
    name_de: "Sushimatte",
    category: "specialty",
    image: "/equipment/sushi-mat.webp",
    synonyms: ["sushi mat", "bamboo mat", "makisu"],
  },
  {
    name_en: "Fondue Pot",
    name_de: "Fonduetopf",
    category: "specialty",
    image: "/equipment/fondue-pot.png",
    synonyms: ["fondue pot", "fondue set"],
  },
  {
    name_en: "Skewers",
    name_de: "Spieße",
    category: "specialty",
    image: "/equipment/skewers.png",
    synonyms: ["skewer", "skewers", "satay sticks", "kebab sticks", "metal skewers", "bamboo skewers"],
  },
  {
    name_en: "Aluminium Foil",
    name_de: "Alufolie",
    category: "specialty",
    image: "/equipment/aluminium-foil.png",
    synonyms: ["aluminium foil", "aluminum foil", "foil", "tin foil"],
  },
  {
    name_en: "Parchment Paper",
    name_de: "Backpapier",
    category: "specialty",
    image: "/equipment/parchment-paper.png",
    synonyms: ["parchment paper", "parchment", "baking paper", "baking parchment", "baking sheet", "baking tray", "silicone mat", "silpat"],
  },
];

export const EQUIPMENT_CATEGORIES: { id: EquipmentCategory | "all"; label: string }[] = [
  { id: "all",       label: "All" },
  { id: "cookware",  label: "Cookware" },
  { id: "appliance", label: "Appliance" },
  { id: "hand_tool", label: "Hand Tool" },
  { id: "prep",      label: "Prep" },
  { id: "bakeware",  label: "Bakeware" },
  { id: "specialty", label: "Specialty" },
];

/**
 * Find the canonical equipment item that best matches a label string.
 * Used to look up the image for equipment stored in recipes.
 */
// Matches `phrase` inside `text` only at word boundaries, so "pot" does not match
// inside "stockpot" but "saute pan" matches inside "small saute pan".
function phraseInText(phrase: string, text: string): boolean {
  if (!phrase) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

export function findEquipmentItem(label: string): EquipmentItem | undefined {
  const lower = label.toLowerCase().trim();
  if (!lower) return undefined;

  // 1) Exact name / synonym match.
  const exact = EQUIPMENT_LIBRARY.find(
    (e) =>
      e.name_en.toLowerCase() === lower ||
      e.name_de.toLowerCase() === lower ||
      e.synonyms.some((s) => s.toLowerCase() === lower),
  );
  if (exact) return exact;

  // 2) Label is MORE specific than a canonical phrase — the phrase appears inside
  //    the label at a word boundary. "Small saute pan" → "saute pan";
  //    "Knife and board" → "knife and board". When several match, the longest
  //    (most specific) phrase wins, so "tadka pan" beats a generic "pan".
  let best: EquipmentItem | undefined;
  let bestLen = 0;
  for (const e of EQUIPMENT_LIBRARY) {
    const phrases = [e.name_en.toLowerCase(), ...e.synonyms.map((s) => s.toLowerCase())];
    for (const p of phrases) {
      if (phraseInText(p, lower) && p.length > bestLen) {
        best = e;
        bestLen = p.length;
      }
    }
  }
  if (best) return best;

  // 3) Label is a generic partial that appears inside a canonical phrase —
  //    "Blender" → "hand blender", "Pan" → "frying pan". First library match wins.
  return EQUIPMENT_LIBRARY.find(
    (e) =>
      phraseInText(lower, e.name_en.toLowerCase()) ||
      e.synonyms.some((s) => phraseInText(lower, s.toLowerCase())),
  );
}

// Resolves an equipment label into one OR MORE library items. Combined labels
// such as "Knife and board" or "Pan & lid" are split on connectors and each
// part is matched separately, so they render as distinct icons. Falls back to
// a single whole-label match when the split doesn't yield 2+ distinct items.
export function resolveEquipmentItems(label: string): EquipmentItem[] {
  const parts = label
    .split(/\s*(?:,|\+|&|\/|\band\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    const matched = parts
      .map((p) => findEquipmentItem(p))
      .filter((m): m is EquipmentItem => Boolean(m));
    const distinct = [...new Map(matched.map((m) => [m.name_en, m])).values()];
    if (distinct.length > 1) return distinct;
  }

  const whole = findEquipmentItem(label);
  return whole ? [whole] : [];
}
