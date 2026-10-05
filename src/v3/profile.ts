import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import QRCode from 'qrcode';

declare global {
  interface Window {
    __motion?: boolean;
    __lenis?: Lenis | null;
  }
}
window.__motion = true;
gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ helpers */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const wait = (ms: number) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

interface Contact {
  name: string;
  first: string;
  last: string;
  role: string;
  phone: string;
  tel: string;
  email: string;
  dre: string;
  brokerage: string;
  area: string;
}
interface Home {
  img: string;
  place: string;
  area: string;
  type: string;
  beds: number;
  baths: number;
  sqft: string;
  list: string;
  sold: string;
  over: string;
  closed: string;
  sample: boolean;
}
type Block = { p: string } | { h2: string } | { quote: string } | { list: string[] };
interface PostData {
  title: string;
  tag: string;
  date: string;
  minutes: number;
  cover: string;
  body: Block[];
  sample: boolean;
}
interface Data {
  contact: Contact;
  highlights: { label: string; slides: { img: string; title: string; sub: string }[] }[];
  homes: Record<string, Home>;
  posts: Record<string, PostData>;
  cities: string[];
}
const data: Data = JSON.parse($('#v3-data')?.textContent || '{}');
const C = data.contact;

/* ------------------------------------------------------------------ smooth scroll */
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.__lenis = lenis;

let locks = 0;
const lockScroll = () => {
  locks++;
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
};
const unlockScroll = () => {
  locks = Math.max(0, locks - 1);
  if (locks) return;
  lenis?.start();
  document.documentElement.style.overflow = '';
};

const scrollToEl = (el: Element) => {
  const top = el.getBoundingClientRect().top + window.scrollY - 124;
  if (lenis) lenis.scrollTo(top, { duration: 1.4 });
  else window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
};

/* ------------------------------------------------------------------ toast */
const toastEl = $('[data-toast]');
let toastTimer: number | undefined;
function toast(msg: string) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('is-on'), 2400);
}

/* ------------------------------------------------------------------ intro + reveals */
function splitWords(el: HTMLElement) {
  if (!el.dataset.splitDone) {
    const text = el.textContent!.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text
      .split(' ')
      .map((w) => `<span class="mask" aria-hidden="true"><span>${esc(w)}</span></span>`)
      .join(' ');
    el.dataset.splitDone = '1';
  }
  return $$('.mask > span', el);
}

function intro() {
  const name = $('#profile-name');
  const nameWords = name ? splitWords(name) : [];
  const intros = $$('[data-intro]');
  const avatar = $('[data-avatar]');
  const cover = $('[data-cover]');
  const hls = $$('[data-highlight]');
  gsap.set([name, ...intros].filter(Boolean), { visibility: 'visible' });
  if (reduce) return;

  const tl = gsap.timeline({ delay: 0.1 });
  if (cover) tl.from(cover, { clipPath: 'inset(6% 4% 6% 4% round 30px)', opacity: 0.4, duration: 1.4, ease: 'expo.out' }, 0);
  if (avatar) tl.from(avatar, { scale: 0.6, opacity: 0, duration: 1.1, ease: 'back.out(1.6)' }, 0.35);
  tl.from(nameWords, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.06 }, 0.5)
    .from(intros, { y: 18, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.07 }, 0.65)
    .from(hls, { y: 14, opacity: 0, scale: 0.9, duration: 0.8, ease: 'back.out(1.7)', stagger: 0.05 }, 0.9);

  // Cover film drifts slower than the page.
  const vid = $('[data-cover-video]');
  if (vid && cover) {
    gsap.to(vid, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: cover, start: 'top top', end: 'bottom top', scrub: true } });
  }
}

