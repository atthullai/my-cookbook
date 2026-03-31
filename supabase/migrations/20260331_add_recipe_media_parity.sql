-- Add source photos, process photos, and recipe-specific video links where available
-- so the saved Supabase recipes feel closer to the richer cream puff page.

update public.recipes
set
  image_urls = ARRAY[
    'https://traditionallymodernfood.com/wp-content/uploads/2025/03/8F349275-0C27-49E9-9354-00ADCE137B29.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2025/03/48970508-2529-485E-B5AE-6F6B6368C9A4-scaled.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2025/03/IMG_5295_jpg-scaled.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2025/03/image-476.png',
    'https://traditionallymodernfood.com/wp-content/uploads/2025/03/image-477.png',
    'https://traditionallymodernfood.com/wp-content/uploads/2025/03/image-478.png'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2025/03/image-476.png",
      "caption_en": "Gather the spinach, dal, and aromatics before cooking.",
      "caption_de": "Spinat, Dal und Gewurze vor dem Kochen bereitlegen."
    },
    {
      "step_number": "2",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2025/03/image-477.png",
      "caption_en": "Cook the dal until soft and mashable.",
      "caption_de": "Das Dal weich kochen, bis es sich gut stampfen lasst."
    },
    {
      "step_number": "3",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2025/03/image-478.png",
      "caption_en": "Simmer the spinach mixture until tender and fragrant.",
      "caption_de": "Die Spinatmischung weich und aromatisch kochen."
    },
    {
      "step_number": "4",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2025/03/image-479.png",
      "caption_en": "Combine, mash lightly, and finish with tempering.",
      "caption_de": "Vermengen, leicht stampfen und mit Temperierung abschliessen."
    }
  ]'::jsonb,
  video_url = 'https://youtu.be/iQlSCEBG3Cc'
where slug = 'palakkura-pappu';

update public.recipes
set
  image_urls = ARRAY[
    'https://traditionallymodernfood.com/wp-content/uploads/2025/01/chidambaram-gosthu-chidambaram-goshtu-6.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2025/01/chidambaram-gosthu-chidambaram-goshtu-1.png',
    'https://traditionallymodernfood.com/wp-content/uploads/2025/01/chidambaram-gosthu-chidambaram-goshtu-10.png',
    'https://traditionallymodernfood.com/wp-content/uploads/2025/01/chidambaram-gosthu-chidambaram-goshtu-11.png',
    'https://traditionallymodernfood.com/wp-content/uploads/2025/01/chidambaram-gosthu-chidambaram-goshtu-12.png',
    'https://traditionallymodernfood.com/wp-content/uploads/2025/01/chidambaram-gosthu-chidambaram-goshtu-13.png'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2025/01/chidambaram-gosthu-chidambaram-goshtu-10.png",
      "caption_en": "Prep the brinjal, tamarind, and onion for the base.",
      "caption_de": "Aubergine, Tamarinde und Zwiebel fur die Basis vorbereiten."
    },
    {
      "step_number": "2",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2025/01/chidambaram-gosthu-chidambaram-goshtu-11.png",
      "caption_en": "Cook the vegetables until the brinjal softens well.",
      "caption_de": "Das Gemuse kochen, bis die Aubergine weich wird."
    },
    {
      "step_number": "3",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2025/01/chidambaram-gosthu-chidambaram-goshtu-12.png",
      "caption_en": "Add tamarind and spice, then simmer into a loose gosthu.",
      "caption_de": "Tamarinde und Gewurze zugeben und zu einem lockeren Gosthu einkochen."
    },
    {
      "step_number": "4",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2025/01/chidambaram-gosthu-chidambaram-goshtu-13.png",
      "caption_en": "Finish with tempering and rest briefly before serving.",
      "caption_de": "Mit Temperierung abschliessen und kurz ruhen lassen."
    }
  ]'::jsonb,
  video_url = 'https://youtube.com/shorts/vB6Bc0-fD1k'
where slug = 'chidambaram-gosthu';

