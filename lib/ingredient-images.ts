/**
 * Ingredient image resolver — maps an ingredient name (English, German, Tamil,
 * or Hindi) to a cut-out icon in /public/ingredients/.
 *
 * Matching order:
 *   1. exact alias (from the auto-generated manifest + curated synonyms below)
 *   2. naive singular/plural fallback
 *   3. longest alias phrase contained in the query at a word boundary
 *      ("2 ripe cherry tomatoes" → cherry tomato)
 *
 * Results are memoized; returns the image path or null (caller falls back to
 * the legacy Lucide/emoji icon).
 */
import { INGREDIENT_IMAGE_ALIASES } from "./ingredient-image-manifest";

/**
 * Curated synonyms → slug. Tamil (ta), Hindi (hi), German (de) and extra
 * English/colloquial spellings for the staples. Slugs must exist in the
 * manifest — `npx tsx scripts/check-ingredient-images.ts` validates this.
 */
export const EXTRA_SYNONYMS: Record<string, string> = {
  // ── Rice & grains ──────────────────────────────────────────────
  "arisi": "rice", "chawal": "rice", "reis": "rice",
  "puzhungal arisi": "ponni-boiled-rice",
  "pacharisi": "ponni-raw-rice",
  "idli arisi": "idli-rice",
  "seeraga samba": "seeraga-samba-rice",
  "aval": "flattened-rice", "poha": "flattened-rice",
  "pori": "puffed-rice", "murmura": "puffed-rice",
  "ragi": "ragi-or-finger-millet", "kezhvaragu": "ragi-or-finger-millet", "nachni": "ragi-or-finger-millet",
  "kambu": "pearl-millet-or-bajra", "bajra": "pearl-millet-or-bajra",
  "cholam": "jowar-or-sorghum", "jowar": "jowar-or-sorghum",
  "thinai": "foxtail-millet",
  "rava": "semolina", "sooji": "semolina", "ravai": "semolina", "suji": "semolina", "griess": "semolina",
  "maida": "weizenmehl-405", "mehl": "weizenmehl-405", "all purpose flour": "weizenmehl-405", "plain flour": "weizenmehl-405",
  "wheat flour": "weizenmehl-type-1050", "atta": "weizenmehl-type-1050", "godhumai maavu": "weizenmehl-type-1050",
  "arisi maavu": "rice-flour", "chawal ka atta": "rice-flour",
  "kadalai maavu": "besan-or-gram-flour", "besan": "besan-or-gram-flour", "gram flour": "besan-or-gram-flour", "kichererbsenmehl": "besan-or-gram-flour",
  "haferflocken": "oats", "oatmeal": "oats",
  // ── Dals & legumes ─────────────────────────────────────────────
  "dal": "toor-dal", "paruppu": "toor-dal",
  "toor dal": "toor-dal", "thuvaram paruppu": "toor-dal", "arhar dal": "toor-dal", "thuvarai": "toor-dal",
  "moong dal": "moong-dal", "paasi paruppu": "moong-dal", "pasi paruppu": "moong-dal",
  "green gram": "green-moong-bean", "pachai payaru": "green-moong-bean", "sabut moong": "green-moong-bean", "mung": "green-moong-bean", "mungobohnen": "green-moong-bean",
  "chana dal": "channa-dal", "kadalai paruppu": "channa-dal", "kadala paruppu": "channa-dal",
  "urad dal": "black-urad-dal", "ulundhu": "black-urad-dal", "ulutham paruppu": "black-urad-dal", "urad": "urad-dal-whole",
  "masoor dal": "red-lentils", "masoor": "red-lentils", "mysore paruppu": "red-lentils", "rote linsen": "red-lentils",
  "linsen": "brown-lentils", "braune linsen": "brown-lentils",
  "grune linsen": "green-lentils", "grüne linsen": "green-lentils",
  "rajma": "kidney-beans", "kidneybohnen": "canned-kidney-beans",
  "kala chana": "brown-chickpea-or-kala-channa", "kondakadalai": "brown-chickpea-or-kala-channa", "black chickpea": "brown-chickpea-or-kala-channa",
  "chickpea": "dried-chickpea", "chole": "dried-chickpea", "chana": "dried-chickpea", "kichererbsen": "canned-chickpea", "garbanzo": "dried-chickpea",
  "pottukadalai": "pottukadalai-or-roasted-gram", "roasted gram": "pottukadalai-or-roasted-gram", "daria": "pottukadalai-or-roasted-gram",
  "kollu": "horse-gram", "kulthi": "horse-gram",
  "karamani": "black-eyed-beans-or-peas", "lobia": "black-eyed-beans-or-peas", "black eyed peas": "black-eyed-beans-or-peas",
  "mochai": "lima-beans", "avarakkai": "broad-beans", "sem": "broad-beans",
  "pattani": "green-peas", "matar": "green-peas", "erbsen": "green-peas",
  "kothavarangai": "cluster-beans", "gawar": "cluster-beans",
  "sojabohnen": "soya-beans", "soybean": "soya-beans",
  // ── Spices & seeds ─────────────────────────────────────────────
  "jeera": "cumin-seeds", "jeeragam": "cumin-seeds", "seeragam": "cumin-seeds", "kreuzkummel": "cumin-seeds", "kreuzkümmel": "cumin-seeds", "cumin": "cumin-seeds",
  "jeera powder": "cumin-powder", "seeraga thool": "cumin-powder",
  "haldi": "turmeric-powder", "manjal": "turmeric-powder", "manjal thool": "turmeric-powder", "turmeric": "turmeric-powder",
  "dhania": "coriander-seeds", "kothamalli vidhai": "coriander-seeds", "koriandersamen": "coriander-seeds",
  "dhania powder": "corinder-powder", "coriander powder": "corinder-powder", "malli thool": "corinder-powder",
  "kothamalli": "coriander-leaves", "hara dhania": "coriander-leaves", "cilantro": "coriander-leaves", "koriander": "coriander-leaves",
  "kadugu": "brown-and-black-mustard-seeds", "rai": "brown-and-black-mustard-seeds", "sarson": "brown-and-black-mustard-seeds", "mustard seeds": "brown-and-black-mustard-seeds", "senf korner": "brown-and-black-mustard-seeds", "senfkorner": "brown-and-black-mustard-seeds",
  "methi": "fenugreek-seeds", "vendhayam": "fenugreek-seeds", "bockshornklee": "fenugreek-seeds", "fenugreek": "fenugreek-seeds",
  "methi leaves": "fenugreek-leaves", "vendhaya keerai": "fenugreek-leaves",
  "kasuri methi": "dry-fenugreek-leaves", "kasoori methi": "dry-fenugreek-leaves",
  "saunf": "fennel-seeds", "sombu": "fennel-seeds", "perunjeeragam": "fennel-seeds", "fenchelsamen": "fennel-seeds", "fennel": "fennel-seeds",
  "hing": "asafoetida-powder", "perungayam": "asafoetida-powder", "asafoetida": "asafoetida-powder", "asafetida": "asafoetida-powder",
  "elaichi": "cardamom", "elakkai": "cardamom", "kardamom": "cardamom",
  "laung": "clove", "kirambu": "clove", "lavangam": "clove", "nelken": "clove", "cloves": "clove",
  "dalchini": "cinnamon-stick", "pattai": "cinnamon-stick", "lavanga pattai": "cinnamon-stick", "zimt": "cinnamon-stick", "zimtstange": "cinnamon-stick", "cinnamon": "cinnamon-stick",
  "kali mirch": "black-pepper", "milagu": "black-pepper", "schwarzer pfeffer": "black-pepper", "pfeffer": "black-pepper", "peppercorn": "black-pepper",
  "milagu thool": "black-pepper-powder",
  "lal mirch": "dried-red-chillies", "milagai vathal": "dried-red-chillies", "vathal milagai": "dried-red-chillies", "red chilli": "dried-red-chillies", "red chili": "dried-red-chillies",
  "hari mirch": "green-chilli", "pachai milagai": "green-chilli", "green chili": "green-chilli", "grune chili": "green-chilli",
  "mirchi powder": "chilli-powder", "milagai thool": "chilli-powder", "lal mirch powder": "chilli-powder", "red chilli powder": "chilli-powder", "chili powder": "chilli-powder",
  "kesar": "saffron", "kungumapoo": "saffron", "safran": "saffron",
  "jaiphal": "nutmeg", "jathikai": "nutmeg", "muskat": "nutmeg", "muskatnuss": "nutmeg",
  "javitri": "mace-indian-spice", "jathipathiri": "mace-indian-spice", "mace": "mace-indian-spice",
  "ajwain": "carom-seeds", "omam": "carom-seeds", "carom": "carom-seeds",
  "kariveppilai": "curry-leaves", "kadi patta": "curry-leaves", "karuveppilai": "curry-leaves", "curryblatter": "curry-leaves",
  "pudina": "mint-leaves", "puthina": "mint-leaves", "minze": "mint-leaves", "mint": "mint-leaves",
  "tulsi": "holy-basil", "thulasi": "holy-basil",
  "tej patta": "bay-leaf", "birinji ilai": "bay-leaf", "lorbeerblatt": "bay-leaf", "lorbeer": "bay-leaf",
  "chakra phool": "star-anise", "annasi mokku": "star-anise", "sternanis": "star-anise",
  "khus khus": "poppy-seeds", "kasakasa": "poppy-seeds", "mohn": "poppy-seeds",
  "til": "sesame-seeds", "ellu": "sesame-seeds", "sesam": "sesame-seeds",
  "karuppu ellu": "black-sesame-seeds", "kala til": "black-sesame-seeds",
  "imli": "dry-tamarind", "puli": "dry-tamarind", "tamarind": "dry-tamarind", "tamarinde": "dry-tamarind",
  "gud": "jaggery", "vellam": "jaggery", "gur": "jaggery",
  "amchur": "dry-mango-powder", "amchoor": "dry-mango-powder",
  "sukku": "dry-ginger-powder-or-sokku", "saunth": "dry-ginger-powder-or-sokku",
  "kalpasi": "black-stone-flower-or-kalpasi", "stone flower": "black-stone-flower-or-kalpasi",
  "sambar podi": "sambar-powder", "biryani masala": "briyani-masala-powder",
  // ── Vegetables ─────────────────────────────────────────────────
  "aloo": "potato", "urulaikizhangu": "potato", "kartoffel": "potato", "kartoffeln": "potato",
  "pyaaz": "onion", "vengayam": "onion", "zwiebel": "onion", "zwiebeln": "onion", "pyaz": "onion",
  "chinna vengayam": "shallots", "sambar onion": "shallots", "schalotten": "shallots",
  "tamatar": "tomato", "thakkali": "tomato", "tomate": "tomato", "tomaten": "tomato",
  "lehsun": "garlic", "poondu": "garlic", "knoblauch": "garlic", "lahsun": "garlic",
  "adrak": "ginger", "inji": "ginger", "ingwer": "ginger",
  "inji poondu": "ginger-garlic-paste", "adrak lehsun": "ginger-garlic-paste",
  "baingan": "brinjal-indian", "kathirikai": "brinjal-indian", "eggplant": "aubergine", "brinjal": "brinjal-indian",
  "bhindi": "lady-finger-or-okra", "vendakkai": "lady-finger-or-okra", "okra": "lady-finger-or-okra", "okraschoten": "lady-finger-or-okra",
  "karela": "bitter-gourd", "pavakkai": "bitter-gourd",
  "lauki": "bottle-gourd", "surakkai": "bottle-gourd", "sorakkai": "bottle-gourd", "dudhi": "bottle-gourd", "flaschenkurbis": "bottle-gourd",
  "turai": "ridge-gourd", "peerkangai": "ridge-gourd",
  "kundru": "ivy-gourd", "kovakkai": "ivy-gourd", "tindora": "ivy-gourd",
  "poosanikai": "ash-gourd-or-winter-melon", "petha": "ash-gourd-or-winter-melon", "ash gourd": "ash-gourd-or-winter-melon", "white pumpkin": "ash-gourd-or-winter-melon",
  "saijan": "drumstick", "murungakkai": "drumstick", "moringa": "drumstick",
  "murungai keerai": "moringa-leaves",
  "palak": "spinach", "keerai": "spinach", "spinat": "spinach", "pasalai": "spinach",
  "pulicha keerai": "gongura-or-pulicha-keerai", "gongura": "gongura-or-pulicha-keerai",
  "gobi": "cauliflower", "phool gobhi": "cauliflower", "blumenkohl": "cauliflower",
  "patta gobhi": "cabbage", "muttaikose": "cabbage", "kohl": "cabbage", "weisskohl": "cabbage",
  "rotkohl": "red-cabbage", "blaukraut": "red-cabbage",
  "gajar": "carrot", "karotte": "carrot", "mohre": "carrot", "moehre": "carrot", "mohren": "carrot",
  "mooli": "raddish", "mullangi": "raddish", "radish": "raddish", "rettich": "raddish",
  "chukandar": "beet-root", "beetroot": "beet-root", "rote bete": "beet-root", "rote beete": "beet-root",
  "shakarkandi": "sweet-potato", "sakkaravalli kizhangu": "sweet-potato", "susskartoffel": "sweet-potato",
  "suran": "elephant-foot-yam-or-suran", "senai kizhangu": "elephant-foot-yam-or-suran", "yam": "elephant-foot-yam-or-suran",
  "arbi": "taro-root", "seppankizhangu": "taro-root", "taro": "taro-root",
  "vazhai thandu": "plainten-stem-or-vazhai-thandu", "banana stem": "plainten-stem-or-vazhai-thandu",
  "vazhaipoo": "raw-banana-flower", "banana flower": "raw-banana-flower",
  "vazhakkai": "raw-banana", "kacha kela": "raw-banana", "plantain": "raw-banana",
  "gurke": "cucumber", "vellarikkai": "cucumber", "kheera": "cucumber", "kakdi": "cucumber",
  "shimla mirch": "green-capsicum", "kudamilagai": "green-capsicum", "capsicum": "green-capsicum", "bell pepper": "green-capsicum", "paprika": "green-capsicum",
  "rote paprika": "paprika-rot", "gelbe paprika": "paprika-gelb",
  "frühlingszwiebel": "spring-onion", "fruhlingszwiebel": "spring-onion", "scallion": "spring-onion", "vengaya thal": "spring-onion", "hara pyaz": "spring-onion",
  "lauch": "porree", "leek": "porree",
  "sellerie": "celery", "staudensellerie": "celery",
  "kurbis": "ash-gourd-or-winter-melon",
  "pilze": "champignons-braun", "mushroom": "champignons-braun", "mushrooms": "champignons-braun", "kalan": "champignons-braun", "khumbi": "champignons-braun",
  "mais": "sweet-corn", "makka": "sweet-corn", "makkacholam": "sweet-corn", "corn": "sweet-corn",
  "avocado": "avocado", "zucchini": "zucchini", "courgette": "zucchini",
  "salat": "eisbergsalat", "lettuce": "eisbergsalat", "iceberg": "eisbergsalat",
  "chayote": "chow-chow", "chow chow": "chow-chow", "bangalore kathirikai": "chow-chow",
  "amla": "amla-or-indian-gooseberry", "nellikai": "amla-or-indian-gooseberry", "gooseberry": "amla-or-indian-gooseberry",
  // ── Fruits ─────────────────────────────────────────────────────
  "kela": "banana", "vazhaipazham": "banana", "banane": "banana",
  "aam": "mango", "manga": "mango", "mampazham": "mango",
  "kacha aam": "raw-mango", "mangai": "raw-mango",
  "nimbu": "lemon", "elumichai": "lemon", "zitrone": "lemon", "nimboo": "lemon",
  "limette": "lime",
  "santra": "orange", "narangi": "orange", "kichili": "orange",
  "seb": "red-apple", "apfel": "red-apple", "apple": "red-apple",
  "gruner apfel": "green-apple",
  "anar": "pomogranate", "mathulai": "pomogranate", "pomegranate": "pomogranate", "granatapfel": "pomogranate",
  "nariyal": "coconut", "thengai": "coconut", "kokosnuss": "coconut", "kokos": "coconut",
  "ilaneer": "tender-coconut", "elaneer": "tender-coconut",
  "seetha pazham": "custard-apple", "sitaphal": "custard-apple",
  "pala pazham": "jackfruit", "kathal": "jackfruit",
  "amrood": "guava", "koyya": "guava", "guave": "guava",
  "papita": "papaya", "pappali": "papaya",
  "angoor": "grapes", "drakshai": "grapes", "trauben": "grapes", "weintrauben": "grapes",
  "tarbooz": "watermelon", "wassermelone": "watermelon",
  "kharbooja": "muskmelon", "melone": "honey-dew-melon",
  "anannas": "pineapple", "ananas": "pineapple",
  "erdbeere": "strawberry", "erdbeeren": "strawberry",
  "himbeere": "raspberry", "himbeeren": "raspberry",
  "blaubeere": "blueberry", "heidelbeeren": "blueberry", "blaubeeren": "blueberry",
  "kirsche": "cherry", "kirschen": "cherry",
  "pfirsich": "peach", "aadu": "peach",
  "pflaume": "plum", "birne": "pear", "nashpati": "pear",
  "khajur": "dates", "pericham pazham": "dates", "datteln": "dates",
  "kishmish": "raisins", "ular dratchai": "raisins", "rosinen": "raisins",
  "anjeer": "dried-fig", "feige": "dried-fig", "fig": "dried-fig",
  // ── Dairy, eggs & proteins ─────────────────────────────────────
  "doodh": "milk", "paal": "milk", "milch": "milk",
  "dahi": "joghurt", "thayir": "joghurt", "curd": "joghurt", "yogurt": "joghurt", "yoghurt": "joghurt",
  "makkhan": "butter", "vennai": "butter",
  "nei": "ghee", "neyyi": "ghee", "butterschmalz": "ghee",
  "malai": "schlagsahne-32-fett", "cream": "schlagsahne-32-fett", "sahne": "schlagsahne-32-fett", "schlagsahne": "schlagsahne-32-fett", "heavy cream": "schlagsahne-32-fett", "whipping cream": "schlagsahne-32-fett",
  "cooking cream": "sahne-zum-kochen",
  "quark": "speisequark-20-fett",
  "kase": "gouda-jung", "cheese": "cheddar-cheese", "käse": "gouda-jung",
  "anda": "egg", "muttai": "egg", "ei": "egg", "eier": "egg",
  "murgh": "chicken", "kozhi": "chicken", "hahnchen": "chicken", "huhn": "chicken", "hühnchen": "chicken",
  "chicken breast": "chicken-breast-fillet", "hahnchenbrust": "chicken-breast-fillet",
  "mutton": "lamb-meat", "aattu kari": "lamb-meat", "lamm": "lamb-meat", "lamb": "lamb-meat", "goat meat": "lamb-meat",
  "beef": "steak-meat-beef", "rind": "steak-meat-beef", "rindfleisch": "steak-meat-beef", "maattu kari": "steak-meat-beef",
  "pork": "pork-meat", "schwein": "pork-meat", "schweinefleisch": "pork-meat", "panni kari": "pork-meat",
  "ground meat": "hackfleisch", "minced meat": "hackfleisch", "keema": "hackfleisch", "kheema": "hackfleisch", "mince": "hackfleisch",
  "jhinga": "prawn", "eral": "prawn", "shrimp": "prawn", "garnelen": "prawn", "garnele": "prawn",
  "machli": "pomfret-fish", "meen": "pomfret-fish", "fisch": "pomfret-fish",
  "vanjaram": "indo-pacific-king-mackeral-fish-cut", "king mackerel": "indo-pacific-king-mackeral-fish-cut", "seer fish": "indo-pacific-king-mackeral-fish-cut",
  "karimeen": "pearl-spot-or-karimeen", "pearl spot": "pearl-spot-or-karimeen",
  "nethili karuvadu": "dried-anchovies", "anchovies": "dried-anchovies", "nethili": "dried-anchovies",
  "sura": "baby-shark-or-paal-sura", "paal sura": "baby-shark-or-paal-sura",
  "lachs": "salmon-fish-fillet", "salmon": "salmon-fish-fillet",
  "thunfisch": "tuna-fillet", "tuna": "tuna-fillet",
  "forelle": "forelle-or-trout", "trout": "forelle-or-trout",
  // ── Pantry staples ─────────────────────────────────────────────
  "namak": "salt", "uppu": "salt", "salz": "salt",
  "kala namak": "rock-salt", "black salt": "rock-salt", "indhu uppu": "himalayan-pink-rock-salt",
  "cheeni": "sugar", "shakkar": "sugar", "sakkarai": "sugar", "zucker": "sugar",
  "puderzucker": "powder-sugar", "icing sugar": "powder-sugar", "powdered sugar": "powder-sugar",
  "brauner zucker": "brown-sugar",
  "shahad": "honey", "thaen": "honey", "honig": "honey",
  "tel": "sunflower-oil", "ennai": "sunflower-oil", "sonnenblumenol": "sunflower-oil", "oil": "sunflower-oil", "cooking oil": "sunflower-oil",
  "nallennai": "sesame-oil", "gingelly oil": "sesame-oil", "til ka tel": "sesame-oil", "sesamol": "sesame-oil",
  "sarson ka tel": "mustard-oil", "kadugu ennai": "mustard-oil",
  "thengai ennai": "coconut-oil", "nariyal tel": "coconut-oil", "kokosol": "coconut-oil",
  "olivenol": "olio-extra-vergine-di-oliva-kreta", "olive oil": "olio-extra-vergine-di-oliva-kreta", "olivenöl": "olio-extra-vergine-di-oliva-kreta",
  "rapsol": "rapeseed-oil", "canola oil": "rapeseed-oil",
  "essig": "essigessenz", "vinegar": "rice-vinegar", "sirka": "rice-vinegar",
  "kaju": "cashew-nut", "munthiri": "cashew-nut", "cashewkerne": "cashew-nut", "cashew": "cashew-nut",
  "badam": "almond", "mandel": "almond", "mandeln": "almond",
  "akhrot": "walnut", "walnuss": "walnut", "walnusse": "walnut",
  "pista": "pistachio", "pistazien": "pistachio",
  "moongphali": "peanut-or-groundnut", "verkadalai": "peanut-or-groundnut", "peanut": "peanut-or-groundnut", "erdnuss": "peanut-or-groundnut", "erdnusse": "peanut-or-groundnut", "groundnut": "peanut-or-groundnut",
  "haselnuss": "hazelnut", "haselnusse": "hazelnut",
  "hefe": "dry-yeast", "yeast": "dry-yeast",
  "backpulver": "baking-powder", "natron": "baking-soda-natron", "baking soda": "baking-soda-natron",
  "starke": "cornstarch", "maisstarke": "cornstarch", "corn flour": "cornstarch", "maizena": "cornstarch",
  "vanille": "vanilla-bean", "vanilla": "vanilla-bean",
  "schokolade": "milk-chocolate", "chocolate": "milk-chocolate",
  "zartbitterschokolade": "dark-chocolate-bar", "dark chocolate": "dark-chocolate-bar",
  "kakao": "kakao-zum-backen", "cocoa powder": "kakao-zum-backen", "cocoa": "kakao-zum-backen",
  "brot": "sourdough-loaf", "bread": "white-bread-slices", "toast": "white-bread-slices",
  "brioche": "brioche-bread-loaf",
  "chapati": "roti-or-chapati", "roti": "roti-or-chapati", "phulka": "roti-or-chapati",
  "parotta": "parotta-malabar", "porotta": "parotta-malabar",
  "nudeln": "pasta", "noodles": "instant-noodles-or-ramen-block", "ramen": "instant-noodles-or-ramen-block",
  "sevai": "vermicelli", "semiya": "vermicelli", "seviyan": "vermicelli",
  "kaapi": "instant-coffee-powder", "coffee": "instant-coffee-powder", "kaffee": "instant-coffee-powder",
  "chai": "tea-powder-taj-mahal", "tea": "tea-powder-taj-mahal", "tee": "tea-powder-taj-mahal", "chaha": "tea-powder-taj-mahal",
  "paneer": "paneer-cubes",
  "wasser": "water", "pani": "water", "thanni": "water", "neer": "water",
  "coconut milk": "canned-coconut-milk", "thengai paal": "canned-coconut-milk", "nariyal doodh": "canned-coconut-milk", "kokosmilch": "canned-coconut-milk",
  // ── Supplements & tracking extras ──────────────────────────────
  "multivitamin": "multivitamin-supplement", "vitamins": "multivitamin-supplement",
  "omega": "omega-fish-oil-capsule", "omega 3": "omega-fish-oil-capsule", "omega-3": "omega-fish-oil-capsule", "fish oil": "omega-fish-oil-capsule",
  "electrolyte": "electrolyte-tablets", "electrolytes": "electrolyte-tablets", "elektrolyt": "electrolyte-tablets",
  "electrolyte drink": "zitrone-limette-elektrolyt-getrank",
  "whey": "whey-protein-powder", "protein powder": "whey-protein-powder", "protein": "whey-protein-powder",
  "creatine": "creatine-monohydrate", "kreatin": "creatine-monohydrate",
  "ashwagandha": "ashwagandha-powder",
  "glucose": "glocon-d-glucose-powder", "glucon d": "glocon-d-glucose-powder",
  "supplement": "supplements",
  // ── Coverage fix-ups (canonical names → existing icons) ────────
  "white pepper": "weiss-pfeffer-gemahlen", "weisser pfeffer": "weiss-pfeffer-gemahlen",
  "dried kashmiri chilli": "kashmiri-red-chilli",
  "rosemary": "rosmarin", "rosemarin": "rosmarin",
  "dried oregano": "dried-oregano-leaves", "oregano": "dried-oregano-leaves",
  "italian seasoning": "italienische-krauter", "italian herbs": "italienische-krauter",
  "basil": "basil-leaves", "basilikum": "basil-leaves",
  "ladies finger": "lady-finger-or-okra",
  "asparagus": "spargel",
  "bok choy": "pak-choi", "bok choi": "pak-choi",
  "bean sprouts": "canned-mungobohnenkeimlinge", "sprossen": "canned-mungobohnenkeimlinge",
  "green beans": "buschbohnen", "french beans": "buschbohnen", "beans": "buschbohnen",
  "olives": "pickled-green-olives", "oliven": "pickled-green-olives",
  "fish": "pomfret-fish",
  "whole moong": "green-moong-bean",
  "quinoa": "white-quinoa",
  "flaxseed": "leinsaat", "flax seeds": "leinsaat", "alsi": "leinsaat",
  "soy sauce": "sajasauce", "sojasauce": "sajasauce", "dark soy sauce": "sajasauce", "soya sauce": "sajasauce",
  "vegetable stock": "vegetable-stock-powder", "gemusebruhe": "vegetable-stock-powder",
  "chicken stock": "chicken-stock-powder", "huhnerbruhe": "chicken-stock-powder",
  "cranberry": "cranberries",
  "blackberry": "brombeeren", "blackberries": "brombeeren",
  "passionfruit": "passion-fruit", "maracuja": "passion-fruit",
  "cod": "cod-fish-fillet", "kabeljau": "cod-fish-fillet",
  "mackerel": "indo-pacific-king-mackeral-fish-cut", "makrele": "indo-pacific-king-mackeral-fish-cut",
  "rohu": "rohu-fish",
  "pomfret": "pomfret-fish", "vavval": "pomfret-fish",
  "gruyere": "le-gruyere-hartkase",
  "cheddar": "cheddar-cheese",
  "emmental": "emmentaler-hartkase", "emmentaler": "emmentaler-hartkase",
  "gouda": "gouda-jung",
  "spelt flour": "dinkelmehl-type-630", "dinkel": "dinkelmehl-type-630",
  "cake flour": "weizenmehl-405",
  "gelatin": "gelatine-powder", "gelatine": "gelatine-powder",
  "sriracha": "siracha-hot-chilli-sauce",
  "yellow mustard": "dijon-mustard", "senf": "dijon-mustard", "mustard": "dijon-mustard",
  "nori": "nori-sheets-seaweed",
  "edamame": "eadmame-bean",
  "yellow lentils": "moong-dal",
  "rose essence": "rose-flavouring-essence",
  "ice": "ice-cube", "eis": "ice-cube",
  "flour": "weizenmehl-405",
  "vollkornmehl": "dinkel-vollkornmehl", "whole grain flour": "dinkel-vollkornmehl", "wholemeal flour": "dinkel-vollkornmehl",
  "roggenmehl": "rye-flour",
  // ── Tomato varieties ───────────────────────────────────────────
  "fleischtomaten": "fleisch-tomaten", "fleischtomate": "fleisch-tomaten",
  "beefsteak tomato": "fleisch-tomaten", "beef tomato": "fleisch-tomaten", "beefsteak tomatoes": "fleisch-tomaten",
  "roma tomato": "roma-tomatoes", "plum tomato": "roma-tomatoes", "plum tomatoes": "roma-tomatoes",
  "tomatenmark": "tomato-paste", "passata": "tomato-paste", "tomato puree": "tomato-paste",
  // ── English names for German-named icons ───────────────────────
  "apple spritzer": "apfelschorlen", "apfelschorle": "apfelschorlen",
  "mountain cheese": "bergkase-mild", "bergkase": "bergkase-mild", "bergkäse": "bergkase-mild",
  "vanilla sugar": "bourbon-vanillezucker", "vanillezucker": "bourbon-vanillezucker",
  "vanilla extract": "bourbon-vanille-extrakt",
  "frying oil": "bratol",
  "bread roll": "brotchen", "bread rolls": "brotchen", "buns": "brotchen",
  "canned peas": "canned-erbsen",
  "canned beetroot": "canned-rote-bete", "canned beets": "canned-rote-bete",
  "canned red cabbage": "canned-rotkohl",
  "sauerkraut": "canned-sauerkraut",
  "napa cabbage": "chinakohl", "chinese cabbage": "chinakohl",
  "iced tea": "eistee", "ice tea": "eistee",
  "peanut oil": "erdnussol", "groundnut oil": "erdnussol",
  "greek yogurt": "greek-joghurt-10", "greek yoghurt": "greek-joghurt-10",
  "grill cheese": "grill-und-pfannenkase-krauter", "grillkase": "grill-und-pfannenkase-krauter",
  "jasmine rice": "jasmin-reis",
  "germ oil": "keimol",
  "flaxseed oil": "leinol", "linseed oil": "leinol",
  "rice pudding": "milchreis", "pudding rice": "milchreis", "milk rice": "milchreis",
  "rice noodles": "reisnudeln",
  "risotto rice": "risotto-paella-reis", "arborio rice": "risotto-paella-reis", "arborio": "risotto-paella-reis", "paella rice": "risotto-paella-reis",
  "fried onions": "rostzwiebeln", "crispy onions": "rostzwiebeln",
  "shiitake": "shiitake-pilze", "shiitake mushrooms": "shiitake-pilze",
  "sparkling water": "sprudelwasser", "soda water": "sprudelwasser",
  "runner beans": "stagenbohnen-breit", "stangenbohnen": "stagenbohnen-breit",
  "grapeseed oil": "traubenkernol", "grape seed oil": "traubenkernol",
  "drinking chocolate": "trinkschokolade", "hot chocolate": "trinkschokolade",
  "walnut oil": "walnussol",
  "cayenne": "cayennepfeffer-gemahlen", "cayenne pepper": "cayennepfeffer-gemahlen",
  "dried basil": "gerebelt-basilikum",
  "marjoram": "gerebelt-majoran", "majoran": "gerebelt-majoran",
  "dried thyme": "gerebelt-thymian",
  "rhubarb": "rhabarber",
  "fennel bulb": "fenchel",
  "snack cucumbers": "snackgurken", "mini cucumbers": "snackgurken",
};

