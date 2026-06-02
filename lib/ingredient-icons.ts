/**
 * Icon configuration for ingredients and kitchen equipment.
 *
 * Each entry pairs a Lucide icon component name with a fallback emoji.
 * The consuming `IngredientIcon` component tries to render the Lucide icon first;
 * if the name doesn't match a known icon, it falls back to the emoji in a styled span.
 *
 * Usage:
 *   import { getIngredientIcon } from "@/lib/ingredient-icons";
 *   const icon = getIngredientIcon("garlic");  // → { lucide: "Leaf", emoji: "🧄" }
 */

export interface IconConfig {
  /** Lucide React component name (PascalCase) */
  lucide: string;
  /** Fallback emoji rendered when Lucide icon is not available */
  emoji: string;
}

export const INGREDIENT_ICONS: Record<string, IconConfig> = {
  // Proteins
  chicken:        { lucide: "Drumstick",  emoji: "🍗" },
  beef:           { lucide: "Beef",       emoji: "🥩" },
  lamb:           { lucide: "Beef",       emoji: "🍖" },
  pork:           { lucide: "Beef",       emoji: "🥩" },
  fish:           { lucide: "Fish",       emoji: "🐟" },
  "fish sauce":   { lucide: "Droplets",   emoji: "🍶" },
  prawn:          { lucide: "Fish",       emoji: "🦐" },
  shrimp:         { lucide: "Fish",       emoji: "🦐" },
  egg:            { lucide: "Egg",        emoji: "🥚" },
  tofu:           { lucide: "Box",        emoji: "🫙" },
  paneer:         { lucide: "Box",        emoji: "🧀" },

  // Vegetables — specific before generic
  "tomato paste": { lucide: "Circle",     emoji: "🍅" },
  tomato:         { lucide: "Circle",     emoji: "🍅" },
  onion:          { lucide: "Circle",     emoji: "🧅" },
  garlic:         { lucide: "Leaf",       emoji: "🧄" },
  ginger:         { lucide: "Leaf",       emoji: "🫚" },
  "sweet potato": { lucide: "Circle",     emoji: "🍠" },
  potato:         { lucide: "Circle",     emoji: "🥔" },
  carrot:         { lucide: "Carrot",     emoji: "🥕" },
  spinach:        { lucide: "Leaf",       emoji: "🥬" },
  capsicum:       { lucide: "Flame",      emoji: "🫑" },
  "bell pepper":  { lucide: "Flame",      emoji: "🫑" },
  "red pepper":   { lucide: "Flame",      emoji: "🫑" },
  "green pepper": { lucide: "Flame",      emoji: "🫑" },
  "chili pepper": { lucide: "Flame",      emoji: "🌶️" },
  "chilli pepper":{ lucide: "Flame",      emoji: "🌶️" },
  "green chili":  { lucide: "Flame",      emoji: "🌶️" },
  "red chili":    { lucide: "Flame",      emoji: "🌶️" },
  mushroom:       { lucide: "Leaf",       emoji: "🍄" },
  corn:           { lucide: "Wheat",      emoji: "🌽" },
  peas:           { lucide: "Circle",     emoji: "🫛" },
  brinjal:        { lucide: "Circle",     emoji: "🍆" },
  eggplant:       { lucide: "Circle",     emoji: "🍆" },
  cauliflower:    { lucide: "Circle",     emoji: "🥦" },
  broccoli:       { lucide: "Circle",     emoji: "🥦" },
  cabbage:        { lucide: "Leaf",       emoji: "🥬" },
  lettuce:        { lucide: "Leaf",       emoji: "🥬" },
  beetroot:       { lucide: "Circle",     emoji: "🟣" },
  drumstick:      { lucide: "Leaf",       emoji: "🌿" },
  "ladies finger":{ lucide: "Circle",     emoji: "🫛" },
  okra:           { lucide: "Circle",     emoji: "🫛" },
  "bottle gourd": { lucide: "Circle",     emoji: "🥒" },
  "bitter gourd": { lucide: "Circle",     emoji: "🥒" },
  zucchini:       { lucide: "Circle",     emoji: "🥒" },
  cucumber:       { lucide: "Circle",     emoji: "🥒" },
  leek:           { lucide: "Leaf",       emoji: "🥬" },
  "spring onion": { lucide: "Leaf",       emoji: "🌿" },
  "spring onions":{ lucide: "Leaf",       emoji: "🌿" },
  "green onion":  { lucide: "Leaf",       emoji: "🌿" },
  asparagus:      { lucide: "Leaf",       emoji: "🌿" },
  avocado:        { lucide: "Circle",     emoji: "🥑" },
  pumpkin:        { lucide: "Circle",     emoji: "🎃" },

  // Fruits
  lemon:          { lucide: "Circle",     emoji: "🍋" },
  lime:           { lucide: "Circle",     emoji: "🍋‍🟩" },
  pear:           { lucide: "Circle",     emoji: "🍐" },
  apple:          { lucide: "Apple",      emoji: "🍎" },
  banana:         { lucide: "Banana",     emoji: "🍌" },
  mango:          { lucide: "Circle",     emoji: "🥭" },
  coconut:        { lucide: "Circle",     emoji: "🥥" },
  tamarind:       { lucide: "Circle",     emoji: "🌰" },
  orange:         { lucide: "Circle",     emoji: "🍊" },
  watermelon:     { lucide: "Circle",     emoji: "🍉" },
  pineapple:      { lucide: "Circle",     emoji: "🍍" },
  strawberry:     { lucide: "Circle",     emoji: "🍓" },
  blueberry:      { lucide: "Circle",     emoji: "🫐" },
  grapes:         { lucide: "Circle",     emoji: "🍇" },
  peach:          { lucide: "Circle",     emoji: "🍑" },
  cherry:         { lucide: "Circle",     emoji: "🍒" },
  kiwi:           { lucide: "Circle",     emoji: "🥝" },
  pomegranate:    { lucide: "Circle",     emoji: "🔴" },
  kokum:          { lucide: "Circle",     emoji: "🔴" },

  // Grains & Pulses — specific dal variants before generic "dal"
  "toor dal":     { lucide: "Circle",     emoji: "🫘" },
  "chana dal":    { lucide: "Circle",     emoji: "🫘" },
  "urad dal":     { lucide: "Circle",     emoji: "🫘" },
  "moong dal":    { lucide: "Circle",     emoji: "🫘" },
  rajma:          { lucide: "Circle",     emoji: "🫘" },
  "kidney beans": { lucide: "Circle",     emoji: "🫘" },
  rice:           { lucide: "Wheat",      emoji: "🍚" },
  flour:          { lucide: "Wheat",      emoji: "🌾" },
  lentil:         { lucide: "Circle",     emoji: "🫘" },
  dal:            { lucide: "Circle",     emoji: "🫘" },
  chickpea:       { lucide: "Circle",     emoji: "🫘" },
  pasta:          { lucide: "Wheat",      emoji: "🍝" },
  bread:          { lucide: "Wheat",      emoji: "🍞" },
  oats:           { lucide: "Wheat",      emoji: "🌾" },

  // Dairy — specific milks/cheeses before generic
  "oat milk":     { lucide: "GlassWater", emoji: "🥛" },
  "almond milk":  { lucide: "GlassWater", emoji: "🥛" },
  "soy milk":     { lucide: "GlassWater", emoji: "🥛" },
  milk:           { lucide: "GlassWater", emoji: "🥛" },
  cream:          { lucide: "GlassWater", emoji: "🥛" },
  butter:         { lucide: "Square",     emoji: "🧈" },
  mozzarella:     { lucide: "Square",     emoji: "🧀" },
  parmesan:       { lucide: "Square",     emoji: "🧀" },
  feta:           { lucide: "Square",     emoji: "🧀" },
  halloumi:       { lucide: "Square",     emoji: "🧀" },
  cheese:         { lucide: "Square",     emoji: "🧀" },
  yogurt:         { lucide: "Circle",     emoji: "🥛" },
  curd:           { lucide: "Circle",     emoji: "🥛" },

  // Spices, herbs & Indian specifics
  salt:           { lucide: "Pipette",    emoji: "🧂" },
  jaggery:        { lucide: "Pipette",    emoji: "🟫" },
  sugar:          { lucide: "Pipette",    emoji: "🍬" },
  turmeric:       { lucide: "Pipette",    emoji: "🟡" },
  cumin:          { lucide: "Pipette",    emoji: "🌿" },
  "curry leaves": { lucide: "Leaf",       emoji: "🌿" },
  coriander:      { lucide: "Leaf",       emoji: "🌿" },
  chilli:         { lucide: "Flame",      emoji: "🌶️" },
  cardamom:       { lucide: "Leaf",       emoji: "🌿" },
  cinnamon:       { lucide: "Leaf",       emoji: "🌿" },
  clove:          { lucide: "Leaf",       emoji: "🌿" },
  mustard:        { lucide: "Pipette",    emoji: "🌿" },
  saffron:        { lucide: "Leaf",       emoji: "🌸" },
  basil:          { lucide: "Leaf",       emoji: "🌿" },
  thyme:          { lucide: "Leaf",       emoji: "🌿" },
  oregano:        { lucide: "Leaf",       emoji: "🌿" },
  parsley:        { lucide: "Leaf",       emoji: "🌿" },
  vanilla:        { lucide: "Leaf",       emoji: "🌿" },

  // Oils & Liquids — specific before generic "oil"
  "olive oil":    { lucide: "Droplets",   emoji: "🫒" },
  "sesame oil":   { lucide: "Droplets",   emoji: "🫙" },
  "coconut oil":  { lucide: "Droplets",   emoji: "🥥" },
  oil:            { lucide: "Droplets",   emoji: "🫙" },
  ghee:           { lucide: "Droplets",   emoji: "🫙" },
  vinegar:        { lucide: "Droplets",   emoji: "🍶" },
  "soy sauce":    { lucide: "Droplets",   emoji: "🍶" },
  sauce:          { lucide: "Droplets",   emoji: "🫙" },
  miso:           { lucide: "Circle",     emoji: "🫙" },
  tahini:         { lucide: "Circle",     emoji: "🫙" },

  // Nuts & Seeds
  walnut:         { lucide: "Circle",     emoji: "🪨" },
  pistachio:      { lucide: "Circle",     emoji: "🫘" },
  cashew:         { lucide: "Circle",     emoji: "🥜" },
  almond:         { lucide: "Circle",     emoji: "🌰" },
  peanut:         { lucide: "Circle",     emoji: "🥜" },
  sesame:         { lucide: "Pipette",    emoji: "🌿" },
  chia:           { lucide: "Leaf",       emoji: "🌿" },
  flaxseed:       { lucide: "Leaf",       emoji: "🌿" },

  // Baking
  chocolate:      { lucide: "Square",     emoji: "🍫" },
  yeast:          { lucide: "Circle",     emoji: "🫙" },
};

