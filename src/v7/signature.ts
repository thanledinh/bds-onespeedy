import type { Room } from '../data/tour';
import type { MapHome } from '../v2/map';

/**
 * Signature-only behaviour. Everything else (smooth scroll, reveals, chat,
 * drawer, contact card) comes from Option C's shared script, and the paged
 * sales list from src/v5/extras.ts.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

const webgl = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
})();

type Pin = MapHome & { id: string };

const bounds = (list: Pin[]): [[number, number], [number, number]] => [
  [Math.min(...list.map((h) => h.lng)), Math.min(...list.map((h) => h.lat))],
  [Math.max(...list.map((h) => h.lng)), Math.max(...list.map((h) => h.lat))],
];

/* ------------------------------------------------------------------ sales map, linked to the list */
function salesMap() {
  const el = $('[data-sig-map]');
  const json = $('#sig-homes');
  if (!el || !json) return;
  const homes: Pin[] = JSON.parse(json.textContent || '[]');
  const index = new Map(homes.map((h, i) => [h.id, i]));

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      import('../v2/map').then(({ initMap }) => {
        const map = initMap(el, homes, { dot: '#10110f', ring: '#fbfaf7', popupClass: 'home-pop-s' });

        // Hovering a row lights up its pin and glides the map to it.
        let lit: number | undefined;
        const light = (i?: number) => {
          if (!map.getSource('homes')) return;
          if (lit !== undefined) map.setFeatureState({ source: 'homes', id: lit }, { hover: false });
          lit = i;
          if (i !== undefined) map.setFeatureState({ source: 'homes', id: i }, { hover: true });
        };
        $$('[data-sale]').forEach((row) => {
          row.addEventListener('pointerenter', (e) => {
            if (e.pointerType !== 'mouse') return;
            const i = index.get(row.dataset.id!);
            if (i === undefined) return;
            light(i);
            map.easeTo({ center: [homes[i].lng, homes[i].lat], zoom: Math.max(map.getZoom(), 11.5), duration: reduce ? 0 : 900 });
          });
          row.addEventListener('pointerleave', () => light(undefined));
        });

        // The city filter (handled by extras.ts for the list) also frames the map.
        const filter = $<HTMLSelectElement>('#sales [data-grid-filter]');
        filter?.addEventListener('change', () => {
          const subset = filter.value ? homes.filter((h) => h.city === filter.value) : homes;
          if (subset.length) map.fitBounds(bounds(subset), { padding: 60, maxZoom: 13, duration: reduce ? 0 : 1400 });
        });
      });
    },
    { rootMargin: '600px 0px' },
  );
  io.observe(el);
}

/* ------------------------------------------------------------------ 360° tour (loads three.js only when near) */
function tour() {
  const root = $('[data-tour]');
  const data = $('#tour-data');
  if (!root || !data) return;
  if (!webgl) {
    root.classList.add('is-fallback');
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      import('./tour').then(({ initTour }) => initTour(root, JSON.parse(data.textContent || '[]') as Room[], { reduce }));
    },
    { rootMargin: '900px 0px' },
  );
  io.observe(root);
}

salesMap();
tour();
