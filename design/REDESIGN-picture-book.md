# Redesign: picture-book style (繪本風)

**For Claude Code, working in `tbh-brett/tokyo_trip_26`.** Clara wants the site to look like a picture book, after a Claude-made Busan trip site she saw on Threads. This is a **reskin plus a few new cards, not a rebuild.** Everything the site does today stays.

## Reference screenshots

Three screenshots of the Busan site are in `design/reference/`:

- `hero-flights.png`: the home page. Illustration in a rounded frame, big title, countdown pill, the first flight card.
- `day-timeline.png`: the itinerary. Day switcher, day header card, timeline with transport tags.
- `prep-stay.png`: the prep page. Checklist and hotel card.

Match their **style**: line weight, radius, palette, type, spacing, and the feel of the illustrations. Don't copy their code or their drawings. The page has no licence, and this site's structure is different anyway. All illustrations here are original and about Tokyo.

## What stays exactly as it is

The shared live plan (Durable Object, `src/lib/plan.ts`), offline service worker, Cloudflare Access, the 中文 / EN switch, Near me, Show to staff, Google Maps links, the data files and their validation, and the "likely open" honesty rules. Also the usability rules from the old design: every control has a text label, tap targets ≥ 44px, body text ≥ 16px, WCAG AA contrast, no hover-only actions, no truncated place names.

## First: replace the design rules in CLAUDE.md

`CLAUDE.md` currently says *Design — modernist, words first* and lists Swiss-style rules. Replace that whole section with this spec, or every later session will enforce the old style. Update the header comment in `src/styles/global.css` too. Keep the stack table, data rules, offline and language sections.

## The look

- **Background**: washi white `#FFFCF6`, light only, no dark mode. This follows the original; record it in CLAUDE.md.
- **Lines**: 3px ink-grey `#3E3A39` on cards, buttons, tabs, the day track and illustrations. A 3px ink rule under the top bar. Dotted ink lines for timelines, flight durations and list separators.
- **Shapes**: large radius, 20–24px on cards and full pills on chips and buttons. Flat colour only: no gradients, no blur shadows.
- **Palette** (fills; text on them is always ink, never white):
  - coral pink `#F2A497`: selected tab, selected day, today, must-go, day header card (as a light tint)
  - yamabuki yellow `#F6D27A`: countdown, recognition pills, taxi
  - mizu blue `#A8D3E6`: flight card header, trains, link underlines
  - wakatake green `#B9DAA5`: walking, ticked, likely open
  - warning text `#B5483A` (about 5:1 on washi) for small notes like "check in online 2 days before"
- **Text**: ink `#3E3A39` on washi is about 11:1. Secondary text no lighter than `#6B6461`. Run every pastel/ink pair through a contrast check.
- **Links**: ink text with a 3px mizu-blue underline, as in the day timeline screenshot.

## Type

- **Huninn** (justfont 粉圓, `@fontsource/huninn`, OFL) for English and Chinese text. **One weight only (400)**: set `font-synthesis: none` and build hierarchy with size, fills and outlined boxes, never fake bold. Titles use generous letter-spacing, as in 「釜山 5 天 4 夜」.
- **Zen Maru Gothic** (`@fontsource/zen-maru-gothic`) for Japanese place names, addresses and the Show to staff screen. Huninn covers kana, but it draws kanji to Taiwanese conventions, so staff should see Japanese forms. Zen Maru matches Huninn's rounded feel.
- Self-host both; extend `scripts/subset-fonts.mjs` so Huninn is subset to the text in `src/i18n`, `data/i18n` and the English, and Zen Maru to the Japanese in `/data`.
- Scale: 13 / 16 / 20 / 28 / 40px. Times use `font-variant-numeric: tabular-nums`.

## The mascot

Her site uses a little cable-car gondola with two eyes as its logo, and it rides the day switcher. Make an original one for Tokyo: **a small Ginza-line car**, orange body, ink outline, two dot eyes. The Ginza line is the trip's spine (Suehirocho G14, one seat to Gaienmae, Omote-sando, Ginza, Shimbashi, Ueno, Tawaramachi, Asakusa). It sits top-left in the top bar, linking home, and rides the day track.

## Components

1. **Top bar, fixed**: mascot left; the existing tabs (Today · Plan · Places) and 中文 / EN on the right as text links, the current one in a coral pill with a 3px outline. Thick rule underneath. Respect the safe-area inset.
2. **Hero (Today)**: a Tokyo illustration in a rounded 3px frame, the title large and letter-spaced, the date line, and the existing countdown in a yamabuki pill ("出發倒數 46 天" / "46 days to go"). During the trip: "Day 3 of 7".
3. **Section headings**: a round icon badge (coloured circle, 3px outline, simple pictogram) beside the heading: plane for Flights, train car for Itinerary, check box for Prep, house for Stay.
4. **Flight cards** (new, from `data/trip.json`):
   - Header strip in mizu with the date, direction (去程 / 回程) and flight number on the right.
   - Body: departure and arrival times in large type, a dotted line between them with the duration, airport and terminal under each time, and a warning-colour note underneath.
   - Data: add a `flights` array (date, direction, airline, number, from, to, depart, arrive, terminals, note_en, note_zh) with a schema. Known now: arrive Narita 27 Nov 14:45; leave Narita 3 Dec 22:00. **Brett to supply numbers, airline and terminals.**