function reveals() {
  $$('[data-split]').forEach((el) => {
    if (el.id === 'profile-name') return;
    const words = splitWords(el);
    gsap.set(el, { visibility: 'visible' });
    if (reduce) return;
    gsap.from(words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  if (reduce) return;
  const bento = $('[data-bento]');
  if (bento) {
    gsap.from([...bento.children], {
      y: 40,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: bento, start: 'top 85%', once: true },
    });
  }
  $$('[data-reveal]').forEach((el) =>
    gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }),
  );
  $$('[data-bars] .bar').forEach((bar, i) =>
    gsap.from(bar, { scaleY: 0, duration: 1.2, ease: 'expo.out', delay: i * 0.06, scrollTrigger: { trigger: bar.closest('svg')!, start: 'top 92%', once: true } }),
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
      start: 'top 95%',
      once: true,
      onEnter: () =>
        gsap.to(n, { v: target, duration: 2.2, ease: 'expo.out', onUpdate: () => (el.textContent = `${pre}${n.v.toFixed(decimals)}${post}`) }),
    });
  });
}

/* ------------------------------------------------------------------ top bar + tabs */
function chrome() {
  const bar = $('[data-topbar]');
  const update = () => bar?.classList.toggle('is-scrolled', window.scrollY > 10);
  update();
  if (lenis) lenis.on('scroll', update);
  else window.addEventListener('scroll', update, { passive: true });

  const tabs = $$('[data-tab]');
  const indicator = $('[data-tab-indicator]');
  const moveIndicator = (tab: HTMLElement) => {
    if (!indicator) return;
    indicator.style.width = `${tab.offsetWidth - 24}px`;
    indicator.style.transform = `translateX(${tab.offsetLeft + 12}px)`;
  };
  const setActive = (id: string) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === id;
      t.classList.toggle('is-active', on);
      if (on) {
        t.setAttribute('aria-current', 'true');
        moveIndicator(t);
        t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } else t.removeAttribute('aria-current');
    });
  };
  if (tabs[0]) requestAnimationFrame(() => moveIndicator(tabs[0]));
  window.addEventListener('resize', () => {
    const active = tabs.find((t) => t.classList.contains('is-active'));
    if (active) moveIndicator(active);
  });

  tabs.forEach((t) => {
    const sec = document.getElementById(t.dataset.tab!);
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 140px',
      end: 'bottom 140px',
      onToggle: (self) => self.isActive && setActive(t.dataset.tab!),
    });
  });

  // Any in-page link to a section scrolls smoothly below the sticky bars.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const target = document.getElementById(a.getAttribute('href')!.slice(1));
    if (!target) return;
    e.preventDefault();
    scrollToEl(target);
  });
}

/* ------------------------------------------------------------------ spotlight + business card */
function spotlight() {
  if (!finePointer) return;
  document.addEventListener('pointermove', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-spot]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

function bizcard() {
  const card = $('[data-bizcard]');
  if (!card) return;
  card.addEventListener('click', () => card.classList.toggle('is-flipped'));
  if (!finePointer || reduce) return;
  const area = card.closest<HTMLElement>('[data-spot]') ?? card;
  area.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.classList.add('is-tracking');
    card.style.setProperty('--ry', `${Math.max(-1, Math.min(1, x)) * 18}deg`);
    card.style.setProperty('--rx', `${Math.max(-1, Math.min(1, y)) * -14}deg`);
    card.style.setProperty('--sheen', `${x * 90}%`);
  });
  area.addEventListener('pointerleave', () => {
    card.classList.remove('is-tracking');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--sheen', '-30%');
  });
}

/* ------------------------------------------------------------------ contact actions: vCard, share, QR */
function profileUrl() {
  return location.origin + location.pathname;
}

function downloadVCard() {
  const vcf = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${C.last};${C.first};;;`,
    `FN:${C.name}`,
    `TITLE:${C.role}`,
    `ORG:${C.brokerage}`,
    `TEL;TYPE=CELL:${C.tel}`,
    `EMAIL;TYPE=INTERNET:${C.email}`,
    `URL:${profileUrl()}`,
    `ADR;TYPE=WORK:;;;San Jose;CA;;USA`,
    `NOTE:${C.dre} · ${C.area}`,
    'END:VCARD',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${C.name.toLowerCase().replace(/\s+/g, '-')}.vcf` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Contact card saved. Open it to add Thang to your phone.');
}

