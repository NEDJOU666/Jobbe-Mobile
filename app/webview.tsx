import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function WebViewScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!url) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.textMuted }}>No URL provided</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: c.accentBg }]}>
          <Text style={{ color: c.accent, fontWeight: '700' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.titleText, { color: c.text }]} numberOfLines={1}>
            {title ?? 'Apply'}
          </Text>
          <Text style={[styles.urlText, { color: c.textMuted }]} numberOfLines={1}>
            {url}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setLoading(true)}
          style={styles.headerBtn}
          accessibilityLabel="Reload"
        >
          <Ionicons name="reload" size={19} color={c.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Progress indicator */}
      {loading && !error && (
        <View style={[styles.loadingBar, { backgroundColor: c.accentBg }]}>
          <ActivityIndicator size="small" color={c.accent} />
          <Text style={[styles.loadingText, { color: c.textMuted }]}>Loading application page…</Text>
        </View>
      )}

      {/* Error state */}
      {error ? (
        <View style={[styles.center, { flex: 1 }]}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border} />
          <Text style={[styles.errorText, { color: c.textMuted }]}>Could not load page</Text>
          <TouchableOpacity
            onPress={() => { setError(false); setLoading(true); }}
            style={[styles.backBtn, { backgroundColor: c.accentBg }]}
          >
            <Text style={{ color: c.accent, fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1 },
  headerBtn:   { padding: 8 },
  headerTitle: { flex: 1, paddingHorizontal: 8 },
  titleText:   { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  urlText:     { fontSize: 10, marginTop: 1 },
  loadingBar:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  loadingText: { fontSize: 12 },
  errorText:   { fontSize: 14, textAlign: 'center' },
  backBtn:     { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
});
