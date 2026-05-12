import type { ApplicationStatus } from '@/hooks/useApplications';
import { useStats } from '@/hooks/useStats';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_META: Record<ApplicationStatus, { label: string; color: string; icon: string }> = {
  PENDING_REVIEW:    { label: 'Pending Review',    color: '#555',    icon: 'document-text-outline' },
  FORWARDED_TO_FIRM: { label: 'Forwarded to Firm', color: '#1565C0', icon: 'paper-plane-outline'   },
  REVIEWING:         { label: 'Under Review',      color: '#E65100', icon: 'eye-outline'           },
  SHORTLISTED:       { label: 'Shortlisted',       color: '#6A1B9A', icon: 'star-outline'          },
  INTERVIEW:         { label: 'Interview',         color: '#14A800', icon: 'mic-outline'           },
  OFFER:             { label: 'Offer',             color: '#F57F17', icon: 'trophy-outline'        },
  REJECTED:          { label: 'Rejected',          color: '#C62828', icon: 'close-circle-outline'  },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const { data, isLoading, isError, refetch } = useStats();
  const applied = data?.applied ?? 0;
  const interviews = data?.interviews ?? 0;
  const offers = data?.offers ?? 0;
  const saved = data?.saved ?? 0;
  const profileViews = data?.profileViews ?? 0;
  const interviewRate = data?.interviewRate ?? 0;
  const statusCounts = data?.statusCounts ?? {};
  const recentActivity = data?.recentActivity ?? [];

  const statusRows = (Object.keys(STATUS_META) as ApplicationStatus[])
    .map((key) => ({ key, ...STATUS_META[key], count: statusCounts[key] ?? 0 }))
    .filter((row) => row.count > 0);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Stats</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={c.accent} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
          <Text style={styles.emptyText}>Could not load stats</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* KPI grid */}
        <View style={styles.kpiGrid}>
          <KpiCard c={c} icon="send-outline"    value={applied}      label="Applied"       color="#14A800" />
          <KpiCard c={c} icon="mic-outline"     value={interviews}   label="Interviews"    color="#1565C0" />
          <KpiCard c={c} icon="trophy-outline"  value={offers}       label="Offers"        color="#F57F17" />
          <KpiCard c={c} icon="eye-outline"     value={profileViews} label="Profile Views" color="#6A1B9A" />
        </View>

        {/* Saved jobs summary */}
        <View style={styles.searchCard}>
          <View style={styles.searchLeft}>
            <Ionicons name="bookmark-outline" size={18} color={c.accent} />
            <View>
              <Text style={styles.searchValue}>{saved}</Text>
              <Text style={styles.searchLabel}>jobs saved for later</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.trendBadge} onPress={() => router.push('/(tabs)/saved')}>
            <Text style={styles.trendText}>View</Text>
            <Ionicons name="chevron-forward" size={14} color={c.accent} />
          </TouchableOpacity>
        </View>

        {/* Interview rate */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Interview Rate</Text>
            <Text style={styles.cardValue}>{interviewRate}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${interviewRate}%` }]} />
          </View>
          <Text style={styles.cardHint}>{interviews} of {applied} applications led to interviews</Text>
        </View>

        {/* Applications breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Applications by Status</Text>
          {statusRows.length === 0 ? (
            <Text style={styles.cardHint}>No applications yet.</Text>
          ) : (
            statusRows.map(({ key, label, count, color }) => (
              <View key={key} style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: color + '20', borderColor: color + '50' }]}>
                  <View style={[styles.statusDotInner, { backgroundColor: color }]} />
                </View>
                <Text style={styles.statusLabel}>{label}</Text>
                <View style={styles.statusBarWrap}>
                  <View style={[styles.statusBar, { width: applied > 0 ? `${(count / applied) * 100}%` : '0%', backgroundColor: color }]} />
                </View>
                <Text style={[styles.statusCount, { color }]}>{count}</Text>
              </View>
            ))
          )}
        </View>

        {/* Recent activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {recentActivity.length === 0 ? (
            <Text style={styles.cardHint}>No recent activity.</Text>
          ) : (
            recentActivity.map((act, i) => {
              const meta = STATUS_META[act.status as ApplicationStatus] ?? STATUS_META.PENDING_REVIEW;
              return (
                <View key={`${act.date}-${i}`} style={[styles.activityRow, i < recentActivity.length - 1 && styles.activityBorder]}>
                  <View style={[styles.activityIcon, { backgroundColor: meta.color + '18' }]}>
                    <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>Application status: {meta.label}</Text>
                    <Text style={styles.activityTime}>{relativeTime(act.date)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
      )}
    </View>
  );
}

function KpiCard({ c, icon, value, label, color }: { c: any; icon: string; value: number; label: string; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.card, borderWidth: 1, borderColor: color + '25', borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: color + '18', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: c.textMuted, fontSize: 11, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
    iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    scroll: { paddingHorizontal: 16, paddingTop: 8 },
    kpiGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    searchCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.card, borderWidth: 1, borderColor: c.accentBorder, borderRadius: 16, padding: 16, marginBottom: 14 },
    searchLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    searchValue: { color: c.text, fontSize: 22, fontWeight: '800' },
    searchLabel: { color: c.textMuted, fontSize: 12, marginTop: 1 },
    trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.accentBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    trendText: { color: c.accent, fontSize: 12, fontWeight: '700' },
    card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16, marginBottom: 14 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 14 },
    cardValue: { color: c.accent, fontSize: 18, fontWeight: '800' },
    progressBg: { height: 8, backgroundColor: c.border2, borderRadius: 4, marginBottom: 8 },
    progressFill: { height: 8, backgroundColor: c.accent, borderRadius: 4 },
    cardHint: { color: c.textMuted, fontSize: 12 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    statusDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    statusDotInner: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { color: c.textBody, fontSize: 12, width: 100 },
    statusBarWrap: { flex: 1, height: 6, backgroundColor: c.border2, borderRadius: 3 },
    statusBar: { height: 6, borderRadius: 3, maxWidth: '100%' },
    statusCount: { fontSize: 13, fontWeight: '700', width: 20, textAlign: 'right' },
    activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
    activityBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    activityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    activityContent: { flex: 1 },
    activityText: { color: c.textSub, fontSize: 13, lineHeight: 19 },
    activityTime: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 12 },
    emptyText: { color: c.textMuted, fontSize: 16, fontWeight: '600' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },
  });
}
