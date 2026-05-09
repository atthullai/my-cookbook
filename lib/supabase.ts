import { createClient } from "@supabase/supabase-js";

// SUPABASE CLIENT MAP
// Supabase is where login, profile text, and recipes live.
// This file creates one shared client so every page talks to the same database project.
// Important: this is the public anon key, not a secret service-role key.

// This client is the single browser-side connection the app uses for auth and recipe data.
// Keeping it in one file avoids repeating keys and config across pages.
const supabaseUrl = "https://mufevuomgysjpudsdtka.supabase.co";
const supabaseAnonKey = "sb_publishable_QpCVuKJasJHfPaz45KWz6g_KXWMfSu5";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
