/**
 * Server-side Supabase client for use in Server Actions.
 * Uses @supabase/ssr to read/write cookies so the user's
 * auth session is available server-side.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mufevuomgysjpudsdtka.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_QpCVuKJasJHfPaz45KWz6g_KXWMfSu5",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Action context — cookies can't always be set
          }
        },
      },
    }
  );
}
