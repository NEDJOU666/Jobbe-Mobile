import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useJobs } from '@/hooks/useJobs';
import { JobCard } from '@/components/JobCard';
import { DrawerMenu } from '@/components/DrawerMenu';

type SortMode = 'recent' | 'popular';

export default function JobsScreen() {
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading, isError, refetch, isRefetching } = useJobs(
    debouncedSearch ? { search: debouncedSearch } : undefined,
  );

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  const jobs = useMemo(() => {
    const list = data?.data ?? [];
    if (sortMode === 'popular') {
      return [...list].sort((a, b) => (b._count?.applications ?? 0) - (a._count?.applications ?? 0));
    }
    return list;
  }, [data, sortMode]);

  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(text), 400);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.avatarBtn}>
          <Text style={styles.avatarText}>{initial}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jobs</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={c.icon} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={c.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for jobs"
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.savedBtn} onPress={() => router.push('/(tabs)/saved')}>
          <Ionicons name="heart" size={20} color={c.accent} />
        </TouchableOpacity>
      </View>

      {/* Sort tabs */}
      <View style={styles.sortRow}>
        {(['recent', 'popular'] as SortMode[]).map((mode) => (
          <TouchableOpacity key={mode} style={styles.sortTab} onPress={() => setSortMode(mode)} activeOpacity={0.8}>
            <Text style={[styles.sortLabel, sortMode === mode && styles.sortLabelActive]}>
              {mode === 'recent' ? 'Most Recent' : 'Most Applied'}
            </Text>
            {sortMode === mode && <View style={styles.sortUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
          <Text style={styles.emptyText}>Could not load jobs</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JobCard job={item} onPress={() => router.push(`/job/${item.id}`)} />
          )}
          ListHeaderComponent={
            data?.total != null ? (
              <Text style={styles.feedHint}>
                {data.total} job{data.total !== 1 ? 's' : ''} found
                {debouncedSearch ? ` for "${debouncedSearch}"` : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={48} color={c.border3} />
              <Text style={styles.emptyText}>No jobs found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 4 }}
        />
      )}

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
    avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    headerTitle: { color: c.text, fontSize: 20, fontWeight: '700', flex: 1 },
    moreBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: c.input, borderRadius: 26, borderWidth: 1, borderColor: c.border2, paddingHorizontal: 14, height: 46 },
    searchInput: { flex: 1, color: c.text, fontSize: 14 },
    savedBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: c.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accentBg },
    sortRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 28, paddingTop: 4 },
    sortTab: { paddingBottom: 10 },
    sortLabel: { color: c.textMuted, fontSize: 14, fontWeight: '600' },
    sortLabelActive: { color: c.text },
    sortUnderline: { height: 2.5, backgroundColor: c.accent, borderRadius: 2, marginTop: 6 },
    divider: { height: 1, backgroundColor: c.border, marginBottom: 8 },
    feedHint: { color: c.textDim, fontSize: 12, lineHeight: 18, paddingHorizontal: 16, paddingBottom: 10 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    emptyText: { color: c.textDim, fontSize: 15 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },
  });
}
