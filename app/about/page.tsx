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
  totalTags: number;
}

// All data is fetched client-side inside AboutPageClient using the
// browser Supabase client — same pattern as home/planner/pantry pages.
export default function AboutPage() {
  return <AboutPageClient />;
}
