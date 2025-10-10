
export interface Env {
  KV: KVNamespace;
  FCM_SERVICE_ACCOUNT_JSON: string; // wrangler secret
  FCM_PROJECT_ID: string;           // wrangler var, e.g. "currensee-5214a"
}

/** ===== Types ===== */
type Favorite = { id: string; pair: string; label?: string; createdAt: number; updatedAt: number; };
type Rule = {
  id: string;
  pair: string;               // "USD/EUR"
  mode: "value" | "percent";  // compare to number vs day-over-day %
  dir: "above" | "below" | "up" | "down";
  threshold: number;
  enabled: boolean;
  lastNotifiedDay?: string;
  createdAt: number;
  updatedAt: number;
};
type DevicePrefs = {
  token: string; userId?: string;
  favorites: Favorite[];
  rules: Rule[];
  updatedAt: number; version: number;
};

const TOKENS_INDEX = "idx:tokens";
const DEVKEY = (t: string) => `dev:${t}`;
const now = () => Date.now();

const json = (d: any, s = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: {
      'content-type': 'application/json',
      ...extraHeaders
    }
  });

/** ===== FCM HTTP v1 auth (JWT → OAuth token) ===== */
async function getAccessToken(env: Env): Promise<string> {
  const cached = await env.KV.get("fcm:token");
  if (cached) return cached;

  const svc = JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON);
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const iat = Math.floor(Date.now() / 1000);
  const claim = {
    iss: svc.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp: iat + 3600
  };

  const enc = (obj: any) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj))))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/,'');
  const toArrayBuffer = (pem: string) => {
    const b64 = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g,'').replace(/\s+/g,'');
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return raw.buffer;
  };

  const input = `${enc(header)}.${enc(claim)}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    toArrayBuffer(svc.private_key),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/[=]+$/,'');
  const assertion = `${input}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type":"application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const {
    access_token, expires_in
  } = await res.json();
  await env.KV.put("fcm:token", access_token, {
    expirationTtl: Math.max(60, Math.min(3300, (expires_in || 3600) - 300))
  });
  return access_token;
}

async function sendFCM(env: Env, token: string, title: string, body: string, data?: Record<string,string>) {
  const accessToken = await getAccessToken(env);
  const url = `https://fcm.googleapis.com/v1/projects/${env.FCM_PROJECT_ID}/messages:send`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: {
        token,
        notification: {
          title,
          body
        },
        data: data ?? {}
      }
    })
  });
  if (!resp.ok) throw new Error(await resp.text());
}

/** ===== Rates (spot + yesterday) ===== */
async function getRates(pairs: string[]) {
  // pairs like ["USD/EUR","EUR/GBP"]
  const bases = new Set<string>(), quotes = new Set<string>();
  for (const p of pairs) { const [b,q] = p.split("/"); bases.add(b); quotes.add(q); }
  const qlist = Array.from(quotes).join(",");

  const spot: Record<string,number> = {}, yday: Record<string,number> = {};

  const prevBusinessDay = () => {
    // frankfurter uses banking days; step back until weekday (simple heuristic)
    let d = new Date(); d.setDate(d.getDate() - 1);
    while ([0,6].includes(d.getUTCDay())) d.setDate(d.getDate() - 1); // Sun/Sat
    return d.toISOString().slice(0,10);
  };

  async function fetchDay(date: "latest" | string, target: Record<string,number>) {
    for (const base of bases) {
      const url = date === "latest"
        ? `https://api.frankfurter.app/latest?from=${base}&to=${qlist}`
        : `https://api.frankfurter.app/${date}?from=${base}&to=${qlist}`;
      const r = await fetch(url);
      if (!r.ok) { console.log("RATES_ERR", date, base, await r.text()); continue; }
      const j = await r.json();
      for (const [q,v] of Object.entries<number>(j.rates ?? {})) {
        target[`${base}/${q}`] = v;
      }
    }
  }

  const yDate = prevBusinessDay();
  await fetchDay("latest", spot);
  await fetchDay(yDate, yday);
  return {
    spot,
    yday
  };
}

