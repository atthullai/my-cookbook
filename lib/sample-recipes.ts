import type { RecipeRecord } from "@/lib/recipe-types";

const CHOUX_TITLE = "Choux Au Craquelin (Cream Puff)";

export function buildSampleRecipe(userId: string) {
  // This sample insert uses only the columns the current app already relies on.
  // Richer fields are layered in locally until the SQL migration is applied.
  return {
    user_id: userId,
    title_en: CHOUX_TITLE,
    title_de: "Choux au Craquelin mit Vanille-Diplomatcreme",
    category: "Dessert",
    tags: ["french pastry", "cream puff", "berries", "baking", "showpiece"],
    ingredients: [
      {
        group: "Vanilla Bean Diplomat Cream",
        items: [
          { amount: "3", unit: "yolks", name: "egg yolks" },
          { amount: "45", unit: "g", name: "granulated sugar" },
          { amount: "25", unit: "g", name: "cornstarch" },
          { amount: "1", unit: "pinch", name: "kosher salt" },
          { amount: "1/2", unit: "bean", name: "vanilla bean" },
          { amount: "250", unit: "g", name: "milk" },
          { amount: "22", unit: "g", name: "unsalted butter" },
        ],
      },
      {
        group: "Whipped Cream",
        items: [
          { amount: "300", unit: "g", name: "heavy whipping cream" },
          { amount: "65", unit: "g", name: "granulated sugar" },
        ],
      },
      {
        group: "Craquelin",
        items: [
          { amount: "50", unit: "g", name: "unsalted butter" },
          { amount: "60", unit: "g", name: "dark brown sugar" },
          { amount: "60", unit: "g", name: "all-purpose flour" },
        ],
      },
      {
        group: "Choux Pastry",
        items: [
          { amount: "62", unit: "g", name: "water" },
          { amount: "62", unit: "g", name: "milk" },
          { amount: "15", unit: "g", name: "granulated sugar" },
          { amount: "1", unit: "pinch", name: "kosher salt" },
          { amount: "55", unit: "g", name: "unsalted butter" },
          { amount: "75", unit: "g", name: "all-purpose flour" },
          { amount: "100-120", unit: "g", name: "eggs, lightly beaten" },
          { amount: "", unit: "", name: "strawberries and blueberries" },
          { amount: "", unit: "", name: "powdered sugar" },
        ],
      },
    ],
    steps_en: [
      "## Part 1 of Diplomat Cream",
      "1. Whisk egg yolks, sugar, cornstarch, and salt until pale and smooth.",
      "2. Heat milk with vanilla bean and part of the sugar until just boiling.",
      "3. Temper the hot milk into the yolk mixture, then return to the pan and cook until thick.",
      "4. Stir in butter, strain, cover, and chill completely.",
      "",
      "## Part 2 of Diplomat Cream",
      "1. Whip the cold cream with sugar until medium peaks form.",
      "2. Fold the whipped cream gently into the chilled pastry cream.",
      "",
      "## Craquelin",
      "1. Mix butter, brown sugar, and flour into a dough.",
      "2. Roll thin between sheets of parchment and chill or freeze.",
      "3. Cut small rounds to sit on top of the piped choux.",
      "",
      "## Choux Pastry",
      "1. Bring water, milk, sugar, salt, and butter to a full boil.",
      "2. Add flour all at once and cook until a smooth dough forms and a film develops on the pan.",
      "3. Cool the dough slightly, then add beaten eggs gradually until glossy and pipeable.",
      "4. Pipe rounds, top with craquelin discs, and bake until deeply golden.",
      "",
      "## Assemble",
      "1. Cool the baked choux and release the steam.",
      "2. Slice the tops, fill with diplomat cream, then add berries.",
      "3. Pipe more cream, replace the tops, and dust with powdered sugar.",
      "4. Serve the same day for the best texture.",
    ].join("\n"),
    steps_de: [
      "## Diplomatcreme Teil 1",
      "1. Eigelb, Zucker, Speisestarke und Salz glatt ruhren.",
      "2. Milch mit Vanille und etwas Zucker erhitzen, bis sie fast kocht.",
      "3. Die warme Milch einruhren, dann alles zuruck in den Topf geben und eindicken.",
      "4. Butter einruhren, durch ein Sieb streichen und kalt stellen.",
      "",
      "## Diplomatcreme Teil 2",
      "1. Kalte Sahne mit Zucker zu mittleren Spitzen schlagen.",
      "2. Vorsichtig unter die gekuhlte Konditorcreme heben.",
      "",
      "## Craquelin",
      "1. Butter, braunen Zucker und Mehl zu einem Teig vermengen.",
      "2. Dunn ausrollen und gut kühlen.",
      "3. Kleine Kreise ausstechen und auf die Choux setzen.",
      "",
      "## Brandteig",
      "1. Wasser, Milch, Zucker, Salz und Butter aufkochen.",
      "2. Mehl auf einmal einruhren und den Teig abbrennen.",
      "3. Kurz abkuhlen lassen und Ei portionsweise einarbeiten.",
      "4. Aufspritzen, mit Craquelin belegen und goldbraun backen.",
      "",
      "## Fertigstellen",
      "1. Gebackene Choux abkuhlen lassen und entdampfen.",
      "2. Aufschneiden und mit Diplomatcreme und Beeren fullen.",
      "3. Mit etwas extra Creme und Puderzucker servieren.",
    ].join("\n"),
  };
}

export function applySampleRecipePreset(recipe: RecipeRecord): RecipeRecord {
  if (recipe.title_en !== CHOUX_TITLE) {
    return recipe;
  }

  return {
    ...recipe,
    description_en:
      recipe.description_en ||
      "A crisp-topped cream puff with vanilla diplomat cream and fresh berries, inspired by classic French pastry techniques.",
    description_de:
      recipe.description_de ||
      "Ein knuspriges Choux mit Vanille-Diplomatcreme und frischen Beeren, inspiriert von klassischer franzosischer Patisserie.",
    notes_en:
      recipe.notes_en ||
      "Best served the same day. Bake one tray at a time, do not open the oven too early, and vent the choux after baking so they stay crisp.",
    notes_de:
      recipe.notes_de ||
      "Am besten am selben Tag servieren. Ein Blech nach dem anderen backen, den Ofen nicht zu fruh offnen und die Choux nach dem Backen entdampfen lassen.",
    source_url: recipe.source_url || "https://www.thebakingspoon.com/choux-au-craquelin-vanilla-bean-diplomat-cream/",
    video_url: recipe.video_url || null,
    servings: recipe.servings || 11,
    equipment:
      recipe.equipment && recipe.equipment.length > 0
        ? recipe.equipment
        : [
            "Kitchen scale",
            "Stand mixer or hand mixer",
            "Saucepan",
            "Spatula",
            "Rolling pin",
            "Cookie cutter",
            "Round piping tip",
            "Pastry bags",
            "Baking sheet",
            "Baking mat or parchment",
          ],
    image_urls:
      recipe.image_urls && recipe.image_urls.length > 0
        ? recipe.image_urls
        : [
            "https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin1.jpg",
            "https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin-9.jpg",
            "https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin-5.jpg",
          ],
  };
}
