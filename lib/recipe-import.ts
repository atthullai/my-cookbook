type JsonLdValue = Record<string, unknown>;

export type ImportedRecipeDraft = {
  sourceUrl: string;
  title: string;
  description: string;
  category: string;
  tags: string;
  learnedFrom: string;
  servings: string;
  ingredients: Array<{
    group_en: string;
    items: Array<{
      amount: string;
      unit: string;
      name_en: string;
    }>;
  }>;
  steps: string;
  notesEn: string;
  imageUrls: string[];
  stepPhotos: Array<{
    step_number: string;
    image_url: string;
    caption_en: string;
  }>;
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

function extractMetaContent(html: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escapedName}["'][^>]+content=["']([^"']+)["']`, "i"));
  return match ? decodeHtmlEntities(match[1]).trim() : "";
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
  const methodSection = stepWiseSection?.[1] || html.match(/<h2>Method:?<\/h2>([\s\S]*?)(?:<h2>Method with step wise pictures:|<div id="respond"|$)/i)?.[1] || "";

  const steps = [...methodSection.matchAll(/<li>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);

  return steps;
}

function extractLegacyStepPhotos(html: string, fallbackSteps: string[]) {
  const stepWiseSection = html.match(/Method with step wise pictures:([\s\S]*?)(?:<\/div>\s*<\/div>\s*<\/div>|<div id="respond"|$)/i)?.[1] || "";
  const imageMatches = [...stepWiseSection.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
    .map((match) => decodeHtmlEntities(match[1]))
    .filter((image) => /wp-content\/uploads/i.test(image));

  return imageMatches.slice(0, 8).map((imageUrl, index) => ({
    step_number: String(index + 1),
    image_url: imageUrl,
    caption_en: fallbackSteps[index] || `Process photo ${index + 1}`,
  }));
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
    _legacyStepPhotos: extractLegacyStepPhotos(html, instructions),
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
      group_en: "Main",
      items: lines.map(parseIngredientLine),
    },
  ];
}

function flattenInstructions(value: unknown): string[] {
  if (typeof value === "string") {
    return normalizeText(value)
      .split(/\n+/)
      .map((step) => step.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const steps: string[] = [];

  for (const item of value) {
    if (typeof item === "string") {
      const step = normalizeText(item);
      if (step) steps.push(step);
      continue;
    }

    if (!item || typeof item !== "object") {
      continue;
    }

    const raw = item as JsonLdValue;
    const type = normalizeText(raw["@type"]).toLowerCase();

    if (type === "howtosection") {
      const sectionName = normalizeText(raw.name);
      const sectionSteps = flattenInstructions(raw.itemListElement);

      if (sectionName) {
        steps.push(`## ${sectionName}`);
      }

      steps.push(...sectionSteps);
      continue;
    }

    const text = normalizeText(raw.text || raw.name);
    if (text) {
      steps.push(text);
    }
  }

  return steps;
}

function buildStepText(recipe: JsonLdValue): string {
  return flattenInstructions(recipe.recipeInstructions)
    .map((step, index) => (step.startsWith("## ") ? step : `${index + 1}. ${step}`))
    .join("\n");
}

function extractImageUrls(html: string, recipe: JsonLdValue): string[] {
  const schemaImages = normalizeTextList(recipe.image);
  const pageImages = [...html.matchAll(/https:\/\/[^"' ]+wp-content\/uploads\/[^"' ]+\.(?:jpg|jpeg|png|webp)/gi)]
    .map((match) => match[0])
    .filter((image) => !/logo|cropped|avatar|button|pixel|icon|yummly|-\d+x\d+\./i.test(image));

  return [...new Set([...schemaImages, ...pageImages])].slice(0, 12);
}

function extractVideoUrl(html: string, recipe: JsonLdValue): string {
  const candidates = [
    recipe.video,
    (recipe.video && typeof recipe.video === "object" ? (recipe.video as JsonLdValue).embedUrl : null),
    (recipe.video && typeof recipe.video === "object" ? (recipe.video as JsonLdValue).contentUrl : null),
    (recipe.video && typeof recipe.video === "object" ? (recipe.video as JsonLdValue).url : null),
  ]
    .flatMap((value) => normalizeTextList(value))
    .filter(Boolean);

  const pageVideo = html.match(/https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[^"' ]+|youtube\.com\/embed\/[^"' ]+|youtu\.be\/[^"' ]+|youtube\.com\/shorts\/[^"' ]+|instagram\.com\/reel\/[^"' ]+)/i);

  return candidates[0] || pageVideo?.[0] || "";
}

function buildStepPhotos(steps: string, imageUrls: string[]) {
  const instructionLines = steps
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("## "));

  return imageUrls.slice(1, Math.min(imageUrls.length, 6)).map((imageUrl, index) => ({
    step_number: String(index + 1),
    image_url: imageUrl,
    caption_en: instructionLines[index]?.replace(/^\d+\.\s*/, "") || `Process photo ${index + 1}`,
  }));
}

function extractDescription(recipe: JsonLdValue): string {
  return normalizeText(recipe.description);
}

function extractCategory(recipe: JsonLdValue): string {
  const category = normalizeText(recipe.recipeCategory);
  if (category) return category;

  const cuisine = normalizeText(recipe.recipeCuisine);
  return cuisine || "";
}

function extractTags(recipe: JsonLdValue): string {
  const keywords = normalizeText(recipe.keywords);
  if (keywords) return keywords;

  return normalizeTextList(recipe.recipeCuisine).join(", ");
}

function extractNotes(recipe: JsonLdValue): string {
  const parts = [
    normalizeText(recipe.totalTime) ? `Total time: ${normalizeText(recipe.totalTime)}` : "",
    normalizeText(recipe.recipeYield) ? `Yield: ${normalizeText(recipe.recipeYield)}` : "",
  ].filter(Boolean);

  return parts.join("\n");
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

  const imageUrls = extractImageUrls(html, recipe);
  const steps = buildStepText(recipe);

  const legacyStepPhotos =
    Array.isArray(recipe._legacyStepPhotos) &&
    recipe._legacyStepPhotos.every((item) => item && typeof item === "object")
      ? (recipe._legacyStepPhotos as ImportedRecipeDraft["stepPhotos"])
      : [];

  return {
    sourceUrl: url.toString(),
    title: normalizeText(recipe.name),
    description: extractDescription(recipe),
    category: extractCategory(recipe),
    tags: extractTags(recipe),
    learnedFrom: extractAuthorName(recipe, url),
    servings: extractRecipeYield(recipe),
    ingredients: extractIngredients(recipe),
    steps,
    notesEn: extractNotes(recipe),
    imageUrls,
    stepPhotos: legacyStepPhotos.length > 0 ? legacyStepPhotos : buildStepPhotos(steps, imageUrls),
    videoUrl: extractVideoUrl(html, recipe),
  };
}
