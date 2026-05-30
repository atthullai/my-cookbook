import { createSupabaseServerClient } from "@/lib/supabase-server";
import AboutPageClient from "./AboutPageClient";

export interface CuisineBreakdown {
  origin: string;
  count: number;
}

export interface TagBreakdown {
  vegetarian: number;
  spicy: number;
  quick: number;
  highProtein: number;
}

export default async function AboutPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = {
    display_name: "",
    bio: "",
    location: "",
    cook_style: "",
    avatar_url: "",
  };

  let stats = { recipes: 0, cuisines: 0 };
  let cuisineBreakdown: CuisineBreakdown[] = [];
  let tagBreakdown: TagBreakdown = { vegetarian: 0, spicy: 0, quick: 0, highProtein: 0 };

  if (user) {
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("display_name, bio, location, cook_style, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileData) {
      profile = {
        display_name: (profileData.display_name as string) ?? "",
        bio:          (profileData.bio as string) ?? "",
        location:     (profileData.location as string) ?? "",
        cook_style:   (profileData.cook_style as string) ?? "",
        avatar_url:   (profileData.avatar_url as string) ?? "",
      };
    }

    const { data: recipes } = await supabase
      .from("recipes")
      .select("cuisine_origin, tags")
      .eq("user_id", user.id);

    if (recipes) {
      // Stats
      const cuisineMap = new Map<string, number>();
      for (const r of recipes) {
        const origin = (r.cuisine_origin as string) || "";
        if (origin) cuisineMap.set(origin, (cuisineMap.get(origin) ?? 0) + 1);
      }
      stats = { recipes: recipes.length, cuisines: cuisineMap.size };

      // Cuisine breakdown sorted by count desc
      cuisineBreakdown = Array.from(cuisineMap.entries())
        .map(([origin, count]) => ({ origin, count }))
        .sort((a, b) => b.count - a.count);

      // Tag breakdown
      let vegetarian = 0, spicy = 0, quick = 0, highProtein = 0;
      for (const r of recipes) {
        const tags: string[] = Array.isArray(r.tags) ? r.tags : [];
        const joined = tags.join(" ").toLowerCase();
        if (joined.includes("vegetarian") || joined.includes("vegan")) vegetarian++;
        if (joined.includes("spic")) spicy++;
        if (joined.includes("quick") || joined.includes("fast") || joined.includes("30 min")) quick++;
        if (joined.includes("high protein") || joined.includes("protein")) highProtein++;
      }
      tagBreakdown = { vegetarian, spicy, quick, highProtein };
    }
  }

  return (
    <AboutPageClient
      initialProfile={profile}
      userId={user?.id ?? null}
      stats={stats}
      cuisineBreakdown={cuisineBreakdown}
      tagBreakdown={tagBreakdown}
    />
  );
}
