/**
 * Everything specific to the agent lives here and in /src/data.
 * Components never hard-code names, numbers or claims.
 *
 * status:
 *   owner       = supplied by Thang
 *   public      = seen on a public source, not re-checked
 *   placeholder = demo filler; the production build fails if any is still used
 */
export type FactStatus = 'verified' | 'owner' | 'public' | 'placeholder';

export interface Fact<T> {
  value: T;
  status: FactStatus;
  source?: string;
}

export const site = {
  mode: 'demo' as 'demo' | 'production',

  name: { value: 'Thang Truong', status: 'public', source: 'MLS sheet shared in chat' } as Fact<string>,
  firstName: 'Thang',
  lastName: 'Truong',
  initials: 'TT',
  role: 'Real Estate Agent',
  area: 'San Jose & the Bay Area',

  phone: { value: '(408) 555-0123', status: 'placeholder' } as Fact<string>,
  email: { value: 'hello@yourdomain.com', status: 'placeholder' } as Fact<string>,
  dre: { value: 'DRE #00000000', status: 'placeholder' } as Fact<string>,
  brokerage: { value: 'Your Brokerage', status: 'placeholder' } as Fact<string>,
  youtube: { value: 'https://www.youtube.com/', status: 'placeholder' } as Fact<string>,

  seo: {
    title: 'Thang Truong — Real Estate Agent, San Jose & the Bay Area',
    description:
      'Buy or sell your home in San Jose and the Bay Area with Thang Truong. Sold homes, market videos and articles.',
  },
};

export const nav = [
  { label: 'Sold Homes', href: '/sold' },
  { label: 'About', href: '/about' },
  { label: 'Videos', href: '/videos' },
  { label: 'Journal', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

/** Throws in production mode if any placeholder fact is still in the config. */
export function assertNoPlaceholders() {
  if (site.mode !== 'production') return;
  const bad = Object.entries(site)
    .filter(([, v]) => typeof v === 'object' && v && 'status' in v && v.status === 'placeholder')
    .map(([k]) => k);
  if (bad.length) throw new Error(`Placeholder facts in production: ${bad.join(', ')}`);
}