async function share() {
  const url = profileUrl();
  if (navigator.share) {
    try {
      await navigator.share({ title: `${C.name} — ${C.role}`, url });
      return;
    } catch {
      /* cancelled: fall through to copy */
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Profile link copied');
  } catch {
    toast(url);
  }
}

const qrOpts = { margin: 0, color: { dark: '#0c1626', light: '#ffffff' } };
function contactActions() {
  $$('[data-vcard]').forEach((b) => b.addEventListener('click', downloadVCard));
  $$('[data-share]').forEach((b) => b.addEventListener('click', share));

  const cardQr = $('[data-card-qr]');
  if (cardQr) QRCode.toString(profileUrl(), { ...qrOpts, type: 'svg' }).then((svg: string) => (cardQr.innerHTML = svg));

  const dlg = $<HTMLDialogElement>('[data-qr]');
  const box = $('[data-qr-svg]');
  $$('[data-qr-open]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!dlg || !box) return;
      box.innerHTML = await QRCode.toString(profileUrl(), { ...qrOpts, type: 'svg' });
      closeMenus();
      dlg.showModal();
      lockScroll();
    }),
  );
  dlg?.addEventListener('close', unlockScroll);
  $('[data-qr-close]')?.addEventListener('click', () => dlg?.close());
  dlg?.addEventListener('click', (e) => e.target === dlg && dlg.close());
  $('[data-qr-download]')?.addEventListener('click', async () => {
    const png = await QRCode.toDataURL(profileUrl(), { ...qrOpts, margin: 2, width: 1200 });
    const a = Object.assign(document.createElement('a'), { href: png, download: 'thang-truong-profile-qr.png' });
    a.click();
  });

  // "More" menu
  const moreBtn = $('[data-more-btn]');
  const moreMenu = $('[data-more-menu]');
  moreBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = moreMenu!.classList.toggle('hidden') === false;
    moreBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-more-menu]')) closeMenus();
  });
}
function closeMenus() {
  $('[data-more-menu]')?.classList.add('hidden');
  $('[data-more-btn]')?.setAttribute('aria-expanded', 'false');
}

/* ------------------------------------------------------------------ stories */
function stories() {
  const root = $('[data-story]');
  if (!root || !data.highlights?.length) return;
  const media = $('[data-story-media]', root)!;
  const bars = $('[data-story-bars]', root)!;
  const label = $('[data-story-label]', root)!;
  const title = $('[data-story-title]', root)!;
  const sub = $('[data-story-sub]', root)!;
  const DURATION = 5200;
  let h = 0;
  let s = 0;
  let start = 0;
  let elapsed = 0;
  let paused = false;
  let raf = 0;
  let holdTimer = 0;
  let held = false;

  const buildBars = () => {
    bars.innerHTML = data.highlights[h].slides
      .map(() => '<span class="h-[3px] flex-1 overflow-hidden rounded-full bg-porcelain/30"><span class="block h-full w-0 bg-porcelain"></span></span>')
      .join('');
  };
  const fills = () => $$('span > span', bars);
  const render = () => {
    const slide = data.highlights[h].slides[s];
    label.textContent = data.highlights[h].label;
    media.innerHTML = `<img src="${esc(slide.img)}" alt="" class="story-img size-full object-cover">`;
    const img = $('img', media)!;
    if (!reduce) gsap.fromTo(img, { scale: 1.1 }, { scale: 1, duration: DURATION / 1000, ease: 'none' });
    title.textContent = slide.title;
    sub.textContent = slide.sub;
    fills().forEach((f, i) => (f.style.width = i < s ? '100%' : '0%'));
    elapsed = 0;
    start = performance.now();
    $$('[data-highlight]')[h]?.classList.add('is-seen');
  };
  const tick = (now: number) => {
    if (!paused) {
      const p = Math.min(1, (elapsed + now - start) / DURATION);
      const f = fills()[s];
      if (f) f.style.width = `${p * 100}%`;
      if (p >= 1) return next();
    }
    raf = requestAnimationFrame(tick);
  };
  const play = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  };
  const next = () => {
    if (s < data.highlights[h].slides.length - 1) s++;
    else if (h < data.highlights.length - 1) {
      h++;
      s = 0;
      buildBars();
    } else return close();
    render();
    play();
  };
  const prev = () => {
    if (s > 0) s--;
    else if (h > 0) {
      h--;
      s = 0;
      buildBars();
    }
    render();
    play();
  };
  const open = (i: number) => {
    h = i;
    s = 0;
    root.hidden = false;
    lockScroll();
    buildBars();
    render();
    play();
    $<HTMLButtonElement>('[data-story-close]', root)?.focus();
  };
  const close = () => {
    cancelAnimationFrame(raf);
    root.hidden = true;
    media.innerHTML = '';
    unlockScroll();
  };
  const pause = () => {
    if (paused) return;
    paused = true;
    elapsed += performance.now() - start;
  };
  const resume = () => {
    if (!paused) return;
    paused = false;
    start = performance.now();
  };

  $$('[data-highlight]').forEach((b) => b.addEventListener('click', () => open(Number(b.dataset.highlight))));
  $('[data-story-close]', root)?.addEventListener('click', close);
  // Tap left/right to navigate; press and hold to pause.
  (['[data-story-prev]', '[data-story-next]'] as const).forEach((sel) => {
    const zone = $(sel, root)!;
    zone.addEventListener('pointerdown', () => {
      held = false;
      holdTimer = window.setTimeout(() => {
        held = true;
        pause();
      }, 220);
    });
    zone.addEventListener('pointerup', () => {
      clearTimeout(holdTimer);
      if (held) return resume();
      sel === '[data-story-prev]' ? prev() : next();
    });
    zone.addEventListener('pointerleave', () => {
      clearTimeout(holdTimer);
      if (held) resume();
    });
    // Keyboard activation (Enter/Space) fires click without pointer events.
    zone.addEventListener('click', (e) => {
      if (e.detail === 0) sel === '[data-story-prev]' ? prev() : next();
    });
  });
  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });
  root.addEventListener('click', (e) => e.target === root && close());
}

