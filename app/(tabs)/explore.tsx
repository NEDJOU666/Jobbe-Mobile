import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const UPCOMING = [
  { icon: 'search', title: 'Job Search', desc: 'Browse thousands of opportunities tailored to your skills.' },
  { icon: 'flash', title: 'Smart Matching', desc: 'AI-powered recommendations based on your profile.' },
  { icon: 'document-text', title: 'One-Click Apply', desc: 'Apply to multiple jobs instantly with your saved profile.' },
  { icon: 'people', title: 'Networking', desc: 'Connect with recruiters and professionals in your field.' },
] as const;

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>WHAT'S COMING</Text>
        <Text style={styles.title}>Built for your{'\n'}career growth</Text>

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
                <Text style={styles.badgeText}>Soon</Text>
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
