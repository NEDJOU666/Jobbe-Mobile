import { useApplications, type Application, type ApplicationStatus } from '@/hooks/useApplications';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Status = ApplicationStatus;

function currentStatus(statuses: Status[]): Status {
  return statuses[statuses.length - 1];
}

const STATUS_META: Record<Status, { label: string; color: string; icon: string }> = {
  PENDING_REVIEW:    { label: 'Pending Review',    color: '#666',    icon: 'time-outline' },
  FORWARDED_TO_FIRM: { label: 'Forwarded to Firm', color: '#1565C0', icon: 'arrow-forward-circle-outline' },
  REVIEWING:         { label: 'Reviewing',          color: '#E65100', icon: 'eye-outline' },
  SHORTLISTED:       { label: 'Shortlisted',        color: '#6A1B9A', icon: 'star-outline' },
  INTERVIEW:         { label: 'Interview',           color: '#14A800', icon: 'videocam-outline' },
  OFFER:             { label: 'Offer Received',     color: '#14A800', icon: 'trophy-outline' },
  REJECTED:          { label: 'Rejected',            color: '#C62828', icon: 'close-circle-outline' },
};

type Filter = 'ALL' | 'ACTIVE' | 'CLOSED';
const ACTIVE_STATUSES: Status[] = ['PENDING_REVIEW', 'FORWARDED_TO_FIRM', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW'];
const CLOSED_STATUSES: Status[] = ['OFFER', 'REJECTED'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ApplicationsScreen() {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data: apps, isLoading, isError, refetch, isRefetching } = useApplications();

  const data = useMemo(() => {
    const list = apps ?? [];
    return list.filter((a) => {
      const cur = currentStatus(a.status);
      if (filter === 'ACTIVE') return ACTIVE_STATUSES.includes(cur);
      if (filter === 'CLOSED') return CLOSED_STATUSES.includes(cur);
      return true;
    });
  }, [apps, filter]);

  const total = apps?.length ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Applications</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{total}</Text></View>
      </View>

      <View style={styles.filterRow}>
        {(['ALL', 'ACTIVE', 'CLOSED'] as Filter[]).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
              {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'Active' : 'Closed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
          <Text style={styles.emptyText}>Could not load applications</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={52} color={c.border3} />
              <Text style={styles.emptyText}>No applications yet</Text>
              <Text style={styles.emptyHint}>Apply to jobs to track them here</Text>
            </View>
          }
          renderItem={({ item }: { item: Application }) => {
            const cur = currentStatus(item.status);
            const meta = STATUS_META[cur];
            const firmCity = [item.firm?.city, item.firm?.country].filter(Boolean).join(', ');
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.88}
                onPress={() => router.push(`/job/${item.post.id}`)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.firmIcon}>
                    <Ionicons name="business-outline" size={18} color={c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.firmName}>{item.firm?.name ?? 'Unknown firm'}</Text>
                    {firmCity ? <Text style={styles.firmCity}>{firmCity}</Text> : null}
                  </View>
                  <Text style={styles.appliedDate}>Applied {formatDate(item.createdAt)}</Text>
                </View>

                <Text style={styles.jobTitle} numberOfLines={2}>{item.post.title}</Text>

                {/* Status journey */}
                <View style={styles.journey}>
                  {item.status.map((s, i) => {
                    const m = STATUS_META[s];
                    const isLast = i === item.status.length - 1;
                    return (
                      <View key={i} style={styles.journeyStep}>
                        <View style={[styles.journeyDot, { backgroundColor: m.color + (isLast ? 'ff' : '55') }]} />
                        {i < item.status.length - 1 && <View style={styles.journeyLine} />}
                      </View>
                    );
                  })}
                  <Text style={[styles.journeyLabel, { color: meta.color }]}>{meta.label}</Text>
                </View>

                <View style={[styles.statusBadge, { borderColor: meta.color + '55' }]}>
                  <Ionicons name={meta.icon as any} size={13} color={meta.color} />
                  <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { color: c.text, fontSize: 22, fontWeight: '800' },
    badge: { backgroundColor: c.accentBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { color: c.accent, fontSize: 13, fontWeight: '700' },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2 },
    filterChipActive: { backgroundColor: c.accentBg, borderColor: c.accent },
    filterLabel: { color: c.textBody, fontSize: 13, fontWeight: '600' },
    filterLabelActive: { color: c.accent },
    card: { backgroundColor: c.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    firmIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center' },
    firmName: { color: c.text, fontSize: 13, fontWeight: '600' },
    firmCity: { color: c.textMuted, fontSize: 12, marginTop: 1 },
    appliedDate: { color: c.textMuted, fontSize: 11 },
    jobTitle: { color: c.textSub, fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 10 },
    journey: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 0 },
    journeyStep: { flexDirection: 'row', alignItems: 'center' },
    journeyDot: { width: 8, height: 8, borderRadius: 4 },
    journeyLine: { width: 12, height: 2, backgroundColor: c.border2, marginHorizontal: 2 },
    journeyLabel: { fontSize: 11, fontWeight: '600', marginLeft: 8 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 12, fontWeight: '600' },
    empty: { alignItems: 'center', paddingTop: 100, gap: 10 },
    emptyText: { color: c.textMuted, fontSize: 16, fontWeight: '600' },
    emptyHint: { color: c.textDim, fontSize: 13 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },
  });
}
