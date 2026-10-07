// Live pieces shared by several pages. Each finds its elements by data
// attribute, so a page opts in just by including the markup.
import { DAYS } from '../lib/catalog';
import { dayItems, itemLabel, itemsForPlace, MARK_LABEL, type Mark, type PlanState } from '../lib/plan';
import { jstNow, openLabel, openState, shortDate, type Hours } from '../lib/time';
import { dispatch, getPlan, newId, subscribe } from './store';
import { ago, dayHeadline, dayOptions, html, mount, placeView } from './ui';

const all = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/** Text of [data-day-title] / [data-day-anchor] follows your edits. */
export function wireDayHeadlines() {
  const paint = () => {
    const plan = getPlan();
    for (const el of all('[data-day-title]')) el.textContent = dayHeadline(plan, el.dataset.dayTitle!).title;
    for (const el of all('[data-day-anchor]')) el.textContent = dayHeadline(plan, el.dataset.dayAnchor!).anchor;
  };
  paint();
  subscribe(paint);
}

/** A one-line-per-item summary of a day. */
export function dayLines(plan: PlanState, date: string): { time: string | null; label: string; href: string | null }[] {
  const { timed, anytime } = dayItems(plan, date);
  return [...timed, ...anytime].map((i) => ({ time: i.time, label: itemLabel(plan, i), href: placeView(plan, i.place)?.href ?? null }));
}

/** [data-day-preview=date]: what's planned, compactly. */
export function wireDayPreviews() {
  for (const el of all('[data-day-preview]')) {
    const date = el.dataset.dayPreview!;
    const max = Number(el.dataset.max ?? 4);
    mount(el, () => {
      const lines = dayLines(getPlan(), date);
      if (!lines.length) return html`<span class="t13 muted">Nothing planned yet</span>`;
      const shown = lines.slice(0, max);
      return html`<span class="preview-list">${shown.map(
        (l) => html`<span><span class="mono">${l.time ?? 'any'}</span> ${l.label}</span>`,
      )}${lines.length > max ? html`<span class="t13 muted">and ${lines.length - max} more</span>` : ''}</span>`;
    });
  }
}

/** Checkboxes with data-check="booking:id" / "prep:id", shared between phones. */
export function wireChecklists() {
  const inputs = all<HTMLInputElement>('input[data-check]');
  const paint = () => {
    const plan = getPlan();
    for (const input of inputs) {
      const done = plan.checks[input.dataset.check!];
      input.checked = Boolean(done);
      const row = input.closest<HTMLElement>('[data-check-row]');
      if (row) {
        row.classList.toggle('done', Boolean(done));
        const by = row.querySelector('[data-check-by]');
        if (by) by.textContent = done ? `Done · ${done.by}, ${ago(done.at)}` : '';
      }
    }
  };
  for (const input of inputs) {
    input.addEventListener('change', () => dispatch({ type: 'check.set', key: input.dataset.check!, done: input.checked }));
  }
  paint();
  subscribe(paint);
}

/** [data-feed=N]: the last N changes, newest first. */
export function wireFeeds() {
  for (const el of all('[data-feed]')) {
    const n = Number(el.dataset.feed);
    mount(el, () => {
      const items = getPlan().activity.slice(0, n);
      if (!items.length) return html`<li class="muted">No changes yet. Anything either of you changes shows up here.</li>`;
      return html`${items.map(
        (a) => html`<li><span class="w500">${a.by}</span> ${a.text} <span class="t13 muted">· ${ago(a.at)}</span></li>`,
      )}`;
    });
  }
}

