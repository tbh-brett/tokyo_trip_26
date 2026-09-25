# Tokyo 2026 — trip site

A private, phone-first site for two people (Brett and Clara) on a Tokyo trip, **27 Nov – 4 Dec 2026**, based at 外神田6丁目 (Suehirocho, Ginza line G14). It replaces spreadsheets that never got opened. Its one job: answer *"what now, from here"* in under five seconds.

Read `PLAN.md` for phases and acceptance criteria. This file is the standing rules.

## Hard constraints

- **Used on phones in Japan, not laptops.** Design at 390×844 first. Everything must work one-handed on a train.
- **Zero maintenance during the trip.** No server to babysit, no API keys, no paid services. The one piece of server state is the shared plan (below), on Cloudflare's free tier. After the code freeze (20 Nov 2026) only files in `/data` change; the plan changes live through the site.
- **A bad edit must never take the site down.** Schema validation fails the build; the host only replaces the live site on a successful build.
- **Private.** The data includes where the hotel is and when the flat is empty. The site sits behind Cloudflare Access. Nothing is indexed.
- **Works offline** once opened. Subway gaps and roaming glitches are normal.

## Stack (decided — don't relitigate without asking)

| Concern | Choice | Why |
|---|---|---|
| Framework | Astro, static output, TypeScript | Content is the product; content collections + Zod schemas catch bad data at build time |
| Data | JSON in `/data`, loaded as content collections | Editable by Claude Code from a phone; diffable; one source of truth |
| Map | MapLibre GL JS + OpenFreeMap `positron` (light) / `dark` style | No API key, no billing, no quota. Load only on Map and Route pages |
| Navigation | Deep links into the Google Maps app | Transit, live hours and turn-by-turn are Google's job, not ours |
| Offline | `@vite-pwa/astro` (Workbox), precache app shell + data + fonts | Opens instantly, survives no signal |
| Fonts | IBM Plex Sans JP + IBM Plex Mono via Fontsource, self-hosted. Japanese glyphs are subset at build time to the characters in `/data` and `/src` (`scripts/subset-fonts.mjs`) | One family covering Latin and Japanese; ~37 KB per weight instead of ~900 KB; cacheable offline |
| Alerts | Subscribed calendar feed (`.ics`) generated at build | Native phone alerts with no push server. Web push on iOS needs Home Screen install + a VAPID server — not worth it |
| Hosting | Cloudflare Workers: static assets for every page, plus a small Worker (`worker/`) that only handles `/api/*` (`run_worker_first`). Deployed by Workers Builds from the private GitHub repo `tbh-brett/tokyo_trip_26` to the Worker `tokyo-trip-26` | Cloudflare's recommended path for new sites (chosen over Pages on 25 Sep 2026). Free static requests, no deploy cap, a failed build never deploys |
| Shared plan | One SQLite-backed Durable Object (`TripStore`, `worker/trip-store.ts`) holding the plan as one JSON document, plus a log of every change (`ops` table). Added 25 Sep 2026 at Brett's request so both phones can edit the itinerary live | Strict ordering of edits from two phones, no database to provision, free tier (100k requests/day) |
| Access | Cloudflare Access on the whole Worker ("Protect all Workers", All traffic, policy "Brett and Clara"), email one-time PIN. Preview URLs are off (`preview_urls: false`) so there is no unprotected second address | Real login for free; no passwords to manage |

### Two kinds of data

- **Research** lives in `/data`: places, days, bookings, prep, zones, routes. Validated at build, changed through Git (Claude Code), never edited from the site.
- **Decisions** live in the shared plan: which places go on which day and when, notes, your own places (ids `m-…`), Want / Booked / Skip marks, ticked-off bookings and prep, headline edits, and who changed what. Edited live from either phone.

The plan's rules are one pure reducer, `src/lib/plan.ts`, used by both the browser (instant, works with no signal) and the Durable Object (final say). Every change is an `Op` with a unique `opId`; the server applies each `opId` once, so retries are safe. The browser (`src/scripts/store.ts`) keeps unsent changes in `localStorage`, sends them when there's signal, and polls `/api/state?since=<version>` every 8 s while the page is visible. `/api/ops` only accepts same-origin JSON with the `X-Trip-Client: 1` header.

When changing the plan's shape, keep old stored plans loading: the store spreads saved JSON over `emptyPlan()`, so add fields with defaults rather than renaming.

### Build pipeline

