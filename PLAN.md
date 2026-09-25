# Build plan — Tokyo 2026 trip site

Today is late September. Code freeze **20 Nov 2026**. Fly **27 Nov**. Five short phases, each finishable in an evening with Claude Code.

## What's in this kit

| File | What it is |
|---|---|
| `CLAUDE.md` | Standing rules Claude Code reads every session: stack, data rules, design system |
| `PLAN.md` | This file |
| `data/places.json` | 116 researched places — 35 eat, 33 coffee, 11 tea, 18 bars, 14 see, 5 buy |
| `data/days.json` | Eight days, one anchor each |
| `data/routes.json` | Six curated walks |
| `data/zones.json` | Ten area guides |
| `data/bookings.json` | Booking calendar with dates |
| `data/prep.json` | Pre-departure checklist |
| `data/lines.json` | Rail line colours for station badges |

**Known data gaps, on purpose:** no coordinates yet (`lat`/`lng` are `null`), 69 of 116 addresses are district-level only, and every opening hour is an estimate. Phase 2 and Phase 5 fix these. Nothing is marked verified that wasn't.

---

## Step 0 — accounts (15 minutes, you, not Claude)

1. **GitHub** → New repository → name `tokyo-2026` → **Private** → create it empty.
2. **Cloudflare** → sign up (free). You'll connect the repo in Phase 1.
3. Decide the two login emails (yours and Clara's) for Cloudflare Access.

### Then start Claude Code — pick one

- **Claude Code on your computer**: unzip this kit into a folder, open Claude Code in that folder, and say:
  > Read CLAUDE.md and PLAN.md. Push this kit to my empty private GitHub repo tokyo-2026, then do Phase 1.
- **Claude Code on the web or the Claude app**: on github.com open the empty repo → *Add file → Upload files* → drag in everything from the unzipped kit → commit. Then open Claude Code on that repo and say:
  > Read CLAUDE.md and PLAN.md, then do Phase 1.

---

## Phase 1 — skeleton, deploy, lock the door

- Scaffold Astro (static), TypeScript, content collections with Zod schemas over every file in `/data`. ✓
- Pages: Today (basic), Places list by kind, place detail `/p/[id]` with Show to staff, Google Maps links, Copy address. ✓
- Design tokens and type from `CLAUDE.md`. ✓
- Connect the repo to **Cloudflare Workers** via Workers Builds (build command `npm run build`, deploy command `npx wrangler deploy`, Worker name `tokyo-2026` to match `wrangler.jsonc`). *(Hosting switched from Pages to Workers on 25 Sep 2026, per Cloudflare's current guidance.)*
- Add **Cloudflare Access** on the Worker's `workers.dev` hostname: allow the two emails, login method One-time PIN, session duration at its longest setting.

**Done when:** both of you can log in on your phones over 4G; a deliberately broken JSON edit fails the build and the live site keeps serving the previous version.

## Phase 2 — coordinates, map, near me

- For the 69 `address_precision: "district"` places, find the full street address from the Tabelog listing or the shop's own site. Update the JSON.
- Geocode every street-level address with the GSI address search API. Spot-check ten pins against Google Maps before marking `coords_verified`.
- Map page with MapLibre + OpenFreeMap. Filter chips. Route overlay.
- Near me on Today: geolocation, open-now, distance, three results max.

**Done when:** every pin is within roughly 50 m of the real door on the ten you checked; Near me returns sensible results standing in Jimbocho (simulate the location).

## Phase 3 — offline and install

- PWA manifest, icons, `@vite-pwa/astro` precaching of pages, data and fonts.
- Self-host IBM Plex Sans JP and Plex Mono via Fontsource.

**Done when:** airplane mode, every page still opens; the site installs to the Home Screen with a proper icon and opens full-screen.

## Phase 4 — routes and calendar

- Route pages from `routes.json`: numbered stops, straight-line map, "Walk this in Google Maps" split into ≤ 3-waypoint legs. Optimise stop order once coordinates exist (`order_verified`).
- `.ics` feed at `/cal/<CAL_TOKEN>.ics`: bookings with alerts, daily anchors, timed events. Access **Bypass** on `/cal/*`.

**Done when:** the calendar is subscribed on both phones and a test alert fires.

## Phase 5 — data pass (runs until the freeze)

- Star the places you actually intend to visit. Verify their hours and closing days first; set `hours_verified: true` only after checking the shop's own page or Tabelog.
- Add new finds with a source.
- Re-check the event dates in `places.json` notes (Hasedera illumination dates were not published when researched).

## 20 Nov — freeze and rehearse

- No more code changes. Data only.
- Both phones: logged in, installed to Home Screen, calendar subscribed, opened once in airplane mode.
- Google Maps offline area downloaded for central Tokyo.

## During the trip — how to change something

Open Claude Code on your phone, connected to the repo, and ask for the change ("add this ramen shop to Tuesday", "mark Marugo as booked for 19:00"). It opens a pull request; Workers Builds builds the branch and shows a check on the PR; merge it in the GitHub app; Cloudflare deploys in about a minute. If the build fails, nothing changes on the live site.

---

## Dates that matter

| Date | What |
|---|---|
| Now | Rikugien night ticket · Sakurai tea counter · Gen Yamamoto |
| 28 Oct | Saturday 28 Nov dinners open (one-month rule) |
| **1 Nov, 10:00 JST / 09:00 HKT** | December reservations open at many restaurants |
| 2–3 Nov | Wed 2 Dec and Thu 3 Dec anchor dinners (one-month rule) |
| 20 Nov | Code freeze |
| 27 Nov | Fly |

## The Ginza line is the spine of this trip

Your station, Suehirocho, is **G14**. One seat, no changes, to: Gaienmae **G03** (the ginkgo), Omote-sando **G02** (coffee and tea), Ginza **G09**, Shimbashi **G08** (Café de l'Ambre), Ueno **G16**, Tawaramachi **G18** (Kappabashi), Asakusa **G19**. Worth making visible in the design.

## If you stay on Netlify instead

1. Check **Usage & billing → Plan details**. Accounts created before 4 Sep 2025 are on legacy plans and are fine.
2. If it says credit-based: the free plan is 300 credits a month, a production deploy costs 15, and when credits run out **every site is paused** until the next cycle. Turn off auto-publishing and deploy in batches, or you can go dark mid-trip.
3. Password protection is a paid feature there. Free alternatives are an unlisted URL with `noindex`, or encrypting the built pages with StatiCrypt. Weaker than Access.

Everything else in this plan is the same on either host.

## Later, only if you miss it

**Shared marks between both phones.** A small Worker script plus KV, keyed by the email Access already passes in the `Cf-Access-Authenticated-User-Email` header. Small, but it is a backend — leave it out of v1.
