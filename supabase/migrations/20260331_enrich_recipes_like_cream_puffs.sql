-- This migration upgrades the existing cookbook recipes in Supabase with richer
-- sections similar to the cream puff recipe: tips, storage, FAQ, troubleshooting,
-- and expanded manual nutrition facts with vitamins and minerals.

update public.recipes
set
  tips_en = 'Cook the dal until it becomes completely soft, then let the spinach carry the fresh flavor. Add the garlic tempering last so the aroma stays bright.',
  tips_de = 'Koche das Dal ganz weich und lass den frischen Geschmack vom Spinat tragen. Gib die Knoblauch-Temperierung erst am Ende dazu, damit das Aroma frisch bleibt.',
  storage_en = 'Refrigerate for up to 2 days. Reheat with a splash of water because the dal thickens as it rests.',
  storage_de = 'Bis zu 2 Tage im Kuhlschrank lagern. Beim Aufwarmen etwas Wasser zugeben, weil das Dal beim Stehen eindickt.',
  faq = '[
    {
      "question_en": "Can I use frozen spinach?",
      "question_de": "Kann ich TK-Spinat verwenden?",
      "answer_en": "Yes. Thaw and squeeze it first so the dal does not turn watery.",
      "answer_de": "Ja. Vorher auftauen und ausdrucken, damit das Dal nicht zu dunn wird."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The dal tastes flat.",
      "issue_de": "Das Dal schmeckt flach.",
      "fix_en": "Add a little more salt, ghee, or a sharper garlic-chili tempering.",
      "fix_de": "Gib etwas mehr Salz, Ghee oder eine kraftigere Knoblauch-Chili-Temperierung dazu."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "220",
    "fat_g": "5",
    "saturated_fat_g": "1",
    "carbs_g": "29",
    "fiber_g": "8",
    "sugar_g": "4",
    "protein_g": "12",
    "sodium_mg": "340",
    "cholesterol_mg": "0",
    "potassium_mg": "760",
    "calcium_mg": "145",
    "iron_mg": "5",
    "magnesium_mg": "88",
    "phosphorus_mg": "190",
    "zinc_mg": "1.7",
    "vitamin_a_mcg": "510",
    "vitamin_c_mg": "19",
    "vitamin_d_mcg": "0",
    "vitamin_e_mg": "2",
    "vitamin_k_mcg": "320",
    "vitamin_b6_mg": "0.3",
    "vitamin_b12_mcg": "0",
    "folate_mcg": "190",
    "note_en": "Approximate nutrition per serving for a home-style spinach dal.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur ein hausgemachtes Spinat-Dal."
  }'::jsonb
where slug = 'palakkura-pappu';

update public.recipes
set
  tips_en = 'Keep the texture slightly loose so it coats pongal and idli well. Let the brinjal soften fully, but do not cook it down into a puree.',
  tips_de = 'Halte die Konsistenz eher locker, damit sie Pongal und Idli gut umhullt. Die Aubergine soll weich sein, aber nicht komplett zerfallen.',
  storage_en = 'Refrigerate for up to 2 days. Reheat gently and loosen with hot water if needed.',
  storage_de = 'Bis zu 2 Tage im Kuhlschrank lagern. Sanft erwarmen und bei Bedarf mit heissem Wasser lockern.',
  faq = '[
    {
      "question_en": "Can I make gosthu thicker?",
      "question_de": "Kann ich Gosthu dicker kochen?",
      "answer_en": "Yes, but it is traditionally kept fairly loose for tiffin dishes.",
      "answer_de": "Ja, aber fur Tiffin-Gerichte wird es traditionell eher locker gehalten."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The tamarind tastes too sharp.",
      "issue_de": "Die Tamarinde schmeckt zu scharf.",
      "fix_en": "Let it simmer a little longer and add a small pinch of jaggery.",
      "fix_de": "Lass es etwas langer kochen und gib eine kleine Prise Jaggery dazu."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "115",
    "fat_g": "4",
    "saturated_fat_g": "0.5",
    "carbs_g": "18",
    "fiber_g": "5",
    "sugar_g": "7",
    "protein_g": "3",
    "sodium_mg": "310",
    "cholesterol_mg": "0",
    "potassium_mg": "420",
    "calcium_mg": "40",
    "iron_mg": "1.3",
    "magnesium_mg": "32",
    "phosphorus_mg": "55",
    "zinc_mg": "0.5",
    "vitamin_a_mcg": "35",
    "vitamin_c_mg": "11",
    "vitamin_d_mcg": "0",
    "vitamin_e_mg": "0.8",
    "vitamin_k_mcg": "18",
    "vitamin_b6_mg": "0.2",
    "vitamin_b12_mcg": "0",
    "folate_mcg": "36",
    "note_en": "Approximate nutrition per serving for a tangy brinjal side dish.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur eine saftig-saure Auberginenbeilage."
  }'::jsonb
