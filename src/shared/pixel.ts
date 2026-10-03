// Small inline SVG helpers for the atlas: hairline line-icons for buttons,
// the two-foci colophon mark (the easter egg), and a violet sparkle rain.
// Everything is drawn in strokes — no pixel art lives here anymore.

/** A 24×24 line icon drawn in currentColor. */
function lineIcon(paths: string): string {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

/** Shuffle / randomize. */
export const ICON_RANDOM = lineIcon(
  '<path d="M3 7h4l10 10h4"/><path d="M3 17h4l3-3"/><path d="M14 10l3-3h4"/><path d="M18 4v3h-3"/><path d="M18 20v-3h-3"/>',
);

/** Share: three nodes joined. */
export const ICON_SHARE = lineIcon(
  '<circle cx="6" cy="12" r="2.4"/><circle cx="17" cy="5.5" r="2.4"/><circle cx="17" cy="18.5" r="2.4"/><path d="M8.2 10.8l6.6-4M8.2 13.2l6.6 4"/>',
);

/** Export PNG: arrow down into a tray. */
export const ICON_PNG = lineIcon(
  '<path d="M12 4v10"/><path d="M8 10.5l4 4 4-4"/><path d="M5 19h14"/>',
);

/** Record: a filled dot. */
export const ICON_REC =
  '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.5" fill="#d0543f"/></svg>';

/** The two-foci colophon mark, inline (Rüya's logo, violet). */
export function colophonSvg(size = 44): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 256 256" fill="none" aria-hidden="true">
    <path d="M 128.000 130.000 C 88.000 78.000 24.000 98.000 34.000 155.000 C 43.000 210.000 100.000 209.000 128.000 130.000 C 149.000 79.000 192.000 62.000 209.000 95.000 C 232.000 138.000 156.000 166.000 128.000 130.000 Z" stroke="#8B5CF6" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="78" cy="152" r="13" fill="#8B5CF6"/>
    <circle cx="176" cy="111" r="13" fill="#8B5CF6"/>
  </svg>`;
}

/** A small four-pointed star, violet, for the sparkle rain. */
export const star = (color: string, size: number): string =>
  `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="${color}"/></svg>`;

/** Easter egg: rain a handful of violet stars down the screen, then clean up. */
export function rainSparkles(count = 28): void {
  const colors = ['#8b5cf6', '#a78bfa', '#6d28d9', '#c4b5fd'];
  const layer = document.createElement('div');
  layer.className = 'sparkle-layer';
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle-drop';
    s.innerHTML = star(colors[i % colors.length], 10 + ((i * 7) % 14));
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = Math.random() * 0.8 + 's';
    s.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
    layer.append(s);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 4000);
}

/** Listen for the Konami code and fire `cb` once it's entered. */
export function onKonami(cb: () => void): () => void {
  const seq = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];
  let i = 0;
  const handler = (e: KeyboardEvent) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    i = key === seq[i] ? i + 1 : key === seq[0] ? 1 : 0;
    if (i === seq.length) {
      i = 0;
      cb();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
