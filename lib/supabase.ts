import { createBrowserClient } from "@supabase/ssr";

// SUPABASE CLIENT MAP
// Uses createBrowserClient from @supabase/ssr so auth tokens are stored in
// cookies instead of localStorage — this lets server components read the
// session via createSupabaseServerClient (which also reads cookies).
const supabaseUrl = "https://mufevuomgysjpudsdtka.supabase.co";
const supabaseAnonKey = "sb_publishable_QpCVuKJasJHfPaz45KWz6g_KXWMfSu5";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