where slug = 'chidambaram-gosthu';

update public.recipes
set
  tips_en = 'Tiffin sambar should be thinner and softer than lunch sambar. A little jaggery helps round the hotel-style flavor.',
  tips_de = 'Tiffin-Sambar sollte dunnflussiger und weicher sein als Mittags-Sambar. Etwas Jaggery rundet den Geschmack im Hotelstil ab.',
  storage_en = 'Refrigerate for up to 3 days. Add hot water after chilling if the sambar thickens.',
  storage_de = 'Bis zu 3 Tage im Kuhlschrank lagern. Nach dem Kuhlen bei Bedarf mit heissem Wasser verdunnen.',
  faq = '[
    {
      "question_en": "Why does hotel sambar taste different?",
      "question_de": "Warum schmeckt Hotel-Sambar anders?",
      "answer_en": "It is usually thinner, slightly sweeter, and cooked until the onion-tomato base is very soft.",
      "answer_de": "Es ist meist dunnflussiger, leicht susser und die Zwiebel-Tomaten-Basis wird sehr weich gekocht."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The sambar is too thick for idli.",
      "issue_de": "Das Sambar ist zu dick fur Idli.",
      "fix_en": "Add hot water little by little and simmer briefly after each addition.",
      "fix_de": "Gib nach und nach heisses Wasser dazu und lass es nach jeder Zugabe kurz kochen."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "145",
    "fat_g": "4",
    "saturated_fat_g": "0.6",
    "carbs_g": "22",
    "fiber_g": "6",
    "sugar_g": "6",
    "protein_g": "6",
    "sodium_mg": "360",
    "cholesterol_mg": "0",
    "potassium_mg": "390",
    "calcium_mg": "55",
    "iron_mg": "1.6",
    "magnesium_mg": "34",
    "phosphorus_mg": "92",
    "zinc_mg": "0.8",
    "vitamin_a_mcg": "160",
    "vitamin_c_mg": "9",
    "vitamin_d_mcg": "0",
    "vitamin_e_mg": "0.7",
    "vitamin_k_mcg": "18",
    "vitamin_b6_mg": "0.2",
    "vitamin_b12_mcg": "0",
    "folate_mcg": "52",
    "note_en": "Approximate nutrition per serving for hotel-style tiffin sambar.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur Tiffin-Sambar im Hotelstil."
  }'::jsonb
where slug = 'tiffin-sambar';