/* ------------------------------------------------------------------ drawer (articles, homes) */
const drawer = $('[data-drawer]');
function openDrawer(kicker: string, html: string) {
  if (!drawer) return;
  $('[data-drawer-kicker]', drawer)!.textContent = kicker;
  const body = $('[data-drawer-body]', drawer)!;
  body.innerHTML = html;
  body.scrollTop = 0;
  drawer.hidden = false;
  lockScroll();
  $<HTMLButtonElement>('[data-drawer-close]', drawer)?.focus();
}
function closeDrawer() {
  if (!drawer || drawer.hidden) return;
  drawer.hidden = true;
  unlockScroll();
}

function renderBlocks(blocks: Block[]) {
  return blocks
    .map((b) =>
      'p' in b
        ? `<p class="text-[1.05rem] leading-relaxed text-ink/80">${esc(b.p)}</p>`
        : 'h2' in b
          ? `<h3 class="pt-4 font-display text-2xl">${esc(b.h2)}</h3>`
          : 'quote' in b
            ? `<blockquote class="border-l-2 border-gold pl-4 font-display text-2xl italic">${esc(b.quote)}</blockquote>`
            : `<ul class="space-y-2">${b.list.map((li) => `<li class="flex gap-3"><span class="text-gold">—</span>${esc(li)}</li>`).join('')}</ul>`,
    )
    .join('');
}