5. **Day switcher**: a horizontal track like a metro strip map, with a 3px ink line and a white station dot per day. The date sits under each dot, with the weekday below in small type (`11/27` / `週五`). The selected date is in a coral pill. **The mascot rides the line and slides to the selected day.** The day pages keep their URLs (`/day/<date>/`); the switcher links them.
6. **Day header card**: a light coral card with a small framed illustration on the left; "Day 2", the day's title, and a stay line ("住 外神田" / "Staying: Sotokanda") on the right.
7. **Timeline**: times on the left, a dotted vertical line with hollow circle nodes, and items on the right.
   - **Places** are white rounded cards with a 3px outline. The name is a link with a mizu underline, and the plan note goes underneath in small grey type.
   - **Transport legs** sit between stops as a pill with a pictogram and label, then the route and "about 20 min".
   - **Untimed items** follow under "Any time".
8. **Transport legs (new data)**: add an optional `legs` array to each day in `days.json`: `{ to: <place id or "hotel">, mode, line?, from_code?, to_code?, minutes?, text_en, text_zh? }`. Fill it **only from what the day's notes already say** (e.g. "07:05 Ginza line from Suehirocho (G14) to Gaienmae (G03), about 20 minutes"); invent no times. A leg renders above its `to` stop when that stop is in the plan. Pill colours:
   - mizu: trains, with the line's official colour as a small dot plus its code (`● G03 銀座線`), so wayfinding stays exact
   - wakatake: walk
   - yamabuki: taxi
   - coral: plane
9. **必去 / Must-go badge**: a coral tag on the stop matching the day's anchor. One per day, two at most.
10. **Prep and bookings**: shared checklists, as now. Boxes are rounded squares with a 3px outline; ticked shows a drawn tick on a wakatake fill.
11. **Stay card** (new): `stay` in `trip.json` with hotel name, `address_ja`, dates, check-in and check-out times, phone. Rows split by a dotted line, dates right-aligned in grey. Copy address and Show to staff stay available. **Brett to supply the hotel name.**
12. **Place cards and pages**: same content, new skin. Recognition (百名店 etc.) as a yamabuki pill.

## Illustrations

Inline SVG components in `src/components/illustrations/`, in the same 3px ink line and flat palette: simple, original, nothing traced. One hero plus one per day, reused small in the day header card.

| Where | Subject |
|---|---|
| Today hero | Tokyo skyline with a lattice tower, falling ginkgo leaves, the Ginza-line mascot crossing, sun |
| Fri 27 Nov | A plane arriving over Roppongi at night, a moon |
| Sat 28 Nov | A ginkgo avenue, a generic beckoning cat (not a branded character), a sunset |
| Sun 29 Nov | Ginkgo, a racehorse, a lit garden pond |
| Mon 30 Nov | A harbour cable car, a Christmas tree, a red-brick warehouse |
| Tue 1 Dec | A green-and-cream tram by the sea, an island with a lighthouse |
| Wed 2 Dec | Maple trees, a cocktail glass |
| Thu 3 Dec | Gold-lit trees along a street, a plane leaving |

No anime or manga characters, no logos, no copied artwork. Each SVG has `role="img"` and an `aria-label` in both languages, or `aria-hidden="true"` if decorative. Keep each under ~6 KB.

## Motion

- Illustrations drift: 4–6 s ease-in-out loops of 2–4px movement or a few degrees of sway (train bobbing, leaves falling, cable car swinging, boat rocking). Transform and opacity only.
- The mascot slides along the day track to the chosen day with a slight overshoot, about 400 ms.
- Switching day: the header card and timeline bounce in, about 300 ms, staggered by item.
- Ticking a box: a quick pop.
- `@media (prefers-reduced-motion: reduce)`: all of it off. CSS only, no animation library.

## Budgets and checks

JS on non-map pages stays < 100 KB compressed. SVGs are inline; no image files for illustrations. `npm run build` passes. Check at 390×844 in both languages, offline in airplane mode, and next to the reference screenshots. Commit in steps: tokens and fonts → top bar, hero, cards → day switcher and timeline → illustrations → motion.

**Done when** Clara looks at it on her phone and says yes.

## Later, only if Brett misses the old look

A per-phone theme switch (picture book / modern) works like the 中文 / EN switch: a `data-theme` attribute set before paint from `localStorage`. It doubles design QA, so don't start it until this version is finished.