update public.recipes
set
  tips_en = 'Mash while the vegetables are hot for the smoothest bhaji. Add butter and lemon at the end for the best street-food finish.',
  tips_de = 'Stampfe das Gemuse im heissen Zustand fur die glatteste Bhaji. Gib Butter und Zitrone erst am Ende dazu fur den besten Street-Food-Abschluss.',
  storage_en = 'Refrigerate the bhaji for up to 3 days. Toast the pav fresh just before serving.',
  storage_de = 'Die Bhaji bis zu 3 Tage im Kuhlschrank lagern. Pav erst kurz vor dem Servieren frisch anrosten.',
  faq = '[
    {
      "question_en": "Can I make pav bhaji without a pressure cooker?",
      "question_de": "Kann ich Pav Bhaji ohne Schnellkochtopf machen?",
      "answer_en": "Yes. Cook the vegetables covered on the stovetop until very soft, then mash them well.",
      "answer_de": "Ja. Koche das Gemuse abgedeckt auf dem Herd sehr weich und stampfe es dann gut."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The bhaji tastes dull.",
      "issue_de": "Die Bhaji schmeckt fad.",
      "fix_en": "Add more pav bhaji masala, a little more salt, butter, and lemon juice.",
      "fix_de": "Gib mehr Pav-Bhaji-Masala, etwas mehr Salz, Butter und Zitronensaft dazu."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "255",
    "fat_g": "10",
    "saturated_fat_g": "4",
    "carbs_g": "35",
    "fiber_g": "8",
    "sugar_g": "8",
    "protein_g": "6",
    "sodium_mg": "480",
    "cholesterol_mg": "12",
    "potassium_mg": "760",
    "calcium_mg": "62",
    "iron_mg": "2.2",
    "magnesium_mg": "46",
    "phosphorus_mg": "120",
    "zinc_mg": "1",
    "vitamin_a_mcg": "280",
    "vitamin_c_mg": "46",
    "vitamin_d_mcg": "0",
    "vitamin_e_mg": "2.1",
    "vitamin_k_mcg": "22",
    "vitamin_b6_mg": "0.4",
    "vitamin_b12_mcg": "0",
    "folate_mcg": "65",
    "note_en": "Approximate nutrition per serving for the bhaji only, without buttered pav.",
    "note_de": "Ungefahrer Nahrwert pro Portion nur fur die Bhaji, ohne gebuttertes Pav."
  }'::jsonb
where slug = 'cooker-pav-bhaji';

update public.recipes
set
  tips_en = 'Heat mor kuzhambu gently and never let it boil hard after adding the yogurt mixture. Sour curd gives the most balanced flavor.',
  tips_de = 'Erhitze Mor Kuzhambu sanft und lass es nach dem Joghurtgemisch nicht stark kochen. Saurer Joghurt gibt den ausgewogensten Geschmack.',
  storage_en = 'Refrigerate for up to 2 days. Reheat slowly over low heat so the curry stays smooth.',
  storage_de = 'Bis zu 2 Tage im Kuhlschrank lagern. Langsam bei niedriger Hitze erwarmen, damit das Curry glatt bleibt.',
  faq = '[
    {
      "question_en": "Why did my mor kuzhambu split?",
      "question_de": "Warum hat sich mein Mor Kuzhambu getrennt?",
      "answer_en": "The heat was too high or it boiled too hard after the yogurt was added.",
      "answer_de": "Die Hitze war zu hoch oder es hat nach dem Joghurt zu stark gekocht."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The curry is too sour.",
      "issue_de": "Das Curry ist zu sauer.",
      "fix_en": "Balance it with a little more coconut paste or serve it with plain rice.",
      "fix_de": "Gleiche es mit etwas mehr Kokospaste aus oder serviere es mit schlichtem Reis."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "165",
    "fat_g": "11",
    "saturated_fat_g": "7",
    "carbs_g": "10",
    "fiber_g": "1",
    "sugar_g": "5",
    "protein_g": "6",
    "sodium_mg": "290",
    "cholesterol_mg": "18",
    "potassium_mg": "310",
    "calcium_mg": "190",
    "iron_mg": "0.8",
    "magnesium_mg": "30",
    "phosphorus_mg": "155",
    "zinc_mg": "0.8",
    "vitamin_a_mcg": "70",
    "vitamin_c_mg": "9",
    "vitamin_d_mcg": "0.2",
    "vitamin_e_mg": "0.7",
    "vitamin_k_mcg": "10",
    "vitamin_b6_mg": "0.1",
    "vitamin_b12_mcg": "0.6",
    "folate_mcg": "28",
    "note_en": "Approximate nutrition per serving for a yogurt-coconut mor kuzhambu.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur ein Mor Kuzhambu mit Joghurt und Kokos."
  }'::jsonb
