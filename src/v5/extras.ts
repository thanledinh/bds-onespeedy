import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Small additions for the calmer profile pages (C2, C3) on top of Option C's script:
 * real tabs that swap content (C2) and paged grids with an optional city filter.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/* ------------------------------------------------------------------ tabs (C2) */
function tabs() {
  const list = document.querySelector<HTMLElement>('[data-ptabs]');
  if (!list) return;
  const tabEls = $$<HTMLButtonElement>('[data-ptab]', list);
  const panels = new Map(tabEls.map((t) => [t.dataset.ptab!, document.getElementById(`panel-${t.dataset.ptab}`)]));

  const select = (id: string, opts: { focus?: boolean; scroll?: boolean } = {}) => {
    const panel = panels.get(id);
    if (!panel) return;
    tabEls.forEach((t) => {
      const on = t.dataset.ptab === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) {
        if (opts.focus) t.focus();
        t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
    panels.forEach((p, key) => p && (p.hidden = key !== id));
    history.replaceState(null, '', id === 'overview' ? location.pathname : `#${id}`);

    // Bring the top of the new content into view if the reader had scrolled past it.
    if (opts.scroll) {
      const top = list.getBoundingClientRect().top + window.scrollY - 64;
      if (window.scrollY > top) {
        if (window.__lenis) window.__lenis.scrollTo(top, { immediate: true });
        else window.scrollTo(0, top);
      }
    }
    if (!reduce) gsap.fromTo(panel, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    ScrollTrigger.refresh();
  };

  tabEls.forEach((t) => t.addEventListener('click', () => select(t.dataset.ptab!, { scroll: true })));
  list.addEventListener('keydown', (e) => {
    const i = tabEls.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabEls.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(tabEls[(next + tabEls.length) % tabEls.length].dataset.ptab!, { focus: true });
  });
  // Buttons elsewhere on the page ("See all 128") jump to a tab.
  document.addEventListener('click', (e) => {
    const go = (e.target as HTMLElement).closest<HTMLElement>('[data-goto-tab]');
    if (!go) return;
    e.preventDefault();
    select(go.dataset.gotoTab!, { scroll: true });
  });

  const initial = location.hash.slice(1);
  if (panels.has(initial)) select(initial);
}

/* ------------------------------------------------------------------ paged grids */
function grids() {
  $$('[data-grid]').forEach((root) => {
    const items = $$('[data-grid-item]', root);
    const first = Number(root.dataset.grid) || 12;
    const step = Number(root.dataset.gridStep) || first;
    const more = root.querySelector<HTMLButtonElement>('[data-grid-more]');
    const count = root.querySelector<HTMLElement>('[data-grid-count]');
    const filter = root.querySelector<HTMLSelectElement>('[data-grid-filter]');
    let limit = first;
    let city = '';

    const render = (animateFrom = Infinity) => {
      const matches = items.filter((el) => !city || el.dataset.city === city);
      items.forEach((el) => (el.hidden = true));
      matches.slice(0, limit).forEach((el, i) => {
        el.hidden = false;
        if (i >= animateFrom && !reduce) {
          gsap.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', delay: (i - animateFrom) * 0.03 });
        }
      });
      const shown = Math.min(limit, matches.length);
      if (count) count.textContent = `${shown} of ${matches.length}`;
      if (more) more.hidden = shown >= matches.length;
      ScrollTrigger.refresh();
    };

    filter?.addEventListener('change', () => {
      city = filter.value;
      limit = first;
      render(0);
    });
    more?.addEventListener('click', () => {
      const from = limit;
      limit += step;
      render(from);
    });
    render();
  });
}

tabs();
grids();
