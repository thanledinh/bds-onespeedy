import { photos, homePhotos, awardPhotos } from './media';
import { soldHomes } from './sold';
import { money } from '../lib/img';
import type { Fact } from '../config/site';

/**
 * Extra profile facts used by Option C. Everything here still needs Thang's
 * confirmation, so it is marked `placeholder` (shown with "Sample" in demo mode).
 */
export const profile = {
  availability: { value: 'Accepting new clients', status: 'placeholder' } as Fact<string>,
  languages: { value: ['English', 'Tiếng Việt'], status: 'placeholder' } as Fact<string[]>,
  licenseIssued: { value: '20XX', status: 'placeholder' } as Fact<string>,
  specialties: {
    value: ['Single-family homes', 'First-time buyers', 'Sellers & pricing', 'Townhomes & condos', 'Move-up buyers', 'Vietnamese-speaking families'],
    status: 'placeholder',
  } as Fact<string[]>,
  bio: {
    value:
      'A short, personal introduction goes here: where Thang grew up, why real estate, the neighborhoods Thang knows best, and what working together feels like.',
    status: 'placeholder',
  } as Fact<string>,
};

export interface StorySlide {
  img: string;
  title: string;
  sub?: string;
}
export interface Highlight {
  id: string;
  label: string;
  cover: string;
  slides: StorySlide[];
}

const recent = soldHomes.slice(0, 4);

/** Instagram-style highlights. Sample captions; real ones come from Thang's posts. */
export const highlights: Highlight[] = [
  {
    id: 'sold',
    label: 'Just sold',
    cover: recent[0].photo,
    slides: recent.map((h) => ({
      img: h.photo,
      title: `Sold in ${h.neighborhood}`,
      sub: `${money(h.soldPrice)} · ${h.beds} bd · ${h.baths} ba · ${h.city}`,
    })),
  },
  {
    id: 'tours',
    label: 'Tours',
    cover: photos.livingWarm,
    slides: [
      { img: photos.livingWarm, title: 'Open house walkthrough', sub: 'Light, layout and the details buyers notice' },
      { img: photos.kitchen, title: 'The kitchen sells the house', sub: 'What to look at beyond the countertops' },
      { img: photos.openPlan, title: 'Open plan, done right', sub: 'Sample tour from the demo' },
    ],
  },
  {
    id: 'market',
    label: 'Market',
    cover: photos.hills,
    slides: [
      { img: photos.hills, title: 'Market minute', sub: 'Monthly notes on the San Jose market' },
      { img: photos.street, title: 'Reading the comps', sub: 'Price per square foot, explained simply' },
    ],
  },
  {
    id: 'tips',
    label: 'Tips',
    cover: photos.livingBright,
    slides: [
      { img: photos.livingBright, title: 'Before you list', sub: 'Fix the small things first' },
      { img: homePhotos[5], title: 'Curb appeal in a weekend', sub: 'Paint, light, plants' },
      { img: photos.duskPath, title: 'Photos at dusk', sub: 'Why listing photos are shot at blue hour' },
    ],
  },
  {
    id: 'awards',
    label: 'Awards',
    cover: awardPhotos[0],
    slides: awardPhotos.map((p, i) => ({ img: p, title: 'Award title', sub: `Issuing organization · ${2025 - i}` })),
  },
  {
    id: 'sanjose',
    label: 'San Jose',
    cover: photos.street,
    slides: [
      { img: photos.street, title: 'Neighborhood walks', sub: 'Streets Thang knows by heart' },
      { img: homePhotos[11], title: 'Bay Area hills', sub: 'Where the light is best in the evening' },
    ],
  },
];
