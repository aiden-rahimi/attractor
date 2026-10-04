// Atlas catalog data: plate numeral, dotted taxonomy name, and an epigraph —
// a real, verified quote — for each visualization. Keyed by viz id.

export interface PlateMeta {
  numeral: string;
  taxonomy: string;
  note: string;
  quoteBy?: string;
}

export const PLATES: Record<string, PlateMeta> = {
  attractors: {
    numeral: 'I',
    taxonomy: 'attractors.strange',
    note: '“When the present determines the future, but the approximate present does not approximately determine the future.”',
    quoteBy: 'Edward Lorenz',
  },
  'reaction-diffusion': {
    numeral: 'II',
    taxonomy: 'gray-scott.bloom',
    note: '“Such a system, although it may originally be quite homogeneous, may later develop a pattern or structure due to an instability of the homogeneous equilibrium, which is triggered off by random disturbances.”',
    quoteBy: 'Alan Turing, “The Chemical Basis of Morphogenesis” (1952)',
  },
  newton: {
    numeral: 'III',
    taxonomy: 'newton.basins',
    note: '“Truth is ever to be found in simplicity, and not in the multiplicity and confusion of things.”',
    quoteBy: 'Isaac Newton',
  },
  'times-tables': {
    numeral: 'IV',
    taxonomy: 'modular.cardioid',
    note: '“God made the integers, all else is the work of man.”',
    quoteBy: 'Leopold Kronecker',
  },
  phyllotaxis: {
    numeral: 'V',
    taxonomy: 'phyllotaxis.golden',
    note: '“Geometry has two great treasures: one is the theorem of Pythagoras; the other, the division of a line into extreme and mean ratio. The first we may compare to a mass of gold, the second we may call a precious jewel.”',
    quoteBy: 'Johannes Kepler',
  },
};
