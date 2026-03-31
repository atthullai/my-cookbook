import { createClient } from "@supabase/supabase-js";

// This client is the single browser-side connection the app uses for auth and recipe data.
// Keeping it in one file avoids repeating keys and config across pages.
const supabaseUrl = "https://mufevuomgysjpudsdtka.supabase.co";
const supabaseAnonKey = "sb_publishable_QpCVuKJasJHfPaz45KWz6g_KXWMfSu5";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
