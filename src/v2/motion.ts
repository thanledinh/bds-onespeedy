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
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const show = (els: Element | Element[]) => gsap.set(els, { visibility: 'visible' });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const store = {
  get: (k: string) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {}
  },
};

/* ------------------------------------------------------------------ smooth scroll */
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.085, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.__lenis = lenis;

/* ------------------------------------------------------------------ loader & transitions */
function loader(onReveal: () => void) {
  const el = $('[data-loader]');
  if (!el) return onReveal();
  if (reduce) {
    el.style.display = 'none';
    return onReveal();
  }
  const count = $('[data-loader-count]', el)!;
  const bar = $('[data-loader-bar]', el)!;
  const full = document.body.dataset.page === 'home' && !store.get('v2-intro');
  lenis?.stop();
  const done = () => {
    el.style.display = 'none';
    lenis?.start();
  };

  if (full) {
    store.set('v2-intro', '1');
    const n = { v: 0 };
    gsap
      .timeline({ onComplete: done })
      .to(n, {
        v: 100,
        duration: 2.2,
        ease: 'power2.inOut',
        onUpdate: () => (count.textContent = String(Math.round(n.v)).padStart(3, '0')),
      })
      .to(bar, { scaleX: 1, duration: 2.2, ease: 'power2.inOut' }, 0)
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'expo.inOut' }, '+=0.2')
      .add(onReveal, '-=0.85');
  } else {
    gsap.set(el.children, { autoAlpha: 0 });
    gsap
      .timeline({ onComplete: done, delay: 0.05 })
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' })
      .add(onReveal, '-=0.7');
  }

  // Leaving: the panel comes back up from the bottom, then we navigate.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;
    e.preventDefault();
    el.style.display = 'flex';
    gsap.set(el.children, { autoAlpha: 0 });
    gsap.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'expo.inOut', onComplete: () => (location.href = url.href) },
    );
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) el.style.display = 'none';
  });
}

/* ------------------------------------------------------------------ text */
function splitWords(el: HTMLElement): HTMLElement[] {
  if (!el.dataset.splitDone) {
    el.setAttribute('aria-label', el.textContent!.replace(/\s+/g, ' ').trim());
    const parts: string[] = [];
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent!.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          parts.push(/^\s+$/.test(w) ? ' ' : `<span class="mask" aria-hidden="true"><span>${esc(w)}</span></span>`);
        });
      } else if (node instanceof HTMLElement) {
        parts.push(node.tagName === 'BR' ? '<br>' : `<span class="mask" aria-hidden="true"><span>${node.outerHTML}</span></span>`);
      }
    });
    el.innerHTML = parts.join('');
    el.dataset.splitDone = '1';
  }
  return $$('.mask > span', el);
}

