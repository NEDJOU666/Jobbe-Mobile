import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';

import { queryClient } from '@/lib/queryClient';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';
import { useLanguageStore } from '@/store/languageStore';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { useT } from '@/hooks/useT';

// expo-notifications removed push support from Expo Go in SDK 53.
// Importing it at module level triggers DevicePushTokenAutoRegistration.fx.js
// which crashes on startup. Use lazy require() inside effects instead.
const isExpoGo = Constants.appOwnership === 'expo';

export const unstable_settings = {
  anchor: '(auth)',
};

function UpdateBanner() {
  const { updateAvailable, applying, applyUpdate } = useAppUpdate();
  const { t } = useT();
  if (!updateAvailable) return null;
  return (
    <View style={updateStyles.banner}>
      <Text style={updateStyles.text}>{t.common.updateAvailable}</Text>
      <TouchableOpacity style={updateStyles.btn} onPress={applyUpdate} disabled={applying}>
        {applying
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={updateStyles.btnText}>{t.common.updateNow}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const updateStyles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    backgroundColor: '#14A800', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    paddingTop: Platform.OS === 'android' ? 36 : 54,
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  btn: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

export default function RootLayout() {
  const { hydrate } = useThemeStore();
  const { hydrate: hydrateLanguage } = useLanguageStore();
  const { isDark, colors: c } = useTheme();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { hydrateLanguage(); }, [hydrateLanguage]);

  // Fix white flash at bottom when keyboard closes on Android (edge-to-edge + keyboard)
  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#000000');
  }, []);

  useEffect(() => {
    if (isExpoGo) return;
    // Lazy require prevents DevicePushTokenAutoRegistration.fx.js from running at startup
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const N = require('expo-notifications');
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    if (Platform.OS === 'android') {
      N.setNotificationChannelAsync('default', {
        name: 'JobFinder',
        importance: N.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#14A800',
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="job/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="apply/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="application/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
        <Stack.Screen name="change-password" options={{ headerShown: false }} />
        <Stack.Screen name="stats" options={{ headerShown: false }} />
        <Stack.Screen name="documents" options={{ headerShown: false }} />
        <Stack.Screen name="credits" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
        <Stack.Screen name="inbox" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="webview" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={c.statusBar} />
      <UpdateBanner />
    </ThemeProvider>
    </QueryClientProvider>
  );
}
