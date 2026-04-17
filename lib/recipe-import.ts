type JsonLdValue = Record<string, unknown>;

export type ImportedRecipeDraft = {
  sourceUrl: string;
  title: string;
  description: string;
  category: string;
  cuisine: string;
  course: string;
  difficulty: string;
  tags: string;
  badges: string[];
  learnedFrom: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  ingredients: Array<{
    group_en: string;
    items: Array<{
      amount: string;
      unit: string;
      name_en: string;
    }>;
  }>;
  instructionSections: Array<{
    title_en: string;
    steps_en: string[];
  }>;
  notesEn: string;
  tipsEn: string;
  faq: Array<{
    question_en: string;
    answer_en: string;
  }>;
  equipment: Array<{
    label_en: string;
  }>;
  imageUrls: string[];
  coverImageUrl: string;
  videoUrl: string;
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function flattenJsonLdRecipe(input: unknown): JsonLdValue | null {
  if (!input) {
    return null;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const recipe = flattenJsonLdRecipe(item);
      if (recipe) return recipe;
    }
    return null;
  }

  if (typeof input !== "object") {
    return null;
  }

  const raw = input as JsonLdValue;
  const type = raw["@type"];

  if (typeof type === "string" && type.toLowerCase() === "recipe") {
    return raw;
  }

  if (Array.isArray(type) && type.some((value) => typeof value === "string" && value.toLowerCase() === "recipe")) {
    return raw;
  }

  if (Array.isArray(raw["@graph"])) {
    return flattenJsonLdRecipe(raw["@graph"]);
  }

  return null;
}

function extractJsonLdRecipe(html: string): JsonLdValue | null {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const match of scripts) {
    const parsed = safeJsonParse(decodeHtmlEntities(match[1].trim()));
    const recipe = flattenJsonLdRecipe(parsed);

    if (recipe) {
      return recipe;
    }
  }

  return null;
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtmlWithLines(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h2|h3|h4|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function extractMetaContent(html: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escapedName}["'][^>]+content=["']([^"']+)["']`, "i"));
  return match ? decodeHtmlEntities(match[1]).trim() : "";
}

function pickBestCoverImage(html: string, recipe: JsonLdValue): string {
  const preferred = [
    extractMetaContent(html, "og:image"),
    extractMetaContent(html, "twitter:image"),
    ...normalizeTextList(recipe.image),
  ].filter(Boolean);

  return preferred.find((image) => !/logo|avatar|icon|pixel|cropped/i.test(image)) || "";
}

function extractHeadingText(html: string): string {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripHtml(match[1]) : "";
}

