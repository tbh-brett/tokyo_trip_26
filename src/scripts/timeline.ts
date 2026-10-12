// A day as a timeline: times on the left, a dotted line with hollow nodes,
// stops as white cards. Journeys from days.json ("legs") sit above the stop
// they lead to, and flights from trip.json are stops of their own. Used by the
// day pages (with edit controls) and by Today during the trip (read-only).
import { DAYS, FLIGHTS, LINE_BY_ID, type CatalogFlight, type CatalogLeg } from '../lib/catalog';
import { dayItems, itemLabel, type PlanItem, type PlanState } from '../lib/plan';
import { iconSvg } from '../lib/icons';
import { aboutMinutes } from '../i18n/ui';
import { lang, t } from './lang';
import { dayOptions, html, placeView, Safe } from './ui';

type Row =
  | { kind: 'stop'; item: PlanItem; movable: { up: boolean; down: boolean } | null }
  | { kind: 'leg'; leg: CatalogLeg }
  | { kind: 'flight'; flight: CatalogFlight };

/** Put the plan, the day's legs and its flights in order. */
function rows(plan: PlanState, day: string): { timed: Row[]; anytime: Row[]; tail: Row[] } {
  const legs = DAYS.find((d) => d.date === day)?.legs ?? [];
  const placed = new Set<CatalogLeg>();
  const take = (to: string): Row[] =>
    legs
      .filter((l) => l.to === to && !placed.has(l))
      .map((leg) => {
        placed.add(leg);
        return { kind: 'leg', leg };
      });
  const stop = (item: PlanItem, movable: { up: boolean; down: boolean } | null): Row[] => [
    ...(item.place ? take(item.place) : []),
    { kind: 'stop', item, movable },
  ];

  const { timed, anytime } = dayItems(plan, day);
  const arrive = FLIGHTS.find((f) => f.date === day && f.direction === 'outbound');
  const depart = FLIGHTS.find((f) => f.date === day && f.direction === 'return');
  // Flights join the clock. At the same minute, a flight goes first.
  const events: Array<{ time: string; rank: number; rows: () => Row[] }> = timed.map((item) => ({
    time: item.time!,
    rank: 1,
    rows: () => stop(item, null),
  }));
  if (arrive?.arrive) events.push({ time: arrive.arrive, rank: 0, rows: () => [{ kind: 'flight', flight: arrive }, ...take('hotel')] });
  if (depart?.depart) events.push({ time: depart.depart, rank: 0, rows: () => [...take('airport'), { kind: 'flight', flight: depart }] });
  events.sort((a, b) => a.time.localeCompare(b.time) || a.rank - b.rank);

  const timedRows = events.flatMap((e) => e.rows());
  const anytimeRows = anytime.flatMap((item, n) => stop(item, { up: n > 0, down: n < anytime.length - 1 }));
  // Going back to the hotel: on the day you fly out, right after the last
  // place you visit (the bags are there); otherwise it closes the day.
  const home = take('hotel');
  if (depart && home.length) {
    const flightAt = timedRows.findIndex((r) => r.kind === 'flight' && r.flight === depart);
    let at = flightAt;
    for (let i = flightAt - 1; i >= 0; i--) {
      const r = timedRows[i];
      if (r.kind === 'stop' && r.item.place) {
        at = i + 1;
        break;
      }
    }
    // The airport legs sit just before the flight; home goes before those too.
    const toAirport = (r: Row | undefined) => r?.kind === 'leg' && r.leg.to === 'airport';
    while (at > 0 && toAirport(timedRows[at - 1])) at--;
    timedRows.splice(at, 0, ...home);
    return { timed: timedRows, anytime: anytimeRows, tail: take('airport') };
  }
  return { timed: timedRows, anytime: anytimeRows, tail: [...home, ...take('airport')] };
}

const LEG_TONE = { train: 'mizu', walk: 'wakatake', taxi: 'yamabuki', plane: 'coral' } as const;

function legRow(leg: CatalogLeg): Safe {
  const zh = lang() === 'zh';
  const icon = new Safe(iconSvg(leg.mode));
  const lines = (leg.lines ?? []).map((id) => LINE_BY_ID.get(id)).filter((l) => l !== undefined);
  const pills = lines.length
    ? lines.map((l, i) => {
        const code = i === lines.length - 1 && leg.to_code ? `${leg.to_code} ` : '';
        return html`<span class="pill ${LEG_TONE[leg.mode]}">${i === 0 ? icon : ''}<span class="line-dot" style="--c:${l.colour}"></span>${code}${zh ? (l.name_zh ?? l.name) : l.name}</span>`;
      })
    : [html`<span class="pill ${LEG_TONE[leg.mode]}">${icon}${t(`leg.${leg.mode}`)}</span>`];
  const text = zh ? (leg.text_zh ?? leg.text_en) : leg.text_en;
  const route = leg.from_code && leg.to_code ? ` (${leg.from_code} → ${leg.to_code})` : '';
  return html`<span class="tl-time"></span><span class="tl-node"></span><div class="tl-body">
    <div class="leg-pills">${pills}</div>
    <p class="leg-text">${text}${route}${leg.minutes ? html` <span class="leg-mins">· ${aboutMinutes(leg.minutes, lang())}</span>` : ''}</p>
  </div>`;
}

