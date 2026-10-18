import { useApplications, useWithdraw, type Application, type ApplicationStatus, type Interview, type MeetingPlatform } from '@/hooks/useApplications';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/hooks/useT';
import type { TabsTranslations } from '@/i18n/sections/tabs';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Status = ApplicationStatus;

function currentStatus(statuses: Status[]): Status {
  return statuses[statuses.length - 1];
}

function getStatusMeta(t: TabsTranslations['applications']): Record<Status, { label: string; color: string; icon: string }> {
  return {
    PENDING_REVIEW:    { label: t.statusPendingReview,    color: '#666',    icon: 'time-outline' },
    FORWARDED_TO_FIRM: { label: t.statusForwardedToFirm, color: '#1565C0', icon: 'arrow-forward-circle-outline' },
    REVIEWING:         { label: t.statusReviewing,          color: '#E65100', icon: 'eye-outline' },
    SHORTLISTED:       { label: t.statusShortlisted,        color: '#6A1B9A', icon: 'star-outline' },
    INTERVIEW:         { label: t.statusInterview,           color: '#14A800', icon: 'videocam-outline' },
    OFFER:             { label: t.statusOffer,     color: '#14A800', icon: 'trophy-outline' },
    REJECTED:          { label: t.statusRejected,            color: '#C62828', icon: 'close-circle-outline' },
  };
}

const PLATFORM_ICON: Record<MeetingPlatform, string> = {
  ZOOM:        'videocam-outline',
  GOOGLE_MEET: 'videocam-outline',
  TEAMS:       'videocam-outline',
  PHONE:       'call-outline',
  IN_PERSON:   'location-outline',
  OTHER:       'link-outline',
};

function getPlatformLabel(t: TabsTranslations['applications']): Record<MeetingPlatform, string> {
  return {
    ZOOM:        t.platformZoom,
    GOOGLE_MEET: t.platformGoogleMeet,
    TEAMS:       t.platformTeams,
    PHONE:       t.platformPhone,
    IN_PERSON:   t.platformInPerson,
    OTHER:       t.platformOther,
  };
}

const INTERVIEW_STATUS_COLOR: Record<string, string> = {
  SCHEDULED:   '#1565C0',
  CONFIRMED:   '#14A800',
  COMPLETED:   '#666',
  CANCELLED:   '#C62828',
  RESCHEDULED: '#E65100',
};

function getInterviewStatusLabel(t: TabsTranslations['applications']): Record<string, string> {
  return {
    SCHEDULED:   t.interviewStatusScheduled,
    CONFIRMED:   t.interviewStatusConfirmed,
    COMPLETED:   t.interviewStatusCompleted,
    CANCELLED:   t.interviewStatusCancelled,
    RESCHEDULED: t.interviewStatusRescheduled,
  };
}

function formatInterviewDate(iso: string, locale: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
  };
}

function InterviewCard({ interview, c, styles, t, locale }: { interview: Interview; c: any; styles: any; t: TabsTranslations['applications']; locale: string }) {
  const { date, time } = formatInterviewDate(interview.scheduled_at, locale);
  const statusColor = INTERVIEW_STATUS_COLOR[interview.status] ?? '#666';
  const statusLabel = getInterviewStatusLabel(t)[interview.status] ?? interview.status;
  const isVirtual = ['ZOOM', 'GOOGLE_MEET', 'TEAMS', 'OTHER'].includes(interview.platform);

  return (
    <View style={styles.interviewCard}>
      <View style={styles.interviewHeader}>
        <View style={styles.interviewTitleRow}>
          <Ionicons name="calendar-outline" size={14} color="#14A800" />
          <Text style={styles.interviewTitle}>{t.interviewScheduledTitle}</Text>
        </View>
        <View style={[styles.interviewStatusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '44' }]}>
          <Text style={[styles.interviewStatusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.interviewRow}>
        <Ionicons name="time-outline" size={14} color={c.textMuted} />
        <Text style={styles.interviewDetail}>{date} · {time}</Text>
      </View>

      <View style={styles.interviewRow}>
        <Ionicons name="hourglass-outline" size={14} color={c.textMuted} />
        <Text style={styles.interviewDetail}>{interview.duration_min} min · {getPlatformLabel(t)[interview.platform]}</Text>
      </View>

      {isVirtual && interview.meeting_link ? (
        <TouchableOpacity style={styles.interviewRow} onPress={() => Linking.openURL(interview.meeting_link!)}>
          <Ionicons name="link-outline" size={14} color="#1565C0" />
          <Text style={[styles.interviewDetail, { color: '#1565C0', textDecorationLine: 'underline' }]} numberOfLines={1}>
            {t.joinMeeting}
          </Text>
        </TouchableOpacity>
      ) : interview.location ? (
        <View style={styles.interviewRow}>
          <Ionicons name="location-outline" size={14} color={c.textMuted} />
          <Text style={styles.interviewDetail} numberOfLines={1}>{interview.location}</Text>
        </View>
      ) : null}

      {interview.agenda ? (
        <View style={[styles.interviewRow, { alignItems: 'flex-start', marginTop: 2 }]}>
          <Ionicons name="document-text-outline" size={14} color={c.textMuted} style={{ marginTop: 1 }} />
          <Text style={[styles.interviewDetail, { flex: 1 }]} numberOfLines={3}>{interview.agenda}</Text>
        </View>
      ) : null}
    </View>
  );
}

