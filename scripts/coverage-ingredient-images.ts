// Coverage report: which canonical ingredients (from the seed list) have NO
// matching cut-out icon. Run: npx tsx scripts/coverage-ingredient-images.ts
import { readFileSync } from "node:fs";
import { resolveIngredientImage } from "../lib/ingredient-images";

// Deliberately not iconified (user decision 2026-06): niche items not worth an icon.
const IGNORE = new Set([
  "thai red curry paste", "thai green curry paste", "kokum", "agar agar",
  "buttermilk", "duck", "sea bass", "tilapia", "hilsa", "catla",
  "golden syrup", "treacle", "linguine", "rigatoni",
]);

const src = readFileSync("scripts/seed-ingredients.ts", "utf8");
const names = [...src.matchAll(/name_en:\s*'([^']+)'/g)].map((m) => m[1]).filter((n) => !IGNORE.has(n.toLowerCase()));
const namesDe = [...src.matchAll(/name_de:\s*'([^']+)'/g)].map((m) => m[1]);

let hit = 0;
const misses: string[] = [];
for (const n of names) {
  if (resolveIngredientImage(n)) hit++;
  else misses.push(n);
}
let hitDe = 0;
for (const n of namesDe) if (resolveIngredientImage(n)) hitDe++;

console.log(`English canonical names: ${hit}/${names.length} covered (${Math.round((hit / names.length) * 100)}%)`);
console.log(`German names:            ${hitDe}/${namesDe.length} covered (${Math.round((hitDe / namesDe.length) * 100)}%)`);
console.log(`\nMissing icons (${misses.length}):`);
misses.forEach((m) => console.log("  ✗ " + m));