where slug = 'mor-kuzhambu';

update public.recipes
set
  tips_en = 'Use ripe tomatoes for the best balance of sweetness and tang. Mash only lightly if you want a more rustic everyday dal.',
  tips_de = 'Verwende reife Tomaten fur die beste Balance aus Suss und Saure. Stampfe nur leicht, wenn du ein rustikaleres Alltags-Dal mochtest.',
  storage_en = 'Refrigerate for up to 3 days. Reheat with a splash of water if the dal thickens too much.',
  storage_de = 'Bis zu 3 Tage im Kuhlschrank lagern. Beim Aufwarmen etwas Wasser zugeben, wenn das Dal zu dick wird.',
  faq = '[
    {
      "question_en": "Can I make it without onion?",
      "question_de": "Kann ich es ohne Zwiebel machen?",
      "answer_en": "Yes. It still works well and tastes even more tomato-forward.",
      "answer_de": "Ja. Es funktioniert trotzdem gut und schmeckt dann noch tomatiger."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The dal is too sour.",
      "issue_de": "Das Dal ist zu sauer.",
      "fix_en": "Add a little more cooked dal or a spoon of ghee to soften the acidity.",
      "fix_de": "Gib etwas mehr gekochtes Dal oder einen Loffel Ghee dazu, um die Saure abzumildern."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "205",
    "fat_g": "5",
    "saturated_fat_g": "0.8",
    "carbs_g": "29",
    "fiber_g": "7",
    "sugar_g": "5",
    "protein_g": "10",
    "sodium_mg": "330",
    "cholesterol_mg": "0",
    "potassium_mg": "590",
    "calcium_mg": "58",
    "iron_mg": "2.5",
    "magnesium_mg": "58",
    "phosphorus_mg": "170",
    "zinc_mg": "1.1",
    "vitamin_a_mcg": "120",
    "vitamin_c_mg": "18",
    "vitamin_d_mcg": "0",
    "vitamin_e_mg": "1",
    "vitamin_k_mcg": "12",
    "vitamin_b6_mg": "0.2",
    "vitamin_b12_mcg": "0",
    "folate_mcg": "120",
    "note_en": "Approximate nutrition per serving for a simple Andhra tomato dal.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur ein einfaches Andhra-Tomaten-Dal."
  }'::jsonb
where slug = 'tomato-pappu';

update public.recipes
set
  tips_en = 'Let the dal simmer after combining so it turns creamy. Pour the ghee tadka over just before serving for the fullest aroma.',
  tips_de = 'Lass das Dal nach dem Vermengen sanft kochen, damit es cremig wird. Gib das Ghee-Tadka erst kurz vor dem Servieren daruber fur das vollste Aroma.',
  storage_en = 'Refrigerate for up to 3 days. Store extra tadka separately if you want the freshest finish.',
  storage_de = 'Bis zu 3 Tage im Kuhlschrank lagern. Extra Tadka separat aufbewahren, wenn du das frischeste Finish mochtest.',
  faq = '[
    {
      "question_en": "Which dal mix gives the best texture?",
      "question_de": "Welche Dal-Mischung gibt die beste Konsistenz?",
      "answer_en": "A mix of toor and moong gives both body and softness, which suits dhaba-style dal very well.",
      "answer_de": "Eine Mischung aus Toor und Moong gibt sowohl Korper als auch Weichheit und passt sehr gut zu Dal im Dhaba-Stil."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The tadka tastes burnt.",
      "issue_de": "Das Tadka schmeckt verbrannt.",
      "fix_en": "Lower the heat and add the garlic only after the fat is hot but not smoking.",
      "fix_de": "Reduziere die Hitze und gib den Knoblauch erst dazu, wenn das Fett heiss, aber nicht rauchend ist."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "240",
    "fat_g": "9",
    "saturated_fat_g": "3",
    "carbs_g": "28",
    "fiber_g": "8",
    "sugar_g": "4",
    "protein_g": "12",
    "sodium_mg": "390",
    "cholesterol_mg": "10",
    "potassium_mg": "520",
    "calcium_mg": "68",
    "iron_mg": "2.7",
    "magnesium_mg": "62",
    "phosphorus_mg": "195",
    "zinc_mg": "1.5",
    "vitamin_a_mcg": "105",
    "vitamin_c_mg": "8",
    "vitamin_d_mcg": "0",
    "vitamin_e_mg": "0.9",
    "vitamin_k_mcg": "14",
    "vitamin_b6_mg": "0.2",
    "vitamin_b12_mcg": "0",
    "folate_mcg": "128",
    "note_en": "Approximate nutrition per serving for dhaba-style dal tadka.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur Dal Tadka im Dhaba-Stil."
  }'::jsonb
