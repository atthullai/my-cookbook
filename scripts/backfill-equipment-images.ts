// scripts/backfill-equipment-images.ts
// Scans every recipe in the DB, matches each equipment item to the canonical
// equipment library, and writes back the image path + proper label_de.
//
// Run once (from the cookbook-app folder):
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/backfill-equipment-images.ts

import { createClient } from '@supabase/supabase-js';

// ── Inline equipment library (no @/ alias needed outside Next.js) ─────────────
const EQUIPMENT: Array<{ name_en: string; name_de: string; image: string; synonyms: string[] }> = [
  { name_en: "Wok",                      name_de: "Wok",                    image: "/equipment/wok.jpg",                             synonyms: ["chinese wok"] },
  { name_en: "Skillet",                  name_de: "Pfanne",                 image: "/equipment/skillet.jpg",                         synonyms: ["frying pan", "skillet pan", "saute pan", "sautee pan"] },
  { name_en: "Saucepan / Pot",           name_de: "Kochtopf",               image: "/equipment/saucepan-pot.jpg",                    synonyms: ["saucepan", "pot", "boiling pot", "cooking pot"] },
  { name_en: "Stockpot",                 name_de: "Suppentopf",             image: "/equipment/stockpot.jpg",                        synonyms: ["stock pot", "large pot", "soup pot"] },
  { name_en: "Dutch Oven",               name_de: "Schmortopf",             image: "/equipment/dutch-oven.jpg",                      synonyms: ["dutch oven", "casserole dish", "braiser"] },
  { name_en: "Pressure Cooker",          name_de: "Schnellkochtopf",        image: "/equipment/pressure-cooker.jpg",                 synonyms: ["pressure cooker", "instant pot", "instapot"] },
  { name_en: "Tawa",                     name_de: "Tawa",                   image: "/equipment/tawa.jpg",                            synonyms: ["tava", "griddle", "flat pan", "chapati pan"] },
  { name_en: "Kadai / Deep Fry Pan",     name_de: "Kadai / Frittiertiegel", image: "/equipment/kadai-deep-fry-pan.jpg",              synonyms: ["kadai", "karahi", "deep fry pan", "deep-fry pan", "shallow fry pan"] },
  { name_en: "Grill Pan",                name_de: "Grillpfanne",            image: "/equipment/grill-pan.jpg",                       synonyms: ["grill pan", "griddle pan", "ridged pan"] },
  { name_en: "Crepe Pan",                name_de: "Crêpepfanne",            image: "/equipment/crepe-pan.jpg",                       synonyms: ["crepe pan", "crêpe pan", "dosa pan"] },
  { name_en: "Tempering Pan",            name_de: "Temperierpfanne",        image: "/equipment/tempering-pan.jpg",                   synonyms: ["tadka pan", "tempering pan", "seasoning pan"] },
  { name_en: "Tagine",                   name_de: "Tajine",                 image: "/equipment/tagine.jpg",                          synonyms: ["tagine", "tajine", "moroccan pot"] },
  { name_en: "Oven",                     name_de: "Backofen",               image: "/equipment/oven.jpg",                            synonyms: ["oven", "electric oven", "conventional oven"] },
  { name_en: "Air Fryer",                name_de: "Heißluftfritteuse",      image: "/equipment/airfryer.jpg",                        synonyms: ["air fryer", "airfryer", "air frier"] },
  { name_en: "Mixer Grinder",            name_de: "Mixer",                  image: "/equipment/mixer-grinder.jpg",                   synonyms: ["mixer grinder", "mixie", "grinder", "blender jar"] },
  { name_en: "Hand Blender",             name_de: "Stabmixer",              image: "/equipment/hand-blender.jpg",                    synonyms: ["hand blender", "immersion blender", "stick blender"] },
  { name_en: "Stand Mixer",              name_de: "Küchenmaschine",         image: "/equipment/standmixer-for-baking.jpg",           synonyms: ["stand mixer", "kitchen mixer", "kitchenaid"] },
  { name_en: "Food Processor",           name_de: "Küchenmaschine",         image: "/equipment/food-processor.jpeg",                 synonyms: ["food processor", "chopper"] },
  { name_en: "Wet Grinder",              name_de: "Nassmühle",              image: "/equipment/wet-grinder.webp",                   synonyms: ["wet grinder", "stone grinder", "table top grinder"] },
  { name_en: "Rice Cooker",              name_de: "Reiskocher",             image: "/equipment/rice-cooker.jpeg",                    synonyms: ["rice cooker", "electric rice cooker"] },
  { name_en: "Steamer",                  name_de: "Dampfgarer",             image: "/equipment/steamer.jpg",                         synonyms: ["steamer", "steam cooker", "idli steamer", "electric steamer"] },
  { name_en: "Electric Kettle",          name_de: "Wasserkocher",           image: "/equipment/electric-kettle.jpg",                 synonyms: ["electric kettle", "kettle"] },
  { name_en: "Chef's Knife",             name_de: "Kochmesser",             image: "/equipment/chefs-knife.jpg",                     synonyms: ["chef knife", "chefs knife", "cook's knife"] },
  { name_en: "Bread Knife",              name_de: "Brotmesser",             image: "/equipment/bread-knife.jpg",                     synonyms: ["bread knife", "serrated knife"] },
  { name_en: "Paring Knife",             name_de: "Schälmesser",            image: "/equipment/paring-knife.webp",                  synonyms: ["paring knife", "small knife", "peeling knife"] },
  { name_en: "Whisk",                    name_de: "Schneebesen",            image: "/equipment/wisk.jpeg",                           synonyms: ["whisk", "balloon whisk", "hand whisk"] },
  { name_en: "Spatula / Ladle",          name_de: "Spatel / Schöpfkelle",  image: "/equipment/spatula-laddle.jpg",                  synonyms: ["spatula", "ladle", "wooden spoon", "stirring spoon", "turner"] },
  { name_en: "Rolling Pin",              name_de: "Nudelholz",              image: "/equipment/rolling-pin.jpg",                     synonyms: ["rolling pin", "chapati roller", "belan"] },
  { name_en: "Tongs",                    name_de: "Zange",                  image: "/equipment/tongs.webp",                         synonyms: ["tongs", "kitchen tongs", "grill tongs"] },
  { name_en: "Box Grater",               name_de: "Kastenreibe",            image: "/equipment/box-grater.jpg",                      synonyms: ["box grater", "grater", "cheese grater"] },
  { name_en: "Peeler",                   name_de: "Sparschäler",            image: "/equipment/peeler.webp",                        synonyms: ["peeler", "vegetable peeler", "potato peeler"] },
  { name_en: "Masher",                   name_de: "Kartoffelstampfer",      image: "/equipment/masher.jpg",                          synonyms: ["masher", "potato masher"] },
  { name_en: "Skimmer / Spider",         name_de: "Schaumkelle / Spinne",   image: "/equipment/skimmer-spider.jpg",                  synonyms: ["skimmer", "spider strainer", "spider skimmer", "frying spider"] },
  { name_en: "Chopsticks",               name_de: "Essstäbchen",            image: "/equipment/chopsticks.jpg",                      synonyms: ["chopsticks", "cooking chopsticks"] },
  { name_en: "Press",                    name_de: "Presse",                 image: "/equipment/press.webp",                         synonyms: ["tortilla press", "roti press", "chapati press", "press"] },
  { name_en: "Mixing Bowls",             name_de: "Rührschüsseln",          image: "/equipment/mixing-bowls.webp",                  synonyms: ["mixing bowl", "bowl", "large bowl", "salad bowl"] },
  { name_en: "Chopping Board",           name_de: "Schneidebrett",          image: "/equipment/chopping-board.jpg",                  synonyms: ["chopping board", "cutting board", "wooden board"] },
  { name_en: "Sieve / Strainer",         name_de: "Sieb",                   image: "/equipment/sieve.jpg",                           synonyms: ["strainer", "sieve", "colander", "fine mesh strainer", "filter"] },
  { name_en: "Mortar and Pestle",        name_de: "Mörser und Stößel",     image: "/equipment/mortar-and-pestle.jpg",               synonyms: ["mortar", "pestle", "mortar and pestle", "ammi", "stone grinder"] },
  { name_en: "Kitchen Scale",            name_de: "Küchenwaage",            image: "/equipment/kitschen-scale.avif",                 synonyms: ["kitchen scale", "food scale", "weighing scale"] },
  { name_en: "Measuring Cup & Spoon",    name_de: "Messbecher & Messlöffel",image: "/equipment/measuring-cup-and-spoon.jpg",         synonyms: ["measuring cup", "measuring spoon", "measuring cups", "measuring spoons"] },
  { name_en: "Spice Box",                name_de: "Gewürzbox",              image: "/equipment/spice-box.jpg",                       synonyms: ["spice box", "masala dabba", "spice tin"] },
  { name_en: "Loaf Pan",                 name_de: "Kastenform",             image: "/equipment/loaf-pan.jpg",                        synonyms: ["loaf pan", "bread pan", "loaf tin"] },
  { name_en: "Round Pan",                name_de: "Rundbackform",           image: "/equipment/round-pan.avif",                      synonyms: ["round pan", "cake tin", "round cake pan", "springform"] },
  { name_en: "Muffin Tin",               name_de: "Muffinform",             image: "/equipment/muffin-tin.avif",                     synonyms: ["muffin tin", "cupcake tin", "muffin tray"] },
  { name_en: "Tart / Pie Dish",          name_de: "Tart- / Pieform",        image: "/equipment/tart-pie-dish.jpg",                   synonyms: ["tart dish", "pie dish", "pie tin", "tart tin"] },
  { name_en: "Ramekin",                  name_de: "Souffléförmchen",        image: "/equipment/ramekin.jpg",                         synonyms: ["ramekin", "ramekins", "souffle dish"] },
  { name_en: "Piping Bag",               name_de: "Spritzbeutel",           image: "/equipment/piping-bag-with-tip.webp",            synonyms: ["piping bag", "pastry bag", "icing bag"] },
  { name_en: "Cooling Rack",             name_de: "Kuchengitter",           image: "/equipment/cooling-rack.jpg",                    synonyms: ["cooling rack", "wire rack", "baking rack"] },
  { name_en: "Idli Maker",               name_de: "Idli-Form",              image: "/equipment/idli-maker.jpg",                      synonyms: ["idli maker", "idli stand", "idli mould", "idli pot"] },
  { name_en: "Appam Pan",                name_de: "Appam-Pfanne",           image: "/equipment/appam-pan.jpg",                       synonyms: ["appam pan", "appa chatti", "string hopper pan"] },
  { name_en: "Kuzhi Paniyaram Pan",      name_de: "Kuzhi-Paniyaram-Pfanne", image: "/equipment/kuzhi-paniyaram-pan--takoyaki-pan.jpg", synonyms: ["kuzhi paniyaram pan", "takoyaki pan", "paniyaram pan", "appe pan"] },
  { name_en: "Tandoor",                  name_de: "Tandoor",                image: "/equipment/tandoor.jpg",                         synonyms: ["tandoor", "tandoor oven", "clay oven"] },
  { name_en: "Bamboo Steamer Basket",    name_de: "Bambusdämpfkorb",        image: "/equipment/bamboo-steamer-basket.webp",          synonyms: ["bamboo steamer", "bamboo steamer basket", "dim sum steamer"] },
  { name_en: "Sushi Mat",                name_de: "Sushimatte",             image: "/equipment/sushi-mat.webp",                     synonyms: ["sushi mat", "bamboo mat", "makisu"] },
  { name_en: "Fondue Pot",               name_de: "Fonduetopf",             image: "/equipment/fondue-pot.jpg",                      synonyms: ["fondue pot", "fondue set"] },
];