function flightRow(f: CatalogFlight): Safe {
  const zh = lang() === 'zh';
  const out = f.direction === 'outbound';
  const airport = (out ? (zh ? f.to.name_zh : f.to.name_en) : zh ? f.from.name_zh : f.from.name_en) ?? '';
  return html`<span class="tl-time">${out ? f.arrive : f.depart}</span><span class="tl-node"></span><div class="tl-body">
    <div class="leg-pills"><span class="pill coral">${new Safe(iconSvg('plane'))}${t('leg.plane')}${f.number ? ` ${f.number}` : ''}</span></div>
    <p class="leg-text">${t(out ? 'tl.land' : 'tl.fly', { airport })}${f.who.length ? html` <span class="leg-mins">· ${t('flight.only', { names: f.who.join(t('list.sep')) })}</span>` : ''}</p>
  </div>`;
}

function controls(item: PlanItem, movable: { up: boolean; down: boolean } | null, href: string | null): Safe {
  return html`<div class="controls">
    <form data-form="item" data-id="${item.id}">
      <div class="row2">
        <label class="field"><span>${t('item.time')}</span><input type="time" name="time" value="${item.time ?? ''}" /></label>
        <label class="field"><span>${t('item.day')}</span><select name="day">${dayOptions(item.day)}</select></label>
      </div>
      <label class="field"><span>${t('item.note')}</span><textarea name="note" rows="2" maxlength="500" placeholder="${t('item.notePh')}">${item.note ?? ''}</textarea></label>
      <button class="btn small primary" type="submit">${t('item.save')}</button>
    </form>
    <div class="btn-row">
      ${movable ? html`<button class="btn small" type="button" data-action="up" data-id="${item.id}" ${movable.up ? '' : new Safe('disabled')}>${t('item.up')}</button>
        <button class="btn small" type="button" data-action="down" data-id="${item.id}" ${movable.down ? '' : new Safe('disabled')}>${t('item.down')}</button>` : ''}
      ${href ? html`<a class="btn small" href="${href}">${t('item.open')}</a>` : ''}
      <button class="btn small" type="button" data-action="remove" data-id="${item.id}">${t('item.remove')}</button>
    </div>
  </div>`;
}

function stopRow(plan: PlanState, row: Extract<Row, { kind: 'stop' }>, must: string[], editable: boolean): Safe {
  const { item } = row;
  const place = placeView(plan, item.place);
  const label = itemLabel(plan, item);
  const isMust = Boolean(item.place && must.includes(item.place));
  return html`<span class="tl-time">${item.time ?? ''}</span><span class="tl-node"></span><div class="tl-body"><div class="tl-card">
    ${isMust ? html`<span class="tag coral mustgo">${t('tl.mustGo')}</span>` : ''}
    <p class="name">${place ? html`<a href="${place.href}">${label}</a>` : label}</p>
    ${place?.nameJa ? html`<span class="ja" lang="ja">${place.nameJa}</span>` : ''}
    ${item.note ? html`<p class="note">${item.note}</p>` : ''}
    ${
      editable
        ? html`<details data-key="${item.id}"><summary class="meta"><span class="t13 muted">${t('item.addedBy', { name: item.by })}</span><span class="linkish t13">${t('item.edit')}</span></summary>${controls(item, row.movable, place?.href ?? null)}</details>`
        : html`<p class="meta"><span class="t13 muted">${t('item.addedBy', { name: item.by })}</span></p>`
    }
  </div></div>`;
}

/**
 * The whole timeline for a day. `enter` adds the bounce-in, for the first
 * paint only, so live updates don't make everything jump again.
 */
export function renderTimeline(plan: PlanState, day: string, opts: { editable: boolean; enter: boolean }): Safe {
  const must = DAYS.find((d) => d.date === day)?.must ?? [];
  const { timed, anytime, tail } = rows(plan, day);
  let i = 0;
  const li = (row: Row) => {
    const cls = row.kind === 'stop' ? (row.item.place ? 'tl-stop' : 'tl-stop tl-plain') : row.kind === 'leg' ? 'tl-leg' : 'tl-leg tl-flight';
    const body = row.kind === 'stop' ? stopRow(plan, row, must, opts.editable) : row.kind === 'leg' ? legRow(row.leg) : flightRow(row.flight);
    return html`<li class="${cls}${opts.enter ? ' enter' : ''}" style="--i:${i++}">${body}</li>`;
  };
  const hasStops = timed.some((r) => r.kind === 'stop') || anytime.length > 0;
  return html`
    ${timed.length ? html`<ol class="tl">${timed.map(li)}</ol>` : ''}
    ${!hasStops ? html`<p class="empty muted">${t('day.empty')}</p>` : ''}
    ${anytime.length ? html`${timed.length ? html`<h3 class="tl-sub">${t('day.anyTime')}</h3>` : ''}<ol class="tl">${anytime.map(li)}</ol>` : ''}
    ${tail.length && hasStops ? html`<ol class="tl">${tail.map(li)}</ol>` : ''}`;
}