function extractLegacyIngredients(html: string): string[] {
  const matches = [...html.matchAll(/<span[^>]*class=["'][^"']*inglist[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)];
  return matches.map((match) => stripHtml(match[1])).filter((line) => line && !/^[\s\u00a0]*$/.test(line));
}

function extractLegacyServings(html: string): string {
  const match = html.match(/serves<\/b>\s*:\s*([^|<]+)/i);
  return match ? stripHtml(match[1]).match(/\d+(\.\d+)?/)?.[0] || stripHtml(match[1]) : "";
}

function extractLegacyDescription(html: string): string {
  const ogDescription = extractMetaContent(html, "og:description");
  if (ogDescription) return ogDescription;

  const firstParagraph = html.match(/<div[^>]*class=["'][^"']*tdb-block-inner[^"']*["'][^>]*>[\s\S]*?<div[^>]*>([\s\S]*?)<p><\/p>/i);
  return firstParagraph ? stripHtml(firstParagraph[1]) : "";
}

function extractLegacyMethodSteps(html: string): string[] {
  const stepWiseSection = html.match(/Method with step wise pictures:([\s\S]*?)(?:<\/div>\s*<\/div>\s*<\/div>|<div id="respond"|$)/i);
  const methodSection =
    stepWiseSection?.[1] || html.match(/<h2>Method:?<\/h2>([\s\S]*?)(?:<h2>Method with step wise pictures:|<div id="respond"|$)/i)?.[1] || "";

  return [...methodSection.matchAll(/<li>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);
}

function extractLegacyRecipe(html: string, sourceUrl: URL): JsonLdValue | null {
  const ingredients = extractLegacyIngredients(html);
  const instructions = extractLegacyMethodSteps(html);
  const title = extractHeadingText(html) || extractMetaContent(html, "og:title");

  if (!title || ingredients.length === 0 || instructions.length === 0) {
    return null;
  }

  return {
    "@type": "Recipe",
    name: title,
    description: extractLegacyDescription(html),
    author: extractMetaContent(html, "author") || getHostLabel(sourceUrl),
    recipeYield: extractLegacyServings(html),
    recipeIngredient: ingredients,
    recipeInstructions: instructions,
    recipeCategory: extractMetaContent(html, "article:section"),
    keywords: extractMetaContent(html, "article:tag"),
    image: [...new Set([extractMetaContent(html, "og:image"), ...extractImageUrls(html, {})])].filter(Boolean),
    video: extractVideoUrl(html, {}),
    recipeCuisine: extractMetaContent(html, "article:section"),
    totalTime: extractMetaContent(html, "cook_time"),
  };
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? decodeHtmlEntities(value).replace(/\s+/g, " ").trim() : "";
}

function normalizeTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }

  const single = normalizeText(value);
  return single ? [single] : [];
}

function getHostLabel(url: URL): string {
  const host = url.hostname.replace(/^www\./, "");

  if (host.includes("traditionallymodernfood")) {
    return "Traditionally Modern Food";
  }

  if (host.includes("jeyashriskitchen")) {
    return "Jeyashri's Kitchen";
  }

  if (host.includes("thebakingspoon")) {
    return "The Baking Spoon";
  }

  return host;
}

function extractAuthorName(recipe: JsonLdValue, sourceUrl: URL): string {
  const author = recipe.author;

  if (typeof author === "string") {
    return normalizeText(author);
  }

  if (Array.isArray(author)) {
    for (const item of author) {
      if (typeof item === "string" && item.trim()) {
        return normalizeText(item);
      }

      if (item && typeof item === "object" && typeof (item as JsonLdValue).name === "string") {
        return normalizeText((item as JsonLdValue).name);
      }
    }
  }

  if (author && typeof author === "object" && typeof (author as JsonLdValue).name === "string") {
    return normalizeText((author as JsonLdValue).name);
  }

  return getHostLabel(sourceUrl);
}

function extractRecipeYield(recipe: JsonLdValue): string {
  const yieldValue = recipe.recipeYield;

  if (Array.isArray(yieldValue)) {
    return normalizeText(yieldValue[0]);
  }

  const normalized = normalizeText(yieldValue);
  const match = normalized.match(/\d+(\.\d+)?/);
  return match ? match[0] : normalized;
}

function parseIngredientLine(line: string) {
  const cleanedLine = line.replace(/\s+/g, " ").trim();
  const match = cleanedLine.match(/^([0-9./\-\s]+|a\s+\w+|an?\s+\w+)?\s*([a-zA-Z]+)?\s*(.*)$/);

  if (!match) {
    return {
      amount: "",
      unit: "",
      name_en: cleanedLine,
    };
  }

  const [, rawAmount = "", rawUnit = "", rawName = ""] = match;
  const amount = rawAmount.trim();
  const unit = amount ? rawUnit.trim() : "";
  const name_en = (amount ? rawName : cleanedLine).trim() || cleanedLine;

  return {
    amount,
    unit,
    name_en,
  };
}

function extractIngredients(recipe: JsonLdValue) {
  const lines = normalizeTextList(recipe.recipeIngredient);

  return [
    {
      group_en: "MAIN",
      items: lines.map(parseIngredientLine),
    },
  ];
}

function flattenInstructions(value: unknown): Array<{ title_en: string; steps_en: string[] }> {
  if (typeof value === "string") {
    const steps = normalizeText(value)
      .split(/\n+/)
      .map((step) => step.trim())
      .filter(Boolean);

    return steps.length > 0 ? [{ title_en: "Method", steps_en: steps }] : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const sections: Array<{ title_en: string; steps_en: string[] }> = [];
  const methodSteps: string[] = [];

  for (const item of value) {
    if (typeof item === "string") {
      const step = normalizeText(item);
      if (step) {
        methodSteps.push(step);
      }
      continue;
    }

    if (!item || typeof item !== "object") {
      continue;
    }

    const raw = item as JsonLdValue;
    const type = normalizeText(raw["@type"]).toLowerCase();

    if (type === "howtosection") {
      const sectionName = normalizeText(raw.name).toUpperCase() || "METHOD";
      const sectionSteps = flattenInstructions(raw.itemListElement).flatMap((section) => section.steps_en);

      if (sectionSteps.length > 0) {
        sections.push({
          title_en: sectionName,
          steps_en: sectionSteps,
        });
      }

      continue;
    }

    const text = normalizeText(raw.text || raw.name);
    if (text) {
      methodSteps.push(text);
    }
  }

  if (sections.length === 0 && methodSteps.length > 0) {
    return [{ title_en: "METHOD", steps_en: methodSteps }];
  }

  if (methodSteps.length > 0) {
    sections.unshift({
      title_en: "METHOD",
      steps_en: methodSteps,
    });
  }

  return sections;
}

function extractImageUrls(html: string, recipe: JsonLdValue): string[] {
  const schemaImages = [pickBestCoverImage(html, recipe), ...normalizeTextList(recipe.image)].filter(Boolean);
  const pageImages = [...html.matchAll(/https:\/\/[^"' ]+wp-content\/uploads\/[^"' ]+\.(?:jpg|jpeg|png|webp)/gi)]
    .map((match) => match[0])
    .filter((image) => !/logo|cropped|avatar|button|pixel|icon|yummly|-\d+x\d+\./i.test(image));

  return [...new Set([...schemaImages, ...pageImages])].slice(0, 12);
}

function extractVideoUrl(html: string, recipe: JsonLdValue): string {
  const candidates = [
    recipe.video,
    recipe.video && typeof recipe.video === "object" ? (recipe.video as JsonLdValue).embedUrl : null,
    recipe.video && typeof recipe.video === "object" ? (recipe.video as JsonLdValue).contentUrl : null,
    recipe.video && typeof recipe.video === "object" ? (recipe.video as JsonLdValue).url : null,
  ]
    .flatMap((value) => normalizeTextList(value))
    .filter(Boolean);

  const pageVideo = html.match(
    /https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[^"' ]+|youtube\.com\/embed\/[^"' ]+|youtu\.be\/[^"' ]+|youtube\.com\/shorts\/[^"' ]+|instagram\.com\/reel\/[^"' ]+)/i
  );

  return candidates[0] || pageVideo?.[0] || "";
}

function extractDescription(recipe: JsonLdValue): string {
  return normalizeText(recipe.description);
}

function extractCategory(recipe: JsonLdValue): string {
  return normalizeText(recipe.recipeCategory);
}

function extractCuisine(recipe: JsonLdValue): string {
  return normalizeText(recipe.recipeCuisine);
}

function extractCourse(recipe: JsonLdValue): string {
  const category = normalizeText(recipe.recipeCategory);
  if (!category) {
    return "";
  }

  const lower = category.toLowerCase();
  if (lower.includes("dessert")) return "Dessert";
  if (lower.includes("breakfast")) return "Breakfast";
  if (lower.includes("lunch")) return "Lunch";
  if (lower.includes("dinner")) return "Dinner";
  if (lower.includes("main")) return "Main Course";
  if (lower.includes("side")) return "Side Dish";

  return category;
}

function extractTags(recipe: JsonLdValue): string {
  const keywords = normalizeText(recipe.keywords);
  if (keywords) return keywords;

  return normalizeTextList(recipe.recipeCuisine).join(", ");
}

function inferBadges(recipe: JsonLdValue, title: string, tags: string): string[] {
  const haystack = `${title} ${tags} ${normalizeText(recipe.description)}`.toLowerCase();
  const badges: string[] = [];

  if (/(veg(etarian)?|dal|sambar|kuzhambu|paneer)/.test(haystack)) badges.push("Veg");
  if (/(vegan)/.test(haystack)) badges.push("Vegan");
  if (/(chicken|mutton|fish|egg|beef|prawn)/.test(haystack)) badges.push("Non-Veg");
  if (/(spicy|masala|andhra)/.test(haystack)) badges.push("Spicy");
  if (/(quick|instant|pressure cooker|cooker)/.test(haystack)) badges.push("Quick Meal");
  if (/(protein|dal|lentil|paneer|moong)/.test(haystack)) badges.push("High Protein");

  return [...new Set(badges)];
}

function inferEquipment(title: string, sections: Array<{ title_en: string; steps_en: string[] }>, ingredients: Array<{ group_en: string; items: Array<{ name_en: string }> }>, html: string) {
  const text = [
    title,
    stripHtmlWithLines(html).slice(0, 5000),
    sections.flatMap((section) => [section.title_en, ...section.steps_en]).join("\n"),
    ingredients.flatMap((group) => [group.group_en, ...group.items.map((item) => item.name_en)]).join("\n"),
  ]
    .join("\n")
    .toLowerCase();
  const matches: string[] = [];
  const rules: Array<[RegExp, string]> = [
    [/\bpressure cooker|instant pot\b/, "PRESSURE COOKER"],
    [/\bblend|blender|mixer grinder|grind\b/, "MIXER GRINDER / BLENDER"],
    [/\bwhisk|beat\b/, "WHISK"],
    [/\boven|bake|preheat\b/, "OVEN"],
    [/\bpiping bag|pipe\b/, "PIPING BAG"],
    [/\bbaking tray|sheet pan\b/, "BAKING TRAY"],
    [/\bdeep fry|deep-fry|fry\b/, "DEEP FRY PAN / KADAI"],
    [/\btemper|tadka\b/, "TEMPERING PAN"],
    [/\bboil|simmer\b/, "SAUCEPAN / POT"],
    [/\bskillet|saute|tawa\b/, "SKILLET / PAN"],
    [/\bstrain|sieve|filter\b/, "STRAINER / SIEVE"],
    [/\broll|flatten\b/, "ROLLING PIN"],
    [/\bmix\b/, "MIXING BOWL"],
    [/\bspatula|ladle|stir\b/, "SPATULA / LADLE"],
  ];

  for (const [pattern, label] of rules) {
    if (pattern.test(text)) {
      matches.push(label);
    }
  }

  return [...new Set(matches)].map((label) => ({ label_en: label })).slice(0, 8);
}

function extractIsoDuration(value: string): string {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (!normalized.startsWith("PT")) return normalized;

  const hours = normalized.match(/(\d+)H/i)?.[1];
  const minutes = normalized.match(/(\d+)M/i)?.[1];
  const parts = [];

  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);

  return parts.join(" ");
}

function extractNotes(recipe: JsonLdValue): string {
  const parts = [
    normalizeText(recipe.totalTime) ? `Total time: ${extractIsoDuration(normalizeText(recipe.totalTime))}` : "",
    normalizeText(recipe.recipeYield) ? `Yield: ${normalizeText(recipe.recipeYield)}` : "",
  ].filter(Boolean);

  return parts.join("\n");
}

function normalizeSubheading(label: string): string {
  return normalizeText(label).replace(/:$/, "").toUpperCase();
}

function extractHtmlHeadingBlock(html: string, startPattern: RegExp, endPatterns: RegExp[]): string {
  const startMatch = html.match(startPattern);

  if (!startMatch || startMatch.index === undefined) {
    return "";
  }

  const startIndex = startMatch.index + startMatch[0].length;
  const afterStart = html.slice(startIndex);
  let endIndex = afterStart.length;

  for (const pattern of endPatterns) {
    const match = afterStart.match(pattern);
    if (match && match.index !== undefined) {
      endIndex = Math.min(endIndex, match.index);
    }
  }

  return afterStart.slice(0, endIndex);
}

function extractGroupedListSections(block: string, fallbackTitle: string): Array<{ title_en: string; items: string[] }> {
  const sections = [...block.matchAll(/<h4[^>]*>\s*([^<]+?)\s*<\/h4>([\s\S]*?)(?=<h4[^>]*>|$)/gi)]
    .map((match) => ({
      title_en: normalizeSubheading(match[1]) || fallbackTitle,
      items: [...match[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((itemMatch) => stripHtml(itemMatch[1]).replace(/^▢\s*/, "").trim())
        .filter(Boolean),
    }))
    .filter((section) => section.items.length > 0);

  if (sections.length > 0) {
    return sections;
  }

  const items = [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripHtml(match[1]).replace(/^▢\s*/, "").trim())
    .filter(Boolean);

  return items.length > 0 ? [{ title_en: fallbackTitle, items }] : [];
}

function extractHebbarOverrides(html: string) {
  if (!/hebbarskitchen/i.test(html)) {
    return null;
  }

  const ingredientsBlock = extractHtmlHeadingBlock(html, /<h3[^>]*>\s*Ingredients\s*<\/h3>/i, [/<h3[^>]*>\s*Instructions\s*<\/h3>/i]);
  const instructionsBlock = extractHtmlHeadingBlock(
    html,
    /<h3[^>]*>\s*Instructions\s*<\/h3>/i,
    [/<h2[^>]*>\s*How to Make/i, /<h2[^>]*>\s*Notes\s*<\/h2>/i, /Tried this recipe/i]
  );
  const faqBlock = extractHtmlHeadingBlock(html, /<h2[^>]*>\s*FAQs\s*<\/h2>/i, [/<h3[^>]*>\s*Video Recipe/i, /<h2[^>]*>\s*Recipe Card/i]);
  const notesBlock = extractHtmlHeadingBlock(html, /<h2[^>]*>\s*Notes\s*<\/h2>/i, [/<\/article>/i, /<h2[^>]*>/i]);
  const tipsBlock = extractHtmlHeadingBlock(html, /<h2[^>]*>\s*Chef Pro Tips[^<]*<\/h2>/i, [/<h2[^>]*>\s*FAQs\s*<\/h2>/i, /<h3[^>]*>\s*Video Recipe/i]);
  const footerMetaBlock = extractHtmlHeadingBlock(html, /<h2[^>]*>\s*Notes\s*<\/h2>/i, [/<\/article>/i]);

  const ingredientSections = extractGroupedListSections(ingredientsBlock, "MAIN").map((section) => ({
    group_en: section.title_en,
    items: section.items.map(parseIngredientLine),
  }));

  const instructionSections = extractGroupedListSections(instructionsBlock, "METHOD").map((section) => ({
    title_en: section.title_en,
    steps_en: section.items,
  }));

  const faqLines = stripHtmlWithLines(faqBlock)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const faq: Array<{ question_en: string; answer_en: string }> = [];
  let currentQuestion = "";
  let currentAnswerLines: string[] = [];

  for (const line of faqLines) {
    if (/^\d+\.\s+/.test(line)) {
      if (currentQuestion && currentAnswerLines.length > 0) {
        faq.push({
          question_en: currentQuestion,
          answer_en: currentAnswerLines.join(" "),
        });
      }

      currentQuestion = line.replace(/^\d+\.\s+/, "").trim();
      currentAnswerLines = [];
      continue;
    }

    if (currentQuestion) {
      currentAnswerLines.push(line);
    }
  }

  if (currentQuestion && currentAnswerLines.length > 0) {
    faq.push({
      question_en: currentQuestion,
      answer_en: currentAnswerLines.join(" "),
    });
  }

  const notesEn = extractGroupedListSections(notesBlock, "NOTES").flatMap((section) => section.items).join("\n");
  const tipsEn = extractGroupedListSections(tipsBlock, "CHEF PRO TIPS").flatMap((section) => section.items).join("\n");
  const equipment = [...footerMetaBlock.matchAll(/【\d+†([^】]+)】/g)]
    .map((match) => normalizeText(match[1]))
    .filter((label) => /blend|stove|frying|bowl|pan|pot|mixer|whisk/i.test(label))
    .map((label) => ({ label_en: label.toUpperCase() }));
  const difficulty = footerMetaBlock.match(/【\d+†(easy|medium|hard|beginner|intermediate|advanced)】/i)?.[1] || "";

  return {
    ingredients: ingredientSections,
    instructionSections,
    faq,
    notesEn,
    tipsEn,
    equipment,
    difficulty: difficulty ? difficulty[0].toUpperCase() + difficulty.slice(1).toLowerCase() : "",
  };
}

export async function importRecipeFromUrl(recipeUrl: string): Promise<ImportedRecipeDraft> {
  const url = new URL(recipeUrl);
  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 Cookbook Importer",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch source page (${response.status}).`);
  }

  const html = await response.text();
  const recipe = extractJsonLdRecipe(html) || extractLegacyRecipe(html, url);

  if (!recipe) {
    throw new Error("I could not find recipe data on that page yet.");
  }

  const title = normalizeText(recipe.name);
  const tags = extractTags(recipe);
  const imageUrls = extractImageUrls(html, recipe);
  const hebbarOverrides = extractHebbarOverrides(html);
  const coverImageUrl = pickBestCoverImage(html, recipe) || imageUrls[0] || "";
  const importedIngredients = hebbarOverrides?.ingredients.length ? hebbarOverrides.ingredients : extractIngredients(recipe);
  const importedInstructionSections =
    hebbarOverrides?.instructionSections.length ? hebbarOverrides.instructionSections : flattenInstructions(recipe.recipeInstructions);
  const importedEquipment =
    hebbarOverrides?.equipment.length ? hebbarOverrides.equipment : inferEquipment(title, importedInstructionSections, importedIngredients, html);

  return {
    sourceUrl: url.toString(),
    title,
    description: extractDescription(recipe),
    category: extractCategory(recipe),
    cuisine: extractCuisine(recipe),
    course: extractCourse(recipe),
    difficulty: hebbarOverrides?.difficulty || "",
    tags,
    badges: inferBadges(recipe, title, tags),
    learnedFrom: extractAuthorName(recipe, url),
    servings: extractRecipeYield(recipe),
    prepTime: extractIsoDuration(normalizeText(recipe.prepTime)),
    cookTime: extractIsoDuration(normalizeText(recipe.cookTime)),
    totalTime: extractIsoDuration(normalizeText(recipe.totalTime)),
    ingredients: importedIngredients,
    instructionSections: importedInstructionSections,
    notesEn: hebbarOverrides?.notesEn || extractNotes(recipe),
    tipsEn: hebbarOverrides?.tipsEn || "",
    faq: hebbarOverrides?.faq || [],
    equipment: importedEquipment,
    imageUrls: coverImageUrl ? [coverImageUrl] : [],
    coverImageUrl,
    videoUrl: extractVideoUrl(html, recipe),
  };
}
