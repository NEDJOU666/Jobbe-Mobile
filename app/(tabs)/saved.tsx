import { JobCard, type Job } from '@/components/JobCard';
import { useSaved, useToggleSave, type SavedItem } from '@/hooks/useSaved';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SavedScreen() {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { data: saved = [], isLoading, isError, refetch, isRefetching } = useSaved();
  const { mutate: toggleSave } = useToggleSave();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Jobs</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{saved.length}</Text></View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
          <Text style={styles.emptyText}>Could not load saved jobs</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />
          }
          renderItem={({ item }: { item: SavedItem }) => (
            <JobCard
              job={{ ...item.post, isSaved: true } as Job}
              onPress={() => router.push(`/job/${item.post.id}`)}
              onSave={(id, nextSaved) => { if (!nextSaved) toggleSave(id); }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={52} color={c.border3} />
              <Text style={styles.emptyText}>No saved jobs</Text>
              <Text style={styles.emptyHint}>Tap ❤️ on any job to save it here</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { color: c.text, fontSize: 22, fontWeight: '800' },
    badge: { backgroundColor: c.accentBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { color: c.accent, fontSize: 13, fontWeight: '700' },
    empty: { alignItems: 'center', paddingTop: 100, gap: 10 },
    emptyText: { color: c.textMuted, fontSize: 16, fontWeight: '600' },
    emptyHint: { color: c.textDim, fontSize: 13 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },
  });
}
