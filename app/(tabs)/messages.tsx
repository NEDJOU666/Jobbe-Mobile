import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

export default function MessagesScreen() {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <View style={styles.empty}>
        <View style={styles.iconWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={44} color={c.accent} />
        </View>
        <Text style={styles.emptyTitle}>Messages coming soon</Text>
        <Text style={styles.emptyHint}>Chat with recruiters and hiring managers{'\n'}directly from the app.</Text>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { color: c.text, fontSize: 22, fontWeight: '800' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 80 },
    iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    emptyTitle: { color: c.text, fontSize: 18, fontWeight: '700' },
    emptyHint: { color: c.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  });
}
