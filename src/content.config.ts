// Every file in /data is a content collection with a strict schema.
// A typo, a missing field or a bad time fails `npm run build`, and a failed
// build never replaces the live site.
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be "HH:MM" (24-hour, JST)');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be "YYYY-MM-DD"');
const weekday = z.enum(WEEKDAYS);
const slug = z.string().regex(/^[a-z0-9-]+$/, 'id must be lowercase letters, digits and hyphens');

/**
 * Parse a JSON array, refusing duplicate ids (the loader would otherwise keep the last one silently).
 * Each item gets its position in the file, so pages can keep the file's order.
 */
function jsonArray(opts: { idFrom?: (item: Record<string, unknown>, index: number) => string } = {}) {
  return (text: string) => {
    const data: unknown = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('expected a JSON array');
    const seen = new Set<string>();
    return data.map((item: Record<string, unknown>, i) => {
      const id = opts.idFrom ? opts.idFrom(item, i) : String(item.id);
      if (seen.has(id)) throw new Error(`duplicate id "${id}"`);
      seen.add(id);
      return { ...item, id, position: i };
    });
  };
}

const places = defineCollection({
  loader: file('data/places.json', { parser: jsonArray() }),
  schema: z
    .strictObject({
      position: z.number().int(),
      id: slug,
      name_ja: z.string().min(1),
      name_en: z.string().min(1),
      kind: z.enum(['eat', 'coffee', 'tea', 'bar', 'see', 'buy']),
      zone: slug,
      station: z.string().min(1),
      line: slug,
      recognition: z.string().min(1),
      why: z.string().min(1),
      note: z.string().min(1).nullable(),
      price: z.string().min(1),
      slots: z.array(z.enum(['breakfast', 'coffee', 'lunch', 'dinner', 'late'])).min(1),
      hours: z.array(z.tuple([hhmm, hhmm])),
      closed_days: z.array(weekday),
      hours_verified: z.boolean(),
      book_ahead: z.boolean(),
      address_ja: z.string().min(1),
      address_precision: z.enum(['street', 'district']),
      address_verified: z.boolean(),
      lat: z.number().min(20).max(46).nullable(),
      lng: z.number().min(122).max(154).nullable(),
      coords_verified: z.boolean(),
      source: z.string().min(1),
    })
    .refine((p) => (p.lat === null) === (p.lng === null), 'lat and lng must both be numbers or both be null')
    .refine((p) => !p.coords_verified || p.lat !== null, 'coords_verified is true but lat/lng are null')
    .refine(
      (p) => p.address_precision === 'street' || p.lat === null,
      'district-precision addresses must not be geocoded: find the street address first',
    ),
});

/**
 * A journey between stops. "hotel" legs show right after an arriving flight,
 * otherwise at the end of the day; "airport" legs just before a departing flight.
 */
const leg = z.strictObject({
  to: z.union([slug, z.literal('hotel'), z.literal('airport')]),
  mode: z.enum(['train', 'walk', 'taxi', 'plane']),
  lines: z.array(slug).optional(),
  from_code: z.string().regex(/^[A-Z]{1,2}\d{2}$/).optional(),
  to_code: z.string().regex(/^[A-Z]{1,2}\d{2}$/).optional(),
  minutes: z.number().int().positive().optional(),
  text_en: z.string().min(1),
  text_zh: z.string().min(1).optional(),
});

const days = defineCollection({
  loader: file('data/days.json', { parser: jsonArray({ idFrom: (d) => String(d.date) }) }),
  schema: z
    .strictObject({
      position: z.number().int(),
      id: isoDate,
      date: isoDate,
      weekday,
      title: z.string().min(1),
      anchor: z.string().min(1),
      notes: z.array(z.string().min(1)),
      /** Places the notes mention, offered as ideas on the day's page. */
      places: z.array(slug),
      /** The stops that make the day (its anchor): tagged Must-go on the timeline. */
      must: z.array(slug).max(2),
      /** How to get between stops, only as the notes say. Each shows above its stop when that stop is in the plan. */
      legs: z.array(leg),
    })
    .refine(
      (d) => WEEKDAYS[new Date(`${d.date}T12:00:00Z`).getUTCDay()] === d.weekday,
      'weekday does not match date',
    ),
});

