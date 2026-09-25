// Time helpers shared by the build and the browser. Everything is Japan time:
// the trip is in Tokyo, and hours in /data are JST.

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type Hours = ReadonlyArray<readonly [string, string]>;

export interface JstNow {
  /** YYYY-MM-DD in Japan */
  date: string;
  /** minutes since midnight in Japan */
  minutes: number;
  /** 0 = Sun */
  weekday: number;
}

export function jstNow(at: Date = new Date()): JstNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  return {
    date,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
    weekday: new Date(`${date}T12:00:00Z`).getUTCDay(),
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-27" → "Fri 27 Nov" */
export function shortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Whole days from a to b (both YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export type OpenState =
  | { open: true; until: string }
  | { open: false; opensAt: string }
  | { open: false; closedToday: boolean };

export function openState(hours: Hours, closedDays: readonly string[], now: JstNow): OpenState {
  const closedOn = (weekday: number) => closedDays.includes(WEEKDAYS[(weekday + 7) % 7]);
  const t = now.minutes;
  for (const [from, to] of hours) {
    const open = toMinutes(from);
    const close = toMinutes(to);
    if (close > open) {
      if (!closedOn(now.weekday) && t >= open && t < close) return { open: true, until: to };
    } else {
      // Runs past midnight, e.g. ["18:00","01:00"]. After midnight it is still yesterday's session.
      if (!closedOn(now.weekday) && t >= open) return { open: true, until: to };
      if (!closedOn(now.weekday - 1) && t < close) return { open: true, until: to };
    }
  }
  if (closedOn(now.weekday)) return { open: false, closedToday: true };
  const later = hours
    .map(([from]) => from)
    .filter((from) => toMinutes(from) > t)
    .sort()[0];
  return later ? { open: false, opensAt: later } : { open: false, closedToday: false };
}

/** Unverified hours only ever say "likely". */
export function openLabel(state: OpenState, verified: boolean): string {
  const open = verified ? 'Open' : 'Likely open';
  const closed = verified ? 'Closed' : 'Likely closed';
  if (state.open) return `${open} · until ${state.until}`;
  if ('opensAt' in state) return `${closed} · opens ${state.opensAt}`;
  return state.closedToday ? `${closed} today` : `${closed} for the day`;
}

/** "09:00–19:00, 21:00–01:00" */
export function hoursText(hours: Hours): string {
  return hours.length ? hours.map(([a, b]) => `${a}–${b}`).join(', ') : 'No hours listed';
}

/** "Closed Sun, Mon" or "" */
export function closedText(closedDays: readonly string[]): string {
  const ordered = WEEKDAYS.filter((d) => closedDays.includes(d));
  return ordered.length ? `Closed ${ordered.join(', ')}` : '';
}
