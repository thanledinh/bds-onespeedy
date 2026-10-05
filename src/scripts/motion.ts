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
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel as any);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel as any)];
const show = (els: Element | Element[]) => gsap.set(els, { visibility: 'visible' });

/* ------------------------------------------------------------------ smooth scroll */
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.__lenis = lenis;

/* ------------------------------------------------------------------ text splitting */
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Wraps every word in `.mask > span`, keeping inline elements such as <em>. */
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
        if (node.tagName === 'BR') parts.push('<br>');
        else parts.push(`<span class="mask" aria-hidden="true"><span>${node.outerHTML}</span></span>`);
      }
    });
    el.innerHTML = parts.join('');
    el.dataset.splitDone = '1';
  }
  return $$('.mask > span', el);
}

/** Plain word spans (no mask) for the scroll-scrubbed reading effect. */
function wordSpans(el: HTMLElement): HTMLElement[] {
  if (!el.dataset.splitDone) {
    el.innerHTML = el
      .textContent!.trim()
      .split(/\s+/)
      .map((w) => `<span class="inline-block">${esc(w)}</span>`)
      .join(' ');
    el.dataset.splitDone = '1';
  }
  return $$(':scope > span', el);
}

/* ------------------------------------------------------------------ hero */
function hero() {
  const hero = $('[data-hero]');
  if (!hero) return;
  const media = $('[data-hero-media]', hero)!;
  const video = $('[data-hero-video]', hero)!;
  const words = $$('[data-hero-word]', hero);
  const letters = $$('[data-hero-letter]', hero);
  const caption = $$('[data-hero-caption]', hero);
  const shade = $('[data-hero-shade]', hero)!;
  const final = $('[data-hero-final]', hero)!;
  show([...words, ...caption]);

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (ctx) => {
    const { desktop } = ctx.conditions as { desktop: boolean };
    const startClip = desktop ? 'inset(15% 23% 15% 23% round 28px)' : 'inset(25% 5% 25% 5% round 18px)';
    const endClip = 'inset(0% 0% 0% 0% round 0px)';

    if (reduce) {
      gsap.set(media, { clipPath: endClip });
      gsap.set(shade, { opacity: 0.55 });
      gsap.set(words, { autoAlpha: 0.0 });
      gsap.set(final, { autoAlpha: 1 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.7 },
    });
    tl.fromTo(media, { clipPath: startClip }, { clipPath: endClip, ease: 'none', duration: 0.6 }, 0)
      .fromTo(video, { scale: 1.2 }, { scale: 1, ease: 'none', duration: 0.6 }, 0)
      .fromTo(shade, { opacity: 0.12 }, { opacity: 0.55, ease: 'none', duration: 0.6 }, 0)
      .to(words[0], { xPercent: -28, yPercent: -55, autoAlpha: 0, ease: 'power1.in', duration: 0.5 }, 0)
      .to(words[1], { xPercent: 28, yPercent: 55, autoAlpha: 0, ease: 'power1.in', duration: 0.5 }, 0)
      .to(caption, { autoAlpha: 0, duration: 0.15 }, 0)
      .fromTo(final, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.58)
      .to({}, { duration: 0.17 });

    // Intro: frame opens from a point, letters rise. Only when the page starts at the top.
    if (window.scrollY < 20) {
      lenis?.stop();
      gsap.set(media, { clipPath: 'inset(50% 50% 50% 50% round 28px)' });
      gsap
        .timeline({ delay: 0.75, onComplete: () => lenis?.start() })
        .to(media, { clipPath: startClip, duration: 1.7, ease: 'expo.inOut' })
        .from(letters, { yPercent: 120, duration: 1.3, ease: 'expo.out', stagger: 0.045 }, '-=1.0')
        .from(caption, { autoAlpha: 0, y: 14, duration: 0.9, ease: 'power2.out', stagger: 0.1 }, '-=0.9');
    }
  });
}

