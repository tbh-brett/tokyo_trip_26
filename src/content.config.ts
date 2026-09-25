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

// Files without ids get their position as the id.
const byPosition = (_: unknown, i: number) => String(i).padStart(3, '0');

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
    })
    .refine(
      (d) => WEEKDAYS[new Date(`${d.date}T12:00:00Z`).getUTCDay()] === d.weekday,
      'weekday does not match date',
    ),
});

const bookings = defineCollection({
  loader: file('data/bookings.json', { parser: jsonArray({ idFrom: byPosition }) }),
  schema: z.strictObject({
    position: z.number().int(),
    id: z.string(),
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
  loader: file('data/prep.json', { parser: jsonArray({ idFrom: byPosition }) }),
  schema: z.strictObject({
    position: z.number().int(),
    id: z.string(),
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
    code: z.string().regex(/^[A-Z]{1,2}$/).nullable(),
    colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'colour must be "#RRGGBB"'),
  }),
});

const trip = defineCollection({
  loader: file('data/trip.json'),
  schema: z.strictObject({
    name_en: z.string().min(1),
    name_ja: z.string().min(1),
    line: slug,
    code: z.string().regex(/^[A-Z]{1,2}\d{2}$/),
    area_ja: z.string().min(1),
  }),
});

export const collections = { places, days, bookings, prep, routes, zones, lines, trip };