`npm run build` = `check-json` (malformed JSON fails fast; Astro's loader would otherwise keep stale data) → `subset-fonts` → `astro check` → `tsc -p worker` → `astro build`. Workers Builds then runs `npx wrangler deploy`, which bundles the Worker. Rerun `npx wrangler types worker/worker-configuration.d.ts` after changing `wrangler.jsonc`. Run everything locally with `npx wrangler dev`. Schemas live in `src/content.config.ts`; cross-file checks (zones, lines, route stops, consecutive days, empty files) in `src/lib/data.ts`. The loader adds a `position` field to every array item so pages keep file order; never write `position` in the JSON.

## Data rules

- `/data/*.json` is the only place content lives. Components never hardcode a place, day, route or booking.
- **Never invent** a place, award, price, hour or address. A new place needs a real source; set `source` to the URL or `general-knowledge`.
- `hours_verified: false` means the hours are an estimate. The UI must then say **"likely open" / "likely closed"**, never "open".
- `address_precision: "district"` means the address stops at the neighbourhood. **Do not geocode those** — the pin would land in the middle of the ward. Find the full street address first (Tabelog listing or the shop's own site), then geocode.
- Geocode street-level Japanese addresses with the GSI (国土地理院) address search API. Store `lat`/`lng`, set `coords_verified: true` only after a spot-check against Google Maps.
- `closed_days` use `Sun`…`Sat`. `hours` are `["HH:MM","HH:MM"]` pairs in JST; a close after midnight is written as e.g. `["18:00","01:00"]`.
- Recognition strings are literal (`喫茶店百名店 2026`, `Asia's 50 Best Bars 2026 · No. 23`). Keep the year; lists change annually.
- `trip.json` holds the home station (`base`). `lines.json` holds each line's name, letter code (`G`, `JY`, or `null` when there isn't a single one) and colour. The `toden` colour is an approximation of the Tokyo Sakura Tram pink.

## Design — modernist, words first

Swiss / International Typographic Style meets Tokyo Metro wayfinding. Restraint is the brief.

- **Grid**: 4 columns on mobile, 16px gutters, 8px baseline. Flush left, ragged right. Nothing centred except the show-to-staff screen.
- **Type** (IBM Plex Sans JP; Plex Mono for times, prices, station codes, distances): 13 / 16 / 20 / 28 / 40px. Body never below 16px. Weights 400, 500, 700 only.
- **Colour**: black `#111`, white `#FFF`, greys `#F2F2F2 #BDBDBD #6B6B6B`, one signal colour: Ginza-line orange `#FF9500`. Orange is a **fill with black text on it** (≈9:1), never orange text on white (fails contrast). Dark mode inverts paper/ink; orange stays.
- **Line colours** appear only in station badges styled like Tokyo Metro codes (ring + `G14`). Nowhere else.
- **Separation by hairlines and space**: 1px rules, no shadows, no gradients, corner radius 0–2px. No card stacks with drop shadows.
- **Visible words**: every control carries a text label. Icons only beside text, never alone. Tap targets ≥ 44px. No hover-only affordances, no truncated place names, no carousels, no modals for primary content.
- **Bilingual order**: English name for scanning, Japanese name beneath at equal visual weight — it is what gets shown to staff and typed into Maps.
- **Sunlight-legible**: WCAG AA minimum everywhere, aim AAA for body text.

## Modules

Tabs: Today · Plan · Places. Day pages at `/day/<date>/`; your own places at `/p/mine/?id=…`; add one at `/add/`.

1. **Today** — date-aware header (countdown before the trip; "Day 3 of 8" during). Today's anchor. Next timed item. **Near me now**: three places max, sorted by open-now then distance (Geolocation API; fall back to a zone picker if denied). Walking time = distance × 1.3 ÷ 80 m/min, labelled "about".
2. **Plan** — eight days with what you've planned, the shared Want list, bookings and prep as shared checklists, the feed of changes. Each day page: your plan (timed items by the clock, the rest in your order), edit time / day / note, move up / down, remove (tap twice), edit the headline, add by search / Want list / the day's ideas (`days.json` `places`) / free text, and Ask Claude about the day.
3. **Map** — every place as a black dot, selected in orange; filter by kind with text chips; overlay one route at a time; "Near me" recentres.
4. **Places** — by kind (Eat, Coffee, Tea, Bars, See, Buy), filter by zone, recognition shown on every row. Static detail page per place (`/p/[id]`).
5. **Routes** — curated walks from `/data/routes.json`. Stops numbered on the map, joined by straight lines (label them "not street routing"). "Walk this in Google Maps" splits into legs of **≤ 3 waypoints** (Google's mobile limit).
6. **Areas** — zone guides from `/data/zones.json`.

Place detail must include: **Show to staff** (full-screen, white on black, `name_ja` at 48px+, address below, request a screen wake lock and tolerate refusal), **Open in Google Maps**, **Directions from here** (transit), **Copy address**, Want / Booked / Skip marks shared through the plan, **In your plan** with **Add to plan** (day + optional time), and **Ask Claude about it** (`src/lib/ask.ts`: a `claude.ai/new?q=` link with the question filled in; no API key).

### Google Maps link formats

- Place: `https://www.google.com/maps/search/?api=1&query=` + encode(`name_ja + " " + address_ja`)
- Transit from current location: `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=transit`
- Walking leg: `https://www.google.com/maps/dir/?api=1&origin=A&destination=D&waypoints=B|C&travelmode=walking`

## Calendar feed

Generate `/cal/<token>.ics` at build (token from the `CAL_TOKEN` env var, so the URL is unguessable). Contents: booking deadlines from `bookings.json` with alerts (1 Nov 2026 10:00 JST = 09:00 HKT is the big one), each day's anchor, timed events such as Rikugien 18:00. All times `Asia/Tokyo`. Cloudflare Access needs a **Bypass** policy on `/cal/*` or calendar apps can't fetch it.

## Performance budget

- JS on non-map pages < 100 KB compressed. MapLibre loads only where a map renders.
- First load on 4G < 2 s. Repeat loads instant from cache.

## Don't

- Add the Google Maps JavaScript API, Places API, or any client-side key.
- Add web push, analytics, third-party trackers or any paid service. The shared plan is the only server state; don't add more without asking.
- Change code after 20 Nov 2026 unless something is broken. Data only.
- Mark anything verified that you didn't verify.

## Checks before every commit

`npm run build` passes (schemas included) · layout checked at 390px wide · no horizontal scroll · offline load still works after structural changes.
