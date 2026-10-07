// The researched data, for code that runs outside Astro's page build: the
// browser and the Worker. The build still validates these files first
// (src/content.config.ts), so nothing malformed ever reaches here.
import placesJson from '../../data/places.json';
import daysJson from '../../data/days.json';
import bookingsJson from '../../data/bookings.json';
import prepJson from '../../data/prep.json';
import travellersJson from '../../data/travellers.json';
import tripJson from '../../data/trip.json';

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

export interface CatalogDay {
  date: string;
  title: string;
  anchor: string;
  places: string[];
}

export const PLACES = placesJson as unknown as CatalogPlace[];
export const PLACE_BY_ID = new Map(PLACES.map((p) => [p.id, p]));
export const DAYS = daysJson as unknown as CatalogDay[];
export const DAY_DATES = DAYS.map((d) => d.date);
export const TRAVELLERS = travellersJson.map((t) => t.name);
export const BASE = tripJson.base;

/** Things that can be ticked off, keyed "booking:<id>" and "prep:<id>". */
export const CHECKS = new Map<string, string>([
  ...bookingsJson.map((b): [string, string] => [`booking:${b.id}`, b.what]),
  ...prepJson.map((p): [string, string] => [`prep:${p.id}`, p.item]),
]);
