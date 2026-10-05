import { photos, homePhotos } from './media';

/**
 * Sample content for the demo. Every entry is flagged `sample: true` and shows a
 * "Sample" tag on the page. Thang's real posts, videos, awards and history come
 * from the CMS later.
 */

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  minutes: number;
  cover: string;
  tag: string;
  body: ({ p: string } | { h2: string } | { quote: string } | { list: string[] })[];
  sample: boolean;
}

export const posts: Post[] = [
  {
    slug: 'thirty-days-before-you-list',
    title: 'The 30 days before you list your home',
    excerpt: 'A simple week-by-week plan for repairs, staging and photos, so your home goes live looking its best.',
    date: '2026-09-12',
    minutes: 6,
    cover: photos.livingBright,
    tag: 'Selling',
    sample: true,
    body: [
      { p: 'This is a sample article. It shows how a long post will look on the site: headings, lists, pull quotes and images. Thang will write and publish the real articles from the CMS.' },
      { h2: 'Week 1 — Walk through like a buyer' },
      { p: 'Start at the curb and walk in the way a buyer would. Write down everything you notice: the front door, the entry light, the smell, the first room you see.' },
      { list: ['Fix what is broken, even if it is small', 'Clear counters and closets by half', 'Book the inspection you would rather hear about now'] },
      { h2: 'Week 2 — Light, paint and air' },
      { p: 'Fresh neutral paint, bright bulbs and open windows change how rooms photograph. These are the cheapest upgrades with the biggest effect on the first impression.' },
      { quote: 'Buyers decide how a home feels in the first ten seconds of the listing photos.' },
      { h2: 'Weeks 3–4 — Stage, shoot, launch' },
      { p: 'Once the home is ready, schedule staging and professional photography back to back, then agree on the launch day and the first open house together.' },
    ],
  },
  {
    slug: 'read-a-sold-report',
    title: 'How to read a sold-homes report like an agent',
    excerpt: 'Price per square foot, days on market and sale-to-list ratio: what each number really tells you.',
    date: '2026-08-21',
    minutes: 5,
    cover: photos.street,
    tag: 'Market',
    sample: true,
    body: [
      { p: 'This is a sample article used to preview the layout. The final copy will come from Thang.' },
      { h2: 'Price per square foot' },
      { p: 'Useful for comparing similar homes in the same neighborhood, much less useful across different streets, lot sizes or home types.' },
      { h2: 'Sale-to-list ratio' },
      { p: 'Tells you how competitive a pocket of the market is, and how a home was priced. A high ratio can mean strong demand or a deliberately low list price.' },
      { list: ['Compare homes sold in the last 90 days', 'Match bedroom count and lot size', 'Look at what did not sell, too'] },
    ],
  },
  {
    slug: 'first-time-buyer-questions',
    title: 'First-time buyer? Start with these five questions',
    excerpt: 'Before you tour a single home, get clear on budget, timing and the trade-offs you can live with.',
    date: '2026-07-30',
    minutes: 7,
    cover: photos.kitchen,
    tag: 'Buying',
    sample: true,
    body: [
      { p: 'This is a sample article used to preview the layout.' },
      { h2: '1. What monthly payment feels comfortable?' },
      { p: 'Start with the payment you can live with, not the largest loan you can get approved for.' },
      { h2: '2. What is your timeline?' },
      { p: 'Knowing when you need to move shapes everything from your offer strategy to your loan choice.' },
    ],
  },
  {
    slug: 'list-price-is-a-strategy',
    title: 'Your list price is a strategy, not a guess',
    excerpt: 'Why the number you launch with matters more than the number you hope for.',
    date: '2026-06-18',
    minutes: 4,
    cover: photos.duskPath,
    tag: 'Selling',
    sample: true,
    body: [
      { p: 'This is a sample article used to preview the layout.' },
      { h2: 'The first two weeks matter most' },
      { p: 'A new listing gets the most attention right after it goes live. The price decides who sees it during that window.' },
    ],
  },
];

export interface Video {
  title: string;
  youtubeId?: string;
  thumb: string;
  minutes: string;
  sample: boolean;
}

export const videoList: Video[] = [
  { title: 'Inside a Willow Glen bungalow', thumb: photos.livingWarm, minutes: '0:58', sample: true },
  { title: 'Three things buyers miss at open houses', thumb: photos.openPlan, minutes: '0:45', sample: true },
  { title: 'Market minute: fall in San Jose', thumb: photos.hills, minutes: '1:00', sample: true },
  { title: 'What staging really changes', thumb: photos.livingBright, minutes: '0:52', sample: true },
  { title: 'Before you sign the offer', thumb: photos.kitchen, minutes: '0:39', sample: true },
  { title: 'Evergreen in 60 seconds', thumb: homePhotos[0], minutes: '1:00', sample: true },
  { title: 'Closing day, step by step', thumb: photos.duskModern, minutes: '0:57', sample: true },
  { title: 'Townhouse or single-family?', thumb: homePhotos[7], minutes: '0:48', sample: true },
];

export interface Award {
  title: string;
  issuer: string;
  year: number;
  photo?: string;
  sample: boolean;
}

export const awards: Award[] = [
  { title: 'Award title', issuer: 'Issuing organization', year: 2025, sample: true },
  { title: 'Award title', issuer: 'Issuing organization', year: 2024, sample: true },
  { title: 'Award title', issuer: 'Issuing organization', year: 2024, sample: true },
  { title: 'Award title', issuer: 'Issuing organization', year: 2023, sample: true },
  { title: 'Award title', issuer: 'Issuing organization', year: 2022, sample: true },
  { title: 'Award title', issuer: 'Issuing organization', year: 2021, sample: true },
];

export interface Milestone {
  year: string;
  title: string;
  org: string;
  text: string;
  photo?: string;
  sample: boolean;
}

export const career: Milestone[] = [
  {
    year: '2026',
    title: 'Real Estate Agent',
    org: 'Your Brokerage',
    text: 'Current role. One or two lines on what Thang focuses on today and the neighborhoods Thang knows best.',
    photo: photos.duskModern,
    sample: true,
  },
  {
    year: '2024',
    title: 'Milestone title',
    org: 'Company or team',
    text: 'A short note about this chapter — a new team, a record year, a new area served.',
    photo: photos.livingWarm,
    sample: true,
  },
  {
    year: '2022',
    title: 'Milestone title',
    org: 'Company or team',
    text: 'Each step on the timeline can carry a photo, a title, the company and a sentence or two.',
    photo: homePhotos[1],
    sample: true,
  },
  {
    year: '2021',
    title: 'First homes sold',
    org: 'MLSListings',
    text: 'The earliest closings in the MLS sheet date from 2021. The real story of how it started goes here.',
    photo: homePhotos[0],
    sample: true,
  },
  {
    year: '20XX',
    title: 'Before real estate',
    org: 'Previous career',
    text: 'Like a LinkedIn profile: earlier roles and education, told in a few words.',
    sample: true,
  },
];
