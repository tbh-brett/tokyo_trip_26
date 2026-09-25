// The shared plan: what Brett and Clara have decided, as opposed to the
// researched menu in /data. One pure reducer runs in two places:
//   - the browser, so a change shows instantly and survives no signal;
//   - the Durable Object, which has the final say and stores the result.
// Nothing here touches the DOM, storage or the network.

import { CHECKS, DAY_DATES, KIND_IDS, PLACE_BY_ID, type Kind } from './catalog';
import { shortDate } from './time';

export type Mark = 'want' | 'booked' | 'skip';
export const MARKS: readonly Mark[] = ['want', 'booked', 'skip'];
export const MARK_LABEL: Record<Mark, string> = { want: 'Want', booked: 'Booked', skip: 'Skip' };

/** Your own places have ids starting "m-"; everything else is a place in /data. */
export const isMine = (ref: string) => ref.startsWith('m-');

export interface PlanItem {
  id: string;
  day: string; // YYYY-MM-DD
  time: string | null; // HH:MM, Japan time
  place: string | null; // a /data place id or one of your own ("m-…")
  title: string | null; // for things that aren't places: "Check in", "Rest"
  note: string | null;
  order: number; // order among the untimed items of a day
  by: string;
  at: number;
}

export interface MyPlace {
  id: string;
  name: string;
  name_ja: string | null;
  address: string | null;
  maps: string | null; // a link, usually Google Maps
  kind: Kind;
  note: string | null;
  by: string;
  at: number;
}

export interface Stamp {
  by: string;
  at: number;
}

export interface Activity extends Stamp {
  id: string;
  text: string;
}

export interface PlanState {
  version: number;
  items: PlanItem[];
  places: MyPlace[];
  marks: Record<string, Stamp & { mark: Mark }>;
  days: Record<string, Stamp & { title?: string; anchor?: string }>;
  checks: Record<string, Stamp>;
  activity: Activity[]; // newest first
}

export type Op =
  | { type: 'item.add'; id: string; day: string; time?: string | null; place?: string | null; title?: string | null; note?: string | null }
  | { type: 'item.update'; id: string; day?: string; time?: string | null; title?: string | null; note?: string | null }
  | { type: 'item.move'; id: string; dir: -1 | 1 }
  | { type: 'item.remove'; id: string }
  | { type: 'place.add'; id: string; name: string; name_ja?: string | null; address?: string | null; maps?: string | null; kind: Kind; note?: string | null }
  | { type: 'place.update'; id: string; name?: string; name_ja?: string | null; address?: string | null; maps?: string | null; kind?: Kind; note?: string | null }
  | { type: 'place.remove'; id: string }
  | { type: 'mark.set'; place: string; mark: Mark | null }
  | { type: 'day.edit'; day: string; title?: string | null; anchor?: string | null }
  | { type: 'check.set'; key: string; done: boolean };

/** One change as sent to the server. opId makes retries safe. */
export interface Envelope {
  opId: string;
  by: string;
  op: Op;
}

export class PlanError extends Error {}

export const emptyPlan = (): PlanState => ({
  version: 0,
  items: [],
  places: [],
  marks: {},
  days: {},
  checks: {},
  activity: [],
});

const LIMITS = { items: 600, places: 300, activity: 60 };

// ── Reading ────────────────────────────────────────────────────────────────

export function placeName(state: PlanState, ref: string | null): string | null {
  if (!ref) return null;
  if (isMine(ref)) return state.places.find((p) => p.id === ref)?.name ?? null;
  return PLACE_BY_ID.get(ref)?.name_en ?? null;
}

export function itemLabel(state: PlanState, item: PlanItem): string {
  return item.title ?? placeName(state, item.place) ?? 'Something';
}

/** A day's items: timed ones by the clock, then the rest in your order. */
export function dayItems(state: PlanState, day: string): { timed: PlanItem[]; anytime: PlanItem[] } {
  const all = state.items.filter((i) => i.day === day);
  return {
    timed: all.filter((i) => i.time).sort((a, b) => a.time!.localeCompare(b.time!) || a.order - b.order),
    anytime: all.filter((i) => !i.time).sort((a, b) => a.order - b.order),
  };
}

export const itemsForPlace = (state: PlanState, ref: string) =>
  state.items.filter((i) => i.place === ref).sort((a, b) => a.day.localeCompare(b.day) || (a.time ?? '99').localeCompare(b.time ?? '99'));

// ── Validation ─────────────────────────────────────────────────────────────

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID = /^[A-Za-z0-9-]{6,64}$/;

function text(value: unknown, field: string, max: number): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new PlanError(`${field} must be text`);
  const t = value.trim().replace(/\s+/g, ' ');
  if (t.length > max) throw new PlanError(`${field} is too long (${max} characters max)`);
  return t || null;
}

