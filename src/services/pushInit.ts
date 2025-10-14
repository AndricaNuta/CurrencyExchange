import '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { registerDeviceToken, syncRules } from './alertsSync';

let currentFcmToken: string | null = null;
export const getCurrentFcmToken = () => currentFcmToken;

export async function initPush() {
  try {
    if (Platform.OS === 'ios') {
      try {
        await messaging().registerDeviceForRemoteMessages();
      } catch (e) {
        console.log('ℹ️ registerDeviceForRemoteMessages not required / failed softly:', e);
      }
    }

    // Ask permission on iOS (Android usually granted)
    const auth = await messaging().requestPermission();
    console.log('🔐 Push permission status:', auth);

    // Get FCM token
    const token = await messaging().getToken();
    currentFcmToken = token;
    console.log('🔥 FCM token:', token);

    // Register this device with the Worker (IMPORTANT)
    await registerDeviceToken(token, 'debug-user'); // pass your real user id if you have auth

    // Handle token refresh
    messaging().onTokenRefresh(async (newToken) => {
      currentFcmToken = newToken;
      console.log('♻️ FCM token refreshed:', newToken);
      await registerDeviceToken(newToken, 'debug-user');
    });

    // Foreground message listener (optional)
    messaging().onMessage(async (msg) => {
      console.log('📬 Foreground push:', msg);
      // You can surface an in-app toast here if you want
    });
  } catch (e) {
    console.log('⚠️ initPush error:', e);
  }
}

/**
 * Hook that mirrors your Redux favorites → Cloudflare Worker rules.
 * Call this once at app start; it will resync automatically whenever favorites change.
 * (You already import & call `useAlertsCloudSync()` in RootNavigator.)
 */
export function useAlertsCloudSync() {
  const favorites = useSelector((s: RootState) => Object.values(s.favorites.items));
  const syncing = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const run = async () => {
      // Wait until we have a token from initPush()
      if (!currentFcmToken) return;
      try {
        // Avoid overlapping syncs if favorites flip quickly
        if (syncing.current) await syncing.current;
        syncing.current = syncRules(currentFcmToken, favorites as any);
        await syncing.current;
        console.log('☁️ Alerts synced:', favorites.length, 'favorite(s)');
      } catch (e) {
        console.log('⚠️ sync rules error:', e);
      } finally {
        syncing.current = null;
      }
    };
    run();
  }, [favorites]);
}
