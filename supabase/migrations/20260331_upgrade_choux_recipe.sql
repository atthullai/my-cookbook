-- Run this after the main cookbook migration if you already imported the starter recipes.
-- It upgrades existing "choux-au-craquelin" rows in Supabase to the richer version with
-- all ingredient sections, process photos, source link, and Instagram video link.

update public.recipes
set
  title_en = 'Choux Au Craquelin (Cream Puff)',
  title_de = 'Choux au Craquelin mit Vanille-Diplomatcreme',
  author_name = 'Saran',
  learned_from = 'The Baking Spoon',
  description_en = 'A crisp-topped cream puff with vanilla bean diplomat cream, whipped cream, and fresh berries, adapted closely from The Baking Spoon reference page.',
  description_de = 'Ein knuspriges Choux mit Vanille-Diplomatcreme, Schlagsahne und frischen Beeren, eng an die Vorlage von The Baking Spoon angelehnt.',
  category = 'Dessert',
  tags = array['french pastry', 'cream puff', 'berries', 'baking', 'choux', 'diplomat cream'],
  ingredients = '[
    {
      "group_en": "Vanilla Diplomat Cream",
      "group_de": "Vanille-Diplomatcreme",
      "items": [
        { "amount": "3", "unit": "", "name_en": "egg yolks", "name_de": "Eigelb" },
        { "amount": "45", "unit": "g", "name_en": "granulated sugar", "name_de": "Zucker" },
        { "amount": "25", "unit": "g", "name_en": "cornstarch", "name_de": "Speisestarke" },
        { "amount": "pinch", "unit": "", "name_en": "kosher salt", "name_de": "eine Prise koscheres Salz" },
        { "amount": "1/2", "unit": "", "name_en": "vanilla bean", "name_de": "Vanilleschote" },
        { "amount": "250", "unit": "g", "name_en": "milk", "name_de": "Milch" },
        { "amount": "22", "unit": "g", "name_en": "unsalted butter", "name_de": "ungesalzene Butter" }
      ]
    },
    {
      "group_en": "Whipped Cream",
      "group_de": "Schlagsahne",
      "items": [
        { "amount": "300", "unit": "g", "name_en": "heavy whipping cream, cold", "name_de": "kalte Schlagsahne" },
        { "amount": "65", "unit": "g", "name_en": "granulated sugar", "name_de": "Zucker" }
      ]
    },
    {
      "group_en": "Craquelin",
      "group_de": "Craquelin",
      "items": [
        { "amount": "50", "unit": "g", "name_en": "unsalted butter", "name_de": "ungesalzene Butter" },
        { "amount": "60", "unit": "g", "name_en": "dark brown sugar", "name_de": "dunkler brauner Zucker" },
        { "amount": "60", "unit": "g", "name_en": "all-purpose flour", "name_de": "Mehl" }
      ]
    },
    {
      "group_en": "Choux Pastry",
      "group_de": "Brandteig",
      "items": [
        { "amount": "62", "unit": "g", "name_en": "water", "name_de": "Wasser" },
        { "amount": "62", "unit": "g", "name_en": "milk", "name_de": "Milch" },
        { "amount": "15", "unit": "g", "name_en": "granulated sugar", "name_de": "Zucker" },
        { "amount": "pinch", "unit": "", "name_en": "kosher salt", "name_de": "eine Prise koscheres Salz" },
        { "amount": "55", "unit": "g", "name_en": "unsalted butter", "name_de": "ungesalzene Butter" },
        { "amount": "75", "unit": "g", "name_en": "all-purpose flour, sifted", "name_de": "gesiebtes Mehl" },
        { "amount": "100-120", "unit": "g", "name_en": "eggs, lightly beaten", "name_de": "leicht verquirlte Eier" },
        { "amount": "", "unit": "", "name_en": "strawberries and blueberries", "name_de": "Erdbeeren und Blaubeeren" },
        { "amount": "", "unit": "", "name_en": "powdered sugar", "name_de": "Puderzucker" }
      ]
    }
  ]'::jsonb,
  steps_en = '## Part 1 Of Diplomat Cream
