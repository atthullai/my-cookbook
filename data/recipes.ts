// Legacy demo data kept only as a small example from the earlier prototype.
// The live app now reads recipes from Supabase and from the starter cookbook helpers.
export const recipes = [
  {
    id: 1,
    title_en: "Chicken Curry",
    title_de: "Hähnchen Curry",
    category: "Lunch",
    tags: ["chicken", "spicy"],
    ingredients_en: "Chicken, spices, onion",
    ingredients_de: "Hähnchen, Gewürze, Zwiebel",
    steps_en: "Cook chicken with spices.",
    steps_de: "Hähnchen mit Gewürzen kochen.",
  },
  {
    id: 2,
    title_en: "Vegetable Rice",
    title_de: "Gemüse Reis",
    category: "Rice",
    tags: ["rice", "vegetarian"],
    ingredients_en: "Rice, vegetables",
    ingredients_de: "Reis, Gemüse",
    steps_en: "Cook rice with vegetables.",
    steps_de: "Reis mit Gemüse kochen.",
  },
  {
    id: 3,
    title_en: "Pancakes",
    title_de: "Pfannkuchen",
    category: "Breakfast",
    tags: ["sweet"],
    ingredients_en: "Flour, milk, sugar",
    ingredients_de: "Mehl, Milch, Zucker",
    steps_en: "Mix and cook.",
    steps_de: "Mischen und kochen.",
  },
];
