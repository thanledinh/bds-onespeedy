/**
 * Sample 360° tour for the Signature option. Panoramas are CC0 from Poly Haven (polyhaven.com),
 * resized to 4096×2048 and stored in /public/tour. The rooms come from different
 * demo homes, so the tour is labelled "Sample". Real tours use Thang's own 360° photos.
 *
 * Positions use the panorama's own coordinates: lon 0–360° left→right across the
 * image, lat +90° (up) to −90° (down).
 */
export interface Hotspot {
  type: 'go' | 'info';
  lon: number;
  lat: number;
  label: string;
  to?: string;
  text?: string;
}
export interface Room {
  id: string;
  name: string;
  image: string;
  preview: string;
  start: { lon: number; lat: number };
  hotspots: Hotspot[];
}

export const tourHome = {
  title: 'Sample home',
  area: 'Willow Glen, San Jose',
  beds: 4,
  baths: 3,
  sqft: '2,480',
  sample: true,
  credit: 'Panoramas: Poly Haven (CC0)',
};

export const rooms: Room[] = [
  {
    id: 'living',
    name: 'Living room',
    image: '/tour/lythwood_lounge.jpg',
    preview: '/tour/lythwood_lounge-preview.jpg',
    start: { lon: 226, lat: -3 },
    hotspots: [
      { type: 'go', to: 'bedroom', lon: 142.4, lat: -3.2, label: 'Bedroom' },
      { type: 'go', to: 'kitchen', lon: 63.3, lat: -8.4, label: 'Kitchen' },
      { type: 'go', to: 'dining', lon: 337.5, lat: -1.4, label: 'Dining & balcony' },
      { type: 'info', lon: 283, lat: -10.2, label: 'Wood-burning stove', text: 'A warm focal point for winter evenings.' },
      { type: 'info', lon: 232.7, lat: 2.1, label: 'Garden doors', text: 'Floor-to-ceiling glass opens onto the lawn.' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    image: '/tour/kiara_interior.jpg',
    preview: '/tour/kiara_interior-preview.jpg',
    start: { lon: 290, lat: -6 },
    hotspots: [
      { type: 'go', to: 'living', lon: 75.6, lat: 0.4, label: 'Living room' },
      { type: 'go', to: 'dining', lon: 147.7, lat: -2.1, label: 'Dining & balcony' },
      { type: 'info', lon: 335.7, lat: -1.4, label: 'Open kitchen', text: 'Stainless appliances and plenty of counter space.' },
      { type: 'info', lon: 33.4, lat: -12, label: 'Breakfast bar', text: 'Casual seating for four.' },
    ],
  },
  {
    id: 'dining',
    name: 'Dining & balcony',
    image: '/tour/cayley_interior.jpg',
    preview: '/tour/cayley_interior-preview.jpg',
    start: { lon: 169, lat: -3 },
    hotspots: [
      { type: 'go', to: 'living', lon: 33.4, lat: 3.9, label: 'Living room' },
      { type: 'go', to: 'kitchen', lon: 327, lat: -10, label: 'Kitchen' },
      { type: 'info', lon: 175.8, lat: 0.4, label: 'Balcony with a view', text: 'Sliding doors open onto a wide balcony.' },
      { type: 'info', lon: 61.5, lat: -15.5, label: 'Dining for six', text: 'Room for a full table next to the view.' },
    ],
  },
  {
    id: 'bedroom',
    name: 'Primary bedroom',
    image: '/tour/lythwood_room.jpg',
    preview: '/tour/lythwood_room-preview.jpg',
    start: { lon: 218, lat: -4 },
    hotspots: [
      { type: 'go', to: 'bathroom', lon: 96.7, lat: -4.2, label: 'Bathroom' },
      { type: 'go', to: 'living', lon: 66.1, lat: -2.1, label: 'Living room' },
      { type: 'info', lon: 301.6, lat: -19, label: 'Fireplace', text: 'A second fireplace keeps the suite cozy.' },
      { type: 'info', lon: 218, lat: 0.4, label: 'Garden view', text: 'Morning light over the garden.' },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    image: '/tour/en_suite.jpg',
    preview: '/tour/en_suite-preview.jpg',
    start: { lon: 100, lat: -8 },
    hotspots: [
      { type: 'go', to: 'bedroom', lon: 202.1, lat: -4.2, label: 'Bedroom' },
      { type: 'info', lon: 112.5, lat: -8.4, label: 'Walk-in shower', text: 'Frameless glass and stone tile.' },
      { type: 'info', lon: 330.5, lat: -20, label: 'Two vanities', text: 'Granite counters on both sides.' },
    ],
  },
];
