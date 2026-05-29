/**
 * Pantry item lookup table — v1.0.0
 * Maps category → item → expiry defaults, opened-state expiry, Pfand, packaging.
 *
 * Used for:
 *  - Auto-suggesting item names when a category is selected in the add form
 *  - Auto-filling expiry date when a known item is selected
 *  - Calculating "opened expiry" when user marks an item as opened
 *  - Driving Pfand detection for beverages (more accurate than keyword-only)
 */

export interface PantryItemDef {
  name: string;
  /** Days until expiry from purchase (sealed / unopened) */
  expiryDays: number;
  /** Days until expiry once opened — only for categories with hasOpenedState */
  openedExpiryDays?: number;
  /** Pfand deposit in € — null means no deposit */
  pfand?: number | null;
  /** Packaging type label, mainly for beverages */
  packaging?: string;
  /** Sub-group label for grouped display (beverages) */
  subgroup?: string;
}

export interface PantryCategory {
  id: string;
  label: string;
  emoji: string;
  defaultUnit: string;
  /** Whether items in this category can be "opened" (triggers opened-expiry countdown) */
  hasOpenedState: boolean;
  /** Whether items may carry a German Pfand deposit */
  hasPfand: boolean;
  defaultExpiryDays: number;
  defaultOpenedExpiryDays?: number;
  items: PantryItemDef[];
}

