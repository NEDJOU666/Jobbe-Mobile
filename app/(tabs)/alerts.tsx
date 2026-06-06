import {
    useMarkAllRead,
    useMarkRead,
    useNotificationStream,
    useNotifications,
    type Notification as NotifItem,
    type NotificationType,
} from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TYPE_ICON: Record<NotificationType, { icon: string; color: string }> = {
  APPLICATION_SUBMITTED:      { icon: 'checkmark-circle-outline', color: '#14A800' },
  APPLICATION_STATUS_CHANGED: { icon: 'refresh-circle-outline',   color: '#1565C0' },
  INVITATION_RECEIVED:        { icon: 'mail-outline',             color: '#6A1B9A' },
  INVITATION_RESPONSE:        { icon: 'mail-open-outline',        color: '#AD1457' },
  FIRM_VERIFIED:              { icon: 'shield-checkmark-outline', color: '#14A800' },
  FIRM_REJECTED:              { icon: 'shield-outline',           color: '#C62828' },
  CREDIT_PURCHASED:           { icon: 'wallet-outline',           color: '#F57F17' },
  GENERAL:                    { icon: 'notifications-outline',    color: '#666' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AlertsScreen() {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead } = useMarkAllRead();
  useNotificationStream();

  const notifs = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Alerts</Text>
          {unread > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadText}>{unread}</Text></View>}
        </View>
        {unread > 0 && <TouchableOpacity onPress={() => markAllRead()}><Text style={styles.markAllBtn}>Mark all read</Text></TouchableOpacity>}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
          <Text style={styles.emptyText}>Could not load alerts</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />
          }
          renderItem={({ item }: { item: NotifItem }) => {
            const meta = TYPE_ICON[item.type] ?? TYPE_ICON.GENERAL;
            return (
              <TouchableOpacity
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => { if (!item.isRead) markRead(item.id); }}
                activeOpacity={0.85}
              >
                <View style={[styles.iconWrap, { backgroundColor: meta.color + '18' }]}>
                  <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                </View>
                <View style={styles.content}>
                  <View style={styles.notifTop}>
                    <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={52} color={c.border3} />
              <Text style={styles.emptyText}>No alerts</Text>
              <Text style={styles.emptyHint}>You're all caught up!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: c.text, fontSize: 22, fontWeight: '800' },
    unreadBadge: { backgroundColor: c.accent, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
    unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    markAllBtn: { color: c.accent, fontSize: 13, fontWeight: '600' },
    card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border },
    cardUnread: { backgroundColor: c.accentBg },
    iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    content: { flex: 1 },
    notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    notifTitle: { color: c.text, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
    timeText: { color: c.textMuted, fontSize: 11 },
    notifMsg: { color: c.textBody, fontSize: 13, lineHeight: 19 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent, marginTop: 4, flexShrink: 0 },
    empty: { alignItems: 'center', paddingTop: 100, gap: 10 },
    emptyText: { color: c.textMuted, fontSize: 16, fontWeight: '600' },
    emptyHint: { color: c.textDim, fontSize: 13 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },
  });
}