function drawers() {
  if (!drawer) return;
  $('[data-drawer-close]', drawer)?.addEventListener('click', closeDrawer);
  $('[data-drawer-scrim]', drawer)?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeDrawer());

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const postBtn = t.closest<HTMLElement>('[data-post]');
    if (postBtn) {
      const p = data.posts[postBtn.dataset.post!];
      if (!p) return;
      openDrawer(
        `${p.tag} · ${p.minutes} min read`,
        `<img src="${esc(p.cover)}" alt="" class="aspect-[16/9] w-full object-cover">
        <div class="space-y-4 p-6 md:p-8">
          <p class="text-sm text-slate">${esc(p.date)}${p.sample ? ' · Sample article' : ''}</p>
          <h2 class="font-display text-4xl leading-tight">${esc(p.title)}</h2>
          ${renderBlocks(p.body)}
          <div class="mt-8 flex flex-wrap gap-2 border-t border-ink/8 pt-6">
            <button type="button" data-chat-open class="btn btn-primary">Ask Thang about this</button>
            <button type="button" data-share class="btn btn-ghost" data-share-inline>Share</button>
          </div>
        </div>`,
      );
      return;
    }
    const homeBtn = t.closest<HTMLElement>('[data-home-tile]');
    if (homeBtn) {
      const h = data.homes[homeBtn.dataset.homeTile!];
      if (!h) return;
      openDrawer(
        `Sold · ${h.closed}`,
        `<img src="${esc(h.img)}" alt="" class="aspect-[4/3] w-full object-cover">
        <div class="space-y-6 p-6 md:p-8">
          <div>
            <p class="text-sm text-slate">${esc(h.place)} · ${esc(h.type)}</p>
            <p class="mt-1 font-display text-5xl">${esc(h.sold)}</p>
            <p class="mt-1 text-sm"><span class="font-bold text-success">${esc(h.over)}</span> <span class="text-slate">· listed at ${esc(h.list)}</span></p>
          </div>
          <dl class="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-ink/8 bg-ink/8 text-center">
            <div class="bg-card p-4"><dd class="font-display text-3xl">${h.beds}</dd><dt class="text-xs text-slate">Bedrooms</dt></div>
            <div class="bg-card p-4"><dd class="font-display text-3xl">${h.baths}</dd><dt class="text-xs text-slate">Bathrooms</dt></div>
            <div class="bg-card p-4"><dd class="font-display text-3xl">${esc(h.sqft)}</dd><dt class="text-xs text-slate">Sq ft</dt></div>
          </dl>
          <p class="text-sm text-slate">Closed ${esc(h.closed)}.${h.sample ? ' Sample data for the demo; the live site links each sale to its MLS record.' : ''}</p>
          <div class="flex flex-wrap gap-2 border-t border-ink/8 pt-6">
            <button type="button" data-chat-open data-chat-intent="Sell my home" data-chat-area="${esc(h.area)}" class="btn btn-primary">Selling nearby? Ask Thang</button>
            <button type="button" data-chat-open data-chat-intent="Buy a home" data-chat-area="${esc(h.area)}" class="btn btn-ghost">Buying in ${esc(h.area)}</button>
          </div>
        </div>`,
      );
    }
  });
  // Share buttons rendered inside the drawer
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-share-inline]')) share();
  });
}

/* ------------------------------------------------------------------ sold grid */
function soldGrid() {
  const grid = $('[data-sold-grid]');
  if (!grid) return;
  const tiles = $$('[data-home-tile]', grid);
  const more = $('[data-sold-more]');
  const count = $('[data-sold-count]');
  const chips = $$('[data-city]', $('[data-city-chips]')!);
  const PAGE = 12;
  let limit = PAGE;
  let city = '';
  const render = (animateFrom = 0) => {
    const matches = tiles.filter((t) => !city || t.dataset.city === city);
    tiles.forEach((t) => t.classList.add('hidden'));
    matches.slice(0, limit).forEach((t, i) => {
      t.classList.remove('hidden');
      if (i >= animateFrom && !reduce) gsap.fromTo(t, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: (i - animateFrom) * 0.03 });
    });
    const shown = Math.min(limit, matches.length);
    if (count) count.textContent = `Showing ${shown} of ${matches.length}`;
    more?.classList.toggle('hidden', shown >= matches.length);
    ScrollTrigger.refresh();
  };
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      city = chip.dataset.city!;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      limit = PAGE;
      render(0);
    }),
  );
  more?.addEventListener('click', () => {
    const from = limit;
    limit += PAGE;
    render(from);
  });
}

/* ------------------------------------------------------------------ awards rotator */
function rotator() {
  const box = $('[data-awards-rotator]');
  if (!box) return;
  const imgs = $$('[data-rot]', box);
  const titleEl = $('[data-rot-title]', box);
  const yearEl = $('[data-rot-year]', box);
  let i = 0;
  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(box);
  setInterval(() => {
    if (!visible || reduce || imgs.length < 2) return;
    i = (i + 1) % imgs.length;
    imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
    if (titleEl) titleEl.textContent = imgs[i].dataset.title ?? '';
    if (yearEl) yearEl.textContent = imgs[i].dataset.year ?? '';
  }, 3200);
}

