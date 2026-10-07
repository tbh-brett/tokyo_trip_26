// "Ask Claude" links. They open a new Claude chat with the question typed in,
// ready to review and send, in the phone's language. No API key, nothing to
// run: it's your own Claude. The wording lives in src/i18n/ui.ts (ask.*).
import { rangeIn, ui, type Lang } from '../i18n/ui';
import { BASE, DAYS } from './catalog';

const first = DAYS[0].date;
const last = DAYS[DAYS.length - 1].date;

const trip = (lang: Lang) =>
  ui('ask.trip', lang, {
    range: rangeIn(first, last, lang),
    station: lang === 'zh' ? BASE.name_ja : BASE.name_en,
    code: BASE.code,
  });

/** The GitHub repo the site is built from, for "change the site" requests. */
export const REPO = 'tbh-brett/tokyo_trip_26';

export const askClaudeUrl = (question: string) => `https://claude.ai/new?q=${encodeURIComponent(question)}`;

/** Opens Claude Code on the web on this repo, for research and data changes. */
export const claudeCodeUrl = (prompt: string) =>
  `https://claude.ai/code?prompt=${encodeURIComponent(prompt)}&repositories=${encodeURIComponent(REPO)}`;

export function askAboutPlace(
  p: { name: string; nameJa?: string | null; address?: string | null; why?: string | null },
  lang: Lang = 'en',
): string {
  const where = [p.nameJa && p.nameJa !== p.name ? p.nameJa : null, p.address].filter(Boolean).join(ui('list.sep', lang));
  return askClaudeUrl(
    [
      trip(lang),
      ui('ask.going', lang, { name: p.name, where: where ? ui('ask.where', lang, { where }) : '' }),
      p.why ? ui('ask.notes', lang, { why: p.why }) : '',
      ui('ask.placeQ', lang),
    ]
      .filter(Boolean)
      .join('\n\n'),
  );
}

export function askAboutDay(day: string, headline: string, lines: string[], lang: Lang = 'en'): string {
  return askClaudeUrl(
    [
      trip(lang),
      ui('ask.dayPlan', lang, { day, headline }),
      lines.length ? lines.map((l) => `- ${l}`).join('\n') : ui('ask.dayNone', lang),
      ui('ask.dayQ', lang),
    ].join('\n\n'),
  );
}
