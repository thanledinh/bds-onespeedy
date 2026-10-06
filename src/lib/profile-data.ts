import { site } from '../config/site';
import { soldHomes } from '../data/sold';
import { posts } from '../data/content';
import { unsplash, money, monthYear, longDate } from './img';

/**
 * Shared by the pages that reuse Option C's script (C2, C3, Signature):
 * the JSON it reads from #v3-data, plus a few small helpers.
 */

export const tel = site.phone.value.replace(/[^\d+]/g, '');
export const DRE_LOOKUP = 'https://www2.dre.ca.gov/publicasp/pplinfo.asp';

export const overLabel = (sold: number, list: number) => {
  const d = (sold / list - 1) * 100;
  return Math.abs(d) < 0.05 ? 'At list price' : `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}% ${d > 0 ? 'over' : 'under'} list`;
};

/** Cities by number of sales, busiest first. */
export const cityCounts = Object.entries(
  soldHomes.reduce<Record<string, number>>((acc, h) => ((acc[h.city] = (acc[h.city] ?? 0) + 1), acc), {}),
).sort((a, b) => b[1] - a[1]);

/** What src/v3/profile.ts expects in #v3-data. No story highlights on these pages. */
export const scriptData = {
  contact: {
    name: site.name.value,
    first: site.firstName,
    last: site.lastName,
    role: site.role,
    phone: site.phone.value,
    tel,
    email: site.email.value,
    dre: site.dre.value,
    brokerage: site.brokerage.value,
    area: site.area,
  },
  highlights: [],
  homes: Object.fromEntries(
    soldHomes.map((h) => [
      h.id,
      {
        img: unsplash(h.photo, 1200, 0.72),
        place: `${h.neighborhood}, ${h.city}`,
        area: h.city,
        type: h.type,
        beds: h.beds,
        baths: h.baths,
        sqft: h.sqft.toLocaleString('en-US'),
        list: money(h.listPrice),
        sold: money(h.soldPrice),
        over: overLabel(h.soldPrice, h.listPrice),
        closed: longDate(h.closeDate),
        sample: h.sample,
      },
    ]),
  ),
  posts: Object.fromEntries(
    posts.map((p) => [
      p.slug,
      { title: p.title, tag: p.tag, date: longDate(p.date), minutes: p.minutes, cover: unsplash(p.cover, 1400, 0.56), body: p.body, sample: p.sample },
    ]),
  ),
  cities: cityCounts.map(([c]) => c).slice(0, 4),
};

/** Map pins, in the same order as soldHomes (the map uses the index as feature id). */
export const mapHomes = soldHomes.map((h) => ({
  id: h.id,
  lat: h.lat,
  lng: h.lng,
  city: h.city,
  price: money(h.soldPrice),
  place: `${h.neighborhood}, ${h.city}`,
  meta: `${h.beds} bd · ${h.baths} ba · ${monthYear(h.closeDate)}`,
}));