// Lowercase, fold accents (gruyère→gruyere, kümmel→kummel), hyphens→spaces.
// Applied to BOTH aliases and queries, so matching stays consistent.
const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-–_]/g, " ")
    // German flour grades: "weizenmehl type 1050" ≡ "weizenmehl 1050"
    .replace(/\btype\s+(?=\d)/g, "")
    .replace(/\s+/g, " ")
    .trim();

// alias → slug index (manifest aliases + curated synonyms)
const ALIAS_TO_SLUG = new Map<string, string>();
for (const [slug, aliases] of Object.entries(INGREDIENT_IMAGE_ALIASES)) {
  for (const a of aliases) {
    const key = norm(a);
    if (!ALIAS_TO_SLUG.has(key)) ALIAS_TO_SLUG.set(key, slug);
  }
}
for (const [term, slug] of Object.entries(EXTRA_SYNONYMS)) {
  ALIAS_TO_SLUG.set(norm(term), slug); // curated entries override filename aliases
}

// Longest-first alias list for contained-phrase matching.
const ALIASES_BY_LENGTH = [...ALIAS_TO_SLUG.keys()].sort((a, b) => b.length - a.length);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cache = new Map<string, string | null>();

/** Resolve an ingredient name (EN/DE/Tamil/Hindi) to its icon path, or null. */
export function resolveIngredientImage(name: string): string | null {
  const q = norm(name ?? "");
  if (!q) return null;
  const hit = cache.get(q);
  if (hit !== undefined) return hit;

  let slug = ALIAS_TO_SLUG.get(q) ?? null;

  // naive plural/singular fallback (EN -s/-es, DE -n/-en)
  if (!slug) {
    for (const v of [q + "s", q + "es", q + "n", q + "en"]) {
      slug = ALIAS_TO_SLUG.get(v) ?? null;
      if (slug) break;
    }
  }
  if (!slug && q.endsWith("s")) slug = ALIAS_TO_SLUG.get(q.slice(0, -1)) ?? null;
  if (!slug && q.endsWith("es")) slug = ALIAS_TO_SLUG.get(q.slice(0, -2)) ?? null;

  // longest alias phrase contained in the query ("ripe cherry tomatoes, diced")
  if (!slug && q.length >= 3) {
    for (const alias of ALIASES_BY_LENGTH) {
      if (alias.length < 3) break; // too generic — avoid false hits
      if (alias.length > q.length) continue;
      // allow English/German plural suffixes: tomato(es), Zwiebel(n), Bohne(n)
      if (new RegExp(`(^|[^a-z0-9])${escapeRe(alias)}(es|s|en|n)?([^a-z0-9]|$)`).test(q)) {
        slug = ALIAS_TO_SLUG.get(alias) ?? null;
        break;
      }
    }
  }

  const result = slug ? `/ingredients/${slug}.png` : null;
  cache.set(q, result);
  return result;
}
