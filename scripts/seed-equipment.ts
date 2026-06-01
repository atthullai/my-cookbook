// scripts/seed-equipment.ts
// Run once: npx ts-node scripts/seed-equipment.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EquipmentSeed = {
  name_en: string;
  name_de?: string;
  synonyms: string[];
  category: string;
};

const EQUIPMENT: EquipmentSeed[] = [
  // ─── COOKWARE ────────────────────────────────────────────────────
  { name_en: 'Saucepan / Pot',           name_de: 'Kochtopf',              synonyms: ['saucepan','pot','boiling pot','cooking pot'],                                     category: 'cookware' },
  { name_en: 'Skillet / Pan',            name_de: 'Pfanne',                synonyms: ['skillet','frying pan','pan','saute pan','sautee pan'],                            category: 'cookware' },
  { name_en: 'Kadai / Deep Fry Pan',     name_de: 'Kadai / Frittiertiegel', synonyms: ['kadai','karahi','wok','deep fry pan','deep-fry pan','shallow fry pan'],          category: 'cookware' },
  { name_en: 'Tawa',                     name_de: 'Tawa',                  synonyms: ['tava','griddle','flat pan'],                                                      category: 'cookware' },
  { name_en: 'Pressure Cooker',          name_de: 'Schnellkochtopf',       synonyms: ['pressure cooker','instant pot','instapot'],                                       category: 'cookware' },
  { name_en: 'Tempering Pan',            name_de: 'Temperierpfanne',       synonyms: ['tadka pan','tempering pan','seasoning pan'],                                      category: 'cookware' },
  { name_en: 'Wok',                      name_de: 'Wok',                   synonyms: ['chinese wok'],                                                                    category: 'cookware' },
  { name_en: 'Baking Tray',             name_de: 'Backblech',             synonyms: ['baking tray','sheet pan','baking sheet','cookie sheet'],                          category: 'cookware' },
  { name_en: 'Tandoor',                  name_de: 'Tandoor',               synonyms: ['tandoor oven','clay oven'],                                                       category: 'cookware' },

  // ─── APPLIANCES ──────────────────────────────────────────────────
  { name_en: 'Oven',                     name_de: 'Backofen',              synonyms: ['oven','bake','preheat oven','electric oven'],                                     category: 'appliance' },
  { name_en: 'Mixer Grinder / Blender', name_de: 'Mixer / Standmixer',    synonyms: ['blender','mixer grinder','stand mixer','grinder','food processor','mixie'],       category: 'appliance' },
  { name_en: 'Steamer',                  name_de: 'Dampfgarer',            synonyms: ['steamer','steam cooker','idli steamer'],                                          category: 'appliance' },

  // ─── HAND TOOLS ──────────────────────────────────────────────────
  { name_en: 'Whisk',                    name_de: 'Schneebesen',           synonyms: ['whisk','balloon whisk','hand whisk'],                                             category: 'hand_tool' },
  { name_en: 'Spatula / Ladle',          name_de: 'Spatel / Schöpfkelle', synonyms: ['spatula','ladle','wooden spoon','stirring spoon'],                               category: 'hand_tool' },
  { name_en: 'Rolling Pin',             name_de: 'Nudelholz',             synonyms: ['rolling pin','chapati roller','belan'],                                           category: 'hand_tool' },
  { name_en: 'Knife',                    name_de: 'Messer',                synonyms: ['chef knife','knife','chopping knife'],                                            category: 'hand_tool' },
  { name_en: 'Piping Bag',              name_de: 'Spritzbeutel',          synonyms: ['piping bag','pastry bag','icing bag'],                                            category: 'hand_tool' },

  // ─── PREP TOOLS ──────────────────────────────────────────────────
  { name_en: 'Mixing Bowl',             name_de: 'Rührschüssel',          synonyms: ['mixing bowl','bowl','large bowl'],                                                 category: 'prep' },
  { name_en: 'Chopping Board',          name_de: 'Schneidebrett',         synonyms: ['chopping board','cutting board','wooden board'],                                  category: 'prep' },
  { name_en: 'Strainer / Sieve',        name_de: 'Sieb',                  synonyms: ['strainer','sieve','colander','fine mesh strainer','filter'],                      category: 'prep' },
  { name_en: 'Mortar and Pestle',       name_de: 'Mörser und Stößel',    synonyms: ['mortar','pestle','mortar and pestle','stone grinder','ammi'],                     category: 'prep' },
];

async function seed() {
  console.log(`Seeding ${EQUIPMENT.length} equipment items…`);
  const { error } = await supabase
    .from('equipment')
    .upsert(EQUIPMENT, { onConflict: 'name_en', ignoreDuplicates: false });
  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log('Done.');
}

seed();
