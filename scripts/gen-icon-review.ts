// Generates a self-contained HTML review sheet of every ingredient icon with
// all names (filename aliases + curated synonyms) that resolve to it, so the
// mappings can be eyeballed for mistakes.
// Run: npx tsx scripts/gen-icon-review.ts   → ~/Downloads/ingredient-icons-review.html
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { INGREDIENT_IMAGE_ALIASES } from "../lib/ingredient-image-manifest";
import { EXTRA_SYNONYMS } from "../lib/ingredient-images";

const IMG_DIR = path.join(process.cwd(), "public", "ingredients");
const OUT = path.join(homedir(), "Downloads", "ingredient-icons-review.html");

// slug → curated synonyms pointing at it
const synonymsBySlug = new Map<string, string[]>();
for (const [term, slug] of Object.entries(EXTRA_SYNONYMS)) {
  (synonymsBySlug.get(slug) ?? synonymsBySlug.set(slug, []).get(slug)!).push(term);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const cards = Object.keys(INGREDIENT_IMAGE_ALIASES).sort().map((slug) => {
  const aliases = INGREDIENT_IMAGE_ALIASES[slug];
  const syns = synonymsBySlug.get(slug) ?? [];
  const all = [...new Set([...aliases, ...syns])];
  return `<div class="card" data-q="${esc((slug + " " + all.join(" ")).toLowerCase())}">
    <img src="file://${IMG_DIR}/${slug}.png" loading="lazy" alt="">
    <div class="slug">${esc(slug)}</div>
    <div class="names">${all.map((n) => `<span>${esc(n)}</span>`).join("")}</div>
  </div>`;
}).join("\n");

const html = `<!doctype html><meta charset="utf-8"><title>Ingredient icon review (${Object.keys(INGREDIENT_IMAGE_ALIASES).length} icons)</title>
<style>
  body{font-family:-apple-system,sans-serif;background:#f4f4f3;margin:0;padding:24px}
  h1{font-size:20px} .sub{color:#777;font-size:13px;margin-bottom:16px}
  #q{width:100%;max-width:420px;padding:10px 14px;font-size:15px;border:1px solid #ddd;border-radius:10px;margin-bottom:20px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
  .card{background:#fff;border:1px solid #e6e6e3;border-radius:14px;padding:12px;text-align:center}
  .card img{width:72px;height:72px;object-fit:contain}
  .slug{font-weight:700;font-size:12.5px;margin:6px 0 4px;word-break:break-word}
  .names{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}
  .names span{font-size:10.5px;background:#f4f4f3;border-radius:999px;padding:2px 8px;color:#555}
  .hide{display:none}
</style>
<h1>Ingredient icon review</h1>
<div class="sub">${Object.keys(INGREDIENT_IMAGE_ALIASES).length} icons. Every chip is a name that resolves to that icon (filename aliases + curated EN/DE/Tamil/Hindi synonyms). Search to filter.</div>
<input id="q" type="search" placeholder="Filter… e.g. podi, mehl, tomato, oil">
<div class="grid">${cards}</div>
<script>
  const q=document.getElementById('q');
  q.addEventListener('input',()=>{const v=q.value.toLowerCase().trim();
    for(const c of document.querySelectorAll('.card')) c.classList.toggle('hide', v && !c.dataset.q.includes(v));});
</script>`;

writeFileSync(OUT, html);
console.log(`Wrote ${OUT}`);
