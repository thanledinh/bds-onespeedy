import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * C3 extras: the large picture on the left (desktop) follows the section being
 * read, swipeable rails get arrow buttons, and "See all" reveals the full list.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = window.matchMedia('(min-width: 1024px)');
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

// Muted inline video may still be refused (data saver, low power); the poster stays up then.
const play = (v: HTMLVideoElement | null | undefined) => v?.play().catch(() => {});

/* ------------------------------------------------------------------ the stage */
function stage() {
  const root = document.querySelector<HTMLElement>('[data-stage-root]');
  if (!root) return;
  const layers = $$('[data-layer]', root);
  const keys = layers.map((l) => l.dataset.layer!);
  const kicker = root.querySelector<HTMLElement>('[data-stage-kicker]');
  const line = root.querySelector<HTMLElement>('[data-stage-line]');
  const index = root.querySelector<HTMLElement>('[data-stage-index]');
  const caption = root.querySelector<HTMLElement>('[data-stage-caption]');
  const bars = $$('[data-stage-bar]', root);
  let current = '';

  const activate = (key: string) => {
    const i = keys.indexOf(key);
    if (key === current || i < 0) return;
    current = key;
    layers.forEach((layer, k) => {
      const on = k === i;
      layer.classList.toggle('is-on', on);
      const v = layer.querySelector('video');
      if (!v) return;
      if (on && desktop.matches && !reduce) play(v);
      else v.pause();
    });
    bars.forEach((b, k) => b.classList.toggle('is-on', k <= i));
    if (index) index.textContent = `${String(i + 1).padStart(2, '0')} / ${String(keys.length).padStart(2, '0')}`;
    // Swap the caption with a short fade so the change reads as deliberate.
    caption?.classList.add('is-swapping');
    window.setTimeout(
      () => {
        if (kicker) kicker.textContent = layers[i].dataset.kicker ?? '';
        if (line) line.textContent = layers[i].dataset.line ?? '';
        caption?.classList.remove('is-swapping');
      },
      reduce ? 0 : 220,
    );
  };

  // The section crossing the middle of the screen owns the stage.
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && activate((e.target as HTMLElement).dataset.stage!)),
    { rootMargin: '-45% 0px -50% 0px' },
  );
  $$('[data-stage]').forEach((s) => io.observe(s));
  activate(keys[0]);

  // Videos only run where they are visible: the stage on desktop, the inline film on phones.
  const inline = document.querySelector<HTMLVideoElement>('[data-inline-video]');
  const sync = () => {
    if (desktop.matches) {
      inline?.pause();
      const v = layers[keys.indexOf(current)]?.querySelector('video');
      if (!reduce) play(v);
    } else {
      layers.forEach((l) => l.querySelector('video')?.pause());
      if (!reduce) play(inline);
    }
  };
  sync();
  desktop.addEventListener('change', sync);
}

/* ------------------------------------------------------------------ rails */
function rails() {
  $$('[data-rail]').forEach((rail) => {
    const id = rail.dataset.rail;
    const step = () => (rail.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? rail.clientWidth * 0.8;
    document.querySelector(`[data-rail-prev="${id}"]`)?.addEventListener('click', () =>
      rail.scrollBy({ left: -(step() + 16), behavior: reduce ? 'auto' : 'smooth' }),
    );
    document.querySelector(`[data-rail-next="${id}"]`)?.addEventListener('click', () =>
      rail.scrollBy({ left: step() + 16, behavior: reduce ? 'auto' : 'smooth' }),
    );
  });
}

/* ------------------------------------------------------------------ "See all" toggles */
function toggles() {
  $$<HTMLButtonElement>('[data-toggle]').forEach((btn) => {
    const target = document.getElementById(btn.dataset.toggle!);
    if (!target) return;
    const closed = btn.textContent;
    btn.addEventListener('click', () => {
      const open = target.hidden;
      target.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Hide the list' : closed;
      ScrollTrigger.refresh();
    });
  });
}

stage();
rails();
toggles();
