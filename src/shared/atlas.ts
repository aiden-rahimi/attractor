// Atlas catalog data: plate numeral, dotted taxonomy name, and the curator's
// one-line note for each visualization. Keyed by viz id.

export interface PlateMeta {
  numeral: string;
  taxonomy: string;
  note: string;
}

export const PLATES: Record<string, PlateMeta> = {
  attractors: {
    numeral: 'I',
    taxonomy: 'attractors.strange',
    note: 'deterministic systems that never repeat themselves.',
  },
  'reaction-diffusion': {
    numeral: 'II',
    taxonomy: 'gray-scott.bloom',
    note: 'how the leopard gets its spots, simulated.',
  },
  newton: {
    numeral: 'III',
    taxonomy: 'newton.basins',
    note: 'the boundary between answers is infinitely thin.',
  },
  'times-tables': {
    numeral: 'IV',
    taxonomy: 'modular.cardioid',
    note: 'arithmetic draws flowers when no one is watching.',
  },
  phyllotaxis: {
    numeral: 'V',
    taxonomy: 'phyllotaxis.golden',
    note: '137.5° — nature’s favorite angle.',
  },
};