function required(value: unknown, field: string, max: number): string {
  const t = text(value, field, max);
  if (!t) throw new PlanError(`${field} is empty`);
  return t;
}

function time(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !TIME.test(value)) throw new PlanError('time must be HH:MM');
  return value;
}

function day(value: unknown): string {
  if (typeof value !== 'string' || !DAY_DATES.includes(value)) throw new PlanError('that day is not part of the trip');
  return value;
}

function id(value: unknown): string {
  if (typeof value !== 'string' || !ID.test(value)) throw new PlanError('bad id');
  return value;
}

function link(value: unknown): string | null {
  const t = text(value, 'link', 600);
  if (!t) return null;
  let url: URL;
  try {
    url = new URL(t);
  } catch {
    throw new PlanError('the link is not a web address');
  }
  if (url.protocol !== 'https:') throw new PlanError('the link must start with https://');
  return url.toString();
}

function kind(value: unknown): Kind {
  if (!KIND_IDS.includes(value as Kind)) throw new PlanError('unknown kind of place');
  return value as Kind;
}

function placeRef(state: PlanState, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new PlanError('bad place');
  if (isMine(value) ? !state.places.some((p) => p.id === value) : !PLACE_BY_ID.has(value)) {
    throw new PlanError('that place no longer exists');
  }
  return value;
}

// ── The reducer ────────────────────────────────────────────────────────────

/**
 * Apply one change. Returns a new state (the input is never mutated) with the
 * version bumped and, for meaningful changes, a line in the activity feed.
 * Throws PlanError when the change doesn't make sense.
 */
