// Small helpers for rendering the live parts of pages without a framework.
import { DAYS, PLACE_BY_ID, type Kind } from '../lib/catalog';
import { isMine, type PlanState } from '../lib/plan';
import { shortDate } from '../lib/time';
import { subscribe } from './store';

/** Markup that is already safe to insert. */
export class Safe {
  constructor(readonly value: string) {}
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

function toHtml(value: unknown): string {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof Safe) return value.value;
  if (Array.isArray(value)) return value.map(toHtml).join('');
  return escape(String(value));
}

/** Template tag: every interpolated value is escaped unless it is Safe. */
export function html(strings: TemplateStringsArray, ...values: unknown[]): Safe {
  let out = strings[0];
  values.forEach((v, i) => (out += toHtml(v) + strings[i + 1]));
  return new Safe(out);
}

/**
 * Keep an element in step with the plan. Skips identical output, waits while
 * someone is typing inside it, and keeps open <details data-key> open.
 */
export function mount(el: HTMLElement, render: () => Safe): () => void {
  let last = '';
  let deferred = false;
  const paint = () => {
    const active = document.activeElement;
    if (active && el.contains(active) && active.matches('input, textarea, select')) {
      if (!deferred) {
        deferred = true;
        const resume = () => {
          deferred = false;
          paint();
        };
        el.addEventListener('focusout', () => setTimeout(resume, 0), { once: true });
      }
      return;
    }
    const next = render().value;
    if (next === last) return;
    const open = new Set([...el.querySelectorAll<HTMLDetailsElement>('details[open][data-key]')].map((d) => d.dataset.key));
    el.innerHTML = next;
    last = next;
    for (const d of el.querySelectorAll<HTMLDetailsElement>('details[data-key]')) if (open.has(d.dataset.key)) d.open = true;
  };
  paint();
  subscribe(paint);
  return paint;
}

/** "just now", "5 min ago", "3 h ago", "Sun 29 Nov" */
export function ago(at: number): string {
  const s = (Date.now() - at) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  const d = new Date(at);
  return shortDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
}

export function dayOptions(selected: string | null): Safe {
  return html`${DAYS.map(
    (d) => html`<option value="${d.date}" ${d.date === selected ? new Safe('selected') : ''}>${shortDate(d.date)} · ${d.title}</option>`,
  )}`;
}

export interface PlaceView {
  ref: string;
  name: string;
  nameJa: string | null;
  href: string;
  kind: Kind | null;
  station: string | null;
}

/** What a place reference looks like on screen, whether it's researched or your own. */
export function placeView(plan: PlanState, ref: string | null): PlaceView | null {
  if (!ref) return null;
  if (isMine(ref)) {
    const p = plan.places.find((x) => x.id === ref);
    return p ? { ref, name: p.name, nameJa: p.name_ja, href: `/p/mine/?id=${p.id}`, kind: p.kind, station: null } : null;
  }
  const p = PLACE_BY_ID.get(ref);
  if (!p) return null;
  return {
    ref,
    name: p.name_en,
    nameJa: p.name_ja !== p.name_en ? p.name_ja : null,
    href: `/p/${p.id}/`,
    kind: p.kind,
    station: p.station,
  };
}

/** The day's title and main plan, with your edits applied. */
export function dayHeadline(plan: PlanState, date: string) {
  const base = DAYS.find((d) => d.date === date)!;
  const edit = plan.days[date];
  return { title: edit?.title ?? base.title, anchor: edit?.anchor ?? base.anchor, edited: Boolean(edit) };
}

/** Delegate clicks on [data-action] inside root. */
export function onAction(root: HTMLElement, handlers: Record<string, (el: HTMLElement) => void>) {
  root.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el || !root.contains(el)) return;
    const handler = handlers[el.dataset.action!];
    if (handler) {
      e.preventDefault();
      handler(el);
    }
  });
}

/** Delegate submits of form[data-form] inside root. */
export function onForm(root: HTMLElement, handlers: Record<string, (form: HTMLFormElement, data: FormData) => void>) {
  root.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    const handler = handlers[form.dataset.form ?? ''];
    if (handler) {
      e.preventDefault();
      handler(form, new FormData(form));
    }
  });
}
