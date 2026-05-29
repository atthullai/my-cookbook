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
  openedExpiryDays?: number | null;
  /** Days until expiry when frozen — null means item should not be frozen */
  freezerExpiryDays?: number | null;
  /** Pfand deposit in € — null means no deposit */
  pfand?: number | null;
  /** Packaging type label, mainly for beverages */
  packaging?: string;
  /** Sub-group label for grouped display (beverages / homemade) */
  subgroup?: string;
  /** Storage tip shown in the form when item is recognised */
  tip?: string;
  /** Preferred storage location for this item */
  defaultStorage?: "fridge" | "freezer" | "room-temp";
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
  // ── Homemade ──────────────────────────────────────────────────────────────
  {
    id: "homemade", label: "Homemade", emoji: "🏠",
    defaultUnit: "g", hasOpenedState: true, hasPfand: false,
    defaultExpiryDays: 5, defaultOpenedExpiryDays: 3,
    items: [
      // Pastes & purees
      { name: "Ginger garlic paste",     expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Add a thin layer of oil on top to extend shelf life" },
      { name: "Ginger paste",            expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Store in airtight glass jar" },
      { name: "Garlic paste",            expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Add a few drops of oil or lemon juice to preserve" },
      { name: "Chili paste",             expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Cover surface with oil layer after each use" },
      { name: "Tomato puree",            expiryDays: 5,  openedExpiryDays: 3,  freezerExpiryDays: 60,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Freeze in ice cube trays for portioned use" },
      { name: "Onion paste",             expiryDays: 7,  openedExpiryDays: 4,  freezerExpiryDays: 60,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Best stored in small batches" },
      { name: "Green chili paste",       expiryDays: 10, openedExpiryDays: 5,  freezerExpiryDays: 90,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Add salt to preserve longer" },
      { name: "Coriander paste",         expiryDays: 5,  openedExpiryDays: 3,  freezerExpiryDays: 60,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Freeze in small portions as it browns quickly" },
      { name: "Mint paste",              expiryDays: 4,  openedExpiryDays: 2,  freezerExpiryDays: 60,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Add lemon juice to retain green colour" },
      { name: "Tamarind paste",          expiryDays: 30, openedExpiryDays: 14, freezerExpiryDays: 180, defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "High acidity acts as natural preservative" },
      { name: "Date paste",              expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Use clean dry spoon each time" },
      { name: "Almond paste",            expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Stir before use as oil may separate" },
      { name: "Cashew paste",            expiryDays: 5,  openedExpiryDays: 3,  freezerExpiryDays: 60,  defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Used as gravy base — freeze in portions" },
      { name: "Sesame paste (homemade)", expiryDays: 30, openedExpiryDays: 14, freezerExpiryDays: null,defaultStorage: "fridge",   subgroup: "Pastes & purees",         tip: "Oil separation is normal — stir before use" },
      // Extracts & infused waters
      { name: "Tamarind water",                 expiryDays: 5,    openedExpiryDays: 3,    freezerExpiryDays: 30,  defaultStorage: "fridge",   subgroup: "Extracts & infused waters", tip: "Strain pulp before storing for longer shelf life" },
      { name: "Coconut milk (homemade)",        expiryDays: 3,    openedExpiryDays: 2,    freezerExpiryDays: 30,  defaultStorage: "fridge",   subgroup: "Extracts & infused waters", tip: "Shake or stir before use — cream separates on top" },
      { name: "Coconut cream (homemade)",       expiryDays: 3,    openedExpiryDays: 2,    freezerExpiryDays: 30,  defaultStorage: "fridge",   subgroup: "Extracts & infused waters", tip: "First press — richer and thicker than coconut milk" },
      { name: "Rose water",                     expiryDays: 30,   openedExpiryDays: 14,   freezerExpiryDays: null,defaultStorage: "room-temp",subgroup: "Extracts & infused waters", tip: "Store in dark glass bottle away from sunlight" },
      { name: "Kewra water",                    expiryDays: 30,   openedExpiryDays: 14,   freezerExpiryDays: null,defaultStorage: "room-temp",subgroup: "Extracts & infused waters", tip: "Store in dark glass bottle away from sunlight" },
      { name: "Pandan extract",                 expiryDays: 5,    openedExpiryDays: 3,    freezerExpiryDays: 30,  defaultStorage: "fridge",   subgroup: "Extracts & infused waters", tip: "Freeze in ice cube trays for easy portioning" },
      { name: "Vanilla extract (homemade)",     expiryDays: 1825, openedExpiryDays: 1825, freezerExpiryDays: null,defaultStorage: "room-temp",subgroup: "Extracts & infused waters", tip: "Improves with age — store in cool dark place" },
      { name: "Lemon/lime juice (fresh squeezed)",expiryDays: 3,  openedExpiryDays: 2,    freezerExpiryDays: 90,  defaultStorage: "fridge",   subgroup: "Extracts & infused waters", tip: "Freeze in ice cube trays for longer storage" },
      { name: "Turmeric water",                 expiryDays: 5,    openedExpiryDays: 3,    freezerExpiryDays: 30,  defaultStorage: "fridge",   subgroup: "Extracts & infused waters", tip: "Use glass containers — stains plastic" },
      // Sauces & chutneys
      { name: "Tomato chutney",   expiryDays: 7,  openedExpiryDays: 5,  freezerExpiryDays: 60,  defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "Use clean dry spoon to avoid contamination" },
      { name: "Mint chutney",     expiryDays: 4,  openedExpiryDays: 2,  freezerExpiryDays: 30,  defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "Add lemon juice to slow browning" },
      { name: "Coconut chutney",  expiryDays: 3,  openedExpiryDays: 2,  freezerExpiryDays: 30,  defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "Best consumed fresh — freezes well in portions" },
      { name: "Tamarind chutney", expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "High sugar and acid content extends shelf life" },
      { name: "Garlic chutney",   expiryDays: 10, openedExpiryDays: 5,  freezerExpiryDays: 60,  defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "Drier chutney lasts longer than wet varieties" },
      { name: "Pesto (homemade)", expiryDays: 5,  openedExpiryDays: 3,  freezerExpiryDays: 90,  defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "Cover surface with olive oil layer to prevent browning" },
      { name: "Hummus (homemade)",expiryDays: 5,  openedExpiryDays: 3,  freezerExpiryDays: 60,  defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "Drizzle olive oil on surface before storing" },
      { name: "Tzatziki (homemade)",expiryDays: 4,openedExpiryDays: 3,  freezerExpiryDays: null,defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "Does not freeze well — make in small batches" },
      { name: "Salsa (homemade)", expiryDays: 5,  openedExpiryDays: 3,  freezerExpiryDays: 60,  defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "Drain excess liquid before freezing" },
      { name: "BBQ sauce (homemade)", expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "High sugar content acts as preservative" },
      { name: "Hot sauce (homemade)", expiryDays: 30, openedExpiryDays: 14, freezerExpiryDays: 180, defaultStorage: "fridge", subgroup: "Sauces & chutneys", tip: "Vinegar-based lasts longer than fresh chili sauces" },
      // Stocks & broths
      { name: "Chicken stock",   expiryDays: 4, openedExpiryDays: 3, freezerExpiryDays: 90, defaultStorage: "fridge", subgroup: "Stocks & broths", tip: "Freeze in 250ml or 500ml portions for easy use" },
      { name: "Beef stock",      expiryDays: 4, openedExpiryDays: 3, freezerExpiryDays: 90, defaultStorage: "fridge", subgroup: "Stocks & broths", tip: "Fat layer on top acts as a seal — remove before use" },
      { name: "Vegetable stock", expiryDays: 5, openedExpiryDays: 3, freezerExpiryDays: 90, defaultStorage: "fridge", subgroup: "Stocks & broths", tip: "Freeze in ice cube trays for small portions" },
      { name: "Fish stock",      expiryDays: 2, openedExpiryDays: 1, freezerExpiryDays: 60, defaultStorage: "fridge", subgroup: "Stocks & broths", tip: "Most perishable stock — freeze immediately if not using same day" },
      { name: "Bone broth",      expiryDays: 5, openedExpiryDays: 3, freezerExpiryDays: 90, defaultStorage: "fridge", subgroup: "Stocks & broths", tip: "Gelatinous when cold — this is normal" },
      { name: "Dashi",           expiryDays: 3, openedExpiryDays: 2, freezerExpiryDays: 30, defaultStorage: "fridge", subgroup: "Stocks & broths", tip: "Make fresh often — loses delicate flavour quickly" },
      // Doughs & batters
      { name: "Bread dough",      expiryDays: 3, openedExpiryDays: null, freezerExpiryDays: 90,  defaultStorage: "fridge", subgroup: "Doughs & batters", tip: "Punch down after 24h in fridge to slow fermentation" },
      { name: "Pizza dough",      expiryDays: 3, openedExpiryDays: null, freezerExpiryDays: 90,  defaultStorage: "fridge", subgroup: "Doughs & batters", tip: "Individual balls freeze best — thaw overnight in fridge" },
      { name: "Pancake batter",   expiryDays: 2, openedExpiryDays: null, freezerExpiryDays: null,defaultStorage: "fridge", subgroup: "Doughs & batters", tip: "Stir before use — baking powder loses potency after day 1" },
      { name: "Crepe batter",     expiryDays: 2, openedExpiryDays: null, freezerExpiryDays: null,defaultStorage: "fridge", subgroup: "Doughs & batters", tip: "Resting batter overnight actually improves texture" },
      { name: "Idli/dosa batter", expiryDays: 5, openedExpiryDays: null, freezerExpiryDays: 30,  defaultStorage: "fridge", subgroup: "Doughs & batters", tip: "Ferments and sours over time — use within 4-5 days for best taste" },
      { name: "Tempura batter",   expiryDays: 1, openedExpiryDays: null, freezerExpiryDays: null,defaultStorage: "fridge", subgroup: "Doughs & batters", tip: "Always make fresh — lumpy is fine, do not overmix" },
      { name: "Cookie dough",     expiryDays: 5, openedExpiryDays: null, freezerExpiryDays: 90,  defaultStorage: "fridge", subgroup: "Doughs & batters", tip: "Freeze pre-portioned balls for bake-on-demand" },
      { name: "Pie/tart dough",   expiryDays: 3, openedExpiryDays: null, freezerExpiryDays: 90,  defaultStorage: "fridge", subgroup: "Doughs & batters", tip: "Wrap tightly in cling film — absorbs fridge odours easily" },
      // Pickles & ferments
      { name: "Quick pickled onions",    expiryDays: 14,  openedExpiryDays: 7,  freezerExpiryDays: null,defaultStorage: "fridge", subgroup: "Pickles & ferments", tip: "Use clean dry utensils — avoid contamination" },
      { name: "Quick pickled cucumber",  expiryDays: 7,   openedExpiryDays: 5,  freezerExpiryDays: null,defaultStorage: "fridge", subgroup: "Pickles & ferments", tip: "Brine keeps vegetables submerged for longer life" },
      { name: "Kimchi (homemade)",       expiryDays: 90,  openedExpiryDays: 30, freezerExpiryDays: 180, defaultStorage: "fridge", subgroup: "Pickles & ferments", tip: "Press down after each use to keep cabbage submerged" },
      { name: "Sauerkraut (homemade)",   expiryDays: 180, openedExpiryDays: 30, freezerExpiryDays: 180, defaultStorage: "fridge", subgroup: "Pickles & ferments", tip: "Keep submerged in brine — exposure to air causes spoilage" },
      { name: "Yogurt (homemade)",       expiryDays: 10,  openedExpiryDays: 5,  freezerExpiryDays: 30,  defaultStorage: "fridge", subgroup: "Pickles & ferments", tip: "Save a spoon as starter culture for next batch" },
      { name: "Kefir (homemade)",        expiryDays: 14,  openedExpiryDays: 7,  freezerExpiryDays: null,defaultStorage: "fridge", subgroup: "Pickles & ferments", tip: "Gets more sour over time — use early for milder taste" },
      { name: "Sourdough starter",       expiryDays: 14,  openedExpiryDays: null,freezerExpiryDays: 180, defaultStorage: "fridge", subgroup: "Pickles & ferments", tip: "Feed weekly if storing in fridge; daily if kept at room temp" },
      // Infused oils & butters
      { name: "Garlic infused oil",               expiryDays: 4,  openedExpiryDays: 3,  freezerExpiryDays: null,defaultStorage: "fridge",    subgroup: "Infused oils & butters", tip: "⚠️ Do NOT store at room temp — botulism risk with fresh garlic in oil" },
      { name: "Chili infused oil",                expiryDays: 30, openedExpiryDays: 14, freezerExpiryDays: null,defaultStorage: "room-temp", subgroup: "Infused oils & butters", tip: "Use dried chili only for room temp storage — fresh chili needs fridge" },
      { name: "Herb infused oil",                 expiryDays: 5,  openedExpiryDays: 3,  freezerExpiryDays: null,defaultStorage: "fridge",    subgroup: "Infused oils & butters", tip: "Fresh herbs in oil must stay refrigerated" },
      { name: "Brown butter (beurre noisette)",   expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge",    subgroup: "Infused oils & butters", tip: "Strain solids for longer shelf life" },
      { name: "Compound butter",                  expiryDays: 7,  openedExpiryDays: 5,  freezerExpiryDays: 90,  defaultStorage: "fridge",    subgroup: "Infused oils & butters", tip: "Roll in cling film — slice off rounds as needed" },
      { name: "Ghee (homemade)",                  expiryDays: 90, openedExpiryDays: 30, freezerExpiryDays: 365, defaultStorage: "room-temp", subgroup: "Infused oils & butters", tip: "Always use a dry clean spoon — moisture causes spoilage" },
      // Sweet preparations
      { name: "Caramel sauce",           expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge", subgroup: "Sweet preparations", tip: "Reheat gently — hardens when cold" },
      { name: "Chocolate ganache",       expiryDays: 7,  openedExpiryDays: 5,  freezerExpiryDays: 60,  defaultStorage: "fridge", subgroup: "Sweet preparations", tip: "Press cling film directly onto surface to prevent skin" },
      { name: "Custard (homemade)",      expiryDays: 3,  openedExpiryDays: 2,  freezerExpiryDays: null,defaultStorage: "fridge", subgroup: "Sweet preparations", tip: "Does not freeze well — separates on thawing" },
      { name: "Jam (homemade)",          expiryDays: 21, openedExpiryDays: 14, freezerExpiryDays: 365, defaultStorage: "fridge", subgroup: "Sweet preparations", tip: "Sterilised jars extend shelf life significantly" },
      { name: "Simple syrup",            expiryDays: 14, openedExpiryDays: 7,  freezerExpiryDays: 90,  defaultStorage: "fridge", subgroup: "Sweet preparations", tip: "1:1 ratio lasts 2 weeks; 2:1 (rich syrup) lasts up to a month" },
      { name: "Condensed coconut milk",  expiryDays: 7,  openedExpiryDays: 5,  freezerExpiryDays: 60,  defaultStorage: "fridge", subgroup: "Sweet preparations", tip: "Stir well before use — sugars settle at bottom" },
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

/**
 * For homemade items: lookup by name across all homemade subgroups.
 * When isHomemade is true in the form, the category may still be set to the food type
 * (e.g. "sauces-pastes"), so we search the homemade category directly.
 */
export function lookupHomemadeItem(name: string): PantryItemDef | undefined {
  return lookupItem("homemade", name);
}

/**
 * Item names for homemade datalist, optionally filtered by subgroup.
 */
export function homemadeItemNames(subgroup?: string): string[] {
  const items = CATEGORY_MAP["homemade"]?.items ?? [];
  if (subgroup) return items.filter((i) => i.subgroup === subgroup).map((i) => i.name);
  return items.map((i) => i.name);
}

/**
 * All unique subgroup labels for the homemade category.
 */
export function homemadeSubgroups(): string[] {
  const items = CATEGORY_MAP["homemade"]?.items ?? [];
  return [...new Set(items.map((i) => i.subgroup).filter(Boolean))] as string[];
}

/**
 * Given an item definition, return the freezer expiry date from today.
 * Returns undefined if item has no freezerExpiryDays (cannot be frozen).
 */
export function suggestFreezerExpiryDate(itemDef: PantryItemDef): string | undefined {
  if (!itemDef.freezerExpiryDays) return undefined;
  return expiryDateFromDays(itemDef.freezerExpiryDays);
}