type Filter = 'ALL' | 'ACTIVE' | 'CLOSED';
const ACTIVE_STATUSES: Status[] = ['PENDING_REVIEW', 'FORWARDED_TO_FIRM', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW'];
const CLOSED_STATUSES: Status[] = ['OFFER', 'REJECTED'];

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ApplicationsScreen() {
  const { colors: c } = useTheme();
  const { t, language } = useT();
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const styles = useMemo(() => makeStyles(c), [c]);
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data: apps, isLoading, isError, refetch, isRefetching } = useApplications();
  const { mutate: withdraw, isPending: isWithdrawing } = useWithdraw();

  const WITHDRAWABLE: Status[] = ['PENDING_REVIEW', 'REVIEWING'];

  const confirmWithdraw = (app: Application) => {
    Alert.alert(
      t.applications.withdrawAlertTitle,
      `${t.applications.withdrawAlertMessagePrefix} "${app.post.title}"?`,
      [
        { text: t.applications.withdrawAlertCancel, style: 'cancel' },
        {
          text: t.applications.withdrawAlertConfirm,
          style: 'destructive',
          onPress: () => withdraw(app.id),
        },
      ],
    );
  };

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
        <Text style={styles.title}>{t.applications.title}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{total}</Text></View>
      </View>

      <View style={styles.filterRow}>
        {(['ALL', 'ACTIVE', 'CLOSED'] as Filter[]).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
              {f === 'ALL' ? t.applications.filterAll : f === 'ACTIVE' ? t.applications.filterActive : t.applications.filterClosed}
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
          <Text style={styles.emptyText}>{t.applications.loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>{t.applications.retry}</Text>
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
              <Text style={styles.emptyText}>{t.applications.emptyTitle}</Text>
              <Text style={styles.emptyHint}>{t.applications.emptyHint}</Text>
            </View>
          }
          renderItem={({ item }: { item: Application }) => {
            const cur = currentStatus(item.status);
            const STATUS_META = getStatusMeta(t.applications);
            const meta = STATUS_META[cur];
            const firmCity = [item.firm?.city, item.firm?.country].filter(Boolean).join(', ');
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.88}
                onPress={() => router.push(`/application/${item.id}`)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.firmIcon}>
                    <Ionicons name="business-outline" size={18} color={c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.firmName}>{item.firm?.name ?? t.applications.unknownFirm}</Text>
                    {firmCity ? <Text style={styles.firmCity}>{firmCity}</Text> : null}
                  </View>
                  <Text style={styles.appliedDate}>{t.applications.appliedPrefix} {formatDate(item.createdAt, locale)}</Text>
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

                {item.interview && (
                  <InterviewCard interview={item.interview} c={c} styles={styles} t={t.applications} locale={locale} />
                )}

                <View style={styles.cardBottom}>
                  <View style={[styles.statusBadge, { borderColor: meta.color + '55' }]}>
                    <Ionicons name={meta.icon as any} size={13} color={meta.color} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    {!item.post.source && (
                      <TouchableOpacity
                        style={styles.msgBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push({
                            pathname: '/(tabs)/messages',
                            params: { applicationId: item.id, firmName: item.firm?.name ?? '', postTitle: item.post.title },
                          });
                        }}
                      >
                        <Ionicons name="chatbubble-outline" size={13} color={c.accent} />
                        <Text style={styles.msgBtnText}>{t.applications.messageBtn}</Text>
                      </TouchableOpacity>
                    )}
                    {WITHDRAWABLE.includes(cur) && (
                      <TouchableOpacity
                        style={styles.withdrawBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          confirmWithdraw(item);
                        }}
                        disabled={isWithdrawing}
                      >
                        <Ionicons name="trash-outline" size={14} color="#C62828" />
                        <Text style={styles.withdrawText}>{t.applications.withdrawBtn}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
    cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 12, fontWeight: '600' },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    msgBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: c.accentBorder, backgroundColor: c.accentBg },
    msgBtnText: { fontSize: 12, fontWeight: '600', color: c.accent },
    withdrawBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#C6282833' },
    withdrawText: { fontSize: 12, fontWeight: '600', color: '#C62828' },
    empty: { alignItems: 'center', paddingTop: 100, gap: 10 },
    emptyText: { color: c.textMuted, fontSize: 16, fontWeight: '600' },
    emptyHint: { color: c.textDim, fontSize: 13 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },
    interviewCard: { backgroundColor: '#14A80010', borderWidth: 1, borderColor: '#14A80033', borderRadius: 10, padding: 12, marginBottom: 10, gap: 6 },
    interviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    interviewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interviewTitle: { color: '#14A800', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    interviewStatusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
    interviewStatusText: { fontSize: 10, fontWeight: '700' },
    interviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    interviewDetail: { color: c.textBody, fontSize: 13, flex: 1 },
  });
}
