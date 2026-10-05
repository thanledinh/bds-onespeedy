import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

declare global {
  interface Window {
    __motion?: boolean;
    __lenis?: Lenis | null;
  }
}
window.__motion = true;
gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

const webgl = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
})();
if (!webgl) document.documentElement.classList.add('no-webgl');

/* ------------------------------------------------------------------ smooth scroll */
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.__lenis = lenis;

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const el = document.getElementById(a.getAttribute('href')!.slice(1));
  if (!el) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(el, { offset: -10, duration: 1.6 });
  else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
});

/* ------------------------------------------------------------------ text helpers */
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
function splitWords(el: HTMLElement) {
  if (!el.dataset.splitDone) {
    el.setAttribute('aria-label', el.textContent!.replace(/\s+/g, ' ').trim());
    const parts: string[] = [];
    el.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE)
        n.textContent!.split(/(\s+)/).forEach((w) => w && parts.push(/^\s+$/.test(w) ? ' ' : `<span class="mask" aria-hidden="true"><span>${esc(w)}</span></span>`));
      else if (n instanceof HTMLElement)
        parts.push(n.tagName === 'BR' ? '<br>' : `<span class="mask" aria-hidden="true"><span>${n.outerHTML}</span></span>`);
    });
    el.innerHTML = parts.join('');
    el.dataset.splitDone = '1';
  }
  return $$('.mask > span', el);
}

/* ------------------------------------------------------------------ hero: model at golden hour → blue hour → step inside */
const lerpColor = gsap.utils.interpolate;
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clockText = (p: number) => {
  const mins = 17 * 60 + 24 + Math.round(166 * Math.min(1, p / 0.9));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} PM`;
};

async function hero() {
  const heroEl = $('[data-hero]');
  if (!heroEl) return;
  const title = $('[data-hero-title]', heroEl);
  const words = title ? splitWords(title) : [];
  const fades = $$('[data-hero-fade]', heroEl);
  gsap.set([title, ...fades].filter(Boolean), { visibility: 'visible' });
  if (reduce) document.documentElement.classList.add('reduce-motion');

  if (!reduce) {
    gsap
      .timeline({ delay: 0.2 })
      .from(words, { yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: 0.07 })
      .from(fades, { y: 18, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 }, 0.5);
  }

  const host = $('[data-house]', heroEl);
  const tourData = $('#tour-data');
  if (!host || !webgl || !tourData) return;
  const first = JSON.parse(tourData.textContent || '[]')[0];

  // Let the copy paint first, then bring in three.js.
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)));
  const { initHouse } = await import('./house');
  const house = initHouse(host, {
    reduce,
    pano: { image: first.image, preview: first.preview, lon: first.start.lon, lat: first.start.lat },
  });
  if (!reduce) gsap.from(host, { opacity: 0, duration: 1.6, ease: 'power2.out' });
  if (reduce) return;

  const backdrop = $('[data-backdrop]', heroEl);
  const clock = $('[data-clock]', heroEl);
  const bar = $('[data-hero-bar]', heroEl);
  const bgA = lerpColor('#3b2e24', '#16233c');
  const bgB = lerpColor('#0c0a08', '#05070c');

  // Copy that comes and goes with the story; tied to the same scroll.
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  tl.to('[data-chapter="intro"]', { opacity: 0, y: -40, duration: 0.07 }, 0.1)
    .to('[data-scroll-hint]', { opacity: 0, duration: 0.03 }, 0.02);
  ([['1', 0.22, 0.42], ['2', 0.52, 0.72], ['3', 0.78, 0.88]] as const).forEach(([k, a, b]) => {
    tl.fromTo(`[data-chapter="${k}"]`, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.05 }, a).to(
      `[data-chapter="${k}"]`,
      { opacity: 0, y: -30, duration: 0.05 },
      b,
    );
  });
  tl.to('[data-clock-wrap]', { opacity: 0, duration: 0.04 }, 0.86)
    .fromTo('[data-blackout]', { opacity: 0 }, { opacity: 1, duration: 0.035 }, house.stepIn - 0.035)
    .to('[data-blackout]', { opacity: 0, duration: 0.05 }, house.stepIn + 0.005)
    .set({}, {}, 1);

  ScrollTrigger.create({
    trigger: heroEl,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6,
    animation: tl,
    onUpdate: (self) => {
      const p = self.progress;
      house.setProgress(p);
      if (clock) clock.textContent = clockText(p);
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (backdrop) {
        const d = smoothstep(0.5, 0.72, p);
        backdrop.style.setProperty('--bg-a', bgA(d));
        backdrop.style.setProperty('--bg-b', bgB(d));
      }
    },
  });
}

/* ------------------------------------------------------------------ tour (lazy) */
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
      import('./tour').then(({ initTour }) => initTour(root, JSON.parse(data.textContent || '[]'), { reduce }));
    },
    { rootMargin: '900px 0px' },
  );
  io.observe(root);
}

/* ------------------------------------------------------------------ reveals, numbers, nav */
function reveals() {
  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    gsap.set(el, { visibility: 'visible' });
    if (reduce) return;
    gsap.from(words, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  if (reduce) return;
  $$('[data-reveal]').forEach((el) =>
    gsap.from(el, { y: 40, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }),
  );
  $$('[data-reveal-group]').forEach((g) =>
    gsap.from([...g.children], { y: 50, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: g, start: 'top 88%', once: true } }),
  );
}

function countUps() {
  $$('[data-count-up]').forEach((el) => {
    const final = el.dataset.countUp!;
    const m = final.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!m || reduce) return;
    const [, pre, num, post] = m;
    const target = parseFloat(num.replace(/,/g, ''));
    const decimals = (num.split('.')[1] ?? '').length;
    const n = { v: 0 };
    el.textContent = `${pre}${(0).toFixed(decimals)}${post}`;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => gsap.to(n, { v: target, duration: 2.2, ease: 'expo.out', onUpdate: () => (el.textContent = `${pre}${n.v.toFixed(decimals)}${post}`) }),
    });
  });
}

function nav() {
  const bar = $('[data-nav]');
  if (!bar) return;
  let lastY = 0;
  const update = () => {
    const y = window.scrollY;
    bar.classList.toggle('is-scrolled', y > 40);
    bar.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
  };
  update();
  if (lenis) lenis.on('scroll', update);
  else window.addEventListener('scroll', update, { passive: true });
}

function contact() {
  const form = $<HTMLFormElement>('[data-showing]');
  if (!form) return;
  const status = $('[data-showing-status]', form)!;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.hidden = false;
    if (!form.checkValidity()) {
      status.textContent = 'Please add your name and a phone number or email.';
      return;
    }
    status.textContent = 'Demo only: nothing was sent. On the live site your request goes straight to Thang.';
    form.reset();
  });
}

hero();
tour();
reveals();
countUps();
nav();
contact();
window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
