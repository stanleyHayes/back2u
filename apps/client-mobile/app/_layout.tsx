import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '../src/lib/auth.store';
import { getNotificationPath, registerForPush } from '../src/lib/push';

const theme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: '#0F766E', secondary: '#F59E0B' },
};

const qc = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const accessToken = useAuth((s) => s.accessToken);
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (accessToken) void registerForPush().catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    const path = getNotificationPath(lastNotificationResponse);
    if (path) router.push(path as never);
  }, [lastNotificationResponse, router]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <QueryClientProvider client={qc}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.primary }, headerTintColor: '#fff' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: 'Sign in' }} />
            <Stack.Screen name="register" options={{ title: 'Create account' }} />
            <Stack.Screen name="forgot-password" options={{ title: 'Reset password' }} />
            <Stack.Screen name="verify-email" options={{ title: 'Verify email' }} />
            <Stack.Screen name="verify-phone" options={{ title: 'Verify phone' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="tags" options={{ title: 'QR tags' }} />
            <Stack.Screen name="vault" options={{ title: 'Memory vault' }} />
            <Stack.Screen name="marketplace" options={{ title: 'Marketplace' }} />
            <Stack.Screen name="leaderboard" options={{ title: 'Top finders' }} />
            <Stack.Screen name="map" options={{ title: 'Map' }} />
            <Stack.Screen name="courier" options={{ title: 'Courier' }} />
            <Stack.Screen name="safety" options={{ title: 'Safety' }} />
            <Stack.Screen name="zones" options={{ title: 'Zones' }} />
            <Stack.Screen name="scan-tag" options={{ title: 'Scan tag' }} />
            <Stack.Screen name="bookmarks" options={{ title: 'Bookmarks' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
            <Stack.Screen name="shop" options={{ title: 'QR Tag Shop' }} />
            <Stack.Screen name="trusted-finder-apply" options={{ title: 'Trusted Finder' }} />
            <Stack.Screen name="courier-tracking" options={{ title: 'Courier Tracking' }} />
            <Stack.Screen name="found-near-you" options={{ title: 'Found Near You' }} />
            <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
            <Stack.Screen name="reviews" options={{ title: 'Reviews' }} />
            <Stack.Screen name="verification/[itemId]" options={{ title: 'Verify ownership' }} />
            <Stack.Screen name="items/[id]" options={{ title: 'Item' }} />
          </Stack>
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
