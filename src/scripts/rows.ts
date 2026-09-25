// Live bits on place rows: "likely open" status and this device's marks.
import { MARK_LABEL, readMarks } from '../lib/marks';
import { jstNow, openLabel, openState, type Hours } from '../lib/time';

export function refreshRows(root: ParentNode = document): void {
  const now = jstNow();
  const marks = readMarks();
  for (const row of root.querySelectorAll<HTMLElement>('[data-place]')) {
    const open = row.querySelector<HTMLElement>('[data-open]');
    if (open) {
      const hours = JSON.parse(row.dataset.hours ?? '[]') as Hours;
      const closed = (row.dataset.closed ?? '').split(',').filter(Boolean);
      open.textContent = openLabel(openState(hours, closed, now), row.dataset.verified === 'true');
    }
    const mark = marks[row.dataset.place ?? ''];
    const tag = row.querySelector<HTMLElement>('[data-tag]');
    if (mark) row.dataset.mark = mark;
    else delete row.dataset.mark;
    if (tag) {
      tag.hidden = !mark;
      tag.dataset.mark = mark ?? '';
      tag.textContent = mark ? MARK_LABEL[mark] : '';
    }
  }
}

export function watchRows(): void {
  refreshRows();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshRows();
  });
  // Back/forward cache restores the old page; marks may have changed on the detail page.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) refreshRows();
  });
}
