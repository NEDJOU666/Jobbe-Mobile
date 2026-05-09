import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';

const FEATURES = [
  { icon: 'search-outline', label: 'Job Search' },
  { icon: 'flash-outline', label: 'Smart Match' },
  { icon: 'document-text-outline', label: 'Easy Apply' },
  { icon: 'notifications-outline', label: 'Alerts' },
  { icon: 'people-outline', label: 'Network' },
  { icon: 'stats-chart-outline', label: 'Insights' },
] as const;

export default function ComingSoonScreen() {
  const { user, logout } = useAuth();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse the green dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Slow rotate the ring
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const rotateDeg = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Text style={styles.logoText}>JOBFINDER</Text>
              <Animated.View style={[styles.logoDot, { transform: [{ scale: pulseAnim }] }]} />
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            {/* Rotating ring */}
            <Animated.View style={[styles.ring, { transform: [{ rotate: rotateDeg }] }]}>
              <View style={styles.ringDot} />
            </Animated.View>

            {/* Inner circle */}
            <View style={styles.innerCircle}>
              <Ionicons name="briefcase" size={40} color="#14A800" />
            </View>
          </View>

          {/* Text */}
          <View style={styles.textBlock}>
            <Text style={styles.title}>Coming{'\n'}Soon</Text>
            <Text style={styles.subtitle}>
              We're building something incredible for your career journey. The wait will be worth it.
            </Text>
          </View>

          {/* Feature chips */}
          <View style={styles.chipsWrap}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.chip}>
                <Ionicons name={f.icon} size={15} color="#14A800" />
                <Text style={styles.chipLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* User greeting */}
          {user?.name ? (
            <View style={styles.greetingCard}>
              <View style={styles.greetingAvatar}>
                <Text style={styles.greetingInitial}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.greetingName}>Hi, {user.name.split(' ')[0]}!</Text>
                <Text style={styles.greetingNote}>You'll be first to know when we launch.</Text>
              </View>
            </View>
          ) : null}

          {/* Status bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>In active development</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end' },
  logoText: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  logoDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#14A800', marginBottom: 4, marginLeft: 2,
  },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 40,
  },
  ring: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 1.5, borderColor: '#14A800',
    borderStyle: 'dashed',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  ringDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#14A800',
    marginLeft: -5,
  },
  innerCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A2A2A',
  },

  // Text
  textBlock: { alignItems: 'center', marginBottom: 36 },
  title: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 58,
    letterSpacing: -1,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  // Feature chips
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipLabel: { color: '#ccc', fontSize: 13, fontWeight: '500' },

  // Greeting
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#1E3A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  greetingAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#14A800',
    alignItems: 'center', justifyContent: 'center',
  },
  greetingInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  greetingName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  greetingNote: { color: '#666', fontSize: 13 },

  // Status
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  statusDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#14A800',
  },
  statusText: { color: '#555', fontSize: 13 },
});
