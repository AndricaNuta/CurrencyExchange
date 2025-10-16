// src/utils/showOnce.ts

import { getBool, getNum, setBool, setNum } from "../services/mmkv";

export function shouldShowOnce(key: string) {
  if (getBool(key)) return false;
  setBool(key, true);
  return true;
}

export function hasSeen(key: string) {
  return getBool(key);
}

export function markSeen(key: string) {
  setBool(key, true);
}

const COUNT_KEY = 'app_launch_count';

export function bumpLaunchCount() {
  const n = (getNum(COUNT_KEY) ?? 0) + 1;
  setNum(COUNT_KEY, n);
  return n;
}

export function getLaunchCount() {
  return getNum(COUNT_KEY) ?? 0;
}