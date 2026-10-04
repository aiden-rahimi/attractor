// The atlas index: a dark field of charted plates. Each visualization is a
// celestial body with a plate numeral, a dotted taxonomy name, a live canvas
// chart in a hairline frame, and the curator's one-line note.

import { VISUALIZATIONS } from './viz/registry';
import { PLATES } from './shared/atlas';
import { makeGradientCss } from './shared/palettes';
import { colophonSvg, rainSparkles } from './shared/pixel';

const REPO = 'https://github.com/aiden-rahimi/MathVisualize';
const FALLBACK_PALETTES = ['inferno', 'aurora', 'turbo', 'sunset', 'ice'];

export function renderGallery(container: HTMLElement): void {
  container.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <a class="wordmark" href="#/" aria-label="attractor — home">
      <img src="./logo-hero.svg" alt="" width="30" height="30" />
      <span>attractor</span>
    </a>`;
  container.append(header);

  const field = document.createElement('main');
  field.className = 'atlas-field';

  const intro = document.createElement('blockquote');
  intro.className = 'atlas-intro';
  intro.innerHTML =
    '“Clouds are not spheres, mountains are not cones, coastlines are not circles, ' +
    'and bark is not smooth, nor does lightning travel in a straight line.”' +
    '<cite>— Benoît Mandelbrot</cite>';
  field.append(intro);

  const spread = document.createElement('div');
  spread.className = 'spread';
  field.append(spread);

  // Render thumbnails one per frame instead of all at once — no load-time jank.
  const thumbJobs: Array<() => void> = [];

  VISUALIZATIONS.forEach((viz, i) => {
    const meta = PLATES[viz.id] ?? {
      numeral: String(i + 1),
      taxonomy: viz.id,
      note: viz.tagline,
    };

    const plate = document.createElement('a');
    plate.className = `plate plate-${i + 1} rise`;
    plate.style.animationDelay = `${0.07 * (i + 1)}s`;
    plate.href = `#/v/${viz.id}`;

    const head = document.createElement('div');
    head.className = 'plate-head';
    head.innerHTML = `
      <span class="plate-numeral">${meta.numeral}</span>
      <span class="plate-taxonomy">${meta.taxonomy}</span>`;

    const frame = document.createElement('div');
    frame.className = 'plate-frame';
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 320;
    frame.append(canvas);

    thumbJobs.push(() => {
      if (viz.thumbnail) {
        try {
          viz.thumbnail(canvas, 1234 + i);
        } catch {
          frame.style.background = makeGradientCss(
            FALLBACK_PALETTES[i % FALLBACK_PALETTES.length],
            '135deg',
          );
        }
      } else {
        frame.style.background = makeGradientCss(
          FALLBACK_PALETTES[i % FALLBACK_PALETTES.length],
          '135deg',
        );
      }
    });

    const cap = document.createElement('div');
    cap.className = 'plate-cap';
    cap.innerHTML = `<h2>${viz.title}</h2><p>${meta.note}</p>${
      meta.quoteBy ? `<span class="plate-quote-by">— ${meta.quoteBy}</span>` : ''
    }`;

    plate.append(head, frame, cap);
    spread.append(plate);
  });

  let job = 0;
  const runNext = () => {
    if (job >= thumbJobs.length) return;
    thumbJobs[job++]();
    requestAnimationFrame(runNext);
  };
  requestAnimationFrame(runNext);

  container.append(field);

  const footer = document.createElement('footer');
  footer.className = 'atlas-footer';

  const left = document.createElement('div');
  left.className = 'footer-left';
  const mark = document.createElement('button');
  mark.className = 'colophon';
  mark.type = 'button';
  mark.title = 'hello';
  mark.setAttribute('aria-label', 'colophon mark');
  mark.innerHTML = colophonSvg(40);
  let pats = 0;
  mark.addEventListener('click', () => {
    mark.classList.remove('hop');
    void mark.offsetWidth; // restart animation
    mark.classList.add('hop');
    if (++pats >= 5) {
      pats = 0;
      rainSparkles();
    }
  });
  const made = document.createElement('span');
  made.className = 'footer-made';
  made.textContent = 'made for the love of math.';
  left.append(mark, made);

  const right = document.createElement('div');
  right.className = 'footer-right';
  right.innerHTML = `
    <span class="logo-credit">logo by r&uuml;ya</span>
    <a href="${REPO}" target="_blank" rel="noopener">source</a>
    <a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">mit</a>`;

  footer.append(left, right);
  container.append(footer);
}