const bookings = defineCollection({
  loader: file('data/bookings.json', { parser: jsonArray() }),
  schema: z.strictObject({
    position: z.number().int(),
    id: slug,
    when: z
      .string()
      .regex(
        new RegExp(`^(Now|Any time|([1-9]|[12]\\d|3[01]) (${MONTHS.join('|')}))$`),
        'when must be "Now", "Any time" or like "1 Nov"',
      ),
    what: z.string().min(1),
    detail: z.string().min(1),
    where: z.string().min(1),
  }),
});

const prep = defineCollection({
  loader: file('data/prep.json', { parser: jsonArray() }),
  schema: z.strictObject({
    position: z.number().int(),
    id: slug,
    group: z.string().min(1),
    item: z.string().min(1),
    due: z.union([z.literal('now'), z.literal('trip'), isoDate]),
  }),
});

const routes = defineCollection({
  loader: file('data/routes.json', { parser: jsonArray() }),
  schema: z.strictObject({
    position: z.number().int(),
    id: slug,
    title: z.string().min(1),
    zone: slug,
    mode: z.enum(['walk']),
    when: z.string().min(1),
    why: z.string().min(1),
    stops: z.array(slug).min(2),
    order_verified: z.boolean(),
  }),
});

const zones = defineCollection({
  loader: file('data/zones.json', { parser: jsonArray() }),
  schema: z.strictObject({
    position: z.number().int(),
    id: slug,
    name_en: z.string().min(1),
    name_ja: z.string().min(1),
    badge: z.string().min(1),
    paragraphs: z.array(z.string().min(1)).min(1),
  }),
});

const lines = defineCollection({
  loader: file('data/lines.json', { parser: jsonArray() }),
  schema: z.strictObject({
    position: z.number().int(),
    id: slug,
    name: z.string().min(1),
    name_zh: z.string().min(1).optional(),
    code: z.string().regex(/^[A-Z]{1,2}$/).nullable(),
    colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'colour must be "#RRGGBB"'),
  }),
});

const travellers = defineCollection({
  loader: file('data/travellers.json', { parser: jsonArray() }),
  schema: z.strictObject({
    position: z.number().int(),
    id: slug,
    name: z.string().min(1).max(20),
  }),
});

// trip.json is one object: the home station, where you stay, and the flights.
const airport = z.strictObject({
  name_en: z.string().min(1).nullable(),
  name_zh: z.string().min(1).nullable(),
  terminal: z.string().min(1).nullable(),
});

const flight = z
  .strictObject({
    date: isoDate,
    /** outbound = arriving in Tokyo, return = leaving it. */
    direction: z.enum(['outbound', 'return']),
    /** Who is on it, when not both of you. */
    who: z.array(z.string().min(1)),
    airline: z.string().min(1).nullable(),
    number: z.string().min(1).nullable(),
    from: airport,
    to: airport,
    /** Local times at each end. */
    depart: hhmm.nullable(),
    arrive: hhmm.nullable(),
    /** Time in the air. */
    minutes: z.number().int().positive().nullable(),
    note_en: z.string().min(1).nullable(),
    note_zh: z.string().min(1).nullable(),
  })
  .refine((f) => (f.direction === 'outbound' ? f.arrive : f.depart) !== null, 'a flight needs its time in Tokyo: arrive for outbound, depart for return');

const trip = defineCollection({
  loader: file('data/trip.json', { parser: (text) => [{ id: 'trip', ...JSON.parse(text) }] }),
  schema: z.strictObject({
    id: z.literal('trip'),
    base: z.strictObject({
      name_en: z.string().min(1),
      name_ja: z.string().min(1),
      line: slug,
      code: z.string().regex(/^[A-Z]{1,2}\d{2}$/),
      area_ja: z.string().min(1),
    }),
    stay: z.strictObject({
      name_en: z.string().min(1).nullable(),
      name_ja: z.string().min(1).nullable(),
      name_zh: z.string().min(1).nullable(),
      area_en: z.string().min(1),
      area_zh: z.string().min(1),
      address_ja: z.string().min(1),
      address_precision: z.enum(['street', 'district']),
      from: isoDate,
      to: isoDate,
      check_in: hhmm.nullable(),
      check_out: hhmm.nullable(),
      phone: z.string().min(1).nullable(),
      /** Where the hotel's details came from. */
      source: z.string().min(1).nullable(),
    }),
    flights: z.array(flight),
  }),
});

export const collections = { places, days, bookings, prep, routes, zones, lines, travellers, trip };