export const PANTRY_CATEGORIES: PantryCategory[] = [
  {
    id: "produce", label: "Produce", emoji: "🥕",
    defaultUnit: "no.", hasOpenedState: false, hasPfand: false,
    defaultExpiryDays: 5,
    items: [
      { name: "Tomato (round/oval)",     expiryDays: 7  },
      { name: "Tomato (cherry/cocktail)",expiryDays: 4  },
      { name: "Onion",                   expiryDays: 14 },
      { name: "Onion (spring)",          expiryDays: 5  },
      { name: "Garlic",                  expiryDays: 30 },
      { name: "Potato",                  expiryDays: 30 },
      { name: "Sweet potato",            expiryDays: 21 },
      { name: "Carrot",                  expiryDays: 21 },
      { name: "Cucumber",                expiryDays: 7  },
      { name: "Zucchini",                expiryDays: 7  },
      { name: "Bell pepper",             expiryDays: 7  },
      { name: "Chili pepper",            expiryDays: 7  },
      { name: "Broccoli",                expiryDays: 5  },
      { name: "Cauliflower",             expiryDays: 5  },
      { name: "Cabbage",                 expiryDays: 14 },
      { name: "Lettuce",                 expiryDays: 4  },
      { name: "Spinach",                 expiryDays: 4  },
      { name: "Kale",                    expiryDays: 5  },
      { name: "Celery",                  expiryDays: 10 },
      { name: "Leek",                    expiryDays: 10 },
      { name: "Mushroom",                expiryDays: 5  },
      { name: "Apple",                   expiryDays: 21 },
      { name: "Banana",                  expiryDays: 5  },
      { name: "Strawberry",              expiryDays: 3  },
      { name: "Blueberry",               expiryDays: 5  },
      { name: "Raspberry",               expiryDays: 3  },
      { name: "Grape",                   expiryDays: 7  },
      { name: "Orange",                  expiryDays: 14 },
      { name: "Lemon",                   expiryDays: 14 },
      { name: "Lime",                    expiryDays: 14 },
      { name: "Mango",                   expiryDays: 5  },
      { name: "Avocado",                 expiryDays: 4  },
      { name: "Pear",                    expiryDays: 7  },
      { name: "Peach",                   expiryDays: 5  },
      { name: "Pineapple",               expiryDays: 5  },
      { name: "Watermelon (whole)",      expiryDays: 14 },
      { name: "Watermelon (cut)",        expiryDays: 4  },
      { name: "Corn",                    expiryDays: 3  },
      { name: "Eggplant",                expiryDays: 7  },
      { name: "Asparagus",               expiryDays: 4  },
      { name: "Beetroot",                expiryDays: 21 },
      { name: "Radish",                  expiryDays: 7  },
    ],
  },
  {
    id: "fresh-herbs", label: "Fresh herbs", emoji: "🌿",
    defaultUnit: "no.", hasOpenedState: false, hasPfand: false,
    defaultExpiryDays: 4,
    items: [
      { name: "Basil",              expiryDays: 3  },
      { name: "Parsley",            expiryDays: 5  },
      { name: "Coriander",          expiryDays: 4  },
      { name: "Mint",               expiryDays: 5  },
      { name: "Rosemary",           expiryDays: 10 },
      { name: "Thyme",              expiryDays: 10 },
      { name: "Dill",               expiryDays: 4  },
      { name: "Chives",             expiryDays: 7  },
      { name: "Sage",               expiryDays: 10 },
      { name: "Bay leaves (fresh)", expiryDays: 7  },
    ],
  },
  {
    id: "dairy", label: "Dairy", emoji: "🥛",
    defaultUnit: "ml", hasOpenedState: true, hasPfand: false,
    defaultExpiryDays: 7, defaultOpenedExpiryDays: 5,
    items: [
      { name: "Milk",              expiryDays: 7,  openedExpiryDays: 5  },
      { name: "Cream",             expiryDays: 7,  openedExpiryDays: 3  },
      { name: "Sour cream",        expiryDays: 14, openedExpiryDays: 7  },
      { name: "Yogurt",            expiryDays: 14, openedExpiryDays: 5  },
      { name: "Butter",            expiryDays: 30, openedExpiryDays: 14 },
      { name: "Cream cheese",      expiryDays: 14, openedExpiryDays: 7  },
      { name: "Cheese (soft)",     expiryDays: 10, openedExpiryDays: 5  },
      { name: "Cheese (hard)",     expiryDays: 30, openedExpiryDays: 21 },
      { name: "Mozzarella (fresh)",expiryDays: 7,  openedExpiryDays: 3  },
    ],
  },
  {
    id: "eggs", label: "Eggs", emoji: "🥚",
    defaultUnit: "no.", hasOpenedState: false, hasPfand: false,
    defaultExpiryDays: 21,
    items: [{ name: "Eggs", expiryDays: 21 }],
  },
  {
    id: "meat", label: "Meat", emoji: "🥩",
    defaultUnit: "g", hasOpenedState: false, hasPfand: false,
    defaultExpiryDays: 3,
    items: [
      { name: "Chicken (raw)",      expiryDays: 2 },
      { name: "Beef (raw)",         expiryDays: 3 },
      { name: "Pork (raw)",         expiryDays: 3 },
      { name: "Lamb (raw)",         expiryDays: 3 },
      { name: "Mince (raw)",        expiryDays: 2 },
      { name: "Sausage (raw)",      expiryDays: 3 },
      { name: "Cooked meat",        expiryDays: 4 },
      { name: "Deli meat (opened)", expiryDays: 5 },
    ],
  },
  {
    id: "fish-seafood", label: "Fish & seafood", emoji: "🐟",
    defaultUnit: "g", hasOpenedState: false, hasPfand: false,
    defaultExpiryDays: 2,
    items: [
      { name: "Fresh fish",   expiryDays: 2 },
      { name: "Shrimp (raw)", expiryDays: 2 },
      { name: "Salmon (raw)", expiryDays: 2 },
      { name: "Smoked fish",  expiryDays: 7 },
      { name: "Cooked fish",  expiryDays: 3 },
    ],
  },
  {
    id: "spices", label: "Spices", emoji: "🧂",
    defaultUnit: "g", hasOpenedState: false, hasPfand: false,
    defaultExpiryDays: 365,
    items: [
      { name: "Ground spices", expiryDays: 365  },
      { name: "Whole spices",  expiryDays: 730  },
      { name: "Dried herbs",   expiryDays: 365  },
      { name: "Salt",          expiryDays: 1825 },
      { name: "Black pepper",  expiryDays: 730  },
      { name: "Chili powder",  expiryDays: 365  },
      { name: "Cumin",         expiryDays: 365  },
      { name: "Paprika",       expiryDays: 365  },
      { name: "Turmeric",      expiryDays: 365  },
      { name: "Cinnamon",      expiryDays: 365  },
    ],
  },
  {
    id: "grains-pulses", label: "Grains & pulses", emoji: "🌾",
    defaultUnit: "g", hasOpenedState: false, hasPfand: false,
    defaultExpiryDays: 365,
    items: [
      { name: "Rice (white)",        expiryDays: 730 },
      { name: "Rice (brown)",        expiryDays: 180 },
      { name: "Pasta (dry)",         expiryDays: 730 },
      { name: "Flour (white)",       expiryDays: 365 },
      { name: "Flour (whole wheat)", expiryDays: 180 },
      { name: "Oats",                expiryDays: 365 },
      { name: "Lentils (dry)",       expiryDays: 730 },
      { name: "Chickpeas (dry)",     expiryDays: 730 },
      { name: "Kidney beans (dry)",  expiryDays: 730 },
      { name: "Quinoa",              expiryDays: 365 },
      { name: "Breadcrumbs",         expiryDays: 180 },
      { name: "Couscous",            expiryDays: 365 },
    ],
  },
  {
    id: "nuts-seeds", label: "Nuts & seeds", emoji: "🥜",
    defaultUnit: "g", hasOpenedState: true, hasPfand: false,
    defaultExpiryDays: 180, defaultOpenedExpiryDays: 60,
    items: [
      { name: "Almonds",         expiryDays: 180, openedExpiryDays: 90  },
      { name: "Walnuts",         expiryDays: 180, openedExpiryDays: 60  },
      { name: "Cashews",         expiryDays: 180, openedExpiryDays: 60  },
      { name: "Peanuts",         expiryDays: 180, openedExpiryDays: 60  },
      { name: "Pine nuts",       expiryDays: 90,  openedExpiryDays: 30  },
      { name: "Sesame seeds",    expiryDays: 180, openedExpiryDays: 90  },
      { name: "Sunflower seeds", expiryDays: 180, openedExpiryDays: 90  },
      { name: "Chia seeds",      expiryDays: 365, openedExpiryDays: 180 },
      { name: "Flaxseeds",       expiryDays: 180, openedExpiryDays: 60  },
    ],
  },
  {
    id: "canned-dried", label: "Canned & dried", emoji: "🥫",
    defaultUnit: "no.", hasOpenedState: true, hasPfand: false,
    defaultExpiryDays: 730, defaultOpenedExpiryDays: 4,
    items: [
      { name: "Canned tomatoes", expiryDays: 730, openedExpiryDays: 4  },
      { name: "Canned beans",    expiryDays: 730, openedExpiryDays: 4  },
      { name: "Canned tuna",     expiryDays: 730, openedExpiryDays: 2  },
      { name: "Canned corn",     expiryDays: 730, openedExpiryDays: 4  },
      { name: "Canned soup",     expiryDays: 730, openedExpiryDays: 3  },
      { name: "Coconut milk",    expiryDays: 730, openedExpiryDays: 5  },
      { name: "Dried fruit",     expiryDays: 180, openedExpiryDays: 90 },
    ],
  },
  {
    id: "bakery", label: "Bakery", emoji: "🍞",
    defaultUnit: "no.", hasOpenedState: false, hasPfand: false,
    defaultExpiryDays: 5,
    items: [
      { name: "Bread (sliced)",    expiryDays: 5 },
      { name: "Bread (whole loaf)",expiryDays: 7 },
      { name: "Croissant",         expiryDays: 2 },
      { name: "Pita bread",        expiryDays: 5 },
      { name: "Tortilla wrap",     expiryDays: 7 },
      { name: "Bagel",             expiryDays: 5 },
    ],
  },
  {
    id: "sauces-pastes", label: "Sauces & pastes", emoji: "🫙",
    defaultUnit: "g", hasOpenedState: true, hasPfand: false,
    defaultExpiryDays: 365, defaultOpenedExpiryDays: 14,
    items: [
      { name: "Tomato sauce",  expiryDays: 730,  openedExpiryDays: 7    },
      { name: "Tomato paste",  expiryDays: 730,  openedExpiryDays: 5    },
      { name: "Pesto",         expiryDays: 180,  openedExpiryDays: 7    },
      { name: "Ketchup",       expiryDays: 365,  openedExpiryDays: 30   },
      { name: "Mayonnaise",    expiryDays: 180,  openedExpiryDays: 60   },
      { name: "Mustard",       expiryDays: 365,  openedExpiryDays: 60   },
      { name: "Soy sauce",     expiryDays: 730,  openedExpiryDays: 30   },
      { name: "Hot sauce",     expiryDays: 730,  openedExpiryDays: 180  },
      { name: "Tahini",        expiryDays: 365,  openedExpiryDays: 30   },
      { name: "Peanut butter", expiryDays: 365,  openedExpiryDays: 90   },
      { name: "Jam",           expiryDays: 365,  openedExpiryDays: 30   },
      { name: "Honey",         expiryDays: 1825, openedExpiryDays: 1825 },
    ],
  },
  {
    id: "oils", label: "Oils", emoji: "🫒",
    defaultUnit: "ml", hasOpenedState: true, hasPfand: false,
    defaultExpiryDays: 365, defaultOpenedExpiryDays: 90,
    items: [
      { name: "Olive oil",        expiryDays: 365,  openedExpiryDays: 60   },
      { name: "Vegetable oil",    expiryDays: 365,  openedExpiryDays: 90   },
      { name: "Coconut oil",      expiryDays: 730,  openedExpiryDays: 180  },
      { name: "Sesame oil",       expiryDays: 180,  openedExpiryDays: 45   },
      { name: "Vinegar",          expiryDays: 1825, openedExpiryDays: 1825 },
      { name: "Balsamic vinegar", expiryDays: 1825, openedExpiryDays: 1825 },
    ],
  },
  {
    id: "frozen", label: "Frozen", emoji: "🧊",
    defaultUnit: "g", hasOpenedState: false, hasPfand: false,
    defaultExpiryDays: 90,
    items: [
      { name: "Frozen vegetables",  expiryDays: 180 },
      { name: "Frozen meat",        expiryDays: 90  },
      { name: "Frozen fish",        expiryDays: 90  },
      { name: "Frozen fruit",       expiryDays: 180 },
      { name: "Ice cream",          expiryDays: 60  },
      { name: "Frozen bread/dough", expiryDays: 60  },
      { name: "Frozen meals",       expiryDays: 90  },
    ],
  },
  {
    id: "beverages", label: "Beverages", emoji: "🧃",
    defaultUnit: "ml", hasOpenedState: true, hasPfand: true,
    defaultExpiryDays: 180, defaultOpenedExpiryDays: 3,
    items: [
      // Water
      { name: "Still water (PET)",        expiryDays: 365, openedExpiryDays: 1, pfand: 0.25, packaging: "PET",     subgroup: "Water" },
      { name: "Still water (glass)",      expiryDays: 365, openedExpiryDays: 1, pfand: 0.15, packaging: "glass",   subgroup: "Water" },
      { name: "Sparkling water (PET)",    expiryDays: 365, openedExpiryDays: 1, pfand: 0.25, packaging: "PET",     subgroup: "Water" },
      { name: "Sparkling water (glass)",  expiryDays: 365, openedExpiryDays: 1, pfand: 0.15, packaging: "glass",   subgroup: "Water" },
      { name: "Sparkling water (Mehrweg)",expiryDays: 365, openedExpiryDays: 1, pfand: 0.08, packaging: "Mehrweg", subgroup: "Water" },
      { name: "Flavoured water (PET)",    expiryDays: 180, openedExpiryDays: 1, pfand: 0.25, packaging: "PET",     subgroup: "Water" },
      // Juice & soft drinks
      { name: "Juice (carton)",           expiryDays: 180, openedExpiryDays: 5, pfand: null,  packaging: "carton", subgroup: "Juice & soft drinks" },
      { name: "Juice (PET)",              expiryDays: 180, openedExpiryDays: 5, pfand: 0.25,  packaging: "PET",    subgroup: "Juice & soft drinks" },
      { name: "Juice (glass bottle)",     expiryDays: 180, openedExpiryDays: 5, pfand: 0.15,  packaging: "glass",  subgroup: "Juice & soft drinks" },
      { name: "Smoothie (bottle)",        expiryDays: 7,   openedExpiryDays: 2, pfand: 0.25,  packaging: "PET",    subgroup: "Juice & soft drinks" },
      { name: "Soft drink (can)",         expiryDays: 180, openedExpiryDays: 1, pfand: 0.25,  packaging: "can",    subgroup: "Juice & soft drinks" },
      { name: "Soft drink (PET)",         expiryDays: 180, openedExpiryDays: 2, pfand: 0.25,  packaging: "PET",    subgroup: "Juice & soft drinks" },
      { name: "Energy drink (can)",       expiryDays: 365, openedExpiryDays: 1, pfand: 0.25,  packaging: "can",    subgroup: "Juice & soft drinks" },
      { name: "Energy drink (PET)",       expiryDays: 365, openedExpiryDays: 1, pfand: 0.25,  packaging: "PET",    subgroup: "Juice & soft drinks" },
      { name: "Iced tea (PET)",           expiryDays: 180, openedExpiryDays: 2, pfand: 0.25,  packaging: "PET",    subgroup: "Juice & soft drinks" },
      { name: "Iced tea (can)",           expiryDays: 180, openedExpiryDays: 1, pfand: 0.25,  packaging: "can",    subgroup: "Juice & soft drinks" },
      { name: "Lemonade (PET)",           expiryDays: 180, openedExpiryDays: 2, pfand: 0.25,  packaging: "PET",    subgroup: "Juice & soft drinks" },
      { name: "Tonic water (can)",        expiryDays: 180, openedExpiryDays: 1, pfand: 0.25,  packaging: "can",    subgroup: "Juice & soft drinks" },
      { name: "Sports drink (PET)",       expiryDays: 180, openedExpiryDays: 1, pfand: 0.25,  packaging: "PET",    subgroup: "Juice & soft drinks" },
      // Beer
      { name: "Beer (can)",                  expiryDays: 180, openedExpiryDays: 1, pfand: 0.25, packaging: "can",    subgroup: "Beer" },
      { name: "Beer (Einweg bottle)",        expiryDays: 180, openedExpiryDays: 1, pfand: 0.25, packaging: "Einweg", subgroup: "Beer" },
      { name: "Beer (Mehrweg bottle)",       expiryDays: 180, openedExpiryDays: 1, pfand: 0.08, packaging: "Mehrweg",subgroup: "Beer" },
      { name: "Beer (Mehrweg crate)",        expiryDays: 180, openedExpiryDays: 1, pfand: 0.08, packaging: "Mehrweg",subgroup: "Beer" },
      { name: "Non-alcoholic beer (can)",    expiryDays: 180, openedExpiryDays: 1, pfand: 0.25, packaging: "can",    subgroup: "Beer" },
      { name: "Non-alcoholic beer (bottle)", expiryDays: 180, openedExpiryDays: 1, pfand: 0.08, packaging: "Mehrweg",subgroup: "Beer" },
      { name: "Radler (can)",                expiryDays: 180, openedExpiryDays: 1, pfand: 0.25, packaging: "can",    subgroup: "Beer" },
      { name: "Radler (bottle)",             expiryDays: 180, openedExpiryDays: 1, pfand: 0.08, packaging: "Mehrweg",subgroup: "Beer" },
      // Wine & spirits
      { name: "Wine (bottle)",     expiryDays: 730,  openedExpiryDays: 3,   pfand: null, packaging: "glass",  subgroup: "Wine & spirits" },
      { name: "Wine (carton/bag)", expiryDays: 365,  openedExpiryDays: 14,  pfand: null, packaging: "carton", subgroup: "Wine & spirits" },
      { name: "Sparkling wine",    expiryDays: 730,  openedExpiryDays: 1,   pfand: null, packaging: "glass",  subgroup: "Wine & spirits" },
      { name: "Spirits (bottle)",  expiryDays: 1825, openedExpiryDays: 365, pfand: null, packaging: "glass",  subgroup: "Wine & spirits" },
      { name: "Liqueur (bottle)",  expiryDays: 730,  openedExpiryDays: 180, pfand: null, packaging: "glass",  subgroup: "Wine & spirits" },
      // Milk-based & cold drinks
      { name: "Milk (carton)",            expiryDays: 7,   openedExpiryDays: 3, pfand: null, packaging: "carton",  subgroup: "Milk-based & cold drinks" },
      { name: "Milk (glass bottle)",      expiryDays: 7,   openedExpiryDays: 3, pfand: 0.08, packaging: "Mehrweg", subgroup: "Milk-based & cold drinks" },
      { name: "Oat/almond milk (carton)", expiryDays: 7,   openedExpiryDays: 4, pfand: null, packaging: "carton",  subgroup: "Milk-based & cold drinks" },
      { name: "Chocolate milk (carton)",  expiryDays: 7,   openedExpiryDays: 3, pfand: null, packaging: "carton",  subgroup: "Milk-based & cold drinks" },
      { name: "Kefir (bottle)",           expiryDays: 14,  openedExpiryDays: 5, pfand: null, packaging: "bottle",  subgroup: "Milk-based & cold drinks" },
      { name: "Coconut water (carton)",   expiryDays: 180, openedExpiryDays: 2, pfand: null, packaging: "carton",  subgroup: "Milk-based & cold drinks" },
      // Hot drinks
      { name: "Coffee beans (bag)",    expiryDays: 180, openedExpiryDays: 30,  pfand: null, packaging: "bag", subgroup: "Hot drinks" },
      { name: "Ground coffee (bag)",   expiryDays: 180, openedExpiryDays: 21,  pfand: null, packaging: "bag", subgroup: "Hot drinks" },
      { name: "Instant coffee (jar)",  expiryDays: 730, openedExpiryDays: 90,  pfand: null, packaging: "jar", subgroup: "Hot drinks" },
      { name: "Tea bags (box)",        expiryDays: 730, openedExpiryDays: 180, pfand: null, packaging: "box", subgroup: "Hot drinks" },
      { name: "Loose leaf tea (tin)",  expiryDays: 730, openedExpiryDays: 180, pfand: null, packaging: "tin", subgroup: "Hot drinks" },
      { name: "Hot chocolate powder",  expiryDays: 365, openedExpiryDays: 90,  pfand: null, packaging: "bag", subgroup: "Hot drinks" },
    ],
  },
  {
    id: "other", label: "Other", emoji: "🛒",
    defaultUnit: "no.", hasOpenedState: false, hasPfand: false,
    defaultExpiryDays: 30,
    items: [],
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

/** Map from category id → category config */
export const CATEGORY_MAP: Record<string, PantryCategory> = Object.fromEntries(
  PANTRY_CATEGORIES.map((c) => [c.id, c])
);

/** Find an item definition by category id + item name (case-insensitive) */
export function lookupItem(categoryId: string, name: string): PantryItemDef | undefined {
  const cat = CATEGORY_MAP[categoryId];
  if (!cat) return undefined;
  const lower = name.toLowerCase();
  return cat.items.find((i) => i.name.toLowerCase() === lower);
}

/** Get all item names for a category (for datalist autocomplete) */
export function itemNamesForCategory(categoryId: string): string[] {
  return CATEGORY_MAP[categoryId]?.items.map((i) => i.name) ?? [];
}

/**
 * Calculate the expiry date string (YYYY-MM-DD) from today + days.
 * Returns empty string if days is 0 or undefined.
 */
export function expiryDateFromDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Given a category + name, return the recommended expiry date from today.
 * Falls back to category default if item not found.
 */
export function suggestExpiryDate(categoryId: string, name: string): string {
  const item = lookupItem(categoryId, name);
  const cat  = CATEGORY_MAP[categoryId];
  const days = item?.expiryDays ?? cat?.defaultExpiryDays ?? 7;
  return expiryDateFromDays(days);
}

/**
 * Given a category + name, return the "opened" expiry date from today.
 * Returns undefined if category doesn't have opened state.
 */
export function suggestOpenedExpiryDate(categoryId: string, name: string): string | undefined {
  const cat = CATEGORY_MAP[categoryId];
  if (!cat?.hasOpenedState) return undefined;
  const item = lookupItem(categoryId, name);
  const days = item?.openedExpiryDays ?? cat.defaultOpenedExpiryDays ?? 3;
  return expiryDateFromDays(days);
}

/**
 * Pfand amount for a named beverage item.
 * Returns null if no Pfand.
 */
export function lookupPfandAmount(categoryId: string, name: string): number | null {
  if (categoryId !== "beverages") return null;
  const item = lookupItem(categoryId, name);
  return item?.pfand ?? null;
}
