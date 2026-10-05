import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre builds its worker URL at runtime, which bundlers can't follow.
// Let Vite bundle the worker and hand MapLibre the resulting URL.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

maplibregl.setWorkerUrl(workerUrl);

export interface MapHome {
  lat: number;
  lng: number;
  price: string;
  place: string;
  meta: string;
  city: string;
}

// Free vector tiles, no API key (openfreemap.org). Light, quiet basemap.
const STYLE = 'https://tiles.openfreemap.org/styles/positron';

export interface MapOptions {
  /** Dot and halo colour. */
  dot?: string;
  /** Dot outline colour. */
  ring?: string;
  /** Class added to popups so each design option can style them. */
  popupClass?: string;
  /** Show zoom buttons. */
  controls?: boolean;
  /** Fixed starting view instead of fitting every pin (useful in small tiles). */
  view?: { center: [number, number]; zoom: number };
}

export function initMap(el: HTMLElement, homes: MapHome[], opts: MapOptions = {}) {
  const { dot: FOREST = '#1f2c25', ring: CREAM = '#faf8f4', popupClass = 'home-pop', controls = true, view } = opts;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const map = new maplibregl.Map({
    container: el,
    style: STYLE,
    ...(view ? { center: view.center, zoom: view.zoom } : { bounds: bounds(homes), fitBoundsOptions: { padding: 50 } }),
    attributionControl: { compact: true },
    cooperativeGestures: true,
    dragRotate: false,
    pitchWithRotate: false,
  });
  if (controls) map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

  map.on('load', () => {
    map.addSource('homes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: homes.map((h, i) => ({
          type: 'Feature',
          id: i,
          properties: h,
          geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
        })),
      },
    });
    map.addLayer({
      id: 'homes-halo',
      type: 'circle',
      source: 'homes',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 7, 13, 16],
        'circle-color': FOREST,
        'circle-opacity': 0,
        'circle-opacity-transition': { duration: reduce ? 0 : 1600 },
      },
    });
    map.addLayer({
      id: 'homes-dot',
      type: 'circle',
      source: 'homes',
      paint: {
        // "zoom" must be the top-level interpolate input; hover state goes in the outputs.
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8,
          ['case', ['boolean', ['feature-state', 'hover'], false], 7, 3.5],
          13,
          ['case', ['boolean', ['feature-state', 'hover'], false], 10, 6.5],
        ],
        'circle-color': FOREST,
        'circle-stroke-color': CREAM,
        'circle-stroke-width': 1.5,
        'circle-opacity': 0,
        'circle-stroke-opacity': 0,
        'circle-opacity-transition': { duration: reduce ? 0 : 1200 },
        'circle-stroke-opacity-transition': { duration: reduce ? 0 : 1200 },
      },
    });
    requestAnimationFrame(() => {
      map.setPaintProperty('homes-dot', 'circle-opacity', 1);
      map.setPaintProperty('homes-dot', 'circle-stroke-opacity', 1);
      map.setPaintProperty('homes-halo', 'circle-opacity', 0.1);
    });

    const popup = new maplibregl.Popup({ closeButton: false, offset: 12, className: popupClass });
    let hovered: number | string | undefined;
    map.on('mousemove', 'homes-dot', (e) => {
      const f = e.features?.[0];
      if (!f) return;
      map.getCanvas().style.cursor = 'pointer';
      if (hovered !== undefined) map.setFeatureState({ source: 'homes', id: hovered }, { hover: false });
      hovered = f.id;
      map.setFeatureState({ source: 'homes', id: hovered! }, { hover: true });
      const p = f.properties as unknown as MapHome;
      popup
        .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
        .setHTML(`<strong>${p.price}</strong><span>${p.place}</span><em>${p.meta}</em>`)
        .addTo(map);
    });
    map.on('mouseleave', 'homes-dot', () => {
      map.getCanvas().style.cursor = '';
      if (hovered !== undefined) map.setFeatureState({ source: 'homes', id: hovered }, { hover: false });
      hovered = undefined;
      popup.remove();
    });
    map.on('click', 'homes-dot', (e) => {
      const f = e.features?.[0];
      if (f) map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: Math.max(map.getZoom(), 12.5) });
    });
  });

  // City list next to the map flies to that city's homes.
  document.querySelectorAll<HTMLButtonElement>('[data-map-city]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const city = btn.dataset.mapCity!;
      const subset = city === '*' ? homes : homes.filter((h) => h.city === city);
      document.querySelectorAll('[data-map-city]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      map.fitBounds(bounds(subset), { padding: 70, maxZoom: 13, duration: reduce ? 0 : 1600 });
    });
  });

  return map;
}

function bounds(list: MapHome[]): maplibregl.LngLatBoundsLike {
  const lngs = list.map((h) => h.lng);
  const lats = list.map((h) => h.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}
