import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      // `shouldShowAlert` is still required by expo-notifications@0.29 (SDK 52) types and
      // runtime; the banner/list fields take over from SDK 53 and are ignored before that.
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }) as Notifications.NotificationBehavior,
});

export async function registerForPush(): Promise<void> {
  const settings = await Notifications.getPermissionsAsync();
  let finalStatus = settings.status;
  if (finalStatus !== 'granted') {
    const r = await Notifications.requestPermissionsAsync();
    finalStatus = r.status;
  }
  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  if (tokenData.data) {
    try {
      await api.registerPushToken(tokenData.data);
    } catch {
      // best-effort
    }
  }
}

/** Parse deep-link path from a notification payload. */
export function getNotificationPath(
  response: Notifications.NotificationResponse | null | undefined
): string | null {
  if (!response) return null;
  const data = response.notification.request.content.data as Record<string, string> | undefined;
  if (data?.url) return data.url;
  if (data?.screen) {
    const screen = data.screen;
    if (screen === 'chat') return '/(tabs)/chat';
    if (screen === 'matches') return '/(tabs)/matches';
    if (screen === 'marketplace') return '/marketplace';
    if (screen === 'courier') return '/courier';
    if (screen === 'notifications') return '/notifications';
    if (screen === 'settings') return '/settings';
    if (data?.itemId) return `/items/${data.itemId}`;
    if (data?.threadId) return '/(tabs)/chat';
  }
  return null;
}
