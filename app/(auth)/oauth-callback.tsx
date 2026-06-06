import { secureStorage } from '@/utils/secureStorage';
import { useAuthStore } from '@/store/authStore';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string }>();
  const { hydrate } = useAuthStore();

  useEffect(() => {
    const handle = async () => {
      const { access_token, refresh_token } = params;
      if (!access_token) {
        router.replace('/(auth)/sign-in');
        return;
      }
      await secureStorage.setAccessToken(access_token);
      if (refresh_token) await secureStorage.setRefreshToken(refresh_token);
      await hydrate();

      const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${access_token}` },
      }).catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (data?.role !== 'EMPLOYER' && !data?.profile?.profileCompleted) {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/(tabs)');
      }
    };
    handle();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#14A800" />
      <Text style={styles.text}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { color: '#9BA1A6', fontSize: 15 },
});
