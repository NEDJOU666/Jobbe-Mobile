import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { useProfile } from '@/hooks/useProfile';
import { useStats } from '@/hooks/useStats';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

function calcCompletion(data: ReturnType<typeof useProfile>['data']): number {
  if (!data) return 0;
  const p = data.profile;
  const checks = [
    !!data.name,
    !!data.email,
    !!p?.headline,
    !!p?.bio,
    !!p?.location,
    !!(p?.skills && p.skills.length > 0),
    !!p?.linkedin,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function Initials({ name, size, c }: { name: string; size: number; c: any }) {
  const letters = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.accent + '22', borderWidth: 2, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: c.accent, fontSize: size * 0.36, fontWeight: '800' }}>{letters}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors: c, isDark, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const qc = useQueryClient();

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile, isRefetching: profileRefetching } = useProfile();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useStats();
  const { data: docs, isLoading: docsLoading, refetch: refetchDocs } = useDocuments();
  const { logout } = useAuth();

  const isRefreshing = profileRefetching;
  const onRefresh = () => {
    refetchProfile();
    refetchStats();
    refetchDocs();
  };

  const completion = calcCompletion(profile);
  const resumes = docs?.filter((d) => d.documentType === 'RESUME') ?? [];

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          qc.clear();
        },
      },
    ]);
  };

  const isLoading = profileLoading && statsLoading && docsLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={c.accent} />
          }
        >
          {/* ── Identity card ────────────────────────────────────── */}
          <View style={styles.identityCard}>
            <Initials name={profile?.name ?? '?'} size={72} c={c} />
            <View style={styles.identityText}>
              <Text style={styles.nameText}>{profile?.name ?? '—'}</Text>
              {profile?.profile?.headline ? (
                <Text style={styles.headlineText} numberOfLines={1}>{profile.profile.headline}</Text>
              ) : (
                <Text style={styles.headlinePlaceholder}>Add a headline</Text>
              )}
              <View style={styles.pillRow}>
                {profile?.isEmailVerified && (
                  <View style={[styles.pill, { backgroundColor: c.accent + '18', borderColor: c.accentBorder }]}>
                    <Ionicons name="checkmark-circle" size={12} color={c.accent} />
                    <Text style={[styles.pillText, { color: c.accent }]}>Verified</Text>
                  </View>
                )}
                {profile?.profile?.openToWork && (
                  <View style={[styles.pill, { backgroundColor: '#1565C018', borderColor: '#1565C030' }]}>
                    <Text style={[styles.pillText, { color: '#1565C0' }]}>Open to Work</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── Stats row ─────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            {[
              { label: 'Applied', value: stats?.applied ?? 0, icon: 'document-text-outline', color: '#1565C0' },
              { label: 'Interviews', value: stats?.interviews ?? 0, icon: 'videocam-outline', color: '#6A1B9A' },
              { label: 'Offers', value: stats?.offers ?? 0, icon: 'trophy-outline', color: c.accent },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon as any} size={18} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Profile completion ───────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile Strength</Text>
              <Text style={[styles.sectionBadge, { color: completion === 100 ? c.accent : '#E65100' }]}>
                {completion}%
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${completion}%` as any, backgroundColor: completion === 100 ? c.accent : '#E65100' }]} />
            </View>
            {completion < 100 && (
              <Text style={styles.completionHint}>
                Complete your profile to attract more recruiters
              </Text>
            )}
          </View>

          {/* ── Skills ──────────────────────────────────────────── */}
          {(profile?.profile?.skills?.length ?? 0) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.chipRow}>
                {profile!.profile!.skills.map((s) => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Documents ───────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Résumés & Documents</Text>
            {docsLoading ? (
              <ActivityIndicator color={c.accent} style={{ marginTop: 12 }} />
            ) : resumes.length === 0 ? (
              <View style={styles.emptyDocs}>
                <Ionicons name="document-outline" size={32} color={c.border3} />
                <Text style={styles.emptyDocsText}>No résumé uploaded</Text>
              </View>
            ) : (
              resumes.map((doc) => (
                <View key={doc.id} style={styles.docCard}>
                  <View style={[styles.docIcon, { backgroundColor: c.accentBg, borderColor: c.accentBorder }]}>
                    <Ionicons name="document-text-outline" size={20} color={c.accent} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                    {doc.size && <Text style={styles.docMeta}>{doc.size}</Text>}
                  </View>
                  {doc.isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: c.accentBg, borderColor: c.accentBorder }]}>
                      <Text style={[styles.defaultText, { color: c.accent }]}>Default</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* ── App settings ────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#33333318' }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={18} color={c.icon} />
                </View>
                <Text style={styles.settingLabel}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{ false: c.border2, true: c.accent + '88' }}
                thumbColor={isDark ? c.accent : c.textMuted}
              />
            </View>

            <TouchableOpacity style={styles.settingRow} onPress={handleLogout} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#C6282818' }]}>
                  <Ionicons name="log-out-outline" size={18} color="#C62828" />
                </View>
                <Text style={[styles.settingLabel, { color: '#C62828' }]}>Sign Out</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { color: c.text, fontSize: 22, fontWeight: '800' },

    // Identity
    identityCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 16, marginBottom: 16, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border },
    identityText: { flex: 1 },
    nameText: { color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 2 },
    headlineText: { color: c.textBody, fontSize: 13, marginBottom: 6 },
    headlinePlaceholder: { color: c.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: 6 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    pillText: { fontSize: 11, fontWeight: '600' },

    // Stats
    statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: c.card, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: c.border },
    statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    statValue: { color: c.text, fontSize: 20, fontWeight: '800' },
    statLabel: { color: c.textMuted, fontSize: 11, fontWeight: '600' },

    // Sections
    section: { marginHorizontal: 16, marginBottom: 16, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
    sectionBadge: { fontSize: 14, fontWeight: '700' },

    // Progress
    progressBg: { height: 8, borderRadius: 4, backgroundColor: c.border2, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', borderRadius: 4 },
    completionHint: { color: c.textMuted, fontSize: 12, marginTop: 2 },

    // Skills
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -4 },
    chip: { backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    chipText: { color: c.accent, fontSize: 12, fontWeight: '600' },

    // Documents
    emptyDocs: { alignItems: 'center', paddingVertical: 16, gap: 8 },
    emptyDocsText: { color: c.textMuted, fontSize: 13 },
    docCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
    docIcon: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    docInfo: { flex: 1 },
    docName: { color: c.text, fontSize: 14, fontWeight: '600' },
    docMeta: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    defaultBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    defaultText: { fontSize: 11, fontWeight: '700' },

    // Settings
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    settingLabel: { color: c.text, fontSize: 15, fontWeight: '600' },
  });
}