where slug = 'dhaba-dal-tadka';

update public.recipes
set
  tips_en = 'Cook the soaked moong only until just tender so it keeps its shape. The final sabzi should stay fairly dry.',
  tips_de = 'Koche das eingeweichte Moong nur bis es gerade weich ist, damit es seine Form behalt. Die Sabzi soll am Ende eher trocken bleiben.',
  storage_en = 'Refrigerate for up to 2 days. Reheat in a skillet so excess moisture can evaporate.',
  storage_de = 'Bis zu 2 Tage im Kuhlschrank lagern. In einer Pfanne aufwarmen, damit uberflussige Feuchtigkeit verdampfen kann.',
  faq = '[
    {
      "question_en": "Can I use sprouted moong?",
      "question_de": "Kann ich gekeimtes Moong verwenden?",
      "answer_en": "Yes. Reduce the cooking time slightly so the sprouts stay pleasantly firm.",
      "answer_de": "Ja. Verkurze die Garzeit etwas, damit die Sprossen angenehm bissfest bleiben."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The sabzi turned wet.",
      "issue_de": "Die Sabzi ist zu nass geworden.",
      "fix_en": "Cook uncovered for a few minutes at the end and avoid overcooking the vegetables.",
      "fix_de": "Koche am Ende einige Minuten ohne Deckel und gare das Gemuse nicht zu lange."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "175",
    "fat_g": "4",
    "saturated_fat_g": "0.5",
    "carbs_g": "24",
    "fiber_g": "7",
    "sugar_g": "5",
    "protein_g": "8",
    "sodium_mg": "250",
    "cholesterol_mg": "0",
    "potassium_mg": "470",
    "calcium_mg": "58",
    "iron_mg": "2.3",
    "magnesium_mg": "61",
    "phosphorus_mg": "138",
    "zinc_mg": "1.1",
    "vitamin_a_mcg": "210",
    "vitamin_c_mg": "22",
    "vitamin_d_mcg": "0",
    "vitamin_e_mg": "1.4",
    "vitamin_k_mcg": "46",
    "vitamin_b6_mg": "0.3",
    "vitamin_b12_mcg": "0",
    "folate_mcg": "96",
    "note_en": "Approximate nutrition per serving for green moong dal sabzi.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur Gemuse mit grunem Moong Dal."
  }'::jsonb
where slug = 'green-moong-dal-sabzi';

