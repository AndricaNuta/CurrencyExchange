// src/services/alertsSync.ts
const WORKER_URL = 'https://rates-alerts.currensee.workers.dev';

type FavoritePair = { id: string; base: string; quote: string; alerts: {
  above: number|null; below: number|null; onChangePct: number|null; enabled?: boolean
}};

export async function registerDeviceToken(token: string, userId?: string) {
  await fetch(`${WORKER_URL}/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      token,
      userId
    }),
  });
}

export async function syncRules(token: string, favorites: FavoritePair[]) {
  const rules = favorites.flatMap(fav => {
    const pair = `${fav.base}/${fav.quote}`;
    const enabled = true;
    const out: any[] = [];
    if (fav.alerts.above != null) out.push({
      id: cryptoRandomId(),
      pair,
      mode: 'value',
      dir: 'above',
      threshold: fav.alerts.above,
      enabled
    });
    if (fav.alerts.below != null) out.push({
      id: cryptoRandomId(),
      pair,
      mode: 'value',
      dir: 'below',
      threshold: fav.alerts.below,
      enabled
    });
    if (fav.alerts.onChangePct != null) {
      out.push({
        id: cryptoRandomId(),
        pair,
        mode: 'percent',
        dir: 'up',
        threshold: fav.alerts.onChangePct,
        enabled
      });
      out.push({
        id: cryptoRandomId(),
        pair,
        mode: 'percent',
        dir: 'down',
        threshold: fav.alerts.onChangePct,
        enabled
      });
    }
    return out;
  });

  await fetch(`${WORKER_URL}/prefs/rules`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      token,
      rules
    }),
  });
}

// simple id helper (stable enough for now)
function cryptoRandomId() {
  // in RN you can use `global.crypto?.randomUUID?.()` on newer stacks; fallback:
  return 'r_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
