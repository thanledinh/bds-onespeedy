// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://example.com',
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    worker: { format: 'es' },
    // Pre-bundle lazily imported deps so dev doesn't re-optimize mid-session.
    optimizeDeps: { include: ['maplibre-gl', 'qrcode', 'gsap', 'gsap/ScrollTrigger', 'lenis', 'three'] },
  },
});