update public.recipes
set
  tips_en = 'Blend the gravy fully smooth for the most restaurant-style finish. Add paneer only at the end so it stays soft.',
  tips_de = 'Mixe die Sauce ganz glatt fur das restaurantahnlichste Ergebnis. Gib den Paneer erst am Ende dazu, damit er weich bleibt.',
  storage_en = 'Refrigerate for up to 2 days. Reheat gently and loosen with a splash of cream or water if needed.',
  storage_de = 'Bis zu 2 Tage im Kuhlschrank lagern. Sanft erwarmen und bei Bedarf mit etwas Sahne oder Wasser lockern.',
  faq = '[
    {
      "question_en": "Can I skip cream?",
      "question_de": "Kann ich die Sahne weglassen?",
      "answer_en": "Yes, but the gravy will taste less rich. A little cashew paste works as a substitute.",
      "answer_de": "Ja, aber die Sauce schmeckt dann weniger reichhaltig. Etwas Cashewpaste funktioniert als Ersatz."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The paneer became rubbery.",
      "issue_de": "Der Paneer ist gummiartig geworden.",
      "fix_en": "Add it only at the end and simmer very briefly, or soak it in warm water before using.",
      "fix_de": "Gib ihn erst am Ende dazu und lass ihn nur ganz kurz ziehen, oder weiche ihn vorher in warmem Wasser ein."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "305",
    "fat_g": "23",
    "saturated_fat_g": "12",
    "carbs_g": "11",
    "fiber_g": "2",
    "sugar_g": "6",
    "protein_g": "13",
    "sodium_mg": "430",
    "cholesterol_mg": "46",
    "potassium_mg": "410",
    "calcium_mg": "310",
    "iron_mg": "1.4",
    "magnesium_mg": "33",
    "phosphorus_mg": "245",
    "zinc_mg": "1.7",
    "vitamin_a_mcg": "230",
    "vitamin_c_mg": "12",
    "vitamin_d_mcg": "0.2",
    "vitamin_e_mg": "1.8",
    "vitamin_k_mcg": "12",
    "vitamin_b6_mg": "0.2",
    "vitamin_b12_mcg": "0.6",
    "folate_mcg": "32",
    "note_en": "Approximate nutrition per serving for paneer butter masala.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur Paneer Butter Masala."
  }'::jsonb
where slug = 'paneer-butter-masala';

update public.recipes
set
  tips_en = 'Grind the coconut paste smooth for the best mouthfeel. Resting the kuzhambu for a short while helps the flavors settle.',
  tips_de = 'Mixe die Kokospaste fur das beste Mundgefuhl ganz fein. Eine kurze Ruhezeit hilft dem Kuzhambu, damit sich die Aromen setzen.',
  storage_en = 'Refrigerate for up to 2 days. Reheat gently so the coconut base stays smooth.',
  storage_de = 'Bis zu 2 Tage im Kuhlschrank lagern. Sanft erwarmen, damit die Kokosbasis glatt bleibt.',
  faq = '[
    {
      "question_en": "Can I use frozen field beans?",
      "question_de": "Kann ich gefrorene Feldbohnen verwenden?",
      "answer_en": "Yes, but reduce the cooking time because they soften faster than fresh beans.",
      "answer_de": "Ja, aber verkuerze die Garzeit, weil sie schneller weich werden als frische Bohnen."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The coconut paste tastes raw.",
      "issue_de": "Die Kokospaste schmeckt roh.",
      "fix_en": "Let the kuzhambu simmer gently for a little longer after adding the ground paste.",
      "fix_de": "Lass das Kuzhambu nach dem Zugeben der Paste noch etwas langer sanft kochen."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "190",
    "fat_g": "10",
    "saturated_fat_g": "7",
    "carbs_g": "20",
    "fiber_g": "6",
    "sugar_g": "4",
    "protein_g": "6",
    "sodium_mg": "260",
    "cholesterol_mg": "0",
    "potassium_mg": "410",
    "calcium_mg": "66",
    "iron_mg": "1.7",
    "magnesium_mg": "42",
    "phosphorus_mg": "110",
    "zinc_mg": "0.9",
    "vitamin_a_mcg": "30",
    "vitamin_c_mg": "11",
    "vitamin_d_mcg": "0",
    "vitamin_e_mg": "0.8",
    "vitamin_k_mcg": "24",
    "vitamin_b6_mg": "0.2",
    "vitamin_b12_mcg": "0",
    "folate_mcg": "48",
    "note_en": "Approximate nutrition per serving for avarakkai poricha kuzhambu.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur Avarakkai Poricha Kuzhambu."
  }'::jsonb