export function applyOp(prev: PlanState, env: Envelope, now: number): PlanState {
  const by = text(env.by, 'name', 24) ?? 'Someone';
  const op = env.op;
  const s: PlanState = {
    ...prev,
    items: [...prev.items],
    places: [...prev.places],
    marks: { ...prev.marks },
    days: { ...prev.days },
    checks: { ...prev.checks },
  };
  let say: string | null = null;

  const findItem = (itemId: string) => {
    const index = s.items.findIndex((i) => i.id === itemId);
    if (index < 0) throw new PlanError('that item was already removed');
    return { index, item: s.items[index] };
  };
  const nextOrder = (d: string) => Math.max(0, ...s.items.filter((i) => i.day === d).map((i) => i.order)) + 1;
  const at = (t: string | null) => (t ? ` at ${t}` : '');

  switch (op?.type) {
    case 'item.add': {
      const itemId = id(op.id);
      if (s.items.some((i) => i.id === itemId)) return prev; // a retry of something already applied
      if (s.items.length >= LIMITS.items) throw new PlanError('the plan is full');
      const item: PlanItem = {
        id: itemId,
        day: day(op.day),
        time: time(op.time),
        place: placeRef(s, op.place),
        title: text(op.title, 'title', 120),
        note: text(op.note, 'note', 500),
        order: 0,
        by,
        at: now,
      };
      if (!item.place && !item.title) throw new PlanError('add a place or a title');
      item.order = nextOrder(item.day);
      s.items.push(item);
      say = `added ${itemLabel(s, item)} to ${shortDate(item.day)}${at(item.time)}`;
      break;
    }
    case 'item.update': {
      const { index, item } = findItem(id(op.id));
      const next = { ...item, by, at: now };
      const movedDay = op.day !== undefined && op.day !== item.day;
      const newTime = op.time !== undefined && time(op.time) !== item.time;
      const newNote = op.note !== undefined && text(op.note, 'note', 500) !== item.note;
      if (movedDay) {
        next.day = day(op.day);
        next.order = nextOrder(next.day);
      }
      if (newTime) {
        next.time = time(op.time);
        if (!next.time) next.order = nextOrder(next.day);
      }
      if (op.title !== undefined) {
        next.title = text(op.title, 'title', 120);
        if (!next.place && !next.title) throw new PlanError('the title is empty');
      }
      if (newNote) next.note = text(op.note, 'note', 500);
      s.items[index] = next;
      const label = itemLabel(s, next);
      if (movedDay) say = `moved ${label} from ${shortDate(item.day)} to ${shortDate(next.day)}${at(next.time)}`;
      else if (newTime) say = next.time ? `set ${label} for ${next.time} on ${shortDate(next.day)}` : `took the time off ${label} on ${shortDate(next.day)}`;
      else if (newNote) say = next.note ? `added a note to ${label}: ${next.note}` : `removed the note from ${label}`;
      if (say && newNote && (movedDay || newTime)) say += ', with a note';
      break;
    }
    case 'item.move': {
      const { item } = findItem(id(op.id));
      if (item.time) throw new PlanError('timed items follow the clock; change the time instead');
      const list = dayItems(s, item.day).anytime;
      const from = list.findIndex((i) => i.id === item.id);
      const to = from + (op.dir === -1 ? -1 : 1);
      if (to < 0 || to >= list.length) return prev;
      const other = list[to];
      s.items = s.items.map((i) =>
        i.id === item.id ? { ...i, order: other.order } : i.id === other.id ? { ...i, order: item.order } : i,
      );
      break; // reordering is too small to announce
    }
    case 'item.remove': {
      const found = s.items.find((i) => i.id === op.id);
      if (!found) return prev;
      s.items = s.items.filter((i) => i.id !== found.id);
      say = `removed ${itemLabel(prev, found)} from ${shortDate(found.day)}`;
      break;
    }
    case 'place.add': {
      const placeId = id(op.id);
      if (!isMine(placeId)) throw new PlanError('bad id');
      if (s.places.some((p) => p.id === placeId)) return prev;
      if (s.places.length >= LIMITS.places) throw new PlanError('too many places');
      const place: MyPlace = {
        id: placeId,
        name: required(op.name, 'name', 120),
        name_ja: text(op.name_ja, 'Japanese name', 120),
        address: text(op.address, 'address', 200),
        maps: link(op.maps),
        kind: kind(op.kind),
        note: text(op.note, 'note', 500),
        by,
        at: now,
      };
      s.places.push(place);
      say = `added a new place: ${place.name}`;
      break;
    }
    case 'place.update': {
      const index = s.places.findIndex((p) => p.id === op.id);
      if (index < 0) throw new PlanError('that place was deleted');
      const p = { ...s.places[index], by, at: now };
      if (op.name !== undefined) p.name = required(op.name, 'name', 120);
      if (op.name_ja !== undefined) p.name_ja = text(op.name_ja, 'Japanese name', 120);
      if (op.address !== undefined) p.address = text(op.address, 'address', 200);
      if (op.maps !== undefined) p.maps = link(op.maps);
      if (op.kind !== undefined) p.kind = kind(op.kind);
      if (op.note !== undefined) p.note = text(op.note, 'note', 500);
      s.places[index] = p;
      say = `edited ${p.name}`;
      break;
    }
    case 'place.remove': {
      const place = s.places.find((p) => p.id === op.id);
      if (!place) return prev;
      s.places = s.places.filter((p) => p.id !== place.id);
      s.items = s.items.filter((i) => i.place !== place.id);
      delete s.marks[place.id];
      say = `deleted ${place.name}`;
      break;
    }
    case 'mark.set': {
      const ref = placeRef(s, op.place);
      if (!ref) throw new PlanError('bad place');
      if (op.mark === null) {
        if (!s.marks[ref]) return prev;
        delete s.marks[ref];
        say = `cleared the mark on ${placeName(s, ref)}`;
      } else {
        if (!MARKS.includes(op.mark)) throw new PlanError('unknown mark');
        if (s.marks[ref]?.mark === op.mark) return prev;
        s.marks[ref] = { mark: op.mark, by, at: now };
        say = `marked ${placeName(s, ref)} as ${MARK_LABEL[op.mark]}`;
      }
      break;
    }
    case 'day.edit': {
      const d = day(op.day);
      const next = { ...(s.days[d] ?? {}), by, at: now };
      if (op.title !== undefined) {
        const t = text(op.title, 'title', 80);
        if (t) next.title = t;
        else delete next.title;
      }
      if (op.anchor !== undefined) {
        const a = text(op.anchor, 'main plan', 240);
        if (a) next.anchor = a;
        else delete next.anchor;
      }
      if (next.title === undefined && next.anchor === undefined) {
        if (!s.days[d]) return prev;
        delete s.days[d];
        say = `put back the original headline for ${shortDate(d)}`;
      } else {
        s.days[d] = next;
        say = `changed the headline for ${shortDate(d)}`;
      }
      break;
    }
    case 'check.set': {
      const label = CHECKS.get(String(op.key));
      if (!label) throw new PlanError('unknown checklist item');
      if (op.done === Boolean(s.checks[op.key])) return prev;
      if (op.done) s.checks[op.key] = { by, at: now };
      else delete s.checks[op.key];
      say = `${op.done ? 'ticked off' : 'unticked'}: ${label}`;
      break;
    }
    default:
      throw new PlanError('unknown change');
  }

  s.version = prev.version + 1;
  if (say) {
    s.activity = [{ id: env.opId, at: now, by, text: say }, ...prev.activity].slice(0, LIMITS.activity);
  }
  return s;
}

/** Apply changes one by one, skipping (and reporting) any that fail. */
export function applyAll(state: PlanState, envs: Envelope[], now: number) {
  const rejected: { opId: string; error: string }[] = [];
  for (const env of envs) {
    try {
      state = applyOp(state, env, now);
    } catch (e) {
      if (!(e instanceof PlanError)) throw e;
      rejected.push({ opId: env.opId, error: e.message });
    }
  }
  return { state, rejected };
}