update public.recipes
set
  image_urls = ARRAY[
    'https://traditionallymodernfood.com/wp-content/uploads/2022/01/tiffin-sambar-hotel-style-idli-sambar-66-scaled.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2022/01/tiffin-sambar-hotel-style-idli-sambar-62.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2022/01/tiffin-sambar-hotel-style-idli-sambar-63.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2022/01/tiffin-sambar-hotel-style-idli-sambar-65.jpeg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2022/01/tiffin-sambar-hotel-style-idli-sambar-62.jpeg",
      "caption_en": "Cook the dal and soften the vegetables for the base.",
      "caption_de": "Dal kochen und das Gemuse fur die Basis weich garen."
    },
    {
      "step_number": "2",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2022/01/tiffin-sambar-hotel-style-idli-sambar-63.jpeg",
      "caption_en": "Build the sambar with spice, jaggery, and the cooked dal.",
      "caption_de": "Das Sambar mit Gewurzen, Jaggery und dem gekochten Dal aufbauen."
    },
    {
      "step_number": "3",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2022/01/tiffin-sambar-hotel-style-idli-sambar-65.jpeg",
      "caption_en": "Adjust the thinner tiffin texture before tempering.",
      "caption_de": "Die dunnere Tiffin-Konsistenz vor der Temperierung einstellen."
    },
    {
      "step_number": "4",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2022/01/tiffin-sambar-hotel-style-idli-sambar-66-scaled.jpeg",
      "caption_en": "Serve hot with idli, dosa, or pongal.",
      "caption_de": "Heiss mit Idli, Dosa oder Pongal servieren."
    }
  ]'::jsonb,
  video_url = 'https://youtu.be/1mCqaqZBapU'
where slug = 'tiffin-sambar';

update public.recipes
set
  image_urls = ARRAY[
    'https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-1-scaled.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-10-scaled.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-11-scaled.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-12-scaled.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-13-scaled.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-16-scaled.jpeg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-10-scaled.jpeg",
      "caption_en": "Load the cooker with vegetables, tomatoes, and spices.",
      "caption_de": "Den Schnellkochtopf mit Gemuse, Tomaten und Gewurzen fullen."
    },
    {
      "step_number": "2",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-11-scaled.jpeg",
      "caption_en": "Pressure cook until everything turns soft and mashable.",
      "caption_de": "Unter Druck garen, bis alles weich und gut stampfbar ist."
    },
    {
      "step_number": "3",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-12-scaled.jpeg",
      "caption_en": "Mash the bhaji until smooth but still hearty.",
      "caption_de": "Die Bhaji glatt, aber noch rustikal stampfen."
    },
    {
      "step_number": "4",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-13-scaled.jpeg",
      "caption_en": "Finish with butter and adjust seasoning.",
      "caption_de": "Mit Butter abschliessen und nachwurken."
    },
    {
      "step_number": "5",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2024/04/cooker-pav-bhaji-pav-bhaji-in-cooker-pressure-cooker-pav-bhaji-16-scaled.jpeg",
      "caption_en": "Toast the pav and serve the bhaji hot.",
      "caption_de": "Das Pav anrosten und die Bhaji heiss servieren."
    }
  ]'::jsonb,
  video_url = 'https://youtu.be/ASsiGnSLRhs?si=6YalaoDHvXYRcbuj'
where slug = 'cooker-pav-bhaji';

update public.recipes
set
  image_urls = ARRAY[
    'https://traditionallymodernfood.com/wp-content/uploads/2015/09/vendakkai-mor-kuzhambu-mor-kulambu-22.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2015/09/vendakkai-mor-kuzhambu-mor-kulambu-10.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2015/09/vendakkai-mor-kuzhambu-mor-kulambu-12.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2015/09/vendakkai-mor-kuzhambu-mor-kulambu-16.jpeg',
    'https://traditionallymodernfood.com/wp-content/uploads/2015/09/vendakkai-mor-kuzhambu-mor-kulambu-19.jpeg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2015/09/vendakkai-mor-kuzhambu-mor-kulambu-10.jpeg",
      "caption_en": "Prepare the yogurt-coconut base and the vegetables.",
      "caption_de": "Die Joghurt-Kokos-Basis und das Gemuse vorbereiten."
    },
    {
      "step_number": "2",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2015/09/vendakkai-mor-kuzhambu-mor-kulambu-12.jpeg",
      "caption_en": "Grind the coconut mixture until smooth.",
      "caption_de": "Die Kokosmischung fein und glatt mahlen."
    },
    {
      "step_number": "3",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2015/09/vendakkai-mor-kuzhambu-mor-kulambu-16.jpeg",
      "caption_en": "Warm the curry gently without letting it boil hard.",
      "caption_de": "Das Curry sanft erwarmen, ohne es stark kochen zu lassen."
    },
    {
      "step_number": "4",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2015/09/vendakkai-mor-kuzhambu-mor-kulambu-19.jpeg",
      "caption_en": "Finish with tempering and serve.",
      "caption_de": "Mit Temperierung abschliessen und servieren."
    }
  ]'::jsonb,
  video_url = 'https://youtu.be/9r9ZFN0loyA'
where slug = 'mor-kuzhambu';