where slug = 'avarakkai-poricha-kuzhambu';

update public.recipes
set
  tips_en = 'Marinate the paneer ahead so it picks up flavor without needing long cooking. Keep the liquid slightly stronger than usual because the rice mellows it.',
  tips_de = 'Mariniere den Paneer fruhzeitig, damit er Geschmack aufnimmt, ohne lange gekocht zu werden. Halte die Flussigkeit etwas kraftiger, weil der Reis den Geschmack mildert.',
  storage_en = 'Refrigerate for up to 2 days. Reheat gently with a spoon of water in a covered pan.',
  storage_de = 'Bis zu 2 Tage im Kuhlschrank lagern. Mit einem Loffel Wasser in einer abgedeckten Pfanne sanft aufwarmen.',
  faq = '[
    {
      "question_en": "Can I make it without saffron?",
      "question_de": "Kann ich es ohne Safran machen?",
      "answer_en": "Yes. It still tastes good, but saffron adds aroma and a festive finish.",
      "answer_de": "Ja. Es schmeckt trotzdem gut, aber Safran gibt Aroma und ein festliches Finish."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The rice turned mushy.",
      "issue_de": "Der Reis ist matschig geworden.",
      "fix_en": "Reduce the water a little next time and let the pressure drop naturally.",
      "fix_de": "Reduziere beim nachsten Mal das Wasser etwas und lass den Druck naturlich abfallen."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "430",
    "fat_g": "16",
    "saturated_fat_g": "6",
    "carbs_g": "56",
    "fiber_g": "3",
    "sugar_g": "4",
    "protein_g": "15",
    "sodium_mg": "470",
    "cholesterol_mg": "22",
    "potassium_mg": "360",
    "calcium_mg": "250",
    "iron_mg": "2.1",
    "magnesium_mg": "46",
    "phosphorus_mg": "240",
    "zinc_mg": "1.8",
    "vitamin_a_mcg": "120",
    "vitamin_c_mg": "8",
    "vitamin_d_mcg": "0.2",
    "vitamin_e_mg": "1.3",
    "vitamin_k_mcg": "16",
    "vitamin_b6_mg": "0.2",
    "vitamin_b12_mcg": "0.4",
    "folate_mcg": "42",
    "note_en": "Approximate nutrition per serving for pressure cooker paneer biryani.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur Paneer-Biryani aus dem Schnellkochtopf."
  }'::jsonb
where slug = 'paneer-biryani';