1. Whisk yolks, sugar, salt, and cornstarch in a heatproof bowl until smooth and pale.
2. Warm milk, half the sugar, and the vanilla bean in a saucepan just until boiling, then remove from the heat.
3. Temper the egg mixture with some hot milk, then return everything to the saucepan.
4. Cook over medium heat, whisking constantly, until thick and bubbling.
5. Strain the pastry cream, stir in the butter, cover the surface, and chill for at least 2 hours.
## Craquelin
1. Cream butter and dark brown sugar until smooth, then mix in the flour just until a dough forms.
2. Roll the dough between parchment sheets to about 2-3 mm thickness.
3. Chill until firm, then cut 2-inch discs and keep them cold.
## Choux Pastry
1. Preheat the oven to 400°F / 204°C and prepare a lined baking sheet with 2-inch guide circles.
2. Bring water, milk, sugar, salt, and butter to a full boil in a saucepan.
3. Remove from the heat, add the sifted flour all at once, and mix into a smooth panade.
4. Return to medium heat and cook for 1-2 minutes until a thin film forms on the pan.
5. Cool the dough briefly in a mixer bowl, then add the beaten eggs gradually until the batter forms a smooth inverted triangle from the spatula.
6. Pipe 2-inch mounds, top each one with a craquelin disc, and bake 10 minutes at 400°F / 204°C then 20-22 minutes at 375°F / 190°C.
7. Poke each baked puff to release steam and cool completely.
## Part 2 Of Diplomat Cream
1. Whip the cold cream with sugar to medium peaks.
2. Loosen the chilled pastry cream, fold in one-third of the whipped cream, and reserve the rest for finishing.
3. Slice the choux tops, fill with diplomat cream, add strawberries and blueberries, pipe whipped cream, place the tops back on, and finish with powdered sugar.',
  steps_de = '## Teil 1 Der Diplomatcreme
