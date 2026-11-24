const VERSION_STORAGE_KEY = 'fysio_installed_version_v1';
const JUST_UPDATED_SESSION_KEY = 'fysio_just_updated_flag';

export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_LABEL = __APP_BUILD_LABEL__;

type UpdateListener = (hasUpdate: boolean) => void;

let registrationRef: ServiceWorkerRegistration | null = null;
let waitingWorker: ServiceWorker | null = null;
let reloading = false;
const listeners = new Set<UpdateListener>();

function notifyListeners(hasUpdate: boolean): void {
  listeners.forEach((cb) => cb(hasUpdate));
}

function watchInstallingWorker(worker: ServiceWorker): void {
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      waitingWorker = worker;
      notifyListeners(true);
    }
  });
}

/**
 * Registers the PWA Service Worker and watches for incoming updates on load
 * and whenever the user returns to the app.
 */
export function initPwaUpdates(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        registrationRef = reg;

        if (reg.waiting) {
          waitingWorker = reg.waiting;
          notifyListeners(true);
        }

        if (reg.installing) {
          watchInstallingWorker(reg.installing);
        }

        reg.addEventListener('updatefound', () => {
          if (reg.installing) {
            watchInstallingWorker(reg.installing);
          }
        });

        // Re-check for updates whenever user switches back to the PWA
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            void reg.update().catch(() => {});
          }
        });
      })
      .catch(() => {
        // Service worker registration failed gracefully
      });
  });
}

export function subscribePwaUpdate(listener: UpdateListener): () => void {
  listeners.add(listener);
  if (waitingWorker) {
    listener(true);
  }
  return () => {
    listeners.delete(listener);
  };
}

/** Activates the waiting Service Worker and reloads the app cleanly */
export function applyPwaUpdate(): void {
  try {
    sessionStorage.setItem(JUST_UPDATED_SESSION_KEY, '1');
  } catch {
    // Ignore storage errors
  }

  if (waitingWorker) {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    // Safety fallback reload in case controllerchange doesn't fire
    window.setTimeout(() => {
      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    }, 1800);
  } else {
    window.location.reload();
  }
}

/** Manually checks GitHub Pages for a newer Service Worker */
export async function checkForPwaUpdate(): Promise<'update-found' | 'up-to-date' | 'unavailable'> {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return 'unavailable';
  }

  try {
    const reg =
      registrationRef ?? (await navigator.serviceWorker.getRegistration('./'));
    if (!reg) return 'unavailable';
    registrationRef = reg;

    await reg.update();

    if (reg.waiting) {
      waitingWorker = reg.waiting;
      notifyListeners(true);
      return 'update-found';
    }

    if (reg.installing) {
      const installing = reg.installing;
      watchInstallingWorker(installing);
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' || installing.state === 'redundant') {
            done();
          }
        });
        window.setTimeout(done, 4000);
      });

      if (reg.waiting) {
        waitingWorker = reg.waiting;
        notifyListeners(true);
        return 'update-found';
      }
    }

    return 'up-to-date';
  } catch {
    return 'unavailable';
  }
}

/**
 * Checks once on app startup if the app just updated to a newer version
 * (either via the "Uppdatera nu" button or an automatic PWA reload).
 */
export function consumeUpdateConfirmation(): boolean {
  try {
    const explicitFlag = sessionStorage.getItem(JUST_UPDATED_SESSION_KEY) === '1';
    if (explicitFlag) {
      sessionStorage.removeItem(JUST_UPDATED_SESSION_KEY);
    }

    const previousVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);

    if (explicitFlag) return true;
    if (previousVersion && previousVersion !== APP_VERSION) return true;
  } catch {
    // Ignore storage errors
  }
  return false;
}
