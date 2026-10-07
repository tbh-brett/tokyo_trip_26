// Lines in the "Latest changes" feed. Each change is stored as a kind plus
// its details, so every phone can show it in its own language. Older entries
// only have English text; they show as they are.
import { dateIn, MARK_TEXT, pick, ui, type Lang, type UIKey } from '../i18n/ui';
import { CHECKS, CHECKS_ZH } from './catalog';

export type ActKind =
  | 'item.add'
  | 'item.move'
  | 'item.time'
  | 'item.untime'
  | 'item.note'
  | 'item.unnote'
  | 'item.remove'
  | 'place.add'
  | 'place.edit'
  | 'place.remove'
  | 'mark.set'
  | 'mark.clear'
  | 'day.edit'
  | 'day.reset'
  | 'check.on'
  | 'check.off';

export interface ActArgs {
  label?: string; // what changed: a place's name or an item's title
  day?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD, when moved
  time?: string; // HH:MM the item is now at
  t?: string; // HH:MM, for "set … for"
  mark?: 'want' | 'booked' | 'skip';
  key?: string; // checklist key
  note?: string;
  withNote?: string; // "1" when a note changed alongside
}

export function activityText(act: { k?: string; a?: ActArgs; text?: string }, lang: Lang): string {
  if (!act.k || !act.a) return act.text ?? '';
  const a = act.a;
  let text = ui(`act.${act.k}` as UIKey, lang, {
    label: a.label ?? '',
    note: a.note ?? '',
    t: a.t ?? '',
    day: a.day ? dateIn(a.day, lang) : '',
    to: a.to ? dateIn(a.to, lang) : '',
    time: a.time ? ui('act.at', lang, { t: a.time }) : '',
    mark: a.mark ? pick(MARK_TEXT[a.mark], lang) : '',
    check: a.key ? ((lang === 'zh' ? CHECKS_ZH.get(a.key) : undefined) ?? CHECKS.get(a.key) ?? a.key) : '',
  });
  if (a.withNote) text += ui('act.withNote', lang);
  return text;
}