1. Eigelb, Zucker, Salz und Speisestarke in einer hitzefesten Schussel hell und glatt verruhren.
2. Milch, die Halfte des Zuckers und die Vanilleschote im Topf bis knapp zum Kochen erhitzen und dann vom Herd nehmen.
3. Die Eigelbmischung mit etwas heisser Milch angleichen und anschliessend alles zuruck in den Topf geben.
4. Unter standigem Ruhren bei mittlerer Hitze kochen, bis die Creme dick wird und blasig kocht.
5. Die Creme durch ein Sieb streichen, Butter einruhren, direkt abdecken und mindestens 2 Stunden kuhlen.
## Craquelin
1. Butter und dunklen braunen Zucker cremig ruhren und dann das Mehl nur kurz einarbeiten, bis ein Teig entsteht.
2. Den Teig zwischen zwei Lagen Backpapier etwa 2-3 mm dick ausrollen.
3. Kalt stellen, 2-Zoll-Scheiben ausstechen und bis zur Verwendung kuhlschrankkalt halten.
## Brandteig
1. Den Ofen auf 400°F / 204°C vorheizen und ein Backblech mit 2-Zoll-Hilfskreisen vorbereiten.
2. Wasser, Milch, Zucker, Salz und Butter im Topf vollstandig aufkochen.
3. Vom Herd nehmen, das gesiebte Mehl auf einmal zugeben und zu einer glatten Panade verruhren.
4. Zuruck auf mittlere Hitze stellen und 1-2 Minuten kochen, bis sich ein dunner Film am Topf bildet.
5. Den Teig kurz abkuhlen lassen und dann die Eier nach und nach einarbeiten, bis ein glattes umgekehrtes Dreieck vom Spatel hangt.
6. 2-Zoll-Hauben aufspritzen, jede mit einer Craquelin-Scheibe belegen und 10 Minuten bei 400°F / 204°C und anschliessend 20-22 Minuten bei 375°F / 190°C backen.
7. Die gebackenen Choux einstechen, damit Dampf entweicht, und vollstandig auskuhlen lassen.
## Teil 2 Der Diplomatcreme
1. Die kalte Sahne mit Zucker bis zu mittleren Spitzen aufschlagen.
2. Die gekuhlte Konditorcreme glatt ruhren, ein Drittel der Sahne unterheben und den Rest fur das Finish aufbewahren.
3. Die Deckel der Choux abschneiden, mit Diplomatcreme fullen, Erdbeeren und Blaubeeren hineingeben, Sahne aufspritzen, Deckel aufsetzen und mit Puderzucker bestreuen.',
  notes_en = 'Best served the same day. Storage from the source page: pastry cream and diplomat cream keep in the fridge up to 3 days, baked empty choux keep 2 days at room temperature or 3 days chilled, and filled choux are best eaten the day they are assembled. The source also notes that unbaked craquelin freezes for 1 month and unbaked piped choux freeze for up to 3 months.',
  notes_de = 'Am besten am selben Tag servieren. Laut der Vorlage halten Konditorcreme und Diplomatcreme bis zu 3 Tage im Kuhlschrank, leere gebackene Choux 2 Tage bei Raumtemperatur oder 3 Tage gekuhlt, und gefullte Choux sollten am Tag des Fullens gegessen werden. Ungebackenes Craquelin kann etwa 1 Monat und ungebackene aufgespritzte Choux bis zu 3 Monate eingefroren werden.',
  tips_en = 'Weigh everything for consistency. Do not open the oven while the choux are rising. Stop adding egg once the batter falls in a smooth inverted triangle from the spatula. Keep the craquelin cold so it transfers neatly to the piped choux.',
  tips_de = 'Wiege alle Zutaten fur gleichmassige Ergebnisse. Offne den Ofen nicht, wahrend die Choux aufgehen. Horte mit dem Ei auf, sobald der Teig als glattes umgekehrtes Dreieck vom Spatel fallt. Halte das Craquelin kalt, damit es sauber auf die Choux gelegt werden kann.',
  storage_en = 'Pastry cream and diplomat cream keep up to 3 days in the fridge. Baked unfilled choux keep about 2 days at room temperature or 3 days chilled. Filled choux are best the day they are assembled. Unbaked craquelin can be frozen for 1 month, and unbaked piped choux can be frozen up to 3 months.',
  storage_de = 'Konditorcreme und Diplomatcreme halten bis zu 3 Tage im Kuhlschrank. Gebackene ungefullte Choux halten etwa 2 Tage bei Raumtemperatur oder 3 Tage gekuhlt. Gefullte Choux schmecken am besten am Tag des Fullens. Ungebackenes Craquelin kann 1 Monat und ungebackene aufgespritzte Choux bis zu 3 Monate eingefroren werden.',
  faq = '[
    {
      "question_en": "Why did my choux collapse?",
      "question_de": "Warum sind meine Choux zusammengefallen?",
      "answer_en": "They were usually underbaked, had too much moisture, or the oven door was opened too early. Bake until deeply golden and release steam after baking.",
      "answer_de": "Meistens waren sie unterbacken, zu feucht oder der Ofen wurde zu fruh geoffnet. Backe sie tief goldbraun und lasse nach dem Backen den Dampf entweichen."
    },
    {
      "question_en": "How do I know when the choux batter has enough egg?",
      "question_de": "Woran erkenne ich, dass genug Ei im Brandteig ist?",
      "answer_en": "Lift the batter with a spatula. It should fall in a smooth inverted triangle shape instead of breaking off in clumps.",
      "answer_de": "Heb den Teig mit einem Spatel an. Er sollte als glattes umgekehrtes Dreieck fallen und nicht klumpig abreissen."
    }
  ]'::jsonb,
  troubleshooting = '[
    {
      "issue_en": "The craquelin is sticking and hard to transfer.",
      "issue_de": "Das Craquelin klebt und lasst sich schwer umsetzen.",
      "fix_en": "Chill it longer and cut the discs while the dough is still very cold.",
      "fix_de": "Kuhle es langer und steche die Scheiben aus, wahrend der Teig noch sehr kalt ist."
    },
    {
      "issue_en": "My pastry cream turned lumpy.",
      "issue_de": "Meine Konditorcreme ist klumpig geworden.",
      "fix_en": "Whisk constantly while cooking and strain it through a fine sieve right away.",
      "fix_de": "Ruhre beim Kochen standig mit dem Schneebesen und streiche die Creme sofort durch ein feines Sieb."
    }
  ]'::jsonb,
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin1.jpg",
      "caption_en": "Start by preparing and chilling the diplomat cream base.",
      "caption_de": "Beginne damit, die Basis der Diplomatcreme zuzubereiten und zu kuhlen."
    },
    {
      "step_number": "2",
      "image_url": "https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin-5.jpg",
      "caption_en": "Roll the craquelin thin and keep it cold for clean circles.",
      "caption_de": "Rolle das Craquelin dunn aus und halte es kalt, damit saubere Kreise entstehen."
    },
    {
      "step_number": "3",
      "image_url": "https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin-6.jpg",
      "caption_en": "Pipe the choux batter into even mounds before topping them.",
      "caption_de": "Spritze den Brandteig in gleichmassige Hauben, bevor du sie belegst."
    },
    {
      "step_number": "4",
      "image_url": "https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin-9.jpg",
      "caption_en": "Bake until the shells are deeply golden and crisp.",
      "caption_de": "Backe, bis die Schalen tief goldbraun und knusprig sind."
    },
    {
      "step_number": "5",
      "image_url": "https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin-14.jpg",
      "caption_en": "Fill with diplomat cream, berries, and whipped cream before dusting with sugar.",
      "caption_de": "Fulle mit Diplomatcreme, Beeren und Schlagsahne und bestaube danach mit Zucker."
    }
  ]'::jsonb,
  source_url = 'https://www.thebakingspoon.com/choux-au-craquelin-vanilla-bean-diplomat-cream/',
  video_url = 'https://www.instagram.com/reel/C2sZvZ9RC1d/?utm_source=ig_embed&utm_campaign=loading',
  servings = 11,
  equipment = '[
    { "label_en": "Kitchen scale", "label_de": "Kuchenwaage" },
    { "label_en": "Stand mixer with paddle attachment", "label_de": "Standmixer mit Flachruhrer" },
    { "label_en": "Saucepan", "label_de": "Topf" },
    { "label_en": "Spatula", "label_de": "Spatel" },
    { "label_en": "Rolling pin", "label_de": "Nudelholz" },
    { "label_en": "2-inch cookie cutter", "label_de": "2-Zoll-Ausstecher" },
    { "label_en": "Round piping tip", "label_de": "runde Spritztulle" },
    { "label_en": "Piping bag", "label_de": "Spritzbeutel" },
    { "label_en": "Baking sheet", "label_de": "Backblech" },
    { "label_en": "Baking mat or parchment paper", "label_de": "Backmatte oder Backpapier" }
  ]'::jsonb,
  image_urls = array[
    'https://www.thebakingspoon.com/wp-content/uploads/2024/01/choux-1200.jpg',
    'https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin1.jpg',
    'https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin-5.jpg',
    'https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin-6.jpg',
    'https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin-9.jpg',
    'https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin-14.jpg',
    'https://www.thebakingspoon.com/wp-content/uploads/2024/01/chouxaucraquelin.jpg'
  ]
where slug = 'choux-au-craquelin';