update public.recipes
set
  tips_en = 'Measure the water carefully and grind the mint paste fine so the flavor spreads evenly. This one works especially well for lunch boxes.',
  tips_de = 'Miss das Wasser genau ab und mahle die Minzpaste fein, damit sich der Geschmack gleichmassig verteilt. Dieses Rezept eignet sich besonders gut fur Lunchboxen.',
  storage_en = 'Refrigerate for up to 2 days. Reheat covered with a splash of water so the rice stays fluffy.',
  storage_de = 'Bis zu 2 Tage im Kuhlschrank lagern. Abgedeckt mit einem Spritzer Wasser aufwarmen, damit der Reis locker bleibt.',
  faq = '[
    {
      "question_en": "Is this good for lunch boxes?",
      "question_de": "Eignet sich das fur Lunchboxen?",
      "answer_en": "Yes. It was designed as a fast one-pot biryani that packs and reheats well.",
      "answer_de": "Ja. Es wurde als schnelles One-Pot-Biryani gedacht, das sich gut einpacken und aufwarmen lasst."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The biryani lacks flavor.",
      "issue_de": "Das Biryani hat zu wenig Geschmack.",
      "fix_en": "Add a little more mint paste, salt, or biryani masala before pressure cooking.",
      "fix_de": "Gib vor dem Druckgaren etwas mehr Minzpaste, Salz oder Biryani-Masala dazu."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "345",
    "fat_g": "10",
    "saturated_fat_g": "2",
    "carbs_g": "57",
    "fiber_g": "5",
    "sugar_g": "5",
    "protein_g": "8",
    "sodium_mg": "410",
    "cholesterol_mg": "4",
    "potassium_mg": "390",
    "calcium_mg": "54",
    "iron_mg": "1.9",
    "magnesium_mg": "42",
    "phosphorus_mg": "155",
    "zinc_mg": "1.1",
    "vitamin_a_mcg": "225",
    "vitamin_c_mg": "17",
    "vitamin_d_mcg": "0",
    "vitamin_e_mg": "1.1",
    "vitamin_k_mcg": "28",
    "vitamin_b6_mg": "0.3",
    "vitamin_b12_mcg": "0",
    "folate_mcg": "58",
    "note_en": "Approximate nutrition per serving for quick vegetable biryani.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur schnelles Gemuse-Biryani."
  }'::jsonb
where slug = 'vegetable-biryani-pressure-cooker';

update public.recipes
set
  tips_en = 'The separate capsicum and cauliflower step is worth it because it protects their texture. The herb paste keeps the biryani lively even without onion and garlic.',
  tips_de = 'Der separate Schritt fur Paprika und Blumenkohl lohnt sich, weil dadurch ihre Struktur geschutzt wird. Die Krauterpaste halt das Biryani auch ohne Zwiebel und Knoblauch lebendig.',
  storage_en = 'Refrigerate for up to 2 days. Reheat gently and fold the rice rather than stirring hard.',
  storage_de = 'Bis zu 2 Tage im Kuhlschrank lagern. Sanft erwarmen und den Reis eher locker unterheben als stark zu ruhren.',
  faq = '[
    {
      "question_en": "Will it still taste like biryani without onion and garlic?",
      "question_de": "Schmeckt es auch ohne Zwiebel und Knoblauch nach Biryani?",
      "answer_en": "Yes. The herb paste and whole spices give it plenty of flavor and freshness.",
      "answer_de": "Ja. Die Krauterpaste und die ganzen Gewurze geben ihm viel Geschmack und Frische."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The vegetables turned too soft.",
      "issue_de": "Das Gemuse ist zu weich geworden.",
      "fix_en": "Keep the cauliflower and capsicum separate until the end, as the source method suggests.",
      "fix_de": "Halte Blumenkohl und Paprika bis zum Ende getrennt, so wie es die Vorlage empfiehlt."
    }
  ]'::jsonb,
  nutrition = '{
    "calories_kcal": "360",
    "fat_g": "11",
    "saturated_fat_g": "2.5",
    "carbs_g": "58",
    "fiber_g": "5",
    "sugar_g": "4",
    "protein_g": "7",
    "sodium_mg": "395",
    "cholesterol_mg": "5",
    "potassium_mg": "385",
    "calcium_mg": "52",
    "iron_mg": "1.8",
    "magnesium_mg": "41",
    "phosphorus_mg": "145",
    "zinc_mg": "1",
    "vitamin_a_mcg": "210",
    "vitamin_c_mg": "19",
    "vitamin_d_mcg": "0",
    "vitamin_e_mg": "1",
    "vitamin_k_mcg": "31",
    "vitamin_b6_mg": "0.3",
    "vitamin_b12_mcg": "0",
    "folate_mcg": "56",
    "note_en": "Approximate nutrition per serving for vegetable biryani without onion and garlic.",
    "note_de": "Ungefahrer Nahrwert pro Portion fur Gemuse-Biryani ohne Zwiebel und Knoblauch."
  }'::jsonb
where slug = 'vegetable-biryani-without-onion-garlic';
