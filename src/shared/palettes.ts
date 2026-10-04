// Color palettes. Each palette is a list of RGB control points (0..1) that we
// interpolate. We expose:
//   - sample(name, t)      -> [r,g,b] in 0..255 for CPU drawing
//   - makeLUT(name, n)     -> Uint8 lookup table (n*4 RGBA) for fast CPU mapping
//   - makeGradientCss(name)-> a CSS linear-gradient for UI previews
//   - paletteTexture(gl,..)-> a 256x1 RGBA texture for shaders

export type RGB = [number, number, number];

interface Palette {
  name: string;
  label: string;
  stops: RGB[];
}

function hexStops(hexes: string[]): RGB[] {
  return hexes.map((h) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as unknown as RGB;
  });
}

// Matplotlib perceptual colormaps, sampled at 10 stops (close enough visually).
const PALETTES: Record<string, Palette> = {
  violet: {
    name: 'violet',
    label: 'Violet',
    stops: hexStops([
      '#060409', '#190e35', '#2e1660', '#4c2396',
      '#6d2fc4', '#8b5cf6', '#a87fff', '#c9a8ff',
    ]),
  },
  viridis: {
    name: 'viridis',
    label: 'Viridis',
    stops: hexStops([
      '#440154', '#482878', '#3e4a89', '#31688e', '#26828e',
      '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725',
    ]),
  },
  inferno: {
    name: 'inferno',
    label: 'Inferno',
    stops: hexStops([
      '#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60',
      '#cf4446', '#ed6925', '#fb9a06', '#f7d13d', '#fcffa4',
    ]),
  },
  magma: {
    name: 'magma',
    label: 'Magma',
    stops: hexStops([
      '#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f',
      '#cd4071', '#f1605d', '#fd9567', '#feca8d', '#fcfdbf',
    ]),
  },
  plasma: {
    name: 'plasma',
    label: 'Plasma',
    stops: hexStops([
      '#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786',
      '#d8576b', '#ed7953', '#fa9e3b', '#fdc926', '#f0f921',
    ]),
  },
  turbo: {
    name: 'turbo',
    label: 'Turbo',
    stops: hexStops([
      '#30123b', '#4145ab', '#4675ed', '#39a2fc', '#1bcfd4',
      '#24eca6', '#61fc6c', '#a4fc3b', '#d1e834', '#f9ba38',
      '#fb7e21', '#e6490c', '#b81b02', '#7a0403',
    ]),
  },
  aurora: {
    name: 'aurora',
    label: 'Aurora',
    stops: hexStops([
      '#05071a', '#0b2545', '#136f63', '#2fd9b8', '#7ef9c0',
      '#b388ff', '#ff7ad9',
    ]),
  },
  sunset: {
    name: 'sunset',
    label: 'Sunset',
    stops: hexStops([
      '#0d0221', '#2c0735', '#6b0f6b', '#b5179e', '#f72585',
      '#ff7b00', '#ffd60a',
    ]),
  },
  ember: {
    name: 'ember',
    label: 'Ember',
    stops: hexStops([
      '#03010a', '#240046', '#7b2cbf', '#e0245e', '#ff5400',
      '#ffbd00', '#fff8c2',
    ]),
  },
  ice: {
    name: 'ice',
    label: 'Ice',
    stops: hexStops([
      '#01030f', '#04243f', '#0a6e8a', '#22b4d6', '#7ef0ff',
      '#e8ffff',
    ]),
  },
  mono: {
    name: 'mono',
    label: 'Mono',
    stops: hexStops(['#000010', '#22243a', '#5b6a8f', '#a9c0e8', '#ffffff']),
  },
};

export const PALETTE_NAMES = Object.keys(PALETTES);
export const PALETTE_LABELS = PALETTE_NAMES.map((n) => ({ value: n, label: PALETTES[n].label }));

export function getPalette(name: string): Palette {
  return PALETTES[name] ?? PALETTES.viridis;
}

/** Sample a palette at t in [0,1]. Returns RGB in 0..255. */
export function sample(name: string, t: number): RGB {
  const stops = getPalette(name).stops;
  t = Math.max(0, Math.min(1, t));
  const x = t * (stops.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  return [
    Math.round((a[0] + (b[0] - a[0]) * f) * 255),
    Math.round((a[1] + (b[1] - a[1]) * f) * 255),
    Math.round((a[2] + (b[2] - a[2]) * f) * 255),
  ];
}

/** A flat RGBA Uint8 lookup table with `n` entries. */
export function makeLUT(name: string, n = 256): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const [r, g, b] = sample(name, i / (n - 1));
    lut[i * 4] = r;
    lut[i * 4 + 1] = g;
    lut[i * 4 + 2] = b;
    lut[i * 4 + 3] = 255;
  }
  return lut;
}

export function makeGradientCss(name: string, angle = '90deg'): string {
  const stops = getPalette(name).stops;
  const parts = stops.map((s, i) => {
    const pct = Math.round((i / (stops.length - 1)) * 100);
    return `rgb(${Math.round(s[0] * 255)},${Math.round(s[1] * 255)},${Math.round(s[2] * 255)}) ${pct}%`;
  });
  return `linear-gradient(${angle}, ${parts.join(', ')})`;
}

/** Upload a palette as a 256x1 RGBA texture for use in shaders. */
export function paletteTexture(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  name: string,
  texture?: WebGLTexture | null,
): WebGLTexture {
  const tex = texture ?? gl.createTexture()!;
  const lut = makeLUT(name, 256);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(lut.buffer));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
