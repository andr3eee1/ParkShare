export type ParkingSpotType = 'private' | 'municipal';

export interface DemoLocation {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  aliases: string[];
}

export interface DemoParkingSpot {
  id: string;
  name: string;
  type: ParkingSpotType;
  price: number;
  host: string;
  distance: string;
  available: string;
  latitude: number;
  longitude: number;
}

export const DEMO_LOCATIONS: DemoLocation[] = [
  {
    id: 'pipera',
    name: 'Pipera',
    shortName: 'Pipera',
    subtitle: 'Business district',
    latitude: 44.4820,
    longitude: 26.1130,
    aliases: ['pipera business district'],
  },
  {
    id: 'aurel-vlaicu',
    name: 'Aurel Vlaicu',
    shortName: 'Aurel Vlaicu',
    subtitle: 'Metro and offices',
    latitude: 44.4801,
    longitude: 26.1025,
    aliases: ['aurel vlaicu metro'],
  },
  {
    id: 'floreasca',
    name: 'Floreasca',
    shortName: 'Floreasca',
    subtitle: 'Floreasca neighborhood',
    latitude: 44.4668,
    longitude: 26.1057,
    aliases: ['floreasca park'],
  },
  {
    id: 'herastrau',
    name: 'Herastrau Park',
    shortName: 'Herastrau',
    subtitle: 'King Michael I Park',
    latitude: 44.4722,
    longitude: 26.0836,
    aliases: ['herastrau', 'king michael i park'],
  },
  {
    id: 'piata-victoriei',
    name: 'Piața Victoriei',
    shortName: 'Piața Victoriei',
    subtitle: 'Victoria Square',
    latitude: 44.4527,
    longitude: 26.0860,
    aliases: ['piata victoriei', 'victoria square'],
  },
  {
    id: 'universitate',
    name: 'Universitate',
    shortName: 'Universitate',
    subtitle: 'University Square',
    latitude: 44.4355,
    longitude: 26.1027,
    aliases: ['university square'],
  },
  {
    id: 'centrul-vechi',
    name: 'Centrul Vechi',
    shortName: 'Centrul Vechi',
    subtitle: 'Bucharest Old Town',
    latitude: 44.4319,
    longitude: 26.1025,
    aliases: ['old town', 'bucharest old town'],
  },
  {
    id: 'cotroceni',
    name: 'Cotroceni',
    shortName: 'Cotroceni',
    subtitle: 'Cotroceni neighborhood',
    latitude: 44.4260,
    longitude: 26.0716,
    aliases: ['cotroceni neighborhood'],
  },
  {
    id: 'tineretului',
    name: 'Tineretului Park',
    shortName: 'Tineretului',
    subtitle: 'Tineretului neighborhood',
    latitude: 44.4068,
    longitude: 26.1036,
    aliases: ['tineretului'],
  },
  {
    id: 'parklake',
    name: 'ParkLake Mall',
    shortName: 'ParkLake',
    subtitle: 'Titan neighborhood',
    latitude: 44.4222,
    longitude: 26.1508,
    aliases: ['parklake', 'titan'],
  },
];

export const DEFAULT_LOCATION = DEMO_LOCATIONS[0];

const PARKING_TEMPLATES: Omit<DemoParkingSpot, 'id' | 'latitude' | 'longitude'>[] = [
  {
    name: 'Driveway (Verified)',
    type: 'private',
    price: 4,
    host: 'Elena M.',
    distance: '2 min walk',
    available: '09:00 - 18:00',
  },
  {
    name: 'Street Meter 1204',
    type: 'municipal',
    price: 5,
    host: 'City of Bucharest',
    distance: '1 min walk',
    available: '24/7',
  },
  {
    name: 'Apartment Complex B',
    type: 'private',
    price: 6,
    host: 'Andrei P.',
    distance: '3 min walk',
    available: '10:00 - 20:00',
  },
  {
    name: 'Office Underground',
    type: 'private',
    price: 8,
    host: 'Corporate Hub',
    distance: '4 min walk',
    available: '18:00 - 08:00',
  },
  {
    name: 'Boulevard Meter 208',
    type: 'municipal',
    price: 5,
    host: 'City of Bucharest',
    distance: '5 min walk',
    available: '24/7',
  },
  {
    name: 'Garden Spot (Verified)',
    type: 'private',
    price: 7,
    host: 'Mihai D.',
    distance: '6 min walk',
    available: '08:00 - 22:00',
  },
  {
    name: 'Resident Garage',
    type: 'private',
    price: 9,
    host: 'Ioana R.',
    distance: '7 min walk',
    available: '24/7',
  },
  {
    name: 'Public Lot 14',
    type: 'municipal',
    price: 6,
    host: 'City of Bucharest',
    distance: '8 min walk',
    available: '24/7',
  },
];

const PARKING_OFFSETS = [
  [0.0010, -0.0012],
  [-0.0008, 0.0010],
  [0.0018, 0.0004],
  [-0.0014, -0.0005],
  [0.0003, 0.0020],
  [-0.0020, 0.0017],
  [0.0022, -0.0018],
  [-0.0003, -0.0022],
] as const;

export const createParkingSpots = (location: DemoLocation): DemoParkingSpot[] => (
  PARKING_TEMPLATES.map((template, index) => ({
    ...template,
    id: `${location.id}-${index + 1}`,
    latitude: location.latitude + PARKING_OFFSETS[index][0],
    longitude: location.longitude + PARKING_OFFSETS[index][1],
  }))
);

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase();

export const searchDemoLocations = (query: string): DemoLocation[] => {
  const normalizedQuery = normalize(query.trim());

  if (!normalizedQuery) {
    return [];
  }

  return DEMO_LOCATIONS.filter((location) => [
    location.name,
    location.shortName,
    location.subtitle,
    ...location.aliases,
  ].some((value) => normalize(value).includes(normalizedQuery)));
};