/* ------------------------------------------------------------------ booking tile */
function booking() {
  const box = $('[data-book]');
  if (!box) return;
  const daysEl = $('[data-book-days]', box)!;
  const days: Date[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (days.length < 5) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
  }
  daysEl.innerHTML = days
    .map(
      (day, i) =>
        `<button type="button" class="day" aria-pressed="${i === 0}" data-day="${day.toISOString()}"><span class="block opacity-70">${day.toLocaleDateString('en-US', { weekday: 'short' })}</span><span class="block text-sm">${day.getDate()}</span></button>`,
    )
    .join('');
  const pick = (group: HTMLElement[], btn: HTMLElement) => group.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  const dayBtns = $$('.day', daysEl);
  const slotBtns = $$('.slot', box);
  dayBtns.forEach((b) => b.addEventListener('click', () => pick(dayBtns, b)));
  slotBtns.forEach((b) => b.addEventListener('click', () => pick(slotBtns, b)));
  $('[data-book-go]', box)?.addEventListener('click', () => {
    const day = dayBtns.find((b) => b.getAttribute('aria-pressed') === 'true')!;
    const slot = slotBtns.find((b) => b.getAttribute('aria-pressed') === 'true')!;
    const when = `${new Date(day.dataset.day!).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · ${slot.textContent}`;
    chat.open({ intent: 'Book a consultation', when });
  });
}