update public.recipes
set
  image_urls = ARRAY[
    'https://traditionallymodernfood.com/wp-content/uploads/2023/03/andhra-style-tomato-pappu-tomato-dal-50-scaled.jpeg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://traditionallymodernfood.com/wp-content/uploads/2023/03/andhra-style-tomato-pappu-tomato-dal-50-scaled.jpeg",
      "caption_en": "Cook the dal with tomatoes until soft and mash lightly before tempering.",
      "caption_de": "Das Dal mit Tomaten weich kochen und vor der Temperierung leicht stampfen."
    }
  ]'::jsonb,
  video_url = 'https://youtu.be/QUx4-UUBTWw'
where slug = 'tomato-pappu';

update public.recipes
set
  image_urls = ARRAY[
    'https://www.jeyashriskitchen.com/wp-content/uploads/2015/08/dhaba-style-dal-tadka.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/19716967504_f531644b82_z.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/19718628053_9c7de0328b_z.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/20151546150_a67ed624ee_z.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/20151546630_9702f2eaa3_z.jpg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/19716967504_f531644b82_z.jpg",
      "caption_en": "Cook the dals until soft and creamy.",
      "caption_de": "Die Dals weich und cremig kochen."
    },
    {
      "step_number": "2",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/19718628053_9c7de0328b_z.jpg",
      "caption_en": "Build the onion-tomato base with spices.",
      "caption_de": "Die Zwiebel-Tomaten-Basis mit Gewurzen aufbauen."
    },
    {
      "step_number": "3",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/20151546150_a67ed624ee_z.jpg",
      "caption_en": "Simmer the dal until the texture turns rich.",
      "caption_de": "Das Dal kochen, bis die Konsistenz reichhaltig wird."
    },
    {
      "step_number": "4",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/20151546630_9702f2eaa3_z.jpg",
      "caption_en": "Pour over the hot tadka just before serving.",
      "caption_de": "Das heisse Tadka erst kurz vor dem Servieren darubergiessen."
    }
  ]'::jsonb,
  video_url = 'https://www.youtube.com/watch?v=f_kujZi4K2s'
where slug = 'dhaba-dal-tadka';

update public.recipes
set
  image_urls = ARRAY[
    'https://www.jeyashriskitchen.com/wp-content/uploads/2009/10/green-moong-dal-subzi-recipe.jpg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2009/10/green-moong-dal-subzi-recipe.jpg",
      "caption_en": "Cook the moong just until tender and finish the sabzi dry.",
      "caption_de": "Das Moong nur bis es zart ist kochen und die Sabzi trocken abschliessen."
    }
  ]'::jsonb,
  video_url = 'https://www.youtube.com/watch?v=Kj5q-Xx1Ttc'
where slug = 'green-moong-dal-sabzi';

update public.recipes
set
  image_urls = ARRAY[
    'https://www.jeyashriskitchen.com/wp-content/uploads/2013/08/paneer-recipes.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/21830142675_34622b0d44_z.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/21839715411_4b57950104_z.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/27828932234_6dd2c6c8ec_z.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/27828932644_9f35c3f644_z.jpg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/21830142675_34622b0d44_z.jpg",
      "caption_en": "Cook the onion-tomato base until soft.",
      "caption_de": "Die Zwiebel-Tomaten-Basis weich kochen."
    },
    {
      "step_number": "2",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/21839715411_4b57950104_z.jpg",
      "caption_en": "Blend the gravy until smooth and return it to the pan.",
      "caption_de": "Die Sauce glatt mixen und zuruck in die Pfanne geben."
    },
    {
      "step_number": "3",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/27828932234_6dd2c6c8ec_z.jpg",
      "caption_en": "Add paneer and simmer only briefly.",
      "caption_de": "Paneer zugeben und nur kurz sanft kochen."
    },
    {
      "step_number": "4",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/27828932644_9f35c3f644_z.jpg",
      "caption_en": "Finish with cream and serve the curry hot.",
      "caption_de": "Mit Sahne abschliessen und das Curry heiss servieren."
    }
  ]'::jsonb,
  video_url = 'https://www.youtube.com/watch?v=e-Zwa02tsDE'
where slug = 'paneer-butter-masala';