function shouldNotify(rule: Rule, spot?: number, prev?: number) {
  if (spot == null || rule.enabled === false) return false;
  if (rule.mode === "value") {
    if (rule.dir === "above") return spot >= rule.threshold;
    if (rule.dir === "below") return spot <= rule.threshold;
    return false;
  } else {
    if (prev == null) return false;
    const pct = ((spot - prev) / prev) * 100;
    if (rule.dir === "up")   return pct >=  rule.threshold;
    if (rule.dir === "down") return pct <= -rule.threshold;
    return false;
  }
}

/** ===== KV helpers ===== */
async function loadPrefs(env: Env, token: string): Promise<DevicePrefs|null> {
  const raw = await env.KV.get(DEVKEY(token)); return raw ? JSON.parse(raw) : null;
}
async function savePrefs(env: Env, prefs: DevicePrefs) {
  prefs.updatedAt = now(); prefs.version = (prefs.version ?? 0) + 1;
  await env.KV.put(DEVKEY(prefs.token), JSON.stringify(prefs));
}
async function loadTokensIndex(env: Env): Promise<string[]> {
  const raw = await env.KV.get(TOKENS_INDEX); return raw ? JSON.parse(raw) : [];
}
async function saveTokensIndex(env: Env, tokens: string[]) {
  await env.KV.put(TOKENS_INDEX, JSON.stringify(tokens));
}

/** ===== The alert run (shared by cron & /run-once) ===== */
type RuleDecision = {
  ruleId: string;
  pair: string;
  mode: Rule["mode"];
  dir: Rule["dir"];
  threshold: number;
  val?: number;
  prev?: number;
  pct?: number;
  lastNotifiedDay?: string;
  should: boolean;
  skippedReason?: string;
  sent?: boolean;
  error?: string;
  title?: string;
  body?: string;
};
type DeviceRun = { token: string; countEnabled: number; decisions: RuleDecision[] };

async function runAlerts(env: Env, debug = false): Promise<DeviceRun[]> {
  const today = new Date().toISOString().slice(0,10);
  const tokens = await loadTokensIndex(env);
  if (!tokens.length) return [];

  const devices: DevicePrefs[] = [];
  const pairs = new Set<string>();
  for (const t of tokens) {
    const p = await loadPrefs(env, t);
    if (!p || !p.rules?.length) continue;
    devices.push(p);
    for (const r of p.rules) if (r.enabled) pairs.add(r.pair);
  }
  if (!pairs.size) return [];

  const {
    spot, yday
  } = await getRates([...pairs]);

  const result: DeviceRun[] = [];

  for (const d of devices) {
    const decisions: RuleDecision[] = [];
    let changed = false;

    for (const r of d.rules) {
      if (!r.enabled) { decisions.push({
        ruleId: r.id,
        pair: r.pair,
        mode: r.mode,
        dir: r.dir,
        threshold: r.threshold,
        should: false,
        skippedReason: "disabled",
        lastNotifiedDay: r.lastNotifiedDay
      }); continue; }

      const val  = spot[r.pair];
      const prev = yday[r.pair];
      const pct  = (val!=null && prev!=null) ? ((val - prev) / prev) * 100 : undefined;

      const match = shouldNotify(r, val, prev);
      const dec: RuleDecision = {
        ruleId: r.id,
        pair: r.pair,
        mode: r.mode,
        dir: r.dir,
        threshold: r.threshold,
        val,
        prev,
        pct,
        lastNotifiedDay: r.lastNotifiedDay,
        should: match
      };

      if (!match) {
        dec.skippedReason = "condition_false";
        decisions.push(dec);
        continue;
      }

      if (r.lastNotifiedDay === today) {
        dec.skippedReason = "already_sent_today";
        decisions.push(dec);
        continue;
      }

      let title: string;
      let body: string;

      if (r.mode === "value") {
        title = `💱 ${r.pair} Update`;
        if (r.dir === "above") {
          body = `Your followed rate ${r.pair} just hit ${val?.toFixed(4)} 🔼 — above your alert threshold of ${r.threshold}`;
        } else {
          body = `Your watched rate ${r.pair} just fell to ${val?.toFixed(4)} 🔻 — below your alert threshold of ${r.threshold}`;
        }
      } else {
        title = `📈 ${r.pair} Movement`;
        if (r.dir === "up") {
          body = `Your watched rate ${r.pair} rose by +${pct?.toFixed(2)}% since yesterday — trending up! 📈`;
        } else {
          body = `Your followed rate ${r.pair} dropped by ${pct?.toFixed(2)}% — market dip detected 📉`;
        }
      }

      body += " Tap to check the latest rates 📊";

      dec.title = title; dec.body = body;

      try {
        await sendFCM(env, d.token, title, body, {
          screen: "Rates",
          pair: r.pair,
          ruleId: r.id
        });
        r.lastNotifiedDay = today;
        r.updatedAt = Date.now();
        changed = true;
        dec.sent = true;
        console.log("ALERT_FIRE", {
          token: d.token.slice(0,12)+"…",
          ruleId: r.id,
          pair: r.pair,
          val,
          prev,
          pct
        });
      } catch (e: any) {
        dec.error = String(e?.message || e);
        console.log("ALERT_ERR", {
          token: d.token.slice(0,12)+"…",
          ruleId: r.id,
          err: dec.error
        });
      }

      decisions.push(dec);
    }

    if (changed) await savePrefs(env, d);
    result.push({
      token: d.token,
      countEnabled: d.rules.filter(x=>x.enabled).length,
      decisions
    });
  }

  return result;
}

