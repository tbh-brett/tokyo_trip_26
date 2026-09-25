// The shared plan in the browser.
// - A change shows immediately (the same reducer the server uses).
// - It is kept on the phone until the server confirms it, so no signal is fine.
// - Every few seconds, while the page is open, it picks up the other phone's changes.
import { applyAll, applyOp, emptyPlan, PlanError, type Envelope, type Op, type PlanState } from '../lib/plan';

const KEYS = {
  state: 'tokyo2026:plan',
  synced: 'tokyo2026:synced-at',
  outbox: 'tokyo2026:outbox',
  me: 'tokyo2026:me',
  oldMarks: 'tokyo2026:marks',
};
const POLL_MS = 8000;

export type Sync =
  | { kind: 'live' }
  | { kind: 'saving' }
  | { kind: 'offline'; waiting: number; since: number | null }
  | { kind: 'signin' }
  | { kind: 'error'; message: string };

function read<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the plan still works for this page view.
  }
}

let confirmed: PlanState = { ...emptyPlan(), ...(read<PlanState>(KEYS.state) ?? {}) };
let syncedAt: number | null = read<number>(KEYS.synced);
let outbox: Envelope[] = read<Envelope[]>(KEYS.outbox) ?? [];
let view: PlanState = rebase();
let sync: Sync = { kind: 'live' };
let news: { text: string; at: number } | null = null;
/** Changes made on this phone, so they're never announced back as news. */
const mine = new Set(outbox.map((e) => e.opId));
const listeners = new Set<() => void>();

function rebase(): PlanState {
  return applyAll(confirmed, outbox, Date.now()).state;
}

function notify() {
  view = rebase();
  for (const fn of listeners) fn();
}

function setSync(next: Sync) {
  sync = next;
  for (const fn of listeners) fn();
}

export const getPlan = () => view;
export const getSync = () => sync;
export const getNews = () => news;
export const hasServerCopy = () => syncedAt !== null;

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function me(): string | null {
  try {
    return localStorage.getItem(KEYS.me);
  } catch {
    return null;
  }
}

export function setMe(name: string) {
  try {
    localStorage.setItem(KEYS.me, name);
  } catch {
    // fine: they'll be asked again next time
  }
  notify();
}

export const newId = (prefix = '') => `${prefix}${crypto.randomUUID()}`;

/** Make a change. Returns an error message if the change doesn't make sense. */
export function dispatch(op: Op): string | null {
  const env: Envelope = { opId: newId(), by: me() ?? 'Someone', op };
  try {
    applyOp(view, env, Date.now());
  } catch (e) {
    if (e instanceof PlanError) return e.message;
    throw e;
  }
  mine.add(env.opId);
  outbox = [...outbox, env];
  write(KEYS.outbox, outbox);
  notify();
  void flush();
  return null;
}

/** Take a newer copy from the server; announce what the other phone changed. */
function accept(state: PlanState) {
  if (state.version < confirmed.version) return;
  const known = new Set(confirmed.activity.map((a) => a.id));
  const theirs = state.activity.filter((a) => !known.has(a.id) && !mine.has(a.id));
  if (theirs.length && syncedAt !== null) news = { text: `${theirs[0].by} ${theirs[0].text}`, at: Date.now() };
  confirmed = state;
  syncedAt = Date.now();
  write(KEYS.state, confirmed);
  write(KEYS.synced, syncedAt);
  notify();
}

const offline = () => setSync({ kind: 'offline', waiting: outbox.length, since: syncedAt });

let flushing = false;
async function flush(): Promise<void> {
  if (flushing || !outbox.length) return;
  flushing = true;
  const batch = outbox.slice(0, 50);
  setSync({ kind: 'saving' });
  try {
    const res = await fetch('/api/ops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Trip-Client': '1' },
      body: JSON.stringify({ ops: batch }),
      redirect: 'manual',
    });
    if (res.type === 'opaqueredirect' || res.status === 401 || res.status === 403) {
      setSync({ kind: 'signin' });
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { state: PlanState; rejected: { opId: string; error: string }[] };
    const sent = new Set(batch.map((e) => e.opId));
    outbox = outbox.filter((e) => !sent.has(e.opId));
    write(KEYS.outbox, outbox);
    accept(body.state);
    if (body.rejected.length) setSync({ kind: 'error', message: `Not saved: ${body.rejected[0].error}` });
    else setSync({ kind: 'live' });
  } catch {
    offline();
  } finally {
    flushing = false;
  }
  if (outbox.length && sync.kind === 'live') void flush();
}

async function poll(): Promise<void> {
  if (document.visibilityState !== 'visible') return;
  try {
    const res = await fetch(`/api/state?since=${confirmed.version}`, { cache: 'no-store', redirect: 'manual' });
    if (res.type === 'opaqueredirect' || res.status === 401 || res.status === 403) {
      setSync({ kind: 'signin' });
      return;
    }
    if (res.status === 200) accept((await res.json()) as PlanState);
    else if (res.status === 204) {
      syncedAt = Date.now();
      write(KEYS.synced, syncedAt);
    } else throw new Error(`HTTP ${res.status}`);
    if (outbox.length) void flush();
    else if (sync.kind === 'offline' || sync.kind === 'signin') setSync({ kind: 'live' });
    migrateOldMarks();
  } catch {
    offline();
  }
}

/** Marks used to live on each phone only. Move any into the shared plan, once. */
function migrateOldMarks() {
  const old = read<Record<string, 'want' | 'booked' | 'skip'>>(KEYS.oldMarks);
  if (!old) return;
  try {
    localStorage.removeItem(KEYS.oldMarks);
  } catch {
    return;
  }
  for (const [place, mark] of Object.entries(old)) {
    if (!view.marks[place]) dispatch({ type: 'mark.set', place, mark });
  }
}

let started = false;
export function start() {
  if (started) return;
  started = true;
  void poll();
  void flush();
  setInterval(() => {
    void poll();
    if (news && Date.now() - news.at > 8000) {
      news = null;
      notify();
    }
  }, POLL_MS);
  // Repaint once a minute so "5 min ago" and "likely open" stay true.
  setInterval(notify, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void poll();
      void flush();
    }
  });
  window.addEventListener('online', () => {
    void poll();
    void flush();
  });
  // Another tab on this phone changed the plan.
  window.addEventListener('storage', (e) => {
    if (e.key === KEYS.state || e.key === KEYS.outbox) {
      confirmed = { ...emptyPlan(), ...(read<PlanState>(KEYS.state) ?? {}) };
      outbox = read<Envelope[]>(KEYS.outbox) ?? [];
      notify();
    }
  });
}

/** Clear a shown error or news line. */
export function dismiss() {
  news = null;
  if (sync.kind === 'error') sync = { kind: 'live' };
  notify();
}
