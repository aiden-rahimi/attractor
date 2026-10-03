// Custom cursor: a precise dot, an eased follower ring, and a glowing comet
// trail. Fine-pointer devices only (skipped on touch and for reduced motion).
//
// Performance: the trail canvas renders at dpr 1 and the animation loop *parks
// itself* whenever the pointer is still and the trail has faded — so it costs
// nothing while you're just watching a visualization.

interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

const VIOLET: [number, number, number] = [139, 92, 246];
const VIOLET_DEEP: [number, number, number] = [76, 41, 149];

export function initCursor(): void {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('custom-cursor');

  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  const ctx = canvas.getContext('2d')!;
  const ring = div('cursor-ring');
  const dot = div('cursor-dot');
  document.body.append(canvas, ring, dot);

  // The trail is a soft glow — dpr 1 keeps the per-frame fill cheap.
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;
  let shown = false;
  let running = false;
  const pts: TrailPoint[] = [];

  const ensureRunning = () => {
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      pts.push({ x: mx, y: my, life: 1 });
      if (pts.length > 90) pts.shift();
      if (!shown) {
        shown = true;
        document.body.classList.add('cursor-on');
      }
      ensureRunning();
    },
    { passive: true },
  );

  window.addEventListener('pointerdown', () => ring.classList.add('down'));
  window.addEventListener('pointerup', () => ring.classList.remove('down'));
  window.addEventListener(
    'pointerover',
    (e) => {
      const t = e.target as HTMLElement | null;
      const interactive = !!t?.closest?.('a, button, input, select, textarea, label, .swatch, .card');
      ring.classList.toggle('hover', interactive);
    },
    { passive: true },
  );
  document.addEventListener('mouseleave', () => {
    document.body.classList.remove('cursor-on');
    shown = false;
  });
  document.addEventListener('mouseenter', () => {
    document.body.classList.add('cursor-on');
    shown = true;
    ensureRunning();
  });

  function frame() {
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const p of pts) p.life -= 0.05;
    while (pts.length && pts[0].life <= 0) pts.shift();
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const a = Math.max(0, p1.life);
      const t = 1 - a;
      const r = Math.round(VIOLET[0] + (VIOLET_DEEP[0] - VIOLET[0]) * t);
      const g = Math.round(VIOLET[1] + (VIOLET_DEEP[1] - VIOLET[1]) * t);
      const b = Math.round(VIOLET[2] + (VIOLET_DEEP[2] - VIOLET[2]) * t);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.35})`;
      ctx.lineWidth = 1 + a * 7;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    // Park the loop once everything has settled — zero cost while idle.
    const settled = Math.abs(mx - rx) < 0.1 && Math.abs(my - ry) < 0.1;
    if (pts.length === 0 && settled) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }

  ensureRunning();
}

function div(cls: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = cls;
  return d;
}