function matchEquipment(label: string) {
  const q = label.toLowerCase().trim().replace(/\s+/g, ' ');
  if (!q) return undefined;
  return (
    EQUIPMENT.find(e => e.name_en.toLowerCase() === q || e.name_de.toLowerCase() === q) ??
    EQUIPMENT.find(e => e.synonyms.some(s => s.toLowerCase() === q)) ??
    EQUIPMENT.find(e => e.name_en.toLowerCase().includes(q) || q.includes(e.name_en.toLowerCase()) ||
      e.synonyms.some(s => s.toLowerCase().includes(q) || q.includes(s.toLowerCase())))
  );
}

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EquipmentRow = { label_en: string; label_de?: string; image?: string };

async function backfill() {
  const { data: recipes, error } = await supabase.from('recipes').select('id, equipment');
  if (error) { console.error('Fetch error:', error.message); return; }
  if (!recipes) return;

  console.log(`Backfilling equipment images for ${recipes.length} recipes…`);
  let updatedCount = 0;

  for (const recipe of recipes) {
    const rows = (recipe.equipment as EquipmentRow[] | null) ?? [];
    if (rows.length === 0) continue;

    let changed = false;
    const updated = rows.map((eq) => {
      if (eq.image) return eq; // already has image, skip
      const match = matchEquipment(eq.label_en);
      if (!match) return eq;
      changed = true;
      return {
        ...eq,
        label_de: eq.label_de && eq.label_de !== eq.label_en ? eq.label_de : match.name_de,
        image: match.image,
      };
    });

    if (!changed) continue;

    const { error: updateErr } = await supabase
      .from('recipes').update({ equipment: updated }).eq('id', recipe.id);

    if (updateErr) {
      console.error(`  ✗ recipe ${recipe.id}:`, updateErr.message);
    } else {
      console.log(`  ✓ recipe ${recipe.id} — enriched ${updated.filter((e: EquipmentRow) => e.image).length} item(s)`);
      updatedCount++;
    }
  }

  console.log(`\nDone. Updated ${updatedCount} recipe(s).`);
}

backfill().catch(console.error);