/** Place rows ([data-place]): likely-open status, shared marks, and which days they're planned for. */
export function wirePlaceRows() {
  const rows = all('[data-place]');
  const paint = () => {
    const plan = getPlan();
    const now = jstNow();
    for (const row of rows) {
      const ref = row.dataset.place!;
      const open = row.querySelector<HTMLElement>('[data-open]');
      if (open && row.dataset.hours) {
        const hours = JSON.parse(row.dataset.hours) as Hours;
        const closed = (row.dataset.closed ?? '').split(',').filter(Boolean);
        // No hours on file: say nothing rather than guess.
        open.textContent = hours.length ? openLabel(openState(hours, closed, now), row.dataset.verified === 'true') : '';
      }
      const mark = plan.marks[ref]?.mark;
      if (mark) row.dataset.mark = mark;
      else delete row.dataset.mark;
      const tag = row.querySelector<HTMLElement>('[data-tag]');
      if (tag) {
        tag.hidden = !mark;
        tag.dataset.mark = mark ?? '';
        tag.textContent = mark ? MARK_LABEL[mark] : '';
      }
      const planned = row.querySelector<HTMLElement>('[data-planned]');
      if (planned) {
        const days = [...new Set(itemsForPlace(plan, ref).map((i) => shortDate(i.day)))];
        planned.hidden = !days.length;
        planned.textContent = days.length ? `Planned · ${days.join(', ')}` : '';
      }
    }
  };
  paint();
  subscribe(paint);
}

/** Want / Booked / Skip, shared. [data-marks=ref] holding buttons with data-mark. */
export function wireMarks() {
  for (const group of all('[data-marks]')) {
    const ref = group.dataset.marks!;
    const buttons = all<HTMLButtonElement>('button[data-mark]', group);
    const by = group.parentElement?.querySelector<HTMLElement>('[data-mark-by]');
    const paint = () => {
      const entry = getPlan().marks[ref];
      for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.mark === entry?.mark));
      if (by) by.textContent = entry ? `${MARK_LABEL[entry.mark]} · ${entry.by}, ${ago(entry.at)}` : '';
    };
    for (const b of buttons) {
      b.addEventListener('click', () => {
        const current = getPlan().marks[ref]?.mark;
        const mark = b.dataset.mark as Mark;
        dispatch({ type: 'mark.set', place: ref, mark: current === mark ? null : mark });
      });
    }
    paint();
    subscribe(paint);
  }
}

/** The day to suggest by default: today during the trip, otherwise the first day. */
export function defaultDay(): string {
  const today = jstNow().date;
  return DAYS.some((d) => d.date === today) ? today : DAYS[0].date;
}

/**
 * [data-add-to-plan=ref]: a form with a day select, optional time and a submit
 * button. [data-in-plan=ref] lists where that place already is.
 */
export function wireAddToPlan() {
  for (const form of all<HTMLFormElement>('form[data-add-to-plan]')) {
    const ref = form.dataset.addToPlan!;
    const select = form.querySelector<HTMLSelectElement>('select[name=day]')!;
    select.innerHTML = dayOptions(defaultDay()).value;
    const status = form.querySelector<HTMLElement>('[data-status]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const day = String(data.get('day'));
      const error = dispatch({
        type: 'item.add',
        id: newId(),
        day,
        place: ref,
        time: String(data.get('time') ?? '') || null,
      });
      if (status) status.textContent = error ?? `Added to ${shortDate(day)}.`;
      const time = form.querySelector<HTMLInputElement>('input[name=time]');
      if (!error && time) time.value = '';
    });
  }
  for (const el of all('[data-in-plan]')) {
    const ref = el.dataset.inPlan!;
    mount(el, () => {
      const items = itemsForPlace(getPlan(), ref);
      if (!items.length) return html`<p class="muted">Not in the plan yet.</p>`;
      return html`<ul class="inplan">${items.map(
        (i) => html`<li><a href="/day/${i.day}/"><span class="mono w500">${shortDate(i.day)}${i.time ? ` · ${i.time}` : ''}</span>${
          i.note ? html` <span class="muted">· ${i.note}</span>` : ''
        } <span class="t13 muted">added by ${i.by}</span></a></li>`,
      )}</ul>`;
    });
  }
}

