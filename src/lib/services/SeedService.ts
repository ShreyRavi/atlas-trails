import { TripRepository } from '@/lib/repositories/TripRepository';
import { PinRepository } from '@/lib/repositories/PinRepository';

const SEED_KEY = 'atlastrail_seeded';

export async function seedDemoData(userId: string) {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_KEY + '_' + userId)) return;

  const europeTrip = await TripRepository.createTrip({
    user_id: userId,
    title: 'European Adventure',
    start_date: '2024-06-01',
    end_date: '2024-06-21',
    description: 'A grand tour through Western Europe.',
    countries_visited: ['France', 'Italy', 'Spain'],
    connect_pins_with_line: true,
  });

  const pins = [
    { title: 'Eiffel Tower', city: 'Paris', province: 'Île-de-France', country: 'France', latitude: 48.8584, longitude: 2.2945, visit_date: '2024-06-01', lodging_name: 'Hotel de Paris', attractions: 'Eiffel Tower, Louvre Museum', food_drink: 'Croissants, Macarons', tips_notes: 'Go early morning to avoid crowds.', order_index: 0 },
    { title: 'Colosseum', city: 'Rome', province: 'Lazio', country: 'Italy', latitude: 41.8902, longitude: 12.4922, visit_date: '2024-06-08', lodging_name: 'Roma Suite', attractions: 'Colosseum, Vatican', food_drink: 'Pasta Carbonara, Gelato', tips_notes: 'Book tickets in advance.', order_index: 1 },
    { title: 'Sagrada Família', city: 'Barcelona', province: 'Catalonia', country: 'Spain', latitude: 41.4036, longitude: 2.1744, visit_date: '2024-06-15', lodging_name: 'Barcelona Hotel Arts', attractions: 'Sagrada Família, Park Güell', food_drink: 'Paella, Tapas', tips_notes: 'Visit at sunset for amazing light.', order_index: 2 },
  ];

  for (const pin of pins) {
    await PinRepository.createPin({
      ...pin,
      user_id: userId,
      trip_id: europeTrip.id,
      image_urls: [],
    });
  }

  const japanTrip = await TripRepository.createTrip({
    user_id: userId,
    title: 'Japan Cherry Blossom',
    start_date: '2024-03-25',
    end_date: '2024-04-10',
    description: 'Chasing cherry blossoms across Japan.',
    countries_visited: ['Japan'],
    connect_pins_with_line: true,
  });

  const japanPins = [
    { title: 'Shinjuku Gyoen', city: 'Tokyo', province: 'Tokyo', country: 'Japan', latitude: 35.6852, longitude: 139.7100, visit_date: '2024-03-26', lodging_name: 'Park Hyatt Tokyo', attractions: 'Shinjuku Gyoen, Meiji Shrine', food_drink: 'Ramen, Sushi', tips_notes: 'Peak bloom is late March.', order_index: 0 },
    { title: 'Arashiyama', city: 'Kyoto', province: 'Kyoto', country: 'Japan', latitude: 35.0116, longitude: 135.6761, visit_date: '2024-04-02', lodging_name: 'Kyoto Ryokan', attractions: 'Arashiyama Bamboo Grove, Fushimi Inari', food_drink: 'Kaiseki, Matcha', tips_notes: 'Rent a bike to explore.', order_index: 1 },
  ];

  for (const pin of japanPins) {
    await PinRepository.createPin({
      ...pin,
      user_id: userId,
      trip_id: japanTrip.id,
      image_urls: [],
    });
  }

  localStorage.setItem(SEED_KEY + '_' + userId, '1');
}