/* ------------------------------------------------------------------ hero */
function heroIntro() {
  const hero = $('[data-hero]');
  if (!hero) return () => {};
  const img = $('[data-hero-img]', hero);
  const lines = $$('[data-hero-line]', hero);
  const fades = $$('[data-hero-fade]', hero);
  show([...lines.map((l) => l.closest('[data-pre-hide]') ?? l), ...fades]);

  if (!reduce) {
    gsap.set(lines, { yPercent: 110 });
    gsap.set(fades, { autoAlpha: 0, y: 16 });
    if (img) gsap.set(img, { scale: 1.28 });
    // Scroll: image drifts, headline lifts away.
    if (img) {
      gsap.to(img, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
    const copy = $('[data-hero-copy]', hero);
    if (copy) {
      gsap.to(copy, { yPercent: -18, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  return () => {
    if (reduce) return;
    const tl = gsap.timeline();
    if (img) tl.to(img, { scale: 1, duration: 2.4, ease: 'expo.out' }, 0);
    tl.to(lines, { yPercent: 0, duration: 1.5, ease: 'expo.out', stagger: 0.09 }, 0.1).to(
      fades,
      { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 },
      0.6,
    );
  };
}

/* ------------------------------------------------------------------ reveals */
function reveals() {
  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    show(el);
    if (reduce) return;
    gsap.from(words, {
      yPercent: 115,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.04,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  $$('[data-lines]').forEach((el) => {
    const inner = $$('.line > *', el);
    show(el);
    if (reduce) return;
    gsap.from(inner, {
      yPercent: 110,
      duration: 1.4,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  $$('[data-reveal]').forEach((el) => {
    show(el);
    if (reduce) return;
    gsap.from(el, {
      y: 40,
      autoAlpha: 0,
      duration: 1.4,
      ease: 'expo.out',
      delay: Number(el.dataset.delay ?? 0),
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });

  $$('[data-reveal-group]').forEach((group) => {
    const items = [...group.children] as HTMLElement[];
    show(items);
    if (reduce) return;
    gsap.from(items, {
      y: 50,
      autoAlpha: 0,
      duration: 1.4,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: group, start: 'top 88%', once: true },
    });
  });

  $$('[data-rule]').forEach((el) => {
    if (reduce) return;
    gsap.from(el, { scaleX: 0, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 95%', once: true } });
  });

  $$('[data-img-reveal]').forEach((box) => {
    const img = $('img', box);
    if (reduce) return;
    const tl = gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 85%', once: true } });
    tl.fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' });
    if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0.15);
  });

  if (reduce) return;
  $$('[data-parallax]').forEach((el) => {
    const amt = Number(el.dataset.parallax || 10);
    gsap.fromTo(
      el,
      { yPercent: -amt },
      { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement!, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}

/* ------------------------------------------------------------------ counting numbers */
function countUps() {
  $$('[data-count-up]').forEach((el) => {
    const final = el.dataset.countUp!;
    const m = final.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!m || reduce) {
      el.textContent = final;
      return;
    }
    const [, pre, num, post] = m;
    const target = parseFloat(num.replace(/,/g, ''));
    const decimals = (num.split('.')[1] ?? '').length;
    const n = { v: 0 };
    el.textContent = `${pre}${(0).toFixed(decimals)}${post}`;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () =>
        gsap.to(n, {
          v: target,
          duration: 2.4,
          ease: 'expo.out',
          onUpdate: () => (el.textContent = `${pre}${n.v.toFixed(decimals)}${post}`),
        }),
    });
  });
}

/* ------------------------------------------------------------------ knockout zoom ("HOME" with film inside) */
function knockout() {
  const sec = $('[data-knockout]');
  if (!sec) return;
  const layer = $('[data-knockout-layer]', sec)!;
  const origin = $('[data-knockout-origin]', sec)!;
  const tint = $('[data-knockout-tint]', sec);
  const after = $$('[data-knockout-after]', sec);
  const hint = $('[data-knockout-hint]', sec);

  if (reduce) {
    sec.setAttribute('data-dark', '');
    gsap.set([layer, tint], { autoAlpha: 0 });
    gsap.set(after, { autoAlpha: 1 });
    return;
  }

  const setOrigin = () => {
    gsap.set(layer, { scale: 1 });
    const lr = layer.getBoundingClientRect();
    const r = origin.getBoundingClientRect();
    // Centre of the H's left stem, so the zoom ends inside solid "ink" (= the film).
    layer.style.transformOrigin = `${r.left + r.width * 0.16 - lr.left}px ${r.top + r.height * 0.52 - lr.top}px`;
  };
  setOrigin();

  gsap.set(after, { autoAlpha: 0, y: 30 });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: sec,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onRefreshInit: setOrigin,
      // The nav switches to light-on-dark once the film has taken over.
      onUpdate: (self) => sec.toggleAttribute('data-dark', self.progress > 0.42),
    },
  });
  tl.to(hint ?? {}, { autoAlpha: 0, duration: 0.05 }, 0)
    .to(layer, { scale: 48, ease: 'power3.in', duration: 0.55 }, 0)
    .set([layer, tint], { autoAlpha: 0 }, 0.55)
    .to(after, { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.2, ease: 'power2.out' }, 0.6)
    .to({}, { duration: 0.2 });
}

/* ------------------------------------------------------------------ index list with cursor-follow preview */
function indexPreview() {
  const preview = $('[data-index-preview]');
  if (!preview || !finePointer || reduce) return;
  const img = $<HTMLImageElement>('img', preview)!;
  const xTo = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' });
  const yTo = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' });
  gsap.set(preview, { autoAlpha: 0, scale: 0.85 });

  $$('[data-index]').forEach((list) => {
    list.addEventListener('pointermove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });
    list.addEventListener('pointerleave', () => gsap.to(preview, { autoAlpha: 0, scale: 0.85, duration: 0.4 }));
    $$('[data-index-row]', list).forEach((row) => {
      row.addEventListener('pointerenter', (e) => {
        if (img.src !== row.dataset.img) img.src = row.dataset.img!;
        xTo(e.clientX);
        yTo(e.clientY);
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'expo.out' });
      });
    });
  });
}

/* ------------------------------------------------------------------ sticky process (image swaps per step) */
function process() {
  const wrap = $('[data-process]');
  if (!wrap) return;
  const imgs = $$('[data-process-img]', wrap);
  const tabs = $$('[data-process-tab]', wrap);
  const lists = $$('[data-process-list]', wrap);

  const showImg = (key: string) =>
    imgs.forEach((im) => im.classList.toggle('is-on', im.dataset.processImg === key));

  $$('[data-process-step]', wrap).forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 62%',
      end: 'bottom 62%',
      onToggle: (self) => {
        step.classList.toggle('is-active', self.isActive);
        if (self.isActive) showImg(step.dataset.processStep!);
      },
    });
  });

  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      const key = tab.dataset.processTab!;
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      lists.forEach((l) => (l.hidden = l.dataset.processList !== key));
      showImg(`${key}-1`);
      ScrollTrigger.refresh();
    }),
  );
}

/* ------------------------------------------------------------------ drag-to-scroll rails */
function dragRails() {
  $$('[data-drag]').forEach((rail) => {
    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = rail.scrollLeft;
      rail.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      rail.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      down = false;
      rail.classList.remove('is-dragging');
    });
    rail.addEventListener('click', (e) => moved && e.preventDefault(), true);
  });
}

/* ------------------------------------------------------------------ magnetic buttons */
function magnetic() {
  if (!finePointer || reduce) return;
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* ------------------------------------------------------------------ cursor */
function cursor() {
  const c = $('[data-cursor]');
  if (!c || !finePointer || reduce) return;
  c.classList.remove('hidden');
  const label = $('[data-cursor-label]', c)!;
  const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    const labelled = t.closest<HTMLElement>('[data-cursor-text]');
    const text = labelled?.dataset.cursorText;
    c.classList.toggle('is-label', !!text);
    label.textContent = text ?? '';
    c.classList.toggle('is-link', !text && !!t.closest('a, button, input, select, textarea, label'));
    c.classList.toggle('on-dark', !!t.closest('[data-dark]'));
  });
  document.addEventListener('pointerleave', () => gsap.to(c, { autoAlpha: 0, duration: 0.2 }));
  document.addEventListener('pointerenter', () => gsap.to(c, { autoAlpha: 1, duration: 0.2 }));
}

/* ------------------------------------------------------------------ nav tone, hide on scroll */
function nav() {
  const navEl = $('[data-nav]');
  if (!navEl) return;
  const darks = () => $$('[data-dark]');
  let lastY = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    const probe = 34;
    const dark = darks().some((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe && getComputedStyle(s).visibility !== 'hidden';
    });
    navEl.dataset.tone = dark ? 'dark' : 'light';
    navEl.classList.toggle('is-scrolled', navEl.hasAttribute('data-nav-solid') || y > 30);
    const menuOpen = document.documentElement.classList.contains('menu-open');
    navEl.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 300);
    lastY = y;
  };
  update();
  if (lenis) lenis.on('scroll', update);
  else window.addEventListener('scroll', update, { passive: true });
}

