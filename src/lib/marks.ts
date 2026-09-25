// Want / Booked / Skip marks, per device. Losing them is acceptable, so every
// storage call is wrapped: private mode or blocked storage just means no marks.

export const MARKS = ['want', 'booked', 'skip'] as const;
export type Mark = (typeof MARKS)[number];
export const MARK_LABEL: Record<Mark, string> = { want: 'Want', booked: 'Booked', skip: 'Skip' };

const KEY = 'tokyo2026:marks';

export function readMarks(): Record<string, Mark> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, Mark>) : {};
  } catch {
    return {};
  }
}

export function writeMark(id: string, mark: Mark | null): void {
  try {
    const marks = readMarks();
    if (mark) marks[id] = mark;
    else delete marks[id];
    localStorage.setItem(KEY, JSON.stringify(marks));
  } catch {
    // Storage unavailable; the mark just won't stick.
  }
}
