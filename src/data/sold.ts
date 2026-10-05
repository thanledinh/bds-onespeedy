import { homePhotos } from './media';

/**
 * Sold homes. In the demo this is GENERATED SAMPLE DATA so the layout can be
 * reviewed at real scale (100+ homes). For launch it is replaced by an import
 * of Thang's MLS export (CSV) — same shape, `sample: false`.
 */
export interface SoldHome {
  id: string;
  neighborhood: string;
  city: string;
  type: 'Single-family' | 'Townhouse' | 'Condo';
  beds: number;
  baths: number;
  sqft: number;
  listPrice: number;
  soldPrice: number;
  closeDate: string; // ISO yyyy-mm-dd
  photo: string;
  lat: number;
  lng: number;
  sample: boolean;
}

// [neighborhood, city, base $/sqft, weight]
const AREAS: [string, string, number, number][] = [
  ['Evergreen', 'San Jose', 860, 6],
  ['Berryessa', 'San Jose', 840, 6],
  ['Willow Glen', 'San Jose', 1050, 4],
  ['Almaden Valley', 'San Jose', 930, 4],
  ['Alum Rock', 'San Jose', 720, 5],
  ['Cambrian Park', 'San Jose', 940, 3],
  ['Blossom Valley', 'San Jose', 790, 4],
  ['Silver Creek', 'San Jose', 820, 3],
  ['Rose Garden', 'San Jose', 1080, 2],
  ['Milpitas Hills', 'Milpitas', 860, 4],
  ['Irvington', 'Fremont', 980, 3],
  ['Mission San Jose', 'Fremont', 1150, 2],
  ['Old Quarry', 'Santa Clara', 1020, 2],
  ['Cherry Chase', 'Sunnyvale', 1200, 2],
  ['Fairway Park', 'Hayward', 640, 3],
  ['Decoto', 'Union City', 760, 2],
  ['Paradise Valley', 'Morgan Hill', 680, 2],
  ['Westside', 'Campbell', 1020, 2],
];

// Approximate neighborhood centres, used to place sample homes on the map.
const CENTRES: Record<string, [number, number]> = {
  Evergreen: [37.315, -121.775],
  Berryessa: [37.385, -121.858],
  'Willow Glen': [37.3, -121.895],
  'Almaden Valley': [37.215, -121.855],
  'Alum Rock': [37.368, -121.828],
  'Cambrian Park': [37.258, -121.93],
  'Blossom Valley': [37.248, -121.828],
  'Silver Creek': [37.29, -121.795],
  'Rose Garden': [37.333, -121.918],
  'Milpitas Hills': [37.445, -121.88],
  Irvington: [37.522, -121.968],
  'Mission San Jose': [37.535, -121.925],
  'Old Quarry': [37.345, -121.99],
  'Cherry Chase': [37.362, -122.045],
  'Fairway Park': [37.632, -122.04],
  Decoto: [37.592, -122.02],
  'Paradise Valley': [37.145, -121.68],
  Westside: [37.282, -121.965],
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generate(count: number): SoldHome[] {
  const rnd = mulberry32(408);
  const between = (a: number, b: number) => a + (b - a) * rnd();
  const totalWeight = AREAS.reduce((s, a) => s + a[3], 0);
  const pickArea = () => {
    let r = rnd() * totalWeight;
    for (const a of AREAS) if ((r -= a[3]) <= 0) return a;
    return AREAS[0];
  };

  const start = new Date('2021-02-01').getTime();
  const end = new Date('2026-09-20').getTime();
  const homes: SoldHome[] = [];
  // Separate stream for map jitter so prices/dates stay identical to earlier builds.
  const jitter = mulberry32(95127);

  for (let i = 0; i < count; i++) {
    const [neighborhood, city, ppsf] = pickArea();
    const t = rnd();
    const type = t < 0.72 ? 'Single-family' : t < 0.9 ? 'Townhouse' : 'Condo';
    const sqft =
      type === 'Single-family'
        ? Math.round(between(1050, 2700) / 10) * 10
        : type === 'Townhouse'
          ? Math.round(between(1100, 1850) / 10) * 10
          : Math.round(between(720, 1300) / 10) * 10;
    const beds = Math.max(1, Math.min(5, Math.round(sqft / 520 + between(-0.4, 0.6))));
    const baths = Math.max(1, Math.min(4, Math.round((beds * 0.75 + between(-0.2, 0.6)) * 2) / 2));

    const time = start + (end - start) * rnd();
    const year = new Date(time).getFullYear();
    // 2021–22 and spring markets ran hotter than 2023.
    const heat = year <= 2022 ? 0.07 : year === 2023 ? 0.0 : 0.04;
    const ratio = Math.max(0.95, 1 + heat + between(-0.04, 0.09));

    const typeFactor = type === 'Condo' ? 0.82 : type === 'Townhouse' ? 0.9 : 1;
    const yearFactor = { 2021: 0.9, 2022: 0.96, 2023: 0.93, 2024: 0.98, 2025: 1.0, 2026: 1.02 }[year] ?? 1;
    const listRaw = sqft * ppsf * typeFactor * yearFactor * between(0.9, 1.08);
    const listPrice = Math.round(listRaw / 5000) * 5000 - (rnd() < 0.4 ? 12000 : 0);
    const soldPrice = Math.round((listPrice * ratio) / 1000) * 1000;

    homes.push({
      id: `s${String(i + 1).padStart(3, '0')}`,
      neighborhood,
      city,
      type,
      beds,
      baths,
      sqft,
      listPrice,
      soldPrice,
      closeDate: new Date(time).toISOString().slice(0, 10),
      photo: homePhotos[i % homePhotos.length],
      lat: +(CENTRES[neighborhood][0] + (jitter() - 0.5) * 0.022).toFixed(5),
      lng: +(CENTRES[neighborhood][1] + (jitter() - 0.5) * 0.026).toFixed(5),
      sample: true,
    });
  }

  return homes.sort((a, b) => b.closeDate.localeCompare(a.closeDate));
}

export const soldHomes: SoldHome[] = generate(128);

export const soldStats = (() => {
  const n = soldHomes.length;
  const volume = soldHomes.reduce((s, h) => s + h.soldPrice, 0);
  const avgRatio = soldHomes.reduce((s, h) => s + h.soldPrice / h.listPrice, 0) / n;
  const cities = new Set(soldHomes.map((h) => h.city)).size;
  return {
    count: n,
    volume,
    avgOverList: Math.round((avgRatio - 1) * 1000) / 10,
    cities,
    sample: soldHomes.some((h) => h.sample),
  };
})();

export const soldCities = [...new Set(soldHomes.map((h) => h.city))].sort();
export const soldYears = [...new Set(soldHomes.map((h) => h.closeDate.slice(0, 4)))].sort().reverse();
