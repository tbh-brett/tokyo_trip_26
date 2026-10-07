// "Ask Claude" links. They open a new Claude chat with the question typed in,
// ready to review and send. No API key, nothing to run: it's your own Claude.

import { BASE, DAYS } from './catalog';
import { shortDate } from './time';

const first = DAYS[0].date;
const last = DAYS[DAYS.length - 1].date;
const TRIP = `We are two people in Tokyo from ${shortDate(first).slice(4)} to ${shortDate(last).slice(4)} ${last.slice(0, 4)}, staying in Soto-Kanda near ${BASE.name_en} station (${BASE.code}).`;

/** The GitHub repo the site is built from, for "change the site" requests. */
export const REPO = 'tbh-brett/tokyo_trip_26';

export const askClaudeUrl = (question: string) => `https://claude.ai/new?q=${encodeURIComponent(question)}`;

/** Opens Claude Code on the web on this repo, for research and data changes. */
export const claudeCodeUrl = (prompt: string) =>
  `https://claude.ai/code?prompt=${encodeURIComponent(prompt)}&repositories=${encodeURIComponent(REPO)}`;

export function askAboutPlace(p: { name: string; nameJa?: string | null; address?: string | null; why?: string | null }): string {
  const where = [p.nameJa && p.nameJa !== p.name ? p.nameJa : null, p.address].filter(Boolean).join(', ');
  return askClaudeUrl(
    [
      TRIP,
      `We're thinking of going to ${p.name}${where ? ` (${where})` : ''}.`,
      p.why ? `Our notes say: ${p.why}` : '',
      'What should we know before going: what to order or see, how busy it gets and when, whether we need cash or a booking, and what nearby is worth pairing with it? Please check current opening hours if you can.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  );
}

export function askAboutDay(day: string, headline: string, lines: string[]): string {
  return askClaudeUrl(
    [
      TRIP,
      `Our plan for ${day}: ${headline}`,
      lines.length ? lines.map((l) => `- ${l}`).join('\n') : '(nothing specific planned yet)',
      'Does the order make sense for getting around by train and on foot? What are we missing, and where should we eat along the way? Flag anything likely to be closed that day.',
    ].join('\n\n'),
  );
}
