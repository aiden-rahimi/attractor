# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Curious visitors, math-curious public, and Rüya's friends/followers arriving from her link hub. Mobile-first in practice: tested on Fennec (Firefox mobile), Brave, Via, and Samsung Browser; desktop second. They come to play with the math, not to read about it.

## Product Purpose

An open gallery of interactive, shareable mathematical visualizations: strange attractors, Gray-Scott reaction-diffusion, Newton fractals, modular times tables, and phyllotaxis. Tagline: "made for the love of math." It is Aiden's maker-mark — the public face of their generative-math work. Success is a visitor losing ten minutes to a slider and sharing the exact picture they found via URL.

## Positioning

Hand-built interactive math art with a real visual identity, not generic AI-slop. Every piece is explorable (sliders, dice/randomize, shareable URL state) rather than a static render. The interface recedes; the mathematics leads.

## Operating Context

Static frontend on The Vibe Hosting at https://attractor.thevibehosting.com/math/ (landing at /). Vite + TypeScript source in the private aiden-rahimi/MathVisualize repo (cloned to ~/workspace/math-gallery). Hash-routed SPA: `#/` gallery index, `#/v/<id>` visualization. Live canvas thumbnails render on the gallery index. Deployed by building and copying `dist/` to the server's `/root/www/math/`.

## Capabilities and Constraints

- Five visualizations must keep working with full interactivity: attractors, reaction-diffusion, newton, multiplication (modular times tables), phyllotaxis.
- Viz pages have parameter controls, randomize, and URL-encoded shareable state (the engine writes the URL itself; see src/shared/engine.ts, ui.ts, url.ts).
- Gallery index has "Surprise me" random navigation; footer mascot easter egg (click/pat interaction) exists in the incumbent.
- Custom cursor and konami-code sparkles exist in the incumbent; keep or replace deliberately, not accidentally.
- Must remain static-hostable (no backend). Must stay touch-usable on mobile; Fennec/Firefox mobile had rendering quirks with the incumbent — verify there.
- Confirmed undecided: whether the landing page at / stays a separate entry or folds into the gallery.

## Brand Commitments

- Name: "attractor". Wordmark is Rüya's topographic-`a` logo (contour-line lowercase a, violet).
- Accent: violet #8B5CF6 on near-black ground #08090A. The old amber/terracotta (#D97F57 family) and the warm dark #14120D are both retired — they read as Claude-brand-adjacent.
- Text tiers: brightest #EAE5D9, lighter #C4BBAF, darker #A59E8C.
- "Surprise me" lives centered below the epigraph, above the plates — not in the header. The header carries only the wordmark; "source" lives only in the footer.
- Small mark: Rüya's "two foci + trail" (two dots in a looping trail; reads as both organic loop and infinity).
- Logo credit: "logo by rüya" (always Rüya, never Madi/Madison/Madalina on any public surface).
- Voice: elegant, a little mysterious, minimal. Dry, never corporate. The tagline "made for the love of math." stays.
- Anti-reference: the incumbent look (generic editorial-minimal dark + amber, pixel-art creature mascot, sparkle decorations) — Madi's verdict: "very Claude-vibe-code-like."

## Evidence on Hand

- Source: ~/workspace/math-gallery (Vite + TS).
- Live incumbent: https://attractor.thevibehosting.com/math/
- Logos: https://attractor.thevibehosting.com/logo-hero.svg, /logo-mark.svg (source zip: ~/workspace/user/files/math-logo-options-8B5CF6_2_cjyx.zip)
- Madi's browser test notes (2026-10-03): Fennec renders oddly; Brave, Via, Samsung fine; transient "controls" overlap with Via's bottom bar.

## Product Principles

1. The math leads; the interface recedes. (Experience mode.)
2. Playable, not viewable: every piece invites touch — sliders, dice, shareable states.
3. Distinctive identity over category defaults: if it could be any AI-made gallery, it failed.
4. Small delights welcome (easter eggs, the mascot's successor) as long as they never obstruct play.

## Accessibility & Inclusion

- Touch-first controls; usable at 390px wide.
- Verify on Firefox mobile (Fennec) — known past rendering quirks.
- Respect reduced-motion where animation is decorative.
