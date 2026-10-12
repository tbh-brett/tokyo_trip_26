// The researched data, for code that runs outside Astro's page build: the
// browser and the Worker. The build still validates these files first
// (src/content.config.ts), so nothing malformed ever reaches here.
import placesJson from '../../data/places.json';
import daysJson from '../../data/days.json';
import bookingsJson from '../../data/bookings.json';
import prepJson from '../../data/prep.json';
import travellersJson from '../../data/travellers.json';
import linesJson from '../../data/lines.json';
import tripJson from '../../data/trip.json';
import zhJson from '../../data/i18n/zh-Hant.json';

export type Kind = 'eat' | 'coffee' | 'tea' | 'bar' | 'see' | 'buy';
export const KIND_IDS: readonly Kind[] = ['eat', 'coffee', 'tea', 'bar', 'see', 'buy'];

export interface CatalogPlace {
  id: string;
  name_en: string;
  name_ja: string;
  kind: Kind;
  zone: string;
  station: string;
  line: string;
  recognition: string;
  address_ja: string;
  hours: [string, string][];
  closed_days: string[];
  hours_verified: boolean;
  lat: number | null;
  lng: number | null;
}

export interface CatalogLeg {
  to: string;
  mode: 'train' | 'walk' | 'taxi' | 'plane';
  lines?: string[];
  from_code?: string;
  to_code?: string;
  minutes?: number;
  text_en: string;
  text_zh?: string;
}

export interface CatalogDay {
  date: string;
  title: string;
  anchor: string;
  places: string[];
  must: string[];
  legs: CatalogLeg[];
}

export interface CatalogLine {
  id: string;
  name: string;
  name_zh?: string;
  code: string | null;
  colour: string;
}

export interface CatalogAirport {
  name_en: string | null;
  name_zh: string | null;
  terminal: string | null;
}

export interface CatalogFlight {
  date: string;
  direction: 'outbound' | 'return';
  who: string[];
  airline: string | null;
  number: string | null;
  from: CatalogAirport;
  to: CatalogAirport;
  depart: string | null;
  arrive: string | null;
  minutes: number | null;
  note_en: string | null;
  note_zh: string | null;
}

export const PLACES = placesJson as unknown as CatalogPlace[];
export const PLACE_BY_ID = new Map(PLACES.map((p) => [p.id, p]));
export const DAYS = daysJson as unknown as CatalogDay[];
export const DAY_DATES = DAYS.map((d) => d.date);
export const TRAVELLERS = travellersJson.map((t) => t.name);
export const BASE = tripJson.base;
export const STAY = tripJson.stay;
export const FLIGHTS = tripJson.flights as CatalogFlight[];
export const LINE_BY_ID = new Map((linesJson as CatalogLine[]).map((l) => [l.id, l]));

/** Traditional Chinese for what the browser renders itself: day headlines and checklist labels. */
export const ZH_DAYS = zhJson.days as Record<string, { title: string; anchor: string; notes: string[] } | undefined>;
const zhBookings = zhJson.bookings as Record<string, { what: string } | undefined>;
const zhPrep = zhJson.prep as Record<string, { item: string } | undefined>;

/** Things that can be ticked off, keyed "booking:<id>" and "prep:<id>". */
export const CHECKS = new Map<string, string>([
  ...bookingsJson.map((b): [string, string] => [`booking:${b.id}`, b.what]),
  ...prepJson.map((p): [string, string] => [`prep:${p.id}`, p.item]),
]);

export const CHECKS_ZH = new Map<string, string>([
  ...bookingsJson.flatMap((b): [string, string][] => (zhBookings[b.id] ? [[`booking:${b.id}`, zhBookings[b.id]!.what]] : [])),
  ...prepJson.flatMap((p): [string, string][] => (zhPrep[p.id] ? [[`prep:${p.id}`, zhPrep[p.id]!.item]] : [])),
]);
