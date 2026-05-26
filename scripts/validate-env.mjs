const required = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    fallback: "hardcoded Supabase URL in lib/supabase.ts",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    fallback: "hardcoded publishable Supabase key in lib/supabase.ts",
  },
];

const missing = required.filter((item) => !process.env[item.name]);

if (missing.length > 0) {
  console.warn("Environment variables not set in shell:");
  for (const item of missing) {
    console.warn(`- ${item.name} (currently using ${item.fallback})`);
  }
}

console.log("Environment validation completed.");
