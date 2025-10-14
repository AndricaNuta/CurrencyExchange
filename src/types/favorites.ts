export type Alerts = {
    onChangePct: number | null;
    above: number | null;
    below: number | null;
    notifyOncePerCross: boolean;
    quietHours: { start: string; end: string } | null; 
    minIntervalMinutes: number;
    lastNotifiedAt: string | null;
    lastBaseline: number | null;
    lastRate: number | null;
  };

export type FavoritePair = {
    id: string;        
    base: string;      
    quote: string;     
    alerts: Alerts;
  };
