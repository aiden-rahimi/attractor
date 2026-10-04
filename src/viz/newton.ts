// Newton fractal basins of attraction. Every pixel is a starting point for
// Newton's method on a polynomial p(z); we color it by which root it falls into
// and shade it by how many steps that took. The polynomial is user-editable and
// the whole thing runs in a fragment shader, so zooming stays smooth.

import type { ParamValues, VizDef, VizHost, VizInstance } from '../shared/types';
import { getGL, program, fullscreenTriangle, VERT_FULLSCREEN } from '../shared/gl';
import { paletteTexture, sample } from '../shared/palettes';

const MAXDEG = 8;
const MAXR = 8;

const FRAG = `#version 300 es
precision highp float;
const int MAXDEG = ${MAXDEG};
const int MAXR = ${MAXR};
const int MAXITER = 256;
uniform float uCoeffs[MAXDEG + 1];
uniform vec2 uRoots[MAXR];
uniform int uDeg;
uniform int uRootCount;
uniform int uMaxIter;
uniform vec2 uCenter;
uniform float uScale;
uniform float uAspect;
uniform sampler2D uPalette;
in vec2 vUv;
out vec4 frag;

vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 cdiv(vec2 a, vec2 b) {
  float d = b.x * b.x + b.y * b.y + 1e-30;
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d;
}

void evalP(vec2 z, out vec2 p, out vec2 dp) {
  p = vec2(0.0);
  dp = vec2(0.0);
  for (int k = MAXDEG; k >= 0; k--) {
    if (k > uDeg) continue;
    dp = cmul(dp, z) + p;
    p = cmul(p, z) + vec2(uCoeffs[k], 0.0);
  }
}

void main() {
  vec2 z = uCenter + (vUv * 2.0 - 1.0) * vec2(uAspect, 1.0) * uScale;
  int used = uMaxIter;
  for (int i = 0; i < MAXITER; i++) {
    if (i >= uMaxIter) break;
    vec2 p, dp;
    evalP(z, p, dp);
    if (dot(dp, dp) < 1e-18) { used = i; break; }
    z -= cdiv(p, dp);
    if (dot(p, p) < 1e-10) { used = i; break; }
  }
  int best = 0;
  float bd = 1e20;
  for (int r = 0; r < MAXR; r++) {
    if (r >= uRootCount) break;
    vec2 d = z - uRoots[r];
    float dist = dot(d, d);
    if (dist < bd) { bd = dist; best = r; }
  }
  float hue = (float(best) + 0.5) / float(max(uRootCount, 1));
  float shade = 1.0 - float(used) / float(uMaxIter);
  shade = pow(clamp(shade, 0.0, 1.0), 0.6);
  vec3 col = texture(uPalette, vec2(hue, 0.5)).rgb;
  col *= 0.18 + 0.82 * shade;
  frag = vec4(col, 1.0);
}`;

interface Complex {
  re: number;
  im: number;
}

/** Parse a real polynomial in z, e.g. "z^3 - 1", into a coefficient array. */
function parsePoly(input: string): number[] | null {
  let s = input.toLowerCase().replace(/\s+/g, '').replace(/−/g, '-').replace(/\*\*/g, '^');
  if (!s) return null;
  if (s[0] !== '+' && s[0] !== '-') s = '+' + s;
  const terms = s.match(/[+-][^+-]+/g);
  if (!terms) return null;
  const coeffs: number[] = new Array(MAXDEG + 1).fill(0);
  for (const term of terms) {
    const sign = term[0] === '-' ? -1 : 1;
    const body = term.slice(1);
    const m = body.match(/^(\d*\.?\d*)\*?(z(?:\^(\d+))?)?$/);
    if (!m) return null;
    const hasZ = !!m[2];
    const coefStr = m[1];
    let coef: number;
    if (coefStr === '' || coefStr === '.') {
      if (!hasZ) return null;
      coef = 1;
    } else {
      coef = parseFloat(coefStr);
      if (!Number.isFinite(coef)) return null;
    }
    let power = 0;
    if (hasZ) power = m[3] !== undefined ? parseInt(m[3], 10) : 1;
    if (power > MAXDEG) return null;
    coeffs[power] += sign * coef;
  }
  let deg = MAXDEG;
  while (deg > 0 && Math.abs(coeffs[deg]) < 1e-12) deg--;
  if (deg < 1) return null;
  return coeffs.slice(0, deg + 1);
}

