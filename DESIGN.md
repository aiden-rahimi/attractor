# Design — the Observatory Atlas

<!-- impeccable:design-schema 1 -->

Visual world for the attractor gallery (https://attractor.thevibehosting.com/math/),
shipped 2026-10-03. Replaces the generic editorial-minimal incumbent.

## World

A dark atlas of charted mathematical bodies. Each visualization is a celestial
object with a plate numeral, a dotted taxonomy name, and a curator's note. The
interface is chart furniture: hairline rules, corner ticks, margin notation.

## Tokens

- `--ground: #14120d` — warm near-black, every surface
- `--ground-2: #1c1813` — panels, cards
- `--ink: #8b5cf6` — the single chart ink (violet). Flat uses only: numerals,
  rules, ticks, active states, slider values, eyebrows. Never glow, never gradient.
- `--ink-soft: #a78bfa` — hover/readout tint; `--ink-faint` — washes
- `--paper: #f1ece2` — primary text; `--muted: #a39e93` — secondary; `--faint` — tertiary
- `--hairline: rgba(241,236,226,.13)` — frames, rules
- Type: EB Garamond (engraved-chart voice, display + italic) / JetBrains Mono
  (catalog data: numerals, taxonomy, coordinates, formulas, labels)

## Components

- **Site header**: slim chart-rule bar, violet top keyline. Topographic-a logo +
  letterspaced "attractor" wordmark left; mono uppercase nav right
  ("surprise me", "source"). Opaque ground (never translucent — bright canvases
  bleed through frosted headers on scroll).
- **Plate** (gallery index): numeral (mono, violet, Roman I–V) + dotted taxonomy
  (`attractors.strange`, `gray-scott.bloom`, `newton.basins`,
  `modular.cardioid`, `phyllotaxis.golden`) in the head; live canvas chart in a
  hairline frame with violet corner ticks; serif title + italic curator's note.
  Hover: frame border and ticks go violet, thumb scales 1.015.
- **Spread**: asymmetric 12-col grid (7/5, 5/7, centered 6) on desktop; single
  column on mobile. No uniform card grid, no hero headline — one quiet italic
  intro line ("five bodies, charted…").
- **Viz topbar**: floating pills — "← atlas" back, centered eyebrow
  ("PLATE I · ATTRACTORS.STRANGE", violet mono) over serif title, "field notes"
  button. Title hidden on small screens.
- **Parameters panel**: floating right (desktop), bottom sheet with safe-area
  padding (mobile). Mono labels, violet readouts, hairline-track sliders with
  violet-ring thumbs, dotted row separators, line-icon action buttons
  (random/share/PNG/record).
- **Field notes** (about overlay): dark card, violet mono eyebrow, serif body,
  formulas in violet-tinted code chips.
- **Cursor** (fine pointers only): violet telescope reticle — fine ring crossed
  by hairlines, center dot, short violet trail. Respects reduced motion.
- **Colophon**: Rüya's two-foci mark in the footer; keeps the 5-pat easter egg
  (violet star rain). Konami code retained.

## Motion

Single `rise` entrance (opacity + 14px translate, staggered per plate).
Hover states only otherwise. `prefers-reduced-motion` disables entrance,
thumb zoom, and sparkles.

## Responsive

- ≤860px: spread stacks; viz title hidden; panel becomes a bottom sheet
  (46vh, collapsible to a 53px handle strip).
- ≤520px: tighter nav, footer stacks.
- Panel collapse on desktop slides fully away; canvas re-renders full width.

## Provenance

- Logos by Rüya (topographic-a hero, two-foci mark), violet #8B5CF6.
- Direction: user-chose "Observatory Atlas" over the roll-assigned "Plotter's
  Table" (degraded roll, seed 164debc9, no challengers).
- UX inspo: complexification.net (dotted taxonomy), inconvergent.net
  (lowercase lab voice), demozoo.org (provenance as design), iquilezles.org
  (formulas as exhibit), CreativeApplications (log/metadata views — not built).
