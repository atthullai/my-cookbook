import { NextResponse } from "next/server";

// POST /api/ingredients/cache-clear
// Busts the in-memory ingredient library cache so the next search
// re-fetches from Supabase. Call this after adding/editing library rows.

// Dynamic import so we can reach into the search route's module scope.
// We expose a reset function from the search route for this purpose.
export async function POST() {
  const mod = await import("@/app/api/ingredients/search/route");
  if (typeof mod.bustCache === "function") {
    mod.bustCache();
    return NextResponse.json({ ok: true, message: "Cache cleared" });
  }
  return NextResponse.json({ ok: false, message: "bustCache not exported" }, { status: 500 });
}