// Durand-Kerner: find all complex roots of a (real-coefficient) polynomial.
function findRoots(coeffs: number[]): Complex[] {
  const deg = coeffs.length - 1;
  const lead = coeffs[deg];
  const c = coeffs.map((v) => v / lead); // monic
  const evalAt = (z: Complex): Complex => {
    let re = c[deg];
    let im = 0;
    for (let k = deg - 1; k >= 0; k--) {
      const nre = re * z.re - im * z.im + c[k];
      const nim = re * z.im + im * z.re;
      re = nre;
      im = nim;
    }
    return { re, im };
  };
  const roots: Complex[] = [];
  const seed = { re: 0.4, im: 0.9 };
  let cur: Complex = { re: 1, im: 0 };
  for (let k = 0; k < deg; k++) {
    roots.push({ ...cur });
    const nre = cur.re * seed.re - cur.im * seed.im;
    const nim = cur.re * seed.im + cur.im * seed.re;
    cur = { re: nre, im: nim };
  }
  for (let iter = 0; iter < 80; iter++) {
    let maxDelta = 0;
    for (let i = 0; i < deg; i++) {
      const pv = evalAt(roots[i]);
      let denRe = 1;
      let denIm = 0;
      for (let j = 0; j < deg; j++) {
        if (j === i) continue;
        const dre = roots[i].re - roots[j].re;
        const dim = roots[i].im - roots[j].im;
        const nre = denRe * dre - denIm * dim;
        const nim = denRe * dim + denIm * dre;
        denRe = nre;
        denIm = nim;
      }
      const d = denRe * denRe + denIm * denIm + 1e-30;
      const qRe = (pv.re * denRe + pv.im * denIm) / d;
      const qIm = (pv.im * denRe - pv.re * denIm) / d;
      roots[i].re -= qRe;
      roots[i].im -= qIm;
      maxDelta = Math.max(maxDelta, Math.abs(qRe) + Math.abs(qIm));
    }
    if (maxDelta < 1e-12) break;
  }
  return roots;
}

const PRESET_POLYS = [
  'z^3 - 1',
  'z^4 - 1',
  'z^5 - 1',
  'z^6 - 1',
  'z^7 - 1',
  'z^3 - 2z + 2',
  'z^4 + z - 1',
  'z^5 + z^2 - 1',
  'z^6 + z^3 - 1',
  'z^8 + 15z^4 - 16',
];

function makeInstance(host: VizHost): VizInstance {
  const canvas = document.createElement('canvas');
  canvas.className = 'viz-canvas';
  host.root.append(canvas);
  const gl = getGL(canvas);
  const prog = program(gl, VERT_FULLSCREEN, FRAG);
  const vao = fullscreenTriangle(gl);
  let palTex = paletteTexture(gl, 'violet');

  const HARD_MAX_ITER = 256;
  const INITIAL_SCALE = 1.6;
  const st = {
    poly: 'z^3 - 1',
    palette: 'violet',
    maxIter: 90,
  };
  let coeffs = parsePoly(st.poly)!;
  let roots = findRoots(coeffs);
  let center: Complex = { re: 0, im: 0 };
  let scale = INITIAL_SCALE;
  let needsRender = true;

  // cache uniform locations
  const loc = {
    coeffs: gl.getUniformLocation(prog, 'uCoeffs'),
    roots: gl.getUniformLocation(prog, 'uRoots'),
    deg: gl.getUniformLocation(prog, 'uDeg'),
    rootCount: gl.getUniformLocation(prog, 'uRootCount'),
    maxIter: gl.getUniformLocation(prog, 'uMaxIter'),
    center: gl.getUniformLocation(prog, 'uCenter'),
    scale: gl.getUniformLocation(prog, 'uScale'),
    aspect: gl.getUniformLocation(prog, 'uAspect'),
    palette: gl.getUniformLocation(prog, 'uPalette'),
  };

  function resize(width: number, height: number) {
    const dpr = Math.min(host.dpr, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    needsRender = true;
  }

  function render() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);

    const cArr = new Float32Array(MAXDEG + 1);
    for (let i = 0; i < coeffs.length; i++) cArr[i] = coeffs[i];
    gl.uniform1fv(loc.coeffs, cArr);

    const rArr = new Float32Array(MAXR * 2);
    for (let i = 0; i < roots.length && i < MAXR; i++) {
      rArr[i * 2] = roots[i].re;
      rArr[i * 2 + 1] = roots[i].im;
    }
    gl.uniform2fv(loc.roots, rArr);

    gl.uniform1i(loc.deg, coeffs.length - 1);
    gl.uniform1i(loc.rootCount, Math.min(roots.length, MAXR));
    // The basin boundaries are genuinely fractal — infinitely fine filaments.
    // Resolving them deeper requires more Newton steps, so we ramp the iteration
    // budget up automatically as you zoom in.
    const zoomBoost = Math.round(Math.max(0, Math.log2(INITIAL_SCALE / scale)) * 14);
    const effIter = Math.min(HARD_MAX_ITER, Math.round(st.maxIter) + zoomBoost);
    gl.uniform1i(loc.maxIter, effIter);
    gl.uniform2f(loc.center, center.re, center.im);
    gl.uniform1f(loc.scale, scale);
    gl.uniform1f(loc.aspect, canvas.width / canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, palTex);
    gl.uniform1i(loc.palette, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function update() {
    if (needsRender) {
      render();
      needsRender = false;
    }
  }

  function applyParams(p: ParamValues) {
    if (typeof p.poly === 'string') {
      const parsed = parsePoly(p.poly);
      if (parsed) {
        st.poly = p.poly;
        coeffs = parsed;
        roots = findRoots(coeffs);
        // reset view when the polynomial changes
        center = { re: 0, im: 0 };
        scale = INITIAL_SCALE;
        needsRender = true;
      }
    }
    if (typeof p.maxIter === 'number') {
      st.maxIter = p.maxIter;
      needsRender = true;
    }
    if (typeof p.palette === 'string') {
      st.palette = p.palette;
      palTex = paletteTexture(gl, st.palette, palTex);
      needsRender = true;
    }
  }

  // --- zoom + pan ---
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    const aspect = canvas.width / canvas.height;
    const offx = (fx * 2 - 1) * aspect;
    const offy = 1 - 2 * fy;
    const factor = Math.exp(e.deltaY * 0.001);
    // Allow very deep zoom; ~2e-7 is roughly where float32 precision gives out.
    const newScale = Math.max(2e-7, Math.min(8, scale * factor));
    center.re += offx * (scale - newScale);
    center.im += offy * (scale - newScale);
    scale = newScale;
    needsRender = true;
  };
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const aspect = canvas.width / canvas.height;
    center.re -= ((e.clientX - lastX) / canvas.clientWidth) * 2 * aspect * scale;
    center.im += ((e.clientY - lastY) / canvas.clientHeight) * 2 * scale;
    lastX = e.clientX;
    lastY = e.clientY;
    needsRender = true;
  };
  const onUp = () => {
    dragging = false;
  };
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);

  resize(host.width, host.height);

  return {
    update,
    resize,
    setParams: applyParams,
    randomize() {
      const poly = PRESET_POLYS[Math.floor(Math.random() * PRESET_POLYS.length)];
      const palettes = ['turbo', 'viridis', 'magma', 'aurora', 'sunset', 'plasma'];
      const palette = palettes[Math.floor(Math.random() * palettes.length)];
      const out: ParamValues = { poly, palette, maxIter: st.maxIter };
      applyParams(out);
      // also reflect the (possibly cleared) view; nothing else to share
      return out;
    },
    exportCanvas: () => canvas,
    destroy() {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    },
  };
}

