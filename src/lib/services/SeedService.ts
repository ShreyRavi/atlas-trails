import { TripRepository } from '@/lib/repositories/TripRepository';
import { PinRepository } from '@/lib/repositories/PinRepository';

const SEED_KEY = 'atlastrail_seeded_v2';

export async function seedDemoData(userId: string) {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_KEY + '_' + userId)) return;

  // ── Trip 1: European Summer ───────────────────────────────────────────────
  const europeTrip = await TripRepository.createTrip({
    user_id: userId,
    title: 'European Summer',
    start_date: '2024-06-01',
    end_date: '2024-06-21',
    description: 'A classic grand tour through Western Europe — art, food, history, and perfect weather.',
    countries_visited: ['France', 'Italy', 'Spain'],
    connect_pins_with_line: true,
  });

  const europePins = [
    {
      title: 'Paris',
      city: 'Paris', province: 'Île-de-France', country: 'France',
      latitude: 48.8566, longitude: 2.3522,
      visit_date: '2024-06-01',
      lodging_name: 'Hôtel des Grands Boulevards',
      attractions: 'Eiffel Tower, Louvre Museum, Musée d\'Orsay, Notre-Dame Cathedral, Montmartre',
      food_drink: 'Croissants at Café de Flore, Steak frites at Bistrot Paul Bert, Macarons from Ladurée',
      tips_notes: 'Buy a Paris Museum Pass — saves a lot of queuing. Visit Eiffel Tower at dusk for incredible views.',
      order_index: 0,
    },
    {
      title: 'Rome',
      city: 'Rome', province: 'Lazio', country: 'Italy',
      latitude: 41.9028, longitude: 12.4964,
      visit_date: '2024-06-07',
      lodging_name: 'Hotel de Russie',
      attractions: 'Colosseum, Roman Forum, Trevi Fountain, Vatican Museums, Sistine Chapel, Pantheon',
      food_drink: 'Carbonara at Da Enzo al 29, Cacio e Pepe at Tonnarello, Gelato from Fatamorgana',
      tips_notes: 'Book Vatican Museums online weeks in advance. Walk everywhere — most sights are 15 min apart.',
      order_index: 1,
    },
    {
      title: 'Florence',
      city: 'Florence', province: 'Tuscany', country: 'Italy',
      latitude: 43.7696, longitude: 11.2558,
      visit_date: '2024-06-11',
      lodging_name: 'AdAstra Firenze',
      attractions: 'Uffizi Gallery, Duomo, Ponte Vecchio, Piazzale Michelangelo, Accademia (David)',
      food_drink: 'Bistecca Fiorentina at Buca Mario, Lampredotto sandwich at Nerbone market',
      tips_notes: 'Climb the Duomo dome for the best view in Florence. Book the Uffizi at least 2 weeks ahead.',
      order_index: 2,
    },
    {
      title: 'Barcelona',
      city: 'Barcelona', province: 'Catalonia', country: 'Spain',
      latitude: 41.3851, longitude: 2.1734,
      visit_date: '2024-06-16',
      lodging_name: 'Hotel Arts Barcelona',
      attractions: 'Sagrada Família, Park Güell, La Boqueria, Gothic Quarter, Camp Nou',
      food_drink: 'Tapas at El Xampanyet, Seafood paella at La Mar Salada, Churros at Granja M. Viader',
      tips_notes: 'Book Sagrada Família months in advance. Best time to visit is early morning or late afternoon.',
      order_index: 3,
    },
  ];

  for (const pin of europePins) {
    await PinRepository.createPin({ ...pin, user_id: userId, trip_id: europeTrip.id, image_urls: [] });
  }

  // ── Trip 2: Japan Cherry Blossom ──────────────────────────────────────────
  const japanTrip = await TripRepository.createTrip({
    user_id: userId,
    title: 'Japan Cherry Blossom',
    start_date: '2024-03-25',
    end_date: '2024-04-10',
    description: 'Chasing sakura across Japan — from the chaos of Tokyo to the tranquility of Kyoto temples.',
    countries_visited: ['Japan'],
    connect_pins_with_line: true,
  });

  const japanPins = [
    {
      title: 'Tokyo',
      city: 'Tokyo', province: 'Tokyo', country: 'Japan',
      latitude: 35.6762, longitude: 139.6503,
      visit_date: '2024-03-26',
      lodging_name: 'Park Hyatt Tokyo',
      attractions: 'Shinjuku Gyoen (sakura), Meiji Shrine, Shibuya Crossing, Akihabara, teamLab Planets',
      food_drink: 'Ramen at Ichiran, Sushi at Tsukiji Outer Market, Yakitori at Yurakucho',
      tips_notes: 'Get a Suica IC card for all transit. Cherry blossoms usually peak late March — check forecast!',
      order_index: 0,
    },
    {
      title: 'Hakone',
      city: 'Hakone', province: 'Kanagawa', country: 'Japan',
      latitude: 35.2323, longitude: 139.1069,
      visit_date: '2024-03-30',
      lodging_name: 'Hakone Ginyu Ryokan',
      attractions: 'Mt Fuji views, Open Air Museum, Owakudani volcanic valley, Lake Ashi cruise',
      food_drink: 'Traditional kaiseki dinner at the ryokan, Black eggs (kuro-tamago) at Owakudani',
      tips_notes: 'Stay at a ryokan for the full onsen experience. Book months in advance. Mt Fuji is often cloudy — morning is best.',
      order_index: 1,
    },
    {
      title: 'Kyoto',
      city: 'Kyoto', province: 'Kyoto', country: 'Japan',
      latitude: 35.0116, longitude: 135.7681,
      visit_date: '2024-04-02',
      lodging_name: 'Kyoto Okura Hotel',
      attractions: 'Fushimi Inari, Arashiyama Bamboo Grove, Kinkaku-ji (Golden Pavilion), Gion district, Philosopher\'s Path',
      food_drink: 'Matcha everything, Kaiseki at Kikunoi, Tofu cuisine at Tousuiro',
      tips_notes: 'Rent a bike — best way to get around Kyoto. Go to Fushimi Inari at dawn to beat the crowds.',
      order_index: 2,
    },
    {
      title: 'Osaka',
      city: 'Osaka', province: 'Osaka', country: 'Japan',
      latitude: 34.6937, longitude: 135.5023,
      visit_date: '2024-04-07',
      lodging_name: 'Cross Hotel Osaka',
      attractions: 'Dotonbori, Osaka Castle, Kuromon Market, Universal Studios Japan, Namba area',
      food_drink: 'Takoyaki (octopus balls) at Aizuya, Okonomiyaki at Fugetsu, Street food on Dotonbori',
      tips_notes: 'Osaka is the food capital of Japan. Eat everything. The "Eat till you drop" culture is real here.',
      order_index: 3,
    },
  ];

  for (const pin of japanPins) {
    await PinRepository.createPin({ ...pin, user_id: userId, trip_id: japanTrip.id, image_urls: [] });
  }

  // ── Trip 3: Southeast Asia Backpacking ───────────────────────────────────
  const asiaTrip = await TripRepository.createTrip({
    user_id: userId,
    title: 'Southeast Asia Adventure',
    start_date: '2023-11-01',
    end_date: '2023-11-28',
    description: 'A month backpacking through Southeast Asia — temples, beaches, street food, and stunning landscapes.',
    countries_visited: ['Thailand', 'Vietnam', 'Cambodia'],
    connect_pins_with_line: true,
  });

  const asiaPins = [
    {
      title: 'Bangkok',
      city: 'Bangkok', province: 'Bangkok', country: 'Thailand',
      latitude: 13.7563, longitude: 100.5018,
      visit_date: '2023-11-01',
      lodging_name: 'Sala Rattanakosin',
      attractions: 'Grand Palace, Wat Pho (Reclining Buddha), Khao San Road, Chatuchak Weekend Market',
      food_drink: 'Pad Thai at Thip Samai, Tom Yum at Or Tor Kor Market, Mango Sticky Rice everywhere',
      tips_notes: 'Dress modestly for temple visits (cover shoulders and knees). Negotiate tuk-tuk fares beforehand.',
      order_index: 0,
    },
    {
      title: 'Chiang Mai',
      city: 'Chiang Mai', province: 'Chiang Mai', country: 'Thailand',
      latitude: 18.7883, longitude: 98.9853,
      visit_date: '2023-11-06',
      lodging_name: 'Rachamankha Hotel',
      attractions: 'Doi Suthep temple, Elephant Nature Park, Sunday Night Market, Old City moat',
      food_drink: 'Khao Soi at Khao Soi Islam, Sai Oua sausage, Nimman area coffee shops',
      tips_notes: 'Do a cooking class — best in Thailand. Visit Elephant Nature Park for ethical elephant encounters.',
      order_index: 1,
    },
    {
      title: 'Siem Reap',
      city: 'Siem Reap', province: 'Siem Reap', country: 'Cambodia',
      latitude: 13.3671, longitude: 103.8448,
      visit_date: '2023-11-11',
      lodging_name: 'Shinta Mani Angkor',
      attractions: 'Angkor Wat (sunrise), Bayon Temple, Ta Prohm (jungle temple), Angkor Thom',
      food_drink: 'Amok fish curry at Cuisine Wat Damnak, Lok Lak at Mahob Restaurant, Fresh coconut everywhere',
      tips_notes: 'Get a 3-day Angkor pass. Sunrise at Angkor Wat is a must — arrive by 5am. Hire a tuk-tuk guide.',
      order_index: 2,
    },
    {
      title: 'Hội An',
      city: 'Hội An', province: 'Quảng Nam', country: 'Vietnam',
      latitude: 15.8801, longitude: 108.3380,
      visit_date: '2023-11-17',
      lodging_name: 'Anantara Hoi An Resort',
      attractions: 'Ancient Town, Japanese Covered Bridge, Lantern Festival, Mỹ Sơn Sanctuary',
      food_drink: 'Cao Lầu at Trung Bắc, White Rose dumplings, Bánh mì at Phượng',
      tips_notes: 'Rent a bicycle to explore the countryside and beaches. Lantern Festival is on every full moon.',
      order_index: 3,
    },
    {
      title: 'Hà Nội',
      city: 'Hà Nội', province: 'Hà Nội', country: 'Vietnam',
      latitude: 21.0278, longitude: 105.8342,
      visit_date: '2023-11-23',
      lodging_name: 'Sofitel Legend Metropole',
      attractions: 'Hoan Kiem Lake, Ho Chi Minh Mausoleum, Old Quarter, Temple of Literature, Hoa Lo Prison',
      food_drink: 'Pho Bo at Pho Gia Truyen, Bun Cha at Bun Cha Huong Lien, Egg coffee at Cafe Giang',
      tips_notes: 'Take a day trip to Ha Long Bay. Crossing the street is an art form — just walk slowly and steadily.',
      order_index: 4,
    },
  ];

  for (const pin of asiaPins) {
    await PinRepository.createPin({ ...pin, user_id: userId, trip_id: asiaTrip.id, image_urls: [] });
  }

  // ── Trip 4: New York Weekend ──────────────────────────────────────────────
  const nycTrip = await TripRepository.createTrip({
    user_id: userId,
    title: 'New York City Weekend',
    start_date: '2024-09-13',
    end_date: '2024-09-15',
    description: 'A packed NYC weekend — art, food, and everything in between.',
    countries_visited: ['United States'],
    connect_pins_with_line: false,
  });

  const nycPins = [
    {
      title: 'Manhattan',
      city: 'New York', province: 'New York', country: 'United States',
      latitude: 40.7580, longitude: -73.9855,
      visit_date: '2024-09-13',
      lodging_name: 'The NoMad Hotel',
      attractions: 'Times Square, Central Park, The High Line, Chelsea Market, MoMA',
      food_drink: 'Bagel at Russ & Daughters, Pizza at Di Fara, Dinner at Eleven Madison Park',
      tips_notes: 'Buy a 7-day MetroCard even for a weekend — unlimited rides add up fast.',
      order_index: 0,
    },
    {
      title: 'Brooklyn',
      city: 'Brooklyn', province: 'New York', country: 'United States',
      latitude: 40.6782, longitude: -73.9442,
      visit_date: '2024-09-14',
      lodging_name: 'The NoMad Hotel',
      attractions: 'Brooklyn Bridge walk, DUMBO, Brooklyn Museum, Prospect Park, Smorgasburg food market',
      food_drink: 'Ramen at Chuko, Ice cream at Ample Hills, Brunch at Egg',
      tips_notes: 'Walk the Brooklyn Bridge from Manhattan to Brooklyn early morning for best photos.',
      order_index: 1,
    },
  ];

  for (const pin of nycPins) {
    await PinRepository.createPin({ ...pin, user_id: userId, trip_id: nycTrip.id, image_urls: [] });
  }

  // ── Standalone pins (not in a trip) ──────────────────────────────────────
  const standalonePins = [
    {
      title: 'Santorini',
      city: 'Oia', province: 'South Aegean', country: 'Greece',
      latitude: 36.4618, longitude: 25.3753,
      visit_date: '2023-08-20',
      lodging_name: '', attractions: 'Oia sunset, Caldera views, black sand beaches',
      food_drink: 'Fresh seafood, local wine', tips_notes: 'Stay in Oia for the famous sunsets.',
      order_index: 0,
    },
    {
      title: 'Machu Picchu',
      city: 'Aguas Calientes', province: 'Cusco', country: 'Peru',
      latitude: -13.1631, longitude: -72.5450,
      visit_date: '2023-05-10',
      lodging_name: '', attractions: 'Inca citadel, Sun Gate hike, Huayna Picchu',
      food_drink: 'Ceviche in Cusco, Alpaca steak', tips_notes: 'Book train tickets months in advance. Altitude sickness is real.',
      order_index: 0,
    },
    {
      title: 'Cape Town',
      city: 'Cape Town', province: 'Western Cape', country: 'South Africa',
      latitude: -33.9249, longitude: 18.4241,
      visit_date: '2022-12-27',
      lodging_name: '', attractions: 'Table Mountain, Cape of Good Hope, Boulders Beach penguins, V&A Waterfront',
      food_drink: 'Braai (BBQ), Cape Malay curry, South African wines in Stellenbosch',
      tips_notes: 'Take the cable car up Table Mountain — but only on a clear day.',
      order_index: 0,
    },
  ];

  for (const pin of standalonePins) {
    await PinRepository.createPin({ ...pin, user_id: userId, trip_id: null, image_urls: [] });
  }

  localStorage.setItem(SEED_KEY + '_' + userId, '1');
}