update public.recipes
set
  image_urls = ARRAY[
    'https://www.jeyashriskitchen.com/wp-content/uploads/2012/06/avarakkai-poricha-kuzhambhu.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/02/IMG_3723.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/02/IMG_3725.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/02/IMG_3733.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/02/IMG_3737.jpg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/02/IMG_3723.jpg",
      "caption_en": "Cook the beans and dal until tender.",
      "caption_de": "Die Bohnen und das Dal weich kochen."
    },
    {
      "step_number": "2",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/02/IMG_3725.jpg",
      "caption_en": "Grind the coconut-cumin mixture smooth.",
      "caption_de": "Die Kokos-Kreuzkummel-Mischung fein mahlen."
    },
    {
      "step_number": "3",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/02/IMG_3733.jpg",
      "caption_en": "Add the ground paste and simmer gently.",
      "caption_de": "Die gemahlene Paste zugeben und sanft kochen."
    },
    {
      "step_number": "4",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/02/IMG_3737.jpg",
      "caption_en": "Finish with tempering and rest briefly.",
      "caption_de": "Mit Temperierung abschliessen und kurz ruhen lassen."
    }
  ]'::jsonb
where slug = 'avarakkai-poricha-kuzhambu';

update public.recipes
set
  image_urls = ARRAY[
    'https://www.jeyashriskitchen.com/wp-content/uploads/2018/04/paneer-biryani.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2018/04/IMG_7407-1.jpg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2018/04/IMG_7407-1.jpg",
      "caption_en": "Marinate the paneer and prep the rice before pressure cooking.",
      "caption_de": "Paneer marinieren und den Reis vor dem Druckgaren vorbereiten."
    },
    {
      "step_number": "2",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2018/04/paneer-biryani.jpg",
      "caption_en": "Cook until the rice stays fluffy and the paneer is well coated.",
      "caption_de": "Kochen, bis der Reis locker bleibt und der Paneer gut umhullt ist."
    }
  ]'::jsonb
where slug = 'paneer-biryani';

update public.recipes
set
  image_urls = ARRAY[
    'https://www.jeyashriskitchen.com/wp-content/uploads/2013/10/vegetable-biryani-in-pressure.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/10326903924_6456642828_z.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/10326904934_f847f4e9f5_m.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/10326907044_59b91bc1de_m.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/10326907714_4c5dd04750_m.jpg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/10326903924_6456642828_z.jpg",
      "caption_en": "Prep the rice, vegetables, and mint paste.",
      "caption_de": "Reis, Gemuse und Minzpaste vorbereiten."
    },
    {
      "step_number": "2",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/10326904934_f847f4e9f5_m.jpg",
      "caption_en": "Build the masala base in the pressure cooker.",
      "caption_de": "Die Masala-Basis im Schnellkochtopf aufbauen."
    },
    {
      "step_number": "3",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/10326907044_59b91bc1de_m.jpg",
      "caption_en": "Add rice and measured water before pressure cooking.",
      "caption_de": "Reis und abgemessenes Wasser vor dem Druckgaren zugeben."
    },
    {
      "step_number": "4",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2022/04/10326907714_4c5dd04750_m.jpg",
      "caption_en": "Fluff gently and serve once cooked.",
      "caption_de": "Nach dem Garen vorsichtig auflockern und servieren."
    }
  ]'::jsonb,
  video_url = 'https://www.youtube.com/embed/IryjnKv4CLE'
where slug = 'vegetable-biryani-pressure-cooker';

update public.recipes
set
  image_urls = ARRAY[
    'https://www.jeyashriskitchen.com/wp-content/uploads/2009/09/Veg-biryani-1.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2009/09/IMG_6723.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2009/09/IMG_6732.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2009/09/IMG_6737.jpg',
    'https://www.jeyashriskitchen.com/wp-content/uploads/2009/09/IMG_6740.jpg'
  ]::text[],
  step_photos = '[
    {
      "step_number": "1",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2009/09/IMG_6723.jpg",
      "caption_en": "Prep the herb paste and the vegetables separately.",
      "caption_de": "Die Krauterpaste und das Gemuse getrennt vorbereiten."
    },
    {
      "step_number": "2",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2009/09/IMG_6732.jpg",
      "caption_en": "Saute the capsicum and cauliflower on their own first.",
      "caption_de": "Paprika und Blumenkohl zuerst separat anbraten."
    },
    {
      "step_number": "3",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2009/09/IMG_6737.jpg",
      "caption_en": "Cook the rice with the vegetable-herb base in the cooker.",
      "caption_de": "Den Reis mit der Gemuse-Krauter-Basis im Schnellkochtopf garen."
    },
    {
      "step_number": "4",
      "image_url": "https://www.jeyashriskitchen.com/wp-content/uploads/2009/09/IMG_6740.jpg",
      "caption_en": "Fold in the reserved vegetables gently before serving.",
      "caption_de": "Das zuruckgehaltene Gemuse vor dem Servieren vorsichtig unterheben."
    }
  ]'::jsonb
where slug = 'vegetable-biryani-without-onion-garlic';
