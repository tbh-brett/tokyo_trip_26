// This phone's language. The choice is made before the page paints (an inline
// script in Base.astro reads the same key), so there's no flash of English.
import { dateIn, ui, type Lang, type UIKey } from '../i18n/ui';

const KEY = 'tokyo2026:lang';
const listeners = new Set<() => void>();

export const lang = (): Lang => (document.documentElement.dataset.lang === 'zh' ? 'zh' : 'en');
export const t = (key: UIKey, vars?: Record<string, string | number>) => ui(key, lang(), vars);
export const date = (iso: string) => dateIn(iso, lang());

export function onLang(fn: () => void) {
  listeners.add(fn);
}

export function setLang(next: Lang) {
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // fine: it applies for this page view
  }
  applyLang();
  for (const fn of listeners) fn();
}

/** Attributes and the title, which CSS can't switch: data-ph-en/zh, data-aria-en/zh, meta title-en/zh. */
export function applyLang() {
  const l = (() => {
    try {
      return localStorage.getItem(KEY) === 'zh' ? 'zh' : 'en';
    } catch {
      return lang();
    }
  })();
  const html = document.documentElement;
  html.dataset.lang = l;
  html.lang = l === 'zh' ? 'zh-Hant' : 'en';
  const title = document.querySelector<HTMLMetaElement>(`meta[name="title-${l}"]`)?.content;
  if (title) document.title = title;
  for (const el of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-ph-en]')) {
    el.placeholder = (l === 'zh' ? el.dataset.phZh : el.dataset.phEn) ?? '';
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-aria-en]')) {
    el.setAttribute('aria-label', (l === 'zh' ? el.dataset.ariaZh : el.dataset.ariaEn) ?? '');
  }
  // <option> can only hold plain text, so CSS can't switch it.
  for (const el of document.querySelectorAll<HTMLElement>('[data-text-en]')) {
    el.textContent = (l === 'zh' ? el.dataset.textZh : el.dataset.textEn) ?? '';
  }
}
