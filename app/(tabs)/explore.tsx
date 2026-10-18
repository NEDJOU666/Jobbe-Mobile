import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useT } from '@/hooks/useT';

export default function ExploreScreen() {
  const { t } = useT();

  const UPCOMING = [
    { icon: 'search', title: t.explore.jobSearchTitle, desc: t.explore.jobSearchDesc },
    { icon: 'flash', title: t.explore.smartMatchingTitle, desc: t.explore.smartMatchingDesc },
    { icon: 'document-text', title: t.explore.oneClickApplyTitle, desc: t.explore.oneClickApplyDesc },
    { icon: 'people', title: t.explore.networkingTitle, desc: t.explore.networkingDesc },
  ] as const;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>{t.explore.eyebrow}</Text>
        <Text style={styles.title}>{t.explore.title}</Text>

        <View style={styles.list}>
          {UPCOMING.map((item, i) => (
            <View key={item.title} style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name={`${item.icon}-outline` as any} size={20} color="#14A800" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t.explore.badgeSoon}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },

  eyebrow: { color: '#14A800', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  title: {
    fontSize: 34, fontWeight: '800', color: '#fff',
    lineHeight: 40, letterSpacing: -0.5, marginBottom: 36,
  },

  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 14,
    padding: 16,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#0D1F0A',
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 3 },
  cardDesc: { color: '#666', fontSize: 13, lineHeight: 18 },

  badge: {
    backgroundColor: '#0D1F0A',
    borderWidth: 1,
    borderColor: '#1E4A18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { color: '#14A800', fontSize: 11, fontWeight: '600' },
});
