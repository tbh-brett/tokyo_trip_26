// One place to read /data. Beyond the per-file schemas, this checks that files
// agree with each other (a route stop that isn't a place, a zone that doesn't
// exist). Any problem throws, which fails the build.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Place = CollectionEntry<'places'>['data'];
export type Day = CollectionEntry<'days'>['data'];
export type Booking = CollectionEntry<'bookings'>['data'];
export type PrepItem = CollectionEntry<'prep'>['data'];
export type Route = CollectionEntry<'routes'>['data'];
export type Zone = CollectionEntry<'zones'>['data'];
export type Line = CollectionEntry<'lines'>['data'];
export type Base = CollectionEntry<'trip'>['data'];
export type Kind = Place['kind'];

export const KINDS: ReadonlyArray<{ id: Kind; label: string }> = [
  { id: 'eat', label: 'Eat' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'tea', label: 'Tea' },
  { id: 'bar', label: 'Bars' },
  { id: 'see', label: 'See' },
  { id: 'buy', label: 'Buy' },
];

export const kindLabel = (kind: Kind) => KINDS.find((k) => k.id === kind)?.label ?? kind;

/** First name in a zone's list: "Kanda · Akihabara · …" → "Kanda". */
export const zoneShort = (zone: Zone) => zone.name_en.split(' · ')[0];

export interface TripData {
  places: Place[];
  days: Day[];
  bookings: Booking[];
  prep: PrepItem[];
  routes: Route[];
  zones: Zone[];
  lines: Line[];
  base: Base;
  place: (id: string) => Place;
  zone: (id: string) => Zone;
  line: (id: string) => Line;
}

let cached: Promise<TripData> | undefined;
export const loadData = () => (cached ??= load());

async function load(): Promise<TripData> {
  // Everything keeps the order it has in its file.
  const inFileOrder = <T extends { data: { position: number } }>(entries: T[]) =>
    entries.sort((a, b) => a.data.position - b.data.position);
  const [places, days, bookings, prep, routes, zones, lines, trip] = await Promise.all([
    getCollection('places').then(inFileOrder),
    getCollection('days').then(inFileOrder),
    getCollection('bookings').then(inFileOrder),
    getCollection('prep').then(inFileOrder),
    getCollection('routes').then(inFileOrder),
    getCollection('zones').then(inFileOrder),
    getCollection('lines').then(inFileOrder),
    getCollection('trip'),
  ]);

  const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((i) => [i.id, i]));
  const placeMap = byId(places.map((e) => e.data));
  const zoneMap = byId(zones.map((e) => e.data));
  const lineMap = byId(lines.map((e) => e.data));

  const problems: string[] = [];
  const counts = { places, days, bookings, prep, routes, zones, lines };
  for (const [name, entries] of Object.entries(counts)) {
    if (entries.length === 0) problems.push(`${name}.json: no entries (unreadable file?)`);
  }
  const base = trip.find((e) => e.id === 'base')?.data;
  if (!base) problems.push('trip.json: missing "base"');
  else if (!lineMap.has(base.line)) problems.push(`trip.json: base line "${base.line}" is not in lines.json`);

  for (const p of placeMap.values()) {
    if (!zoneMap.has(p.zone)) problems.push(`places.json ${p.id}: zone "${p.zone}" is not in zones.json`);
    if (!lineMap.has(p.line)) problems.push(`places.json ${p.id}: line "${p.line}" is not in lines.json`);
  }
  for (const { data: r } of routes) {
    if (!zoneMap.has(r.zone)) problems.push(`routes.json ${r.id}: zone "${r.zone}" is not in zones.json`);
    for (const stop of r.stops) {
      if (!placeMap.has(stop)) problems.push(`routes.json ${r.id}: stop "${stop}" is not in places.json`);
    }
  }
  for (let i = 1; i < days.length; i++) {
    const prev = Date.parse(`${days[i - 1].data.date}T00:00:00Z`);
    const next = Date.parse(`${days[i].data.date}T00:00:00Z`);
    if (next - prev !== 86_400_000) problems.push(`days.json: ${days[i].data.date} does not follow ${days[i - 1].data.date}`);
  }
  if (problems.length || !base) throw new Error(`Data check failed:\n  ${problems.join('\n  ')}`);

  const need = <T>(map: Map<string, T>, what: string) => (id: string) => {
    const item = map.get(id);
    if (!item) throw new Error(`Unknown ${what} "${id}"`);
    return item;
  };

  return {
    places: [...placeMap.values()],
    days: days.map((e) => e.data),
    bookings: bookings.map((e) => e.data),
    prep: prep.map((e) => e.data),
    routes: routes.map((e) => e.data),
    zones: zones.map((e) => e.data),
    lines: lines.map((e) => e.data),
    base,
    place: need(placeMap, 'place'),
    zone: need(zoneMap, 'zone'),
    line: need(lineMap, 'line'),
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "1 Nov" → "2026-11-01" in the trip's year; "Now" and "Any time" → null. */
export function bookingDate(when: string, tripYear: number): string | null {
  const m = /^(\d{1,2}) ([A-Z][a-z]{2})$/.exec(when);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]) + 1;
  return `${tripYear}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** "2026-11-27" → "Fri 27 Nov" */
export function shortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

// Google Maps deep links. Navigation is Google's job; these open the app on a phone.
export const mapsPlaceUrl = (p: Place) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name_ja} ${p.address_ja}`)}`;

export const mapsTransitUrl = (p: Place) => {
  const destination = p.lat !== null && p.lng !== null ? `${p.lat},${p.lng}` : `${p.name_ja} ${p.address_ja}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=transit`;
};
