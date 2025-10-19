import { delKey, getBool, setBool } from "../../services/mmkv";

export const OB_KEYS = {
  TIP_FROM: 'tip_from_picker',
  TIP_AMOUNT: 'tip_amount_input',
  TIP_TO: 'tip_to_picker',
  TIP_RATE_SRC: 'tip_rate_source',
  FAB_TIP: 'tip_fab_seen',
  STAR_TIP: 'tip_star_seen',
  ALERTS_ENTRY_TIP: 'tip_alerts_entry',
  ALERTS_CREATE_TIP: 'tip_alerts_create_seen',
  ALERTS_DELETE_TIP: 'tip_alerts_delete_seen',
  SETTINGS_TIP: 'tip_settings_seen',
  WATCHLIST_STEP2: 'tour_watchlist_step2',
  WATCHLIST_STEP3: 'tour_watchlist_step3',
  ONBOARDING_VERSION: 'onboarding_version',
} as const;


export function triggerTipOnce(key: string, show: () => void) {
  if (getBool(key)) return;
  setBool(key, true);
  requestAnimationFrame(show);
}

/** Persistent flag used to start the tour after navigation+layout are ready */
export const OB_FLAGS = {
  GUIDED_TOUR_PENDING: '__guided_tour_pending__',
} as const;

export function restartTips() {
  Object.values(OB_KEYS).forEach(k => delKey(k));
}

export function markGuidedTourPending() {
  setBool(OB_FLAGS.GUIDED_TOUR_PENDING, true);
}

export function consumeGuidedTourPending(): boolean {
  const has = getBool(OB_FLAGS.GUIDED_TOUR_PENDING);
  if (has) delKey(OB_FLAGS.GUIDED_TOUR_PENDING);
  return has;
}