/* ------------------------------------------------------------------ footer */
function footer() {
  const wrap = $('[data-footer-wrap]');
  const foot = $('[data-footer]');
  if (!wrap || !foot) return;
  wrap.setAttribute('data-dark', '');
  const layout = () => {
    const h = foot.offsetHeight;
    const fits = !reduce && h <= window.innerHeight;
    wrap.classList.toggle('is-curtain', fits);
    wrap.style.height = fits ? `${h}px` : '';
  };
  layout();
  new ResizeObserver(() => {
    layout();
    ScrollTrigger.refresh();
  }).observe(foot);

  const clock = $('[data-clock]', foot);
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' });
    const tick = () => (clock.textContent = fmt.format(new Date()));
    tick();
    setInterval(tick, 15000);
  }

  const letters = $$('.wm-letter', foot);
  if (reduce || !letters.length) return;
  gsap.fromTo(
    letters,
    { yPercent: 100 },
    { yPercent: 0, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: wrap, start: 'top 85%', end: 'bottom bottom', scrub: 0.6 } },
  );
}

/* ------------------------------------------------------------------ map (lazy) */
function lazyMap() {
  const el = $('[data-map]');
  const data = $('#homes-data');
  if (!el || !data) return;
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      import('./map').then((m) => {
        (el as any).__map = m.initMap(el, JSON.parse(data.textContent || '[]'));
        el.dispatchEvent(new CustomEvent('map:ready'));
      });
    },
    { rootMargin: '600px 0px' },
  );
  io.observe(el);
}

/* ------------------------------------------------------------------ horizontal pinned rail (about timeline) */
function rails() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    $$('[data-hrail]').forEach((sec) => {
      const track = $('[data-hrail-track]', sec)!;
      const bar = $('[data-hrail-bar]', sec);
      const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      tl.to(track, { x: () => -dist(), ease: 'none' }, 0);
      if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0);
    });
  });
}

/* ------------------------------------------------------------------ boot */
const revealHero = heroIntro();
reveals();
countUps();
knockout();
indexPreview();
process();
dragRails();
rails();
magnetic();
cursor();
nav();
footer();
lazyMap();
loader(revealHero);

window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
