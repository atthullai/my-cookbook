import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mufevuomgysjpudsdtka.supabase.co";
const supabaseAnonKey = "sb_publishable_QpCVuKJasJHfPaz45KWz6g_KXWMfSu5"; // your key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);