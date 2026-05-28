"use client";

/**
 * /recipes/[id] — redirects to the canonical recipe detail page at /recipe/[id].
 *
 * Both routes exist in the codebase. All navigation now goes to /recipe/[id]
 * (the full-featured page). This page exists as a redirect so any bookmarked
 * or externally-shared /recipes/[id] links continue to work.
 */
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RecipesIdRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (id) {
      router.replace(`/recipe/${id}`);
    } else {
      router.replace("/recipes");
    }
  }, [id, router]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-16 text-center">
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading recipe…</p>
    </main>
  );
}
