// scripts/seed-ingredients.ts
// Run once: npx ts-node -e "require('dotenv').config(); require('./scripts/seed-ingredients.ts')"
// Or: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/seed-ingredients.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type IngredientSeed = {
  name_en: string;
  name_de?: string;
  synonyms: string[];
  category: string;
  default_unit?: string;
  density?: number;
  weight_per_tsp?: number;
  weight_per_tbsp?: number;
  weight_per_cup?: number;
  weight_per_piece?: number;
  weight_per_sprig?: number;
  edible_portion?: number;
  weight_confidence: 'exact' | 'measured' | 'estimated' | 'unknown';
};

const INGREDIENTS: IngredientSeed[] = [
  // ─── OILS & FATS ───────────────────────────────────────────────
  { name_en: 'sesame oil', name_de: 'Sesamöl', synonyms: ['gingelly oil','nellennai','til oil','sesame seed oil','gingely oil'], category: 'oils', default_unit: 'ml', density: 0.91, weight_per_tsp: 4.5, weight_per_tbsp: 13.6, weight_confidence: 'exact' },
  { name_en: 'coconut oil', name_de: 'Kokosöl', synonyms: ['nariyal tel','coconut cooking oil'], category: 'oils', default_unit: 'ml', density: 0.92, weight_per_tsp: 4.5, weight_per_tbsp: 13.6, weight_confidence: 'exact' },
  { name_en: 'groundnut oil', name_de: 'Erdnussöl', synonyms: ['peanut oil','moongphali tel','arachide oil'], category: 'oils', default_unit: 'ml', density: 0.91, weight_per_tsp: 4.5, weight_per_tbsp: 13.6, weight_confidence: 'exact' },
  { name_en: 'mustard oil', name_de: 'Senföl', synonyms: ['sarson ka tel','kadugu ennai'], category: 'oils', default_unit: 'ml', density: 0.91, weight_per_tsp: 4.5, weight_per_tbsp: 13.6, weight_confidence: 'exact' },
  { name_en: 'sunflower oil', name_de: 'Sonnenblumenöl', synonyms: ['sunflower cooking oil'], category: 'oils', default_unit: 'ml', density: 0.92, weight_per_tsp: 4.5, weight_per_tbsp: 13.6, weight_confidence: 'exact' },
  { name_en: 'rapeseed oil', name_de: 'Rapsöl', synonyms: ['canola oil','canola','rapsöl','colza oil'], category: 'oils', default_unit: 'ml', density: 0.91, weight_per_tsp: 4.5, weight_per_tbsp: 13.6, weight_confidence: 'exact' },
  { name_en: 'olive oil', name_de: 'Olivenöl', synonyms: ['olio di oliva'], category: 'oils', default_unit: 'ml', density: 0.91, weight_per_tsp: 4.5, weight_per_tbsp: 13.5, weight_confidence: 'exact' },
  { name_en: 'extra virgin olive oil', name_de: 'Natives Olivenöl Extra', synonyms: ['EVOO','extra vergine','kaltgepresstes olivenöl'], category: 'oils', default_unit: 'ml', density: 0.91, weight_per_tsp: 4.5, weight_per_tbsp: 13.5, weight_confidence: 'exact' },
  { name_en: 'rice bran oil', name_de: 'Reiskleieöl', synonyms: ['rice oil'], category: 'oils', default_unit: 'ml', density: 0.92, weight_per_tsp: 4.5, weight_per_tbsp: 13.6, weight_confidence: 'exact' },
  { name_en: 'walnut oil', name_de: 'Walnussöl', synonyms: ['huile de noix'], category: 'oils', default_unit: 'ml', density: 0.92, weight_per_tsp: 4.5, weight_per_tbsp: 13.6, weight_confidence: 'exact' },
  { name_en: 'flaxseed oil', name_de: 'Leinöl', synonyms: ['linseed oil','flax oil'], category: 'oils', default_unit: 'ml', density: 0.93, weight_per_tsp: 4.6, weight_per_tbsp: 13.8, weight_confidence: 'exact' },
  { name_en: 'corn oil', name_de: 'Maiskeimöl', synonyms: ['corn germ oil','maize oil'], category: 'oils', default_unit: 'ml', density: 0.92, weight_per_tsp: 4.5, weight_per_tbsp: 13.6, weight_confidence: 'exact' },
  { name_en: 'grapeseed oil', name_de: 'Traubenkernöl', synonyms: ['grape seed oil'], category: 'oils', default_unit: 'ml', density: 0.92, weight_per_tsp: 4.5, weight_per_tbsp: 13.6, weight_confidence: 'exact' },
  { name_en: 'avocado oil', name_de: 'Avocadoöl', synonyms: [], category: 'oils', default_unit: 'ml', density: 0.91, weight_per_tsp: 4.5, weight_per_tbsp: 13.5, weight_confidence: 'exact' },
  { name_en: 'ghee', name_de: 'Ghee', synonyms: ['clarified butter','desi ghee','usli ghee'], category: 'oils', default_unit: 'tbsp', density: 0.91, weight_per_tsp: 4.6, weight_per_tbsp: 13.8, weight_confidence: 'exact' },
  { name_en: 'butter', name_de: 'Butter', synonyms: ['unsalted butter','salted butter','beurre','burro'], category: 'oils', default_unit: 'tbsp', weight_per_tsp: 4.7, weight_per_tbsp: 14.2, weight_per_cup: 227, weight_confidence: 'exact' },
  { name_en: 'oil', name_de: 'Öl', synonyms: ['cooking oil','vegetable oil','oil of your choice','any oil'], category: 'oils', default_unit: 'ml', density: 0.92, weight_per_tsp: 4.5, weight_per_tbsp: 13.5, weight_confidence: 'estimated' },

  // ─── WHOLE SPICES ───────────────────────────────────────────────
  { name_en: 'mustard seeds', name_de: 'Senfkörner', synonyms: ['rai','kadugu','sarson','black mustard seeds','yellow mustard seeds'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 3.3, weight_per_tbsp: 9.9, weight_confidence: 'exact' },
  { name_en: 'cumin seeds', name_de: 'Kreuzkümmel', synonyms: ['jeera','jeeragam','zeera','whole cumin'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 2.1, weight_per_tbsp: 6.3, weight_confidence: 'exact' },
  { name_en: 'fennel seeds', name_de: 'Fenchelsamen', synonyms: ['saunf','sombu','perunjeeragam'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 2.0, weight_per_tbsp: 6.0, weight_confidence: 'exact' },
  { name_en: 'fenugreek seeds', name_de: 'Bockshornkleesamen', synonyms: ['methi seeds','vendhayam','uluva','methi dana'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 3.7, weight_per_tbsp: 11.1, weight_confidence: 'exact' },
  { name_en: 'coriander seeds', name_de: 'Koriandersamen', synonyms: ['dhania','malli','corriander seeds','whole coriander'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 1.8, weight_per_tbsp: 5.4, weight_confidence: 'exact' },
  { name_en: 'ajwain', name_de: 'Ajowan', synonyms: ['carom seeds','omam','bishops weed','thymol seeds'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 2.3, weight_per_tbsp: 6.9, weight_confidence: 'exact' },
  { name_en: 'caraway seeds', name_de: 'Kümmel', synonyms: ['shah jeera','kala jeera','black cumin'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 2.1, weight_per_tbsp: 6.3, weight_confidence: 'exact' },
  { name_en: 'peppercorns', name_de: 'Pfefferkörner', synonyms: ['black pepper','milagu','kali mirch','whole pepper'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 2.3, weight_per_tbsp: 6.9, weight_confidence: 'exact' },
  { name_en: 'cardamom', name_de: 'Kardamom', synonyms: ['elaichi','elakkai','green cardamom','hari elaichi'], category: 'spices_whole', default_unit: 'no.', weight_per_piece: 0.8, weight_per_tsp: 2.0, weight_confidence: 'exact' },
  { name_en: 'black cardamom', name_de: 'Schwarzer Kardamom', synonyms: ['badi elaichi','kali elaichi','brown cardamom'], category: 'spices_whole', default_unit: 'no.', weight_per_piece: 1.5, weight_confidence: 'exact' },
  { name_en: 'cloves', name_de: 'Gewürznelken', synonyms: ['laung','krambu','lavang'], category: 'spices_whole', default_unit: 'no.', weight_per_piece: 0.2, weight_per_tsp: 2.1, weight_confidence: 'exact' },
  { name_en: 'cinnamon stick', name_de: 'Zimtstange', synonyms: ['dalchini','pattai','cannella'], category: 'spices_whole', default_unit: 'no.', weight_per_piece: 2.5, weight_confidence: 'estimated' },
  { name_en: 'nutmeg', name_de: 'Muskatnuss', synonyms: ['jaiphal','jathikai'], category: 'spices_whole', default_unit: 'no.', weight_per_piece: 8.0, weight_per_tsp: 2.3, weight_confidence: 'exact' },
  { name_en: 'bay leaf', name_de: 'Lorbeerblatt', synonyms: ['tej patta','brinji ilai','bay leaves'], category: 'spices_whole', default_unit: 'no.', weight_per_piece: 0.4, weight_confidence: 'estimated' },
  { name_en: 'star anise', name_de: 'Sternanis', synonyms: ['chakra phool','annasi poo'], category: 'spices_whole', default_unit: 'no.', weight_per_piece: 1.0, weight_confidence: 'estimated' },
  { name_en: 'poppy seeds', name_de: 'Mohnsamen', synonyms: ['khus khus','kasa kasa','posto'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 2.8, weight_per_tbsp: 8.4, weight_confidence: 'exact' },
  { name_en: 'sesame seeds', name_de: 'Sesamsamen', synonyms: ['til','ellu','gingelly seeds','white sesame'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 3.0, weight_per_tbsp: 9.0, weight_confidence: 'exact' },
  { name_en: 'dried red chilli', name_de: 'Getrocknete rote Chilli', synonyms: ['dry red chili','sukhi lal mirch','dried red chillies','dry red chilies'], category: 'spices_whole', default_unit: 'no.', weight_per_piece: 1.5, weight_confidence: 'estimated' },
  { name_en: 'dried kashmiri chilli', name_de: 'Getrocknete Kashmiri Chilli', synonyms: ['kashmiri dry red chilli','kashmiri mirch whole'], category: 'spices_whole', default_unit: 'no.', weight_per_piece: 2.0, weight_confidence: 'estimated' },
  { name_en: 'saffron', name_de: 'Safran', synonyms: ['kesar','zafran'], category: 'spices_whole', default_unit: 'pinch', weight_per_piece: 0.1, weight_confidence: 'estimated' },
  { name_en: 'dried chilli flakes', name_de: 'Chiliflocken', synonyms: ['chili flakes','red pepper flakes','peperoncino'], category: 'spices_whole', default_unit: 'tsp', weight_per_tsp: 2.5, weight_per_tbsp: 7.5, weight_confidence: 'exact' },
  { name_en: 'black stone flower', name_de: 'Kalpasi', synonyms: ['kalpasi','dagad phool'], category: 'spices_whole', default_unit: 'no.', weight_per_piece: 1.0, weight_confidence: 'estimated' },

  // ─── SPICE POWDERS ─────────────────────────────────────────────
  { name_en: 'turmeric powder', name_de: 'Kurkuma', synonyms: ['haldi','manjal','turmeric','ground turmeric','kurkuma'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 3.0, weight_per_tbsp: 9.0, weight_confidence: 'exact' },
  { name_en: 'cumin powder', name_de: 'Kreuzkümmel gemahlen', synonyms: ['jeera powder','ground cumin','powdered cumin'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.1, weight_per_tbsp: 6.3, weight_confidence: 'exact' },
  { name_en: 'coriander powder', name_de: 'Korianderpulver', synonyms: ['dhania powder','malli podi','ground coriander'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.5, weight_per_tbsp: 7.5, weight_confidence: 'exact' },
  { name_en: 'red chilli powder', name_de: 'Rotes Chilipulver', synonyms: ['chilli powder','lal mirch','milagai podi','red chili powder','chili powder'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.5, weight_per_tbsp: 7.5, weight_confidence: 'exact' },
  { name_en: 'kashmiri chilli powder', name_de: 'Kashmiri Chilipulver', synonyms: ['kashmiri red chili powder','kashmiri mirch powder','kashmiri chili powder'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.5, weight_per_tbsp: 7.5, weight_confidence: 'exact' },
  { name_en: 'black pepper powder', name_de: 'Schwarzer Pfeffer gemahlen', synonyms: ['ground black pepper','pepper powder'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.3, weight_per_tbsp: 6.9, weight_confidence: 'exact' },
  { name_en: 'paprika powder', name_de: 'Paprikapulver', synonyms: ['paprika','smoked paprika','sweet paprika'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.3, weight_per_tbsp: 6.9, weight_confidence: 'exact' },
  { name_en: 'cinnamon powder', name_de: 'Zimt gemahlen', synonyms: ['dalchini powder','ground cinnamon','zimt'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.6, weight_per_tbsp: 7.8, weight_confidence: 'exact' },
  { name_en: 'amchur powder', name_de: 'Amchur', synonyms: ['dry mango powder','amchoor','aamchur'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.5, weight_per_tbsp: 7.5, weight_confidence: 'exact' },
  { name_en: 'garlic powder', name_de: 'Knoblauchpulver', synonyms: ['powdered garlic','garlic granules'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 3.1, weight_per_tbsp: 9.3, weight_confidence: 'exact' },
  { name_en: 'onion powder', name_de: 'Zwiebelpulver', synonyms: ['powdered onion','onion granules'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.4, weight_per_tbsp: 7.2, weight_confidence: 'exact' },
  { name_en: 'garam masala', name_de: 'Garam Masala', synonyms: ['garam masala powder','indian spice mix'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.5, weight_per_tbsp: 7.5, weight_confidence: 'estimated' },
  { name_en: 'sambar powder', name_de: 'Sambarpulver', synonyms: ['sambar masala','kulambu powder'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.5, weight_per_tbsp: 7.5, weight_confidence: 'estimated' },
  { name_en: 'biryani masala', name_de: 'Biryani Masala', synonyms: ['biryani masala powder','biryani spice mix'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.5, weight_per_tbsp: 7.5, weight_confidence: 'estimated' },
  { name_en: 'fenugreek powder', name_de: 'Bockshornkleepulver', synonyms: ['methi powder','vendhaya podi','ground fenugreek'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 3.7, weight_per_tbsp: 11.1, weight_confidence: 'exact' },
  { name_en: 'curry powder', name_de: 'Currypulver', synonyms: ['curry','currymischung','madras curry'], category: 'spices_powder', default_unit: 'tsp', weight_per_tsp: 2.5, weight_per_tbsp: 7.5, weight_confidence: 'estimated' },
  { name_en: 'asafoetida', name_de: 'Asant', synonyms: ['hing','perungayam','heeng'], category: 'spices_powder', default_unit: 'pinch', weight_per_tsp: 3.5, weight_confidence: 'exact' },
  { name_en: 'cocoa powder', name_de: 'Kakaopulver', synonyms: ['unsweetened cocoa','dutch cocoa','cacao powder'], category: 'spices_powder', default_unit: 'tbsp', weight_per_tsp: 2.5, weight_per_tbsp: 7.5, weight_per_cup: 120, weight_confidence: 'exact' },

  // ─── HERBS & DRIED LEAVES ──────────────────────────────────────
  { name_en: 'curry leaves', name_de: 'Curryblätter', synonyms: ['few curry leaves','kadi patta','karivepilai','meetha neem'], category: 'herbs', default_unit: 'sprig', weight_per_sprig: 2.0, weight_confidence: 'estimated' },
  { name_en: 'coriander leaves', name_de: 'Korianderblätter', synonyms: ['cilantro','dhania','kothamalli','few coriander leaves','corriander leaves','fresh coriander'], category: 'herbs', default_unit: 'tbsp', weight_per_tbsp: 3.0, weight_per_cup: 25.0, weight_confidence: 'estimated' },
  { name_en: 'mint leaves', name_de: 'Minzblätter', synonyms: ['pudina','fresh mint'], category: 'herbs', default_unit: 'tbsp', weight_per_tbsp: 2.5, weight_per_cup: 20.0, weight_confidence: 'estimated' },
  { name_en: 'kasoori methi', name_de: 'Kasuri Methi', synonyms: ['dried kasoori methi','kasuri methi','fenugreek leaves dried'], category: 'herbs', default_unit: 'tsp', weight_per_tsp: 1.0, weight_per_tbsp: 3.0, weight_confidence: 'estimated' },
  { name_en: 'dill', name_de: 'Dill', synonyms: ['dill leaves','dillkraut','fresh dill'], category: 'herbs', default_unit: 'tbsp', weight_per_tbsp: 3.0, weight_confidence: 'estimated' },
  { name_en: 'rosemary', name_de: 'Rosmarin', synonyms: ['rosmarin','rosemary sprig','fresh rosemary'], category: 'herbs', default_unit: 'sprig', weight_per_sprig: 3.0, weight_confidence: 'estimated' },
  { name_en: 'thyme', name_de: 'Thymian', synonyms: ['thymian','thyme leaf','fresh thyme'], category: 'herbs', default_unit: 'sprig', weight_per_sprig: 1.5, weight_confidence: 'estimated' },
  { name_en: 'basil', name_de: 'Basilikum', synonyms: ['basilikum','sweet basil','fresh basil'], category: 'herbs', default_unit: 'tbsp', weight_per_tbsp: 3.0, weight_per_cup: 25.0, weight_confidence: 'estimated' },
  { name_en: 'parsley', name_de: 'Petersilie', synonyms: ['petersilie','fresh parsley'], category: 'herbs', default_unit: 'tbsp', weight_per_tbsp: 3.5, weight_per_cup: 30.0, weight_confidence: 'estimated' },
  { name_en: 'chives', name_de: 'Schnittlauch', synonyms: ['schnittlauch','fresh chives'], category: 'herbs', default_unit: 'tbsp', weight_per_tbsp: 3.0, weight_confidence: 'estimated' },
  { name_en: 'spring onion', name_de: 'Frühlingszwiebel', synonyms: ['green onion','scallion','frühlingszwiebel','hara pyaz'], category: 'herbs', default_unit: 'no.', weight_per_piece: 15.0, weight_confidence: 'estimated' },
  { name_en: 'lemongrass', name_de: 'Zitronengras', synonyms: ['sereh','zitronengras'], category: 'herbs', default_unit: 'no.', weight_per_piece: 20.0, weight_confidence: 'estimated' },
  { name_en: 'kaffir lime leaves', name_de: 'Kaffirlimettenblätter', synonyms: ['makrut lime leaves','bai magrood'], category: 'herbs', default_unit: 'no.', weight_per_piece: 0.5, weight_confidence: 'estimated' },

  // ─── AROMATICS ─────────────────────────────────────────────────
  { name_en: 'onion', name_de: 'Zwiebel', synonyms: ['onions','zwiebel','pyaz','vengayam','brown onion','yellow onion'], category: 'aromatics', default_unit: 'no.', weight_per_piece: 110.0, edible_portion: 0.9, weight_confidence: 'estimated' },
  { name_en: 'shallots', name_de: 'Schalotten', synonyms: ['small onions','sambar onion','chinna vengayam','pearl onions'], category: 'aromatics', default_unit: 'no.', weight_per_piece: 20.0, edible_portion: 0.9, weight_confidence: 'estimated' },
  { name_en: 'garlic', name_de: 'Knoblauch', synonyms: ['knoblauch','lahsun','poondu','aglio'], category: 'aromatics', default_unit: 'no.', weight_per_piece: 4.0, edible_portion: 0.85, weight_confidence: 'exact' },
  { name_en: 'ginger', name_de: 'Ingwer', synonyms: ['adrak','inji','ingwer','fresh ginger'], category: 'aromatics', default_unit: 'no.', weight_per_piece: 30.0, weight_per_tsp: 2.0, weight_confidence: 'estimated' },
  { name_en: 'green chilli', name_de: 'Grüne Chilli', synonyms: ['green chillies','green chilies','green chili','hari mirch','pachamilagai'], category: 'aromatics', default_unit: 'no.', weight_per_piece: 5.0, edible_portion: 0.95, weight_confidence: 'estimated' },
  { name_en: 'ginger-garlic paste', name_de: 'Ingwer-Knoblauch-Paste', synonyms: ['ginger garlic paste','adrak lahsun paste'], category: 'aromatics', default_unit: 'tsp', weight_per_tsp: 5.0, weight_per_tbsp: 15.0, weight_confidence: 'estimated' },
  { name_en: 'tomato', name_de: 'Tomate', synonyms: ['tomatoes','tamatar','thakkali','cherry tomato','pomodoro'], category: 'aromatics', default_unit: 'no.', weight_per_piece: 120.0, edible_portion: 0.95, weight_confidence: 'estimated' },
  { name_en: 'jalapeño', name_de: 'Jalapeño', synonyms: ['jalapeños','jalapeno pepper'], category: 'aromatics', default_unit: 'no.', weight_per_piece: 14.0, weight_confidence: 'estimated' },

  // ─── VEGETABLES ────────────────────────────────────────────────
  { name_en: 'potato', name_de: 'Kartoffel', synonyms: ['aloo','urulaikizhangu','kartoffel'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 170.0, edible_portion: 0.85, weight_confidence: 'estimated' },
  { name_en: 'sweet potato', name_de: 'Süßkartoffel', synonyms: ['shakarkand','batata'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 130.0, edible_portion: 0.85, weight_confidence: 'estimated' },
  { name_en: 'cauliflower', name_de: 'Blumenkohl', synonyms: ['gobi','blumenkohl'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 600.0, weight_per_cup: 100.0, edible_portion: 0.55, weight_confidence: 'estimated' },
  { name_en: 'cabbage', name_de: 'Weißkohl', synonyms: ['kohl','patta gobhi','muttaikose','weißkohl'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 900.0, weight_per_cup: 90.0, edible_portion: 0.79, weight_confidence: 'estimated' },
  { name_en: 'spinach', name_de: 'Spinat', synonyms: ['palak','keerai'], category: 'vegetables', default_unit: 'cup', weight_per_cup: 30.0, edible_portion: 0.92, weight_confidence: 'estimated' },
  { name_en: 'capsicum', name_de: 'Paprika', synonyms: ['bell pepper','shimla mirch','paprika','peperone'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 150.0, edible_portion: 0.82, weight_confidence: 'estimated' },
  { name_en: 'ladies finger', name_de: 'Okra', synonyms: ['okra','bhindi','vendakkai'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 8.0, edible_portion: 0.9, weight_confidence: 'estimated' },
  { name_en: 'brinjal', name_de: 'Aubergine', synonyms: ['eggplant','aubergine','baingan','kathirikkai'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 200.0, edible_portion: 0.81, weight_confidence: 'estimated' },
  { name_en: 'carrot', name_de: 'Karotte', synonyms: ['gajar','karotte'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 80.0, edible_portion: 0.88, weight_confidence: 'estimated' },
  { name_en: 'radish', name_de: 'Rettich', synonyms: ['mooli','mullangi','daikon','white radish'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 200.0, edible_portion: 0.9, weight_confidence: 'estimated' },
  { name_en: 'beetroot', name_de: 'Rote Bete', synonyms: ['beet root','rote bete','chukandar'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 160.0, edible_portion: 0.9, weight_confidence: 'estimated' },
  { name_en: 'green peas', name_de: 'Erbsen', synonyms: ['peas','matar','pattani','erbsen'], category: 'vegetables', default_unit: 'cup', weight_per_cup: 145.0, weight_confidence: 'exact' },
  { name_en: 'mushroom', name_de: 'Champignon', synonyms: ['pilze','champignon','button mushroom'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 18.0, edible_portion: 0.97, weight_confidence: 'estimated' },
  { name_en: 'cucumber', name_de: 'Gurke', synonyms: ['gurke','kheera','vellarikai'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 200.0, edible_portion: 0.96, weight_confidence: 'estimated' },
  { name_en: 'bitter gourd', name_de: 'Bittergurke', synonyms: ['karela','pavakkai','bitter melon'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 80.0, edible_portion: 0.85, weight_confidence: 'estimated' },
  { name_en: 'ridge gourd', name_de: 'Rippengurke', synonyms: ['turai','peerkangai','luffa'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 200.0, edible_portion: 0.82, weight_confidence: 'estimated' },
  { name_en: 'bottle gourd', name_de: 'Flaschenkürbis', synonyms: ['lauki','sorakkai','dudhi'], category: 'vegetables', default_unit: 'g', weight_per_cup: 130.0, weight_confidence: 'estimated' },
  { name_en: 'drumstick', name_de: 'Moringa-Hülse', synonyms: ['moringa pods','murungakkai'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 30.0, weight_confidence: 'estimated' },
  { name_en: 'taro root', name_de: 'Taro', synonyms: ['arbi','seppankizhangu','colocasia'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 120.0, edible_portion: 0.85, weight_confidence: 'estimated' },
  { name_en: 'broad beans', name_de: 'Dicke Bohnen', synonyms: ['avarakkai','field beans','fava beans'], category: 'vegetables', default_unit: 'cup', weight_per_cup: 150.0, weight_confidence: 'estimated' },
  { name_en: 'cluster beans', name_de: 'Guarbohnen', synonyms: ['guar phalli','kothavarangai'], category: 'vegetables', default_unit: 'cup', weight_per_cup: 100.0, weight_confidence: 'estimated' },
  { name_en: 'ivy gourd', name_de: 'Efeugurke', synonyms: ['kovakkai','tondli','tendli'], category: 'vegetables', default_unit: 'cup', weight_per_cup: 100.0, weight_confidence: 'estimated' },
  { name_en: 'corn', name_de: 'Mais', synonyms: ['maize','makka cholam','sweetcorn'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 150.0, edible_portion: 0.78, weight_confidence: 'estimated' },
  { name_en: 'zucchini', name_de: 'Zucchini', synonyms: ['courgette','summer squash'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 200.0, edible_portion: 0.95, weight_confidence: 'estimated' },
  { name_en: 'asparagus', name_de: 'Spargel', synonyms: ['spargel'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 20.0, edible_portion: 0.94, weight_confidence: 'estimated' },
  { name_en: 'celery', name_de: 'Sellerie', synonyms: ['sellerie'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 40.0, edible_portion: 0.95, weight_confidence: 'estimated' },
  { name_en: 'leek', name_de: 'Lauch', synonyms: ['lauch'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 100.0, edible_portion: 0.7, weight_confidence: 'estimated' },
  { name_en: 'fennel bulb', name_de: 'Fenchelknolle', synonyms: ['fenchel','finocchio'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 250.0, edible_portion: 0.77, weight_confidence: 'estimated' },
  { name_en: 'bok choy', name_de: 'Pak Choi', synonyms: ['pak choi','chinese cabbage'], category: 'vegetables', default_unit: 'no.', weight_per_piece: 170.0, edible_portion: 0.9, weight_confidence: 'estimated' },
  { name_en: 'bean sprouts', name_de: 'Bohnensprossen', synonyms: ['bohnensprossen','mung bean sprouts'], category: 'vegetables', default_unit: 'cup', weight_per_cup: 104.0, weight_confidence: 'estimated' },

  // ─── FRUITS ────────────────────────────────────────────────────
  { name_en: 'mango', name_de: 'Mango', synonyms: ['aam','manga','alphonso'], category: 'fruits', default_unit: 'no.', weight_per_piece: 200.0, edible_portion: 0.67, weight_confidence: 'estimated' },
  { name_en: 'raw mango', name_de: 'Grüne Mango', synonyms: ['green mango','kacha aam','maangai'], category: 'fruits', default_unit: 'no.', weight_per_piece: 200.0, edible_portion: 0.77, weight_confidence: 'estimated' },
  { name_en: 'banana', name_de: 'Banane', synonyms: ['kela','vazhai pazham'], category: 'fruits', default_unit: 'no.', weight_per_piece: 120.0, edible_portion: 0.64, weight_confidence: 'estimated' },
  { name_en: 'apple', name_de: 'Apfel', synonyms: ['apfel','seb'], category: 'fruits', default_unit: 'no.', weight_per_piece: 180.0, edible_portion: 0.9, weight_confidence: 'estimated' },
  { name_en: 'lemon', name_de: 'Zitrone', synonyms: ['nimbu','elumichai','zitrone'], category: 'fruits', default_unit: 'no.', weight_per_piece: 80.0, edible_portion: 0.52, weight_confidence: 'estimated' },
  { name_en: 'lime', name_de: 'Limette', synonyms: ['limette','neembu'], category: 'fruits', default_unit: 'no.', weight_per_piece: 60.0, edible_portion: 0.49, weight_confidence: 'estimated' },
  { name_en: 'coconut', name_de: 'Kokosnuss', synonyms: ['fresh coconut','grated coconut','nariyal','thengai','desiccated coconut'], category: 'fruits', default_unit: 'cup', weight_per_cup: 80.0, weight_confidence: 'estimated' },
  { name_en: 'tamarind', name_de: 'Tamarinde', synonyms: ['imli','puli','tamarind paste','tamarind water','tamarind pulp'], category: 'fruits', default_unit: 'g', weight_per_piece: 25.0, weight_confidence: 'estimated' },
  { name_en: 'coconut milk', name_de: 'Kokosmilch', synonyms: ['nariyal doodh','kokosmilch'], category: 'fruits', default_unit: 'ml', density: 1.02, weight_per_cup: 240.0, weight_confidence: 'exact' },
  { name_en: 'pomegranate', name_de: 'Granatapfel', synonyms: ['anar','granatapfel'], category: 'fruits', default_unit: 'no.', weight_per_piece: 280.0, edible_portion: 0.56, weight_confidence: 'estimated' },
  { name_en: 'raw banana', name_de: 'Grüne Banane', synonyms: ['green banana','vazhakkai'], category: 'fruits', default_unit: 'no.', weight_per_piece: 120.0, weight_confidence: 'estimated' },
  { name_en: 'jackfruit', name_de: 'Jackfrucht', synonyms: ['kathal','chakka'], category: 'fruits', default_unit: 'g', weight_per_cup: 165.0, edible_portion: 0.72, weight_confidence: 'estimated' },
  { name_en: 'raw jackfruit', name_de: 'Unreife Jackfrucht', synonyms: ['green jackfruit','kachcha kathal'], category: 'fruits', default_unit: 'g', weight_per_cup: 165.0, weight_confidence: 'estimated' },
  { name_en: 'dry grapes', name_de: 'Rosinen', synonyms: ['raisins','kishmish','rosinen','sultanas'], category: 'fruits', default_unit: 'cup', weight_per_cup: 165.0, weight_confidence: 'exact' },
  { name_en: 'date', name_de: 'Dattel', synonyms: ['khajur','medjool date','dattel'], category: 'fruits', default_unit: 'no.', weight_per_piece: 24.0, edible_portion: 0.87, weight_confidence: 'estimated' },

  // ─── PROTEINS ──────────────────────────────────────────────────
  { name_en: 'chicken', name_de: 'Hähnchen', synonyms: ['hähnchen','pollo','murgh','kozhi'], category: 'proteins', default_unit: 'g', weight_per_piece: 1200.0, weight_confidence: 'estimated' },
  { name_en: 'chicken breast', name_de: 'Hähnchenbrustfilet', synonyms: ['hähnchenbrustfilet'], category: 'proteins', default_unit: 'no.', weight_per_piece: 150.0, weight_confidence: 'estimated' },
  { name_en: 'lamb', name_de: 'Lammfleisch', synonyms: ['mutton','lammfleisch','gosht','aadu kari'], category: 'proteins', default_unit: 'g', weight_confidence: 'estimated' },
  { name_en: 'beef', name_de: 'Rindfleisch', synonyms: ['rindfleisch','manzo'], category: 'proteins', default_unit: 'g', weight_confidence: 'estimated' },
  { name_en: 'pork', name_de: 'Schweinefleisch', synonyms: ['schweinefleisch','maiale'], category: 'proteins', default_unit: 'g', weight_confidence: 'estimated' },
  { name_en: 'minced meat', name_de: 'Hackfleisch', synonyms: ['hackfleisch','ground meat','keema','kheema'], category: 'proteins', default_unit: 'g', weight_confidence: 'estimated' },
  { name_en: 'fish', name_de: 'Fisch', synonyms: ['fisch','meen'], category: 'proteins', default_unit: 'g', weight_confidence: 'estimated' },
  { name_en: 'salmon', name_de: 'Lachs', synonyms: ['lachs','saumon'], category: 'proteins', default_unit: 'g', weight_per_piece: 150.0, weight_confidence: 'estimated' },
  { name_en: 'prawns', name_de: 'Garnelen', synonyms: ['shrimp','garnelen','chingri','jhinga'], category: 'proteins', default_unit: 'no.', weight_per_piece: 10.0, weight_confidence: 'estimated' },
  { name_en: 'tofu', name_de: 'Tofu', synonyms: ['firm tofu','silken tofu','bean curd'], category: 'proteins', default_unit: 'g', weight_per_cup: 252.0, weight_confidence: 'exact' },
  { name_en: 'egg', name_de: 'Ei', synonyms: ['eggs','egg yolks','ei','uovo'], category: 'proteins', default_unit: 'no.', weight_per_piece: 55.0, weight_confidence: 'exact' },

  // ─── DAIRY ─────────────────────────────────────────────────────
  { name_en: 'milk', name_de: 'Milch', synonyms: ['milch','doodh','pal','whole milk','full cream milk'], category: 'dairy', default_unit: 'ml', density: 1.03, weight_per_cup: 245.0, weight_confidence: 'exact' },
  { name_en: 'yogurt', name_de: 'Joghurt', synonyms: ['curd','thick curd','dahi','mosaru','joghurt'], category: 'dairy', default_unit: 'cup', weight_per_cup: 245.0, weight_per_tbsp: 15.0, weight_confidence: 'exact' },
  { name_en: 'heavy cream', name_de: 'Schlagsahne', synonyms: ['schlagsahne','fresh cream','whipping cream','sahne'], category: 'dairy', default_unit: 'ml', density: 1.01, weight_per_cup: 240.0, weight_per_tbsp: 15.0, weight_confidence: 'exact' },
  { name_en: 'buttermilk', name_de: 'Buttermilch', synonyms: ['butter milk','chaas','moru','buttermilch'], category: 'dairy', default_unit: 'ml', density: 1.03, weight_per_cup: 245.0, weight_confidence: 'exact' },
  { name_en: 'condensed milk', name_de: 'Kondensmilch gesüßt', synonyms: ['sweetened condensed milk'], category: 'dairy', default_unit: 'tbsp', weight_per_tbsp: 19.0, weight_per_cup: 306.0, weight_confidence: 'exact' },

  // ─── CHEESE ────────────────────────────────────────────────────
  { name_en: 'parmigiano reggiano', name_de: 'Parmesan', synonyms: ['parmesan','parmigiano','grana padano'], category: 'cheese', default_unit: 'g', weight_per_tbsp: 5.0, weight_per_cup: 80.0, weight_confidence: 'exact' },
  { name_en: 'mozzarella', name_de: 'Mozzarella', synonyms: ['mozarella','fresh mozzarella'], category: 'cheese', default_unit: 'g', weight_per_cup: 130.0, weight_confidence: 'exact' },
  { name_en: 'cream cheese', name_de: 'Frischkäse', synonyms: ['frischkäse','philadelphia'], category: 'cheese', default_unit: 'tbsp', weight_per_tbsp: 14.5, weight_per_cup: 232.0, weight_confidence: 'exact' },
  { name_en: 'feta', name_de: 'Feta', synonyms: ['fetakäse','greek cheese'], category: 'cheese', default_unit: 'g', weight_per_cup: 150.0, weight_confidence: 'exact' },

  // ─── DALS & LEGUMES ────────────────────────────────────────────
  { name_en: 'toor dal', name_de: 'Toor Dal', synonyms: ['toor daal','arhar dal','pigeon pea','thuvaram paruppu'], category: 'dals', default_unit: 'cup', weight_per_cup: 190.0, weight_confidence: 'exact' },
  { name_en: 'chana dal', name_de: 'Chana Dal', synonyms: ['channa daal','bengal gram','split chickpea','kadalai paruppu'], category: 'dals', default_unit: 'cup', weight_per_cup: 185.0, weight_confidence: 'exact' },
  { name_en: 'urad dal', name_de: 'Urad Dal', synonyms: ['urad daal','black gram split','ulutham paruppu','white lentil'], category: 'dals', default_unit: 'cup', weight_per_cup: 185.0, weight_confidence: 'exact' },
  { name_en: 'black urad dal', name_de: 'Schwarzer Urad Dal', synonyms: ['whole urad dal','black gram whole','muzhu ulutham','sabut urad'], category: 'dals', default_unit: 'cup', weight_per_cup: 185.0, weight_confidence: 'exact' },
  { name_en: 'moong dal', name_de: 'Mungbohnen Dal', synonyms: ['yellow moong daal','green moong daal','mung dal','split mung'], category: 'dals', default_unit: 'cup', weight_per_cup: 180.0, weight_confidence: 'exact' },
  { name_en: 'masoor dal', name_de: 'Rote Linsen', synonyms: ['masoor daal','red lentils','lal masoor','rote linsen'], category: 'dals', default_unit: 'cup', weight_per_cup: 185.0, weight_confidence: 'exact' },
  { name_en: 'whole moong', name_de: 'Ganze Mungbohnen', synonyms: ['whole green gram','sabut moong','pachai payaru','green gram'], category: 'dals', default_unit: 'cup', weight_per_cup: 200.0, weight_confidence: 'exact' },
  { name_en: 'chickpea', name_de: 'Kichererbsen', synonyms: ['chana','chole','kichererbse','kabuli chana','garbanzo'], category: 'dals', default_unit: 'cup', weight_per_cup: 200.0, weight_confidence: 'exact' },
  { name_en: 'black chickpea', name_de: 'Schwarze Kichererbsen', synonyms: ['kala chana','black chana','desi chana'], category: 'dals', default_unit: 'cup', weight_per_cup: 200.0, weight_confidence: 'exact' },
  { name_en: 'kidney beans', name_de: 'Kidneybohnen', synonyms: ['rajma','rote bohnen','red kidney beans'], category: 'dals', default_unit: 'cup', weight_per_cup: 185.0, weight_confidence: 'exact' },
  { name_en: 'pottukadalai', name_de: 'Geröstete Kichererbsen', synonyms: ['roasted gram','bhuna chana','fried gram','puttu kadalai'], category: 'dals', default_unit: 'cup', weight_per_cup: 120.0, weight_confidence: 'exact' },
  { name_en: 'horse gram', name_de: 'Pferdebohnen', synonyms: ['kulthi','kollu','hurali'], category: 'dals', default_unit: 'cup', weight_per_cup: 200.0, weight_confidence: 'exact' },

  // ─── GRAINS, RICE & MILLETS ────────────────────────────────────
  { name_en: 'basmati rice', name_de: 'Basmatireis', synonyms: ['basmati','long grain rice'], category: 'grains', default_unit: 'cup', weight_per_cup: 185.0, weight_confidence: 'exact' },
  { name_en: 'raw rice', name_de: 'Rohreis', synonyms: ['pacharisi','pachai arisi','uncooked rice'], category: 'grains', default_unit: 'cup', weight_per_cup: 185.0, weight_confidence: 'exact' },
  { name_en: 'idli rice', name_de: 'Idli Reis', synonyms: ['idli arisi','parboiled rice for idli'], category: 'grains', default_unit: 'cup', weight_per_cup: 190.0, weight_confidence: 'exact' },
  { name_en: 'ponni boiled rice', name_de: 'Ponni Reis', synonyms: ['ponni rice','boiled rice','puzhungal arisi','parboiled rice'], category: 'grains', default_unit: 'cup', weight_per_cup: 195.0, weight_confidence: 'exact' },
  { name_en: 'sona masuri rice', name_de: 'Sona Masuri Reis', synonyms: ['sona masoori'], category: 'grains', default_unit: 'cup', weight_per_cup: 185.0, weight_confidence: 'exact' },
  { name_en: 'cooked rice', name_de: 'Gekochter Reis', synonyms: ['steamed rice','leftover rice'], category: 'grains', default_unit: 'cup', weight_per_cup: 195.0, weight_confidence: 'estimated' },
  { name_en: 'brown rice', name_de: 'Brauner Reis', synonyms: ['brauner reis','whole grain rice'], category: 'grains', default_unit: 'cup', weight_per_cup: 190.0, weight_confidence: 'exact' },
  { name_en: 'idli rava', name_de: 'Idli Rava', synonyms: ['rice rava','cream of rice','idli sooji'], category: 'grains', default_unit: 'cup', weight_per_cup: 175.0, weight_confidence: 'exact' },
  { name_en: 'semolina', name_de: 'Grieß', synonyms: ['rava','sooji','grieß','cream of wheat'], category: 'grains', default_unit: 'cup', weight_per_cup: 167.0, weight_confidence: 'exact' },
  { name_en: 'poha', name_de: 'Gepresstes Reis', synonyms: ['flattened rice','aval','beaten rice'], category: 'grains', default_unit: 'cup', weight_per_cup: 80.0, weight_confidence: 'exact' },
  { name_en: 'oats', name_de: 'Haferflocken', synonyms: ['rolled oats','haferflocken','porridge oats'], category: 'grains', default_unit: 'cup', weight_per_cup: 90.0, weight_confidence: 'exact' },
  { name_en: 'quinoa', name_de: 'Quinoa', synonyms: ['quinoa seeds'], category: 'grains', default_unit: 'cup', weight_per_cup: 170.0, weight_confidence: 'exact' },
  { name_en: 'pasta', name_de: 'Nudeln', synonyms: ['nudeln','generic pasta'], category: 'grains', default_unit: 'g', weight_per_cup: 100.0, weight_confidence: 'exact' },
  { name_en: 'spaghetti', name_de: 'Spaghetti', synonyms: [], category: 'grains', default_unit: 'g', weight_per_cup: 100.0, weight_confidence: 'exact' },
  { name_en: 'rice noodles', name_de: 'Reisnudeln', synonyms: ['pad thai noodles','rice stick noodles'], category: 'grains', default_unit: 'g', weight_per_cup: 56.0, weight_confidence: 'exact' },
  { name_en: 'vermicelli', name_de: 'Vermicelli', synonyms: ['semiya','sevai'], category: 'grains', default_unit: 'cup', weight_per_cup: 55.0, weight_confidence: 'exact' },
  { name_en: 'bulgur', name_de: 'Bulgur', synonyms: ['bulgur wheat','burghul'], category: 'grains', default_unit: 'cup', weight_per_cup: 140.0, weight_confidence: 'exact' },
  { name_en: 'bajra', name_de: 'Perlhirse', synonyms: ['pearl millet','kambu'], category: 'grains', default_unit: 'cup', weight_per_cup: 170.0, weight_confidence: 'exact' },
  { name_en: 'ragi', name_de: 'Fingerhirse', synonyms: ['finger millet','kezhvaragu','nachni'], category: 'grains', default_unit: 'cup', weight_per_cup: 160.0, weight_confidence: 'exact' },

  // ─── NUTS & SEEDS ──────────────────────────────────────────────
  { name_en: 'cashew nuts', name_de: 'Cashewkerne', synonyms: ['cashews','kaju','mundhiri'], category: 'nuts', default_unit: 'cup', weight_per_cup: 130.0, weight_per_piece: 1.5, weight_confidence: 'exact' },
  { name_en: 'peanuts', name_de: 'Erdnüsse', synonyms: ['groundnuts','moongphali','kadala','roasted peanuts'], category: 'nuts', default_unit: 'cup', weight_per_cup: 145.0, weight_confidence: 'exact' },
  { name_en: 'almonds', name_de: 'Mandeln', synonyms: ['badam','mandeln'], category: 'nuts', default_unit: 'cup', weight_per_cup: 143.0, weight_per_piece: 1.2, weight_confidence: 'exact' },
  { name_en: 'walnuts', name_de: 'Walnüsse', synonyms: ['akhrot','walnüsse'], category: 'nuts', default_unit: 'cup', weight_per_cup: 100.0, weight_per_piece: 3.5, weight_confidence: 'exact' },
  { name_en: 'pistachios', name_de: 'Pistazien', synonyms: ['pista','pistazien'], category: 'nuts', default_unit: 'cup', weight_per_cup: 125.0, weight_confidence: 'exact' },
  { name_en: 'chia seeds', name_de: 'Chiasamen', synonyms: ['chiasamen'], category: 'nuts', default_unit: 'tbsp', weight_per_tbsp: 10.0, weight_per_cup: 160.0, weight_confidence: 'exact' },
  { name_en: 'flaxseeds', name_de: 'Leinsamen', synonyms: ['alsi','agasi','leinsamen'], category: 'nuts', default_unit: 'tbsp', weight_per_tbsp: 10.0, weight_confidence: 'exact' },

  // ─── SWEETENERS ───────────────────────────────────────────────
  { name_en: 'sugar', name_de: 'Zucker', synonyms: ['granulated sugar','cane sugar','white sugar','cheeni'], category: 'sweet', default_unit: 'cup', weight_per_tsp: 4.2, weight_per_tbsp: 12.6, weight_per_cup: 200.0, weight_confidence: 'exact' },
  { name_en: 'dark brown sugar', name_de: 'Brauner Zucker', synonyms: ['brown sugar','brauner zucker'], category: 'sweet', default_unit: 'cup', weight_per_tsp: 4.6, weight_per_tbsp: 13.8, weight_per_cup: 220.0, weight_confidence: 'exact' },
  { name_en: 'powdered sugar', name_de: 'Puderzucker', synonyms: ['icing sugar','puderzucker'], category: 'sweet', default_unit: 'cup', weight_per_cup: 120.0, weight_confidence: 'exact' },
  { name_en: 'jaggery', name_de: 'Jaggery', synonyms: ['gur','vellam','palm sugar'], category: 'sweet', default_unit: 'tbsp', weight_per_tbsp: 15.0, weight_per_cup: 220.0, weight_confidence: 'estimated' },
  { name_en: 'honey', name_de: 'Honig', synonyms: ['honig','miel','shahad'], category: 'sweet', default_unit: 'tbsp', weight_per_tsp: 7.0, weight_per_tbsp: 21.0, weight_per_cup: 340.0, weight_confidence: 'exact' },
  { name_en: 'maple syrup', name_de: 'Ahornsirup', synonyms: ['ahornsirup'], category: 'sweet', default_unit: 'tbsp', weight_per_tbsp: 20.0, weight_per_cup: 322.0, weight_confidence: 'exact' },

  // ─── FLOURS & STARCH ──────────────────────────────────────────
  { name_en: 'all-purpose flour', name_de: 'Weizenmehl 405', synonyms: ['maida','plain flour','mehl','AP flour','weizenmehl','farina 00'], category: 'flour', default_unit: 'cup', weight_per_cup: 125.0, weight_per_tbsp: 7.8, weight_confidence: 'exact' },
  { name_en: 'whole wheat flour', name_de: 'Vollkornmehl', synonyms: ['vollkornmehl','atta','whole grain flour'], category: 'flour', default_unit: 'cup', weight_per_cup: 120.0, weight_confidence: 'exact' },
  { name_en: 'rice flour', name_de: 'Reismehl', synonyms: ['chawal ka atta','arisi maavu','reismehl'], category: 'flour', default_unit: 'cup', weight_per_cup: 158.0, weight_confidence: 'exact' },
  { name_en: 'besan', name_de: 'Kichererbsenmehl', synonyms: ['chickpea flour','gram flour','kadalai maavu','kichererbsenmehl'], category: 'flour', default_unit: 'cup', weight_per_cup: 120.0, weight_confidence: 'exact' },
  { name_en: 'cornstarch', name_de: 'Maisstärke', synonyms: ['cornflour','maizena','cornflour uk'], category: 'flour', default_unit: 'tbsp', weight_per_tbsp: 8.0, weight_per_cup: 128.0, weight_confidence: 'exact' },
  { name_en: 'breadcrumbs', name_de: 'Semmelbrösel', synonyms: ['semmelbrösel','panko','panko breadcrumbs'], category: 'flour', default_unit: 'cup', weight_per_cup: 108.0, weight_confidence: 'exact' },

  // ─── BAKING ───────────────────────────────────────────────────
  { name_en: 'baking powder', name_de: 'Backpulver', synonyms: ['backpulver'], category: 'baking', default_unit: 'tsp', weight_per_tsp: 4.0, weight_per_tbsp: 12.0, weight_confidence: 'exact' },
  { name_en: 'baking soda', name_de: 'Natron', synonyms: ['natron','bicarbonate of soda','meetha soda'], category: 'baking', default_unit: 'tsp', weight_per_tsp: 6.0, weight_per_tbsp: 18.0, weight_confidence: 'exact' },
  { name_en: 'yeast', name_de: 'Hefe', synonyms: ['hefe','active dry yeast','instant yeast','fast action yeast'], category: 'baking', default_unit: 'tsp', weight_per_tsp: 3.1, weight_per_tbsp: 9.3, weight_confidence: 'exact' },
  { name_en: 'dark chocolate', name_de: 'Zartbitterschokolade', synonyms: ['zartbitterschokolade','bittersweet chocolate'], category: 'baking', default_unit: 'g', weight_per_cup: 170.0, weight_confidence: 'exact' },
  { name_en: 'vanilla extract', name_de: 'Vanilleextrakt', synonyms: ['vanilleextrakt','pure vanilla extract','vanilla essence'], category: 'flavouring', default_unit: 'tsp', weight_per_tsp: 4.2, weight_confidence: 'estimated' },

  // ─── PANTRY & CONDIMENTS ──────────────────────────────────────
  { name_en: 'soy sauce', name_de: 'Sojasoße', synonyms: ['sojasoße','shoyu','light soy sauce'], category: 'pantry', default_unit: 'tbsp', density: 1.18, weight_per_tbsp: 18.0, weight_confidence: 'exact' },
  { name_en: 'fish sauce', name_de: 'Fischsoße', synonyms: ['nam pla','nuoc mam','fischsauce'], category: 'pantry', default_unit: 'tbsp', density: 1.18, weight_per_tbsp: 18.0, weight_confidence: 'exact' },
  { name_en: 'tomato paste', name_de: 'Tomatenmark', synonyms: ['tomatenmark','double concentrate'], category: 'pantry', default_unit: 'tbsp', weight_per_tbsp: 16.0, weight_confidence: 'exact' },
  { name_en: 'tomato passata', name_de: 'Passierte Tomaten', synonyms: ['passierte tomaten','strained tomatoes','tomato puree'], category: 'pantry', default_unit: 'ml', density: 1.05, weight_per_cup: 245.0, weight_confidence: 'exact' },
  { name_en: 'canned tomatoes', name_de: 'Dosentomaten', synonyms: ['dosentomaten','peeled tomatoes','chopped tomatoes','crushed tomatoes'], category: 'pantry', default_unit: 'ml', weight_per_cup: 240.0, weight_confidence: 'exact' },
  { name_en: 'tahini', name_de: 'Tahini', synonyms: ['sesame paste','sesampaste'], category: 'pantry', default_unit: 'tbsp', weight_per_tbsp: 15.0, weight_per_cup: 240.0, weight_confidence: 'exact' },
  { name_en: 'miso paste', name_de: 'Misopaste', synonyms: ['white miso','red miso','shiro miso'], category: 'pantry', default_unit: 'tbsp', weight_per_tbsp: 17.0, weight_confidence: 'exact' },
  { name_en: 'vinegar', name_de: 'Essig', synonyms: ['essig','white vinegar','rice vinegar'], category: 'pantry', default_unit: 'tbsp', density: 1.01, weight_per_tbsp: 15.0, weight_confidence: 'exact' },
  { name_en: 'apple cider vinegar', name_de: 'Apfelessig', synonyms: ['apfelessig','ACV'], category: 'pantry', default_unit: 'tbsp', density: 1.01, weight_per_tbsp: 15.0, weight_confidence: 'exact' },
  { name_en: 'vegetable stock', name_de: 'Gemüsebrühe', synonyms: ['gemüsebrühe','bouillon','vegetable broth','stock'], category: 'pantry', default_unit: 'ml', density: 1.0, weight_per_cup: 240.0, weight_confidence: 'estimated' },
  { name_en: 'chicken stock', name_de: 'Hühnerbrühe', synonyms: ['hühnerbrühe','chicken broth'], category: 'pantry', default_unit: 'ml', density: 1.01, weight_per_cup: 240.0, weight_confidence: 'estimated' },
  { name_en: 'coconut cream', name_de: 'Kokosnusscreme', synonyms: ['kokoscreme','thick coconut milk'], category: 'pantry', default_unit: 'ml', density: 1.06, weight_per_cup: 252.0, weight_confidence: 'exact' },
  { name_en: 'thai red curry paste', name_de: 'Rote Currypaste', synonyms: ['rote currypaste','red curry paste'], category: 'pantry', default_unit: 'tbsp', weight_per_tbsp: 15.0, weight_confidence: 'estimated' },
  { name_en: 'rose water', name_de: 'Rosenwasser', synonyms: ['rosenwasser','gulab jal'], category: 'flavouring', default_unit: 'tsp', density: 1.0, weight_per_tsp: 5.0, weight_confidence: 'exact' },

  // ─── OTHER ─────────────────────────────────────────────────────
  { name_en: 'salt', name_de: 'Salz', synonyms: ['rock salt','table salt','kosher salt','sea salt','pink salt','himalayan salt','namak','uppu','salz'], category: 'other', default_unit: 'tsp', weight_per_tsp: 6.0, weight_per_tbsp: 18.0, weight_confidence: 'exact' },
  { name_en: 'water', name_de: 'Wasser', synonyms: ['hot water','warm water','wasser','jal'], category: 'other', default_unit: 'ml', density: 1.0, weight_per_cup: 240.0, weight_confidence: 'exact' },
];

async function seed() {
  console.log(`Seeding ${INGREDIENTS.length} ingredients...`);
  const batchSize = 50;
  let total = 0;

  for (let i = 0; i < INGREDIENTS.length; i += batchSize) {
    const batch = INGREDIENTS.slice(i, i + batchSize);
    const { error } = await supabase
      .from('ingredients')
      .upsert(batch, { onConflict: 'name_en' });

    if (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
    } else {
      total += batch.length;
      console.log(`Batch ${Math.floor(i / batchSize) + 1} done — ${total}/${INGREDIENTS.length} rows`);
    }
  }

  console.log(`\nSeed complete. ${total} ingredients upserted.`);
}

seed().catch(console.error);