/* ------------------------------------------------------------------ chat (guided message) */
const chat = (() => {
  const panel = $('[data-chat]');
  const log = $('[data-chat-log]');
  const actions = $('[data-chat-actions]');
  const answers: Record<string, string> = {};
  let run = 0;

  const scrollDown = () => log && (log.scrollTop = log.scrollHeight);
  const bubble = (from: 'bot' | 'me', html: string) => {
    if (!log) return;
    const wrap = document.createElement('div');
    wrap.className = `flex ${from === 'me' ? 'justify-end' : 'justify-start'}`;
    wrap.innerHTML = `<p class="max-w-[85%] px-4 py-2.5 text-[0.92rem] leading-snug ${
      from === 'me' ? 'rounded-lg rounded-br-sm bg-night text-porcelain' : 'rounded-lg rounded-bl-sm border border-ink/8 bg-card'
    }">${html}</p>`;
    log.append(wrap);
    if (!reduce) gsap.from(wrap, { y: 10, opacity: 0, duration: 0.45, ease: 'power3.out' });
    scrollDown();
  };
  const typing = async (id: number, ms = 650) => {
    if (!log) return;
    const t = document.createElement('div');
    t.className = 'flex';
    t.innerHTML = '<p class="typing rounded-lg rounded-bl-sm border border-ink/8 bg-card px-4 py-3"><span></span><span></span><span></span></p>';
    log.append(t);
    scrollDown();
    await wait(ms);
    t.remove();
    return id === run;
  };
  const say = async (id: number, lines: string[]) => {
    for (const line of lines) {
      if (!(await typing(id))) return false;
      bubble('bot', line);
    }
    return id === run;
  };
  const options = (opts: string[], onPick: (v: string) => void) => {
    if (!actions) return;
    actions.innerHTML = `<div class="flex flex-wrap gap-2">${opts.map((o) => `<button type="button" class="chip">${esc(o)}</button>`).join('')}</div>`;
    $$('button', actions).forEach((b) =>
      b.addEventListener('click', () => {
        actions.innerHTML = '';
        bubble('me', esc(b.textContent));
        onPick(b.textContent!);
      }),
    );
  };

  const stepIntent = async (id: number) => {
    if (!(await say(id, ['Hi, I’m Thang 👋', 'Thanks for stopping by. What can I help you with today?']))) return;
    options(['Sell my home', 'Buy a home', 'Home value estimate', 'Book a consultation', 'Something else'], (v) => {
      answers.intent = v;
      stepArea(id);
    });
  };
  const stepArea = async (id: number) => {
    if (!(await say(id, ['Great. Which area are you thinking about?']))) return;
    options([...data.cities, 'Somewhere else'], (v) => {
      answers.area = v;
      stepTiming(id);
    });
  };
  const stepTiming = async (id: number) => {
    if (!(await say(id, ['And what’s your timing?']))) return;
    options(['As soon as possible', 'In 1–3 months', 'Later this year', 'Just exploring'], (v) => {
      answers.timing = v;
      stepContact(id);
    });
  };
  const stepContact = async (id: number) => {
    if (!(await say(id, ['Perfect. How can I reach you?']))) return;
    if (!actions) return;
    actions.innerHTML = `
      <form class="space-y-2" novalidate>
        <input name="name" required autocomplete="name" placeholder="Your name" class="chat-input">
        <input name="reach" required autocomplete="tel" placeholder="Phone or email" class="chat-input">
        <button class="btn btn-primary w-full">Send to Thang</button>
      </form>`;
    const form = $<HTMLFormElement>('form', actions)!;
    $<HTMLInputElement>('input', form)?.focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const name = String(f.get('name') || '').trim();
      const reach = String(f.get('reach') || '').trim();
      if (!name || !reach) {
        form.querySelectorAll<HTMLInputElement>('input').forEach((i) => i.classList.toggle('is-invalid', !i.value.trim()));
        return;
      }
      actions.innerHTML = '';
      bubble('me', `${esc(name)} · ${esc(reach)}`);
      const summary = [answers.intent, answers.area, answers.timing, answers.when].filter(Boolean).map(esc).join(' · ');
      if (
        !(await say(id, [
          `Thank you, ${esc(name.split(' ')[0])}! I’ll get back to you personally.`,
          `<span class="text-slate">Your request: ${summary}</span>`,
          '<span class="text-slate">Demo only: nothing was sent. On the live site this goes straight to Thang’s phone.</span>',
        ]))
      )
        return;
      actions.innerHTML = `<div class="grid grid-cols-2 gap-2"><a href="tel:${esc(C.tel)}" class="btn btn-gold">Call now</a><button type="button" class="btn btn-ghost" data-chat-restart>Start over</button></div>`;
      $('[data-chat-restart]', actions)?.addEventListener('click', () => start({}));
    });
  };

  const start = (preset: { intent?: string; area?: string; when?: string }) => {
    run++;
    const id = run;
    if (log) log.innerHTML = '';
    if (actions) actions.innerHTML = '';
    Object.keys(answers).forEach((k) => delete answers[k]);
    Object.assign(answers, preset);
    if (!preset.intent) return stepIntent(id);
    (async () => {
      if (!(await say(id, ['Hi, I’m Thang 👋']))) return;
      bubble('me', esc(preset.when ? `${preset.intent}: ${preset.when}` : preset.area ? `${preset.intent} · ${preset.area}` : preset.intent));
      if (preset.when) return stepContact(id);
      if (preset.area) return stepTiming(id);
      return stepArea(id);
    })();
  };

  const open = (preset: { intent?: string; area?: string; when?: string } = {}) => {
    if (!panel) return;
    closeDrawer();
    const wasHidden = panel.hidden;
    panel.hidden = false;
    document.documentElement.classList.add('chat-open');
    if (window.matchMedia('(max-width: 639px)').matches) lockScroll();
    if (wasHidden || preset.intent || !log?.childElementCount) start(preset);
  };
  const close = () => {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    document.documentElement.classList.remove('chat-open');
    if (window.matchMedia('(max-width: 639px)').matches) unlockScroll();
  };

  document.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-chat-open]');
    if (!t) return;
    e.preventDefault();
    closeMenus();
    open({ intent: t.dataset.chatIntent, area: t.dataset.chatArea });
  });
  $('[data-chat-close]')?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  return { open, close };
})();

/* ------------------------------------------------------------------ map (lazy) */
function lazyMap() {
  const el = $('[data-map]');
  const homes = $('#homes-data');
  if (!el || !homes) return;
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      import('../v2/map').then((m) =>
        m.initMap(el, JSON.parse(homes.textContent || '[]'), {
          dot: '#0c1626',
          ring: '#ffffff',
          popupClass: 'home-pop-c',
          controls: false,
          view: { center: [-121.88, 37.36], zoom: window.innerWidth < 768 ? 8.9 : 9.4 },
        }),
      );
    },
    { rootMargin: '500px 0px' },
  );
  io.observe(el);
}

/* ------------------------------------------------------------------ boot */
intro();
reveals();
countUps();
chrome();
spotlight();
bizcard();
contactActions();
stories();
drawers();
soldGrid();
rotator();
booking();
lazyMap();

window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