export const newtonDef: VizDef = {
  id: 'newton',
  title: 'Newton Fractals',
  tagline: "Where does Newton's method land? Color the plane by its answer.",
  about: `
    <p>Newton's method finds a root of a function by repeatedly stepping
    <code>z → z − p(z)/p′(z)</code>. For a polynomial with several roots, the
    starting point decides <em>which</em> root you reach.</p>
    <p>We color every point of the complex plane by its destination root, and
    brighten it by how quickly it got there. The boundaries between basins are
    infinitely intricate — a fractal — because near them the tiniest nudge sends
    Newton's method to a completely different root.</p>
    <p>Type your own polynomial (e.g. <code>z^5 + z^2 - 1</code>), scroll to zoom,
    and drag to pan into the filigree along the borders.</p>`,
  params: [
    { type: 'text', key: 'poly', label: 'Polynomial p(z)', default: 'z^3 - 1', placeholder: 'z^3 - 1' },
    { type: 'palette', key: 'palette', label: 'Palette', default: 'violet' },
    { type: 'range', key: 'maxIter', label: 'Detail (iterations)', min: 20, max: 200, step: 1, default: 90 },
  ],
  create: makeInstance,
  thumbnail(canvas) {
    // CPU Newton for z^3 - 1 (roots at the cube roots of unity)
    const c = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    const img = c.createImageData(w, h);
    const roots = [
      { re: 1, im: 0 },
      { re: -0.5, im: 0.8660254 },
      { re: -0.5, im: -0.8660254 },
    ];
    const maxIter = 30;
    const scale = 1.6;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        let zr = ((px / w) * 2 - 1) * scale * (w / h);
        let zi = ((py / h) * 2 - 1) * scale;
        let used = maxIter;
        for (let i = 0; i < maxIter; i++) {
          // p = z^3 - 1, dp = 3 z^2
          const zr2 = zr * zr - zi * zi;
          const zi2 = 2 * zr * zi;
          const pr = zr2 * zr - zi2 * zi - 1;
          const pi = zr2 * zi + zi2 * zr;
          const dr = 3 * zr2;
          const di = 3 * zi2;
          const d = dr * dr + di * di + 1e-30;
          const qr = (pr * dr + pi * di) / d;
          const qi = (pi * dr - pr * di) / d;
          zr -= qr;
          zi -= qi;
          if (pr * pr + pi * pi < 1e-8) {
            used = i;
            break;
          }
        }
        let best = 0;
        let bd = 1e9;
        for (let r = 0; r < 3; r++) {
          const dx = zr - roots[r].re;
          const dy = zi - roots[r].im;
          const dist = dx * dx + dy * dy;
          if (dist < bd) {
            bd = dist;
            best = r;
          }
        }
        const shade = Math.pow(1 - used / maxIter, 0.6);
        const [cr, cg, cb] = sample('violet', (best + 0.5) / 3);
        const idx = (py * w + px) * 4;
        img.data[idx] = cr * (0.18 + 0.82 * shade);
        img.data[idx + 1] = cg * (0.18 + 0.82 * shade);
        img.data[idx + 2] = cb * (0.18 + 0.82 * shade);
        img.data[idx + 3] = 255;
      }
    }
    c.putImageData(img, 0, 0);
  },
};