/* ------------------------------------------------------------------ reveals */
function reveals() {
  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    show(el);
    if (reduce) return;
    gsap.from(words, {
      yPercent: 115,
      duration: 1.15,
      ease: 'expo.out',
      stagger: 0.035,
      delay: Number(el.dataset.delay ?? 0),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  $$('[data-reveal]').forEach((el) => {
    show(el);
    if (reduce) return;
    gsap.from(el, {
      y: 48,
      autoAlpha: 0,
      duration: 1.3,
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
      y: 60,
      autoAlpha: 0,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: { trigger: group, start: 'top 88%', once: true },
    });
  });

  $$('[data-words-scrub]').forEach((el) => {
    const words = wordSpans(el);
    show(el);
    if (reduce) return;
    gsap.fromTo(
      words,
      { opacity: 0.13 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true },
      },
    );
  });

  if (reduce) return;
  $$('[data-parallax]').forEach((el) => {
    const amt = Number(el.dataset.parallax || 10);
    gsap.fromTo(
      el,
      { yPercent: -amt },
      {
        yPercent: amt,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement!, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  // Frosted panel rides up over its image.
  $$('[data-rise]').forEach((el) => {
    gsap.fromTo(
      el,
      { y: 160 },
      { y: 0, ease: 'none', scrollTrigger: { trigger: el.parentElement!, start: 'top 85%', end: 'center 45%', scrub: true } },
    );
  });
}

/* ------------------------------------------------------------------ odometer numbers */
function odometers() {
  $$('[data-count]').forEach((el) => {
    const final = el.dataset.count!;
    el.setAttribute('aria-label', final);
    if (reduce) {
      el.textContent = final;
      return;
    }
    // Each column is as wide as its final digit (in em, so it scales with the font),
    // which keeps proportional spacing instead of a gap after narrow digits like "1".
    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    el.append(probe);
    const widthEm = (ch: string) => {
      probe.textContent = ch;
      return probe.getBoundingClientRect().width / fontSize;
    };
    const widths = [...final].map((ch) => (/\d/.test(ch) ? widthEm(ch) : 0));

    el.innerHTML = '';
    const cols: HTMLElement[] = [];
    const LOOPS = 2;
    for (const [i, ch] of [...final].entries()) {
      if (/\d/.test(ch)) {
        const col = document.createElement('span');
        col.className = 'odo-col';
        col.style.width = `${widths[i]}em`;
        col.setAttribute('aria-hidden', 'true');
        const inner = document.createElement('span');
        inner.className = 'odo-inner';
        for (let l = 0; l < LOOPS; l++) for (let d = 0; d < 10; d++) inner.insertAdjacentHTML('beforeend', `<span>${d}</span>`);
        inner.insertAdjacentHTML('beforeend', `<span>${ch}</span>`);
        col.append(inner);
        el.append(col);
        cols.push(inner);
      } else {
        el.insertAdjacentHTML('beforeend', `<span aria-hidden="true">${esc(ch)}</span>`);
      }
    }
    const steps = LOOPS * 10;
    const pct = (steps / (steps + 1)) * 100;
    gsap.set(cols, { yPercent: 0 });
    const tl = gsap.timeline({ paused: true });
    cols.forEach((inner, i) => {
      tl.to(inner, { yPercent: -pct, duration: 2.2 + (cols.length - i) * 0.18, ease: 'expo.inOut' }, i * 0.05);
    });
    tl.fromTo(el, { filter: 'blur(6px)' }, { filter: 'blur(0px)', duration: 1.6, ease: 'power2.out' }, 0.6);
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => tl.play() });
  });
}

/* ------------------------------------------------------------------ horizontal rail */
function rails() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    $$('[data-hrail]').forEach((sec) => {
      const track = $('[data-hrail-track]', sec)!;
      const bar = $('[data-hrail-bar]', sec);
      const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      tl.to(track, { x: () => -dist(), ease: 'none' }, 0);
      if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0);
    });
  });
}

/* ------------------------------------------------------------------ timeline (about) */
function careerTimeline() {
  const wrap = $('[data-timeline]');
  if (!wrap) return;
  const yearEl = $('[data-timeline-year]', wrap);
  const fill = $('[data-timeline-fill]', wrap);
  const items = $$('[data-timeline-item]', wrap);
  if (fill && !reduce) {
    gsap.fromTo(
      fill,
      { scaleY: 0 },
      { scaleY: 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 60%', end: 'bottom 60%', scrub: true } },
    );
  }
  if (!yearEl) return;
  const setYear = (y: string) => {
    if (yearEl.textContent === y) return;
    if (reduce) {
      yearEl.textContent = y;
      return;
    }
    gsap
      .timeline()
      .to(yearEl, { yPercent: -30, autoAlpha: 0, duration: 0.25, ease: 'power2.in' })
      .add(() => {
        yearEl.textContent = y;
      })
      .fromTo(yearEl, { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out' });
  };
  items.forEach((item, i) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 60%',
      end: 'bottom 60%',
      onToggle: (self) => {
        item.classList.toggle('is-active', self.isActive);
        if (self.isActive) setYear(item.dataset.year!);
      },
      onLeaveBack: () => {
        if (i === 0) setYear(item.dataset.year!);
      },
    });
  });
}

/* ------------------------------------------------------------------ footer curtain */
function footer() {
  const wrap = $('[data-footer-wrap]');
  const foot = $('[data-footer]', wrap ?? document);
  if (!wrap || !foot) return;
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

  const letters = $$('.wm-letter', foot);
  if (reduce || !letters.length) return;
  gsap.fromTo(
    letters,
    { yPercent: 105 },
    {
      yPercent: 0,
      ease: 'none',
      stagger: 0.06,
      scrollTrigger: { trigger: wrap, start: 'top 85%', end: 'bottom bottom', scrub: 0.6 },
    },
  );
}

/* ------------------------------------------------------------------ nav + page curtain */
function chrome() {
  const nav = $('[data-nav]');
  if (nav) {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        nav.classList.toggle('nav-hidden', self.direction === 1 && y > 240 && !document.documentElement.classList.contains('menu-open'));
      },
    });
  }

  const curtain = $('[data-curtain]');
  if (!curtain) return;
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return; // same page (anchors, reload)
    e.preventDefault();
    if (reduce) {
      location.href = url.href;
      return;
    }
    curtain.style.animation = 'none';
    gsap.fromTo(
      curtain,
      { yPercent: 100 },
      { yPercent: 0, duration: 0.7, ease: 'expo.inOut', onComplete: () => (location.href = url.href) },
    );
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) gsap.set(curtain, { yPercent: -100 });
  });
}

/* ------------------------------------------------------------------ boot */
hero();
reveals();
// Digit widths are measured, so wait for the web fonts first.
(document.fonts?.ready ?? Promise.resolve()).then(odometers);
rails();
careerTimeline();
footer();
chrome();

window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
