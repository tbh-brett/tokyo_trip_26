// Phone features, each wrapped so a refusal or an old browser just does nothing.
import { t } from './lang';

/** Keep the screen on while this page is visible (Show to staff). */
export function holdScreenOn() {
  let lock: WakeLockSentinel | null = null;
  const hold = async () => {
    if (!('wakeLock' in navigator) || lock) return;
    try {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => (lock = null));
    } catch {
      lock = null;
    }
  };
  void hold();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void hold();
  });
}

/** Copy text; falls back to the old selection trick for older iOS Safari. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      // Deprecated, but still the only copy path on older iOS Safari.
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

/** Wire every button[data-copy] on the page. */
export function wireCopyButtons() {
  for (const button of document.querySelectorAll<HTMLButtonElement>('button[data-copy]')) {
    button.addEventListener('click', async () => {
      const ok = await copyText(button.dataset.copy ?? '');
      const status = button.querySelector('[data-copy-status]');
      if (status) status.textContent = ok ? t('place.copied') : t('place.copyFail');
    });
  }
}
