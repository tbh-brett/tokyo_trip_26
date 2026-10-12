// Pictograms in the picture-book line: drawn on a 24px grid, ink stroke,
// round ends. Used by Icon.astro on the build and by browser code
// (timeline legs), so they're plain strings. Always beside words, never alone.

const ICONS = {
  plane:
    '<path d="M12 2.8c.9 0 1.5.9 1.5 2.2v4.6l7.2 4.1v2.1l-7.2-2.2v4.4l2.3 1.7v1.8L12 20.6l-3.8.9v-1.8l2.3-1.7v-4.4l-7.2 2.2v-2.1l7.2-4.1V5c0-1.3.6-2.2 1.5-2.2z"/>',
  train:
    '<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M8.5 7h7v4h-7z"/><path d="M8 18l-2 3M16 18l2 3"/><circle cx="9" cy="14.5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14.5" r="1" fill="currentColor" stroke="none"/>',
  walk: '<circle cx="13" cy="4.3" r="2"/><path d="M12.3 8.5l-1.6 6 3 3V21M10.7 14.5L8.5 21M11.8 9.8L8.6 12.3M12.4 9.2l2.6 3 2.4.3"/>',
  taxi: '<path d="M3.5 16v-3.4L6 8h12l2.5 4.6V16z"/><path d="M10 8V5.5h4V8M3.5 12.6h17"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
  check: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M8 12.3l2.8 2.8L16.4 9"/>',
  house: '<path d="M3.5 11.5L12 4.3l8.5 7.2"/><path d="M6 9.8v9.7h12V9.8"/><path d="M10.3 19.5v-5h3.4v5"/>',
  star: '<path d="M12 3.6l2.5 5.2 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="3.5"/><path d="M4 10.2h16M8.5 3.5v4M15.5 3.5v4"/>',
  chat: '<path d="M5.5 5h13a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5H12l-4.5 3.5V17H5.5A2.5 2.5 0 013 14.5v-7A2.5 2.5 0 015.5 5z"/>',
  phone: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.8"/><path d="M11 17.6h2"/>',
  sparkle:
    '<path d="M11 3.5c.6 4 2.5 6 6.5 6.5-4 .6-5.9 2.5-6.5 6.5-.6-4-2.5-5.9-6.5-6.5 4-.5 5.9-2.5 6.5-6.5z"/><path d="M18 15c.2 1.5 1 2.3 2.5 2.5-1.5.2-2.3 1-2.5 2.5-.2-1.5-1-2.3-2.5-2.5 1.5-.2 2.3-1 2.5-2.5z"/>',
  pin: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0113 0c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  book: '<path d="M4 5.5c3-1 5.5-.8 8 1 2.5-1.8 5-2 8-1v13c-3-1-5.5-.8-8 1-2.5-1.8-5-2-8-1z"/><path d="M12 6.5v13"/>',
  list: '<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="4.8" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.8" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.8" cy="17" r="1.1" fill="currentColor" stroke="none"/>',
} as const;

export type IconName = keyof typeof ICONS;

/** An inline <svg>. Decorative: the words beside it carry the meaning. */
export const iconSvg = (name: IconName) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
