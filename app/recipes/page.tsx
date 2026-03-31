import Link from "next/link";
import { curatedRecipes } from "@/data/curated-recipes";

export default function RecipeIndexPage() {
  const categories = Array.from(new Set(curatedRecipes.map((recipe) => recipe.category).filter(Boolean)));

  return (
    <main className="container">
      <h1>Recipe Index</h1>
      <p>A structured overview of the cookbook, grouped so it is easier to browse than the homepage.</p>

      {categories.map((category) => (
        <section key={category} style={{ marginTop: 28 }}>
          <h2 style={{ marginBottom: 12 }}>{category}</h2>

          <div style={{ display: "grid", gap: 14 }}>
            {curatedRecipes
              .filter((recipe) => recipe.category === category)
              .map((recipe) => (
                <div key={recipe.slug} className="card">
                  <Link href={`/recipe/${recipe.slug}`}>
                    <h3 style={{ marginBottom: 8 }}>{recipe.title_en}</h3>
                  </Link>
                  <p style={{ marginBottom: 8 }}>{recipe.description_en}</p>
                  <p style={{ marginBottom: 0 }}>
                    By {recipe.author_name}
                    {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
                  </p>
                </div>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}

export const metadata = {
  title: "Recipe Index",
};
