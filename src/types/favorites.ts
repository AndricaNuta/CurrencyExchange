export type Alerts = {
    onChangePct: number | null;
    above: number | null;
    below: number | null;
    notifyOncePerCross: boolean;
    quietHours: { start: string; end: string } | null; // "22:00"–"07:00"
    minIntervalMinutes: number;
    lastNotifiedAt: string | null;
    lastBaseline: number | null;
    lastRate: number | null;
  };

export type FavoritePair = {
    id: string;        // "EUR-RON"
    base: string;      // "EUR"
    quote: string;     // "RON"
    alerts: Alerts;
  };
