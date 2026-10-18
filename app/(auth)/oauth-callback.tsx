import { secureStorage } from '@/utils/secureStorage';
import { useAuthStore } from '@/store/authStore';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useT } from '@/hooks/useT';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3004/api';

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string }>();
  const { hydrate } = useAuthStore();
  const { t } = useT();

  useEffect(() => {
    const handle = async () => {
      const { access_token, refresh_token } = params;
      if (!access_token) {
        router.replace('/(auth)/sign-in');
        return;
      }

      // 1. Persist tokens
      await secureStorage.setAccessToken(access_token);
      if (refresh_token) await secureStorage.setRefreshToken(refresh_token);

      // 2. Fetch the user object and save it — this is what normal login does
      //    and what was MISSING from the OAuth flow.
      try {
        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (meRes.ok) {
          const user = await meRes.json();
          await secureStorage.setUser(user);
        }
      } catch {}

      // 3. Hydrate Zustand store from storage (user is now saved above)
      await hydrate();

      // 4. Check onboarding
      try {
        const profileRes = await fetch(`${API_BASE}/profile`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const profileData = profileRes.ok ? await profileRes.json() : null;
        if (profileData?.role !== 'EMPLOYER' && !profileData?.profile?.profileCompleted) {
          router.replace('/onboarding' as any);
          return;
        }
      } catch {}

      router.replace('/(tabs)');
    };
    handle();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#14A800" />
      <Text style={styles.text}>{t.oauthCallback.signingIn}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { color: '#9BA1A6', fontSize: 15 },
});