/** ===== HTTP + Cron ===== */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method.toUpperCase();
    const path = url.pathname.replace(/\/+$/, '') || '/';
    console.log('REQ', method, path);

    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS,PATCH,DELETE',
      'access-control-allow-headers': 'content-type,authorization,x-run-secret',
      'content-type': 'application/json'
    };
    if (method === 'OPTIONS') return new Response(null, {
      headers: cors
    });

    // Health
    if (method === 'GET' && path === '/health') {
      return json({
        ok: true,
        now: Date.now()
      }, 200, cors);
    }

    // Simple ping send (manual)
    if (method === 'POST' && path === '/test-ping') {
      const body = await req.json().catch(()=>({})) as any;
      const {
        token, title = "Ping 🔔", body: b = "Hello"
      } = body || {};
      if (!token) return json({
        error: "token required"
      }, 400, cors);
      try {
        await sendFCM(env, token, title, b, {
          screen: "Rates",
          test: "1"
        });
        console.log("PING_SENT", {
          token: token.slice(0,12)+"…"
        });
        return json({
          ok: true
        }, 200, cors);
      } catch (e: any) {
        console.log("PING_FAIL", String(e?.message || e));
        return json({
          ok: false,
          error: String(e?.message || e)
        }, 200, cors);
      }
    }

    // Manual alert run (with optional debug view)
    if ((method === 'GET' || method === 'POST') && path === '/run-once') {
      const debug = url.searchParams.get("debug") === "1";
      const res = await runAlerts(env, debug);
      return json(debug ? {
        ok: true,
        run: res
      } : {
        ok: true
      }, 200, cors);
    }

    // Read raw rates for quick verification
    if (method === 'GET' && path === '/rates') {
      const q = url.searchParams.get("pairs") || "";
      const list = q.split(",").map(s => s.trim()).filter(Boolean);
      const data = await getRates(list);
      return json({
        ok: true,
        ...data
      }, 200, cors);
    }

    // Register
    if (method === "POST" && path === "/register") {
      const body = await req.json().catch(()=>({})) as { token?: string; userId?: string };
      const {
        token, userId
      } = body;
      if (!token) return json({
        error: "token required"
      }, 400, cors);

      const existing = await loadPrefs(env, token);
      const prefs: DevicePrefs = existing ?? {
        token,
        userId,
        favorites: [],
        rules: [],
        updatedAt: now(),
        version: 0
      };
      if (userId) prefs.userId = userId;
      await savePrefs(env, prefs);

      const idx = await loadTokensIndex(env);
      if (!idx.includes(token)) { idx.push(token); await saveTokensIndex(env, idx); }

      return json({
        ok: true
      }, 200, cors);
    }

    // Unregister
    if (method === "POST" && path === "/unregister") {
      const body = await req.json().catch(()=>({})) as { token?: string };
      const {
        token
      } = body;
      if (!token) return json({
        error: "token required"
      }, 400, cors);
      await env.KV.delete(DEVKEY(token));
      const idx = (await loadTokensIndex(env)).filter(t => t !== token);
      await saveTokensIndex(env, idx);
      return json({
        ok: true
      }, 200, cors);
    }

    // Get prefs
    if (method === "GET" && path === "/prefs") {
      const token = url.searchParams.get("token") || "";
      const prefs = await loadPrefs(env, token);
      return prefs ? json(prefs, 200, cors) : json({
        error: "not found"
      }, 404, cors);
    }

    // Replace rules
    if (method === "POST" && path === "/prefs/rules") {
      const body = await req.json().catch(()=>({})) as { token?: string; rules?: any[] };
      const {
        token, rules
      } = body;
      if (!token || !Array.isArray(rules)) return json({
        error: "token + rules[] required"
      }, 400, cors);
      const prefs = await loadPrefs(env, token); if (!prefs) return json({
        error: "device not registered"
      }, 404, cors);

      prefs.rules = rules.map(r => ({
        id: r.id ?? (crypto as any).randomUUID?.() ?? `r_${Math.random().toString(36).slice(2)}`,
        pair: String(r.pair),
        mode: r.mode === "percent" ? "percent" : "value",
        dir: r.dir,
        threshold: Number(r.threshold),
        enabled: r.enabled !== false,
        lastNotifiedDay: r.lastNotifiedDay,
        createdAt: r.createdAt ?? now(),
        updatedAt: now(),
      }));
      await savePrefs(env, prefs);
      return json({
        ok: true,
        count: prefs.rules.length,
        version: prefs.version
      }, 200, cors);
    }

    // Patch a rule
    if (method === "PATCH" && path.startsWith("/prefs/rules/")) {
      const id = path.split("/").pop()!;
      const body = await req.json().catch(()=>({})) as any;
      const {
        token, ...patch
      } = body;
      const prefs = await loadPrefs(env, token); if (!prefs) return json({
        error: "device not registered"
      }, 404, cors);
      const rule = prefs.rules.find(r => r.id === id); if (!rule) return json({
        error: "rule not found"
      }, 404, cors);

      if (patch.pair) rule.pair = String(patch.pair);
      if (patch.mode) rule.mode = patch.mode === "percent" ? "percent" : "value";
      if (patch.dir)  rule.dir  = patch.dir;
      if (patch.threshold != null) rule.threshold = Number(patch.threshold);
      if (patch.enabled   != null) rule.enabled   = !!patch.enabled;
      if ('lastNotifiedDay' in patch) rule.lastNotifiedDay = patch.lastNotifiedDay ?? undefined;

      rule.updatedAt = now();
      await savePrefs(env, prefs);
      return json({
        ok: true,
        version: prefs.version
      }, 200, cors);
    }

    // Delete a rule
    if (method === "DELETE" && path.startsWith("/prefs/rules/")) {
      const id = path.split("/").pop()!;
      const body = await req.json().catch(()=>({})) as any;
      const {
        token
      } = body;
      const prefs = await loadPrefs(env, token); if (!prefs) return json({
        error: "device not registered"
      }, 404, cors);
      prefs.rules = prefs.rules.filter(r => r.id !== id);
      await savePrefs(env, prefs);
      return json({
        ok: true,
        version: prefs.version
      }, 200, cors);
    }

    return json({
      error: "not found"
    }, 404, cors);
  },

  async scheduled(_e: ScheduledEvent, env: Env) {
    await runAlerts(env);
  },
} satisfies ExportedHandler<Env>;
