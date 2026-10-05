/** Unsplash image URL (imgix params). Demo stock only; real photos replace these. */
export function unsplash(id: string, w = 1600, ratio?: number) {
  const h = ratio ? `&h=${Math.round(w * ratio)}` : '';
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}${h}&q=72`;
}

export function srcset(id: string, ratio?: number, widths = [480, 768, 1100, 1600, 2200]) {
  return widths.map((w) => `${unsplash(id, w, ratio)} ${w}w`).join(', ');
}

export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const compactMoney = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1)}M` : `$${Math.round(n / 1e3)}K`;

export const monthYear = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

export const longDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
