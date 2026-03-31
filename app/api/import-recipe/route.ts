import { NextResponse } from "next/server";
import { importRecipeFromUrl } from "@/lib/recipe-import";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    url?: unknown;
  };

  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!url) {
    return NextResponse.json({ error: "Please add a recipe URL first." }, { status: 400 });
  }

  try {
    const importedRecipe = await importRecipeFromUrl(url);
    return NextResponse.json({ recipe: importedRecipe });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recipe import failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