export const EQUIPMENT_ICONS: Record<string, IconConfig> = {
  pan:       { lucide: "Circle",       emoji: "🍳" },
  wok:       { lucide: "Circle",       emoji: "🥘" },
  pot:       { lucide: "Circle",       emoji: "🫕" },
  pressure:  { lucide: "Circle",       emoji: "⚗️" },
  oven:      { lucide: "Flame",        emoji: "🔥" },
  blender:   { lucide: "Zap",          emoji: "🌀" },
  mixer:     { lucide: "Zap",          emoji: "🥣" },
  grinder:   { lucide: "Zap",          emoji: "⚙️" },
  knife:     { lucide: "Scissors",     emoji: "🔪" },
  board:     { lucide: "Square",       emoji: "🪣" },
  bowl:      { lucide: "Circle",       emoji: "🥣" },
  whisk:     { lucide: "Zap",          emoji: "🥄" },
  spatula:   { lucide: "Minus",        emoji: "🥄" },
  strainer:  { lucide: "Filter",       emoji: "🫙" },
  colander:  { lucide: "Filter",       emoji: "🫙" },
  tray:      { lucide: "Square",       emoji: "🍽️" },
  steamer:   { lucide: "Wind",         emoji: "♨️" },
  mortar:    { lucide: "Circle",       emoji: "⚗️" },
  tawa:      { lucide: "Circle",       emoji: "🍳" },
  kadai:     { lucide: "Circle",       emoji: "🥘" },
  tandoor:   { lucide: "Flame",        emoji: "🔥" },
};

/**
 * Returns icon config for an ingredient name, matching the longest substring.
 * Falls back to a generic spice icon if nothing matches.
 */
export function getIngredientIcon(name: string): IconConfig {
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(INGREDIENT_ICONS)) {
    if (lower.includes(key)) return value;
  }
  return { lucide: "Circle", emoji: "🫙" };
}

/**
 * Returns icon config for a piece of kitchen equipment.
 * Falls back to a wrench emoji if nothing matches.
 */
export function getEquipmentIcon(name: string): IconConfig {
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(EQUIPMENT_ICONS)) {
    if (lower.includes(key)) return value;
  }
  return { lucide: "Wrench", emoji: "🔧" };
}
