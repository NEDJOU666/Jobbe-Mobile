import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { useProfile } from '@/hooks/useProfile';
import { useStats } from '@/hooks/useStats';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/hooks/useT';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

function parseLang(s: string): { lang: string; level: string } {
  const [lang, level] = s.split(':');
  return { lang: lang ?? s, level: level ?? '' };
}

interface ExperienceItem { role?: string; company?: string; period?: string; desc?: string }
interface EducationItem  { degree?: string; school?: string; year?: string }

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function computeCompletion(p: { headline?: string | null; bio?: string | null; location?: string | null; phone?: string | null; skills?: string[]; languages?: string[]; experience?: unknown; education?: unknown } | null | undefined): number {
  if (!p) return 0;
  const checks = [
    !!p.headline, !!p.bio, !!p.location, !!p.phone,
    (p.skills?.length ?? 0) > 0, (p.languages?.length ?? 0) > 0,
    asArray(p.experience).length > 0, asArray(p.education).length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors: c, isDark, toggle } = useTheme();
  const { t } = useT();
  const styles = useMemo(() => makeStyles(c), [c]);
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useProfile();
  const { data: stats } = useStats();
  const { data: docs } = useDocuments();
  const profile = data?.profile ?? null;

  const displayName = data?.name ?? user?.name ?? t.profile.defaultUserName;
  const displayEmail = data?.email ?? user?.email ?? '—';
  const avatarUri = (data as any)?.profile_image ?? (data as any)?.avatar ?? null;
  const initial = displayName.charAt(0).toUpperCase();

  const resumes = docs?.filter((d) => d.documentType === 'RESUME') ?? [];

  const handleLogout = () => {
    Alert.alert(t.profile.signOutTitle, t.profile.signOutMessage, [
      { text: t.profile.cancel, style: 'cancel' },
      {
        text: t.profile.signOutTitle, style: 'destructive',
        onPress: async () => { await logout(); qc.clear(); },
      },
    ]);
  };

  const skills = profile?.skills ?? [];
  const languages = profile?.languages ?? [];
  const experience = asArray<ExperienceItem>(profile?.experience);
  const education  = asArray<EducationItem>(profile?.education);
  const completion = computeCompletion(profile);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.profile.title}</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/profile-edit')}>
          <Ionicons name="create-outline" size={20} color={c.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={c.accent} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
          <Text style={styles.emptyText}>{t.profile.loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>{t.profile.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {avatarUri
                  ? <Image source={{ uri: avatarUri }} style={{ width: 84, height: 84, borderRadius: 42 }} />
                  : <Text style={styles.avatarText}>{initial}</Text>}
              </View>
              {data?.isEmailVerified && (
                <View style={styles.verifiedBadge}><Ionicons name="checkmark-circle" size={22} color={c.accent} /></View>
              )}
            </View>
            <Text style={styles.userName}>{displayName}</Text>
            {profile?.headline ? <Text style={styles.userTitle}>{profile.headline}</Text> : null}
            {profile?.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={c.textMuted} />
                <Text style={styles.locationText}>{profile.location}</Text>
              </View>
            ) : null}
            <View style={styles.completionCard}>
              <View style={styles.completionTop}>
                <Text style={styles.completionLabel}>{t.profile.profileCompletion}</Text>
                <Text style={styles.completionPct}>{completion}%</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${completion}%` }]} />
              </View>
              {completion < 100 && (
                <Text style={styles.completionHint}>{t.profile.completionHint}</Text>
              )}
            </View>
          </View>

          {profile?.bio ? (
            <Section c={c} title={t.profile.aboutMe}>
              <Text style={styles.bodyText}>{profile.bio}</Text>
            </Section>
          ) : null}

          <Section c={c} title={t.profile.contact}>
            <InfoRow c={c} icon="mail-outline" value={displayEmail} />
            {data?.phone ? <InfoRow c={c} icon="call-outline" value={data.phone} /> : null}
            {profile?.location ? <InfoRow c={c} icon="location-outline" value={profile.location} /> : null}
          </Section>

          {skills.length > 0 && (
            <Section c={c} title={t.profile.skills}>
              <View style={styles.chipGrid}>
                {skills.map((s) => (
                  <View key={s} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
                ))}
              </View>
            </Section>
          )}

          {languages.length > 0 && (
            <Section c={c} title={t.profile.languages}>
              {languages.map((raw) => {
                const { lang, level } = parseLang(raw);
                return (
                  <View key={raw} style={styles.langRow}>
                    <Text style={styles.langName}>{lang}</Text>
                    {level ? <View style={styles.langBadge}><Text style={styles.langLevel}>{level}</Text></View> : null}
                  </View>
                );
              })}
            </Section>
          )}

          {experience.length > 0 && (
            <Section c={c} title={t.profile.workExperience}>
              {experience.map((exp, i) => (
                <View key={i} style={[styles.timelineItem, i < experience.length - 1 && styles.timelineItemBorder]}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.expRole}>{exp.role ?? '—'}</Text>
                    <Text style={styles.expCompany}>{[exp.company, exp.period].filter(Boolean).join(' · ')}</Text>
                    {exp.desc ? <Text style={styles.expDesc}>{exp.desc}</Text> : null}
                  </View>
                </View>
              ))}
            </Section>
          )}

          {education.length > 0 && (
            <Section c={c} title={t.profile.education}>
              {education.map((edu, i) => (
                <View key={i} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.expRole}>{edu.degree ?? '—'}</Text>
                    <Text style={styles.expCompany}>{[edu.school, edu.year].filter(Boolean).join(' · ')}</Text>
                  </View>
                </View>
              ))}
            </Section>
          )}

          {/* Stats */}
          <Section c={c} title={t.profile.myStats}>
            <View style={styles.statsRow}>
              {[
                { label: t.profile.statApplied,    value: stats?.applied    ?? 0, icon: 'document-text-outline', color: '#1565C0' },
                { label: t.profile.statInterviews, value: stats?.interviews ?? 0, icon: 'videocam-outline',       color: '#6A1B9A' },
                { label: t.profile.statOffers,     value: stats?.offers     ?? 0, icon: 'trophy-outline',         color: c.accent },
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
          </Section>

          {/* Documents */}
          <Section c={c} title={t.profile.documents}>
            {resumes.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 12, gap: 6 }}>
                <Ionicons name="document-outline" size={32} color={c.border3} />
                <Text style={{ color: c.textMuted, fontSize: 13 }}>{t.profile.noResume}</Text>
                <TouchableOpacity
                  style={[styles.outlineBtn, { marginTop: 4 }]}
                  onPress={() => router.push('/documents')}
                >
                  <Ionicons name="add-circle-outline" size={16} color={c.accent} />
                  <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>{t.profile.uploadResume}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {resumes.map((doc) => (
                  <View key={doc.id} style={styles.docRow}>
                    <View style={styles.docIcon}>
                      <Ionicons name="document-text-outline" size={20} color={c.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                      {doc.size && <Text style={{ color: c.textMuted, fontSize: 11 }}>{doc.size}</Text>}
                    </View>
                    {doc.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>{t.profile.defaultBadge}</Text>
                      </View>
                    )}
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.outlineBtn, { marginTop: 10 }]}
                  onPress={() => router.push('/documents')}
                >
                  <Ionicons name="folder-open-outline" size={16} color={c.accent} />
                  <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>{t.profile.manageDocuments}</Text>
                </TouchableOpacity>
              </>
            )}
          </Section>

          {/* App Settings */}
          <Section c={c} title={t.profile.appSettings}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#33333318' }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={18} color={c.icon} />
                </View>
                <Text style={styles.settingLabel}>{t.profile.darkMode}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{ false: c.border2, true: c.accent + '88' }}
                thumbColor={isDark ? c.accent : c.textMuted}
              />
            </View>

            <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={handleLogout} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#C6282818' }]}>
                  <Ionicons name="log-out-outline" size={18} color="#C62828" />
                </View>
                <Text style={[styles.settingLabel, { color: '#C62828' }]}>{t.profile.signOut}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
            </TouchableOpacity>
          </Section>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

function Section({ c, title, children }: { c: any; title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16, backgroundColor: c.card }}>
      <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 14 }}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ c, icon, value }: { c: any; icon: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <Ionicons name={icon as any} size={16} color={c.textMuted} />
      <Text style={{ color: c.textBody, fontSize: 14 }}>{value}</Text>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
    iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    scroll: { paddingHorizontal: 16, paddingTop: 4 },
    hero: { alignItems: 'center', marginBottom: 20, paddingTop: 8 },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
    verifiedBadge: { position: 'absolute', bottom: 0, right: -2, backgroundColor: c.bg, borderRadius: 11 },
    userName: { color: c.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
    userTitle: { color: c.textBody, fontSize: 14, marginBottom: 6 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
    locationText: { color: c.textMuted, fontSize: 13 },
    completionCard: { width: '100%', backgroundColor: c.card2, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14 },
    completionTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    completionLabel: { color: c.textBody, fontSize: 13 },
    completionPct: { color: c.accent, fontSize: 13, fontWeight: '700' },
    progressBg: { height: 6, backgroundColor: c.border2, borderRadius: 3 },
    progressFill: { height: 6, backgroundColor: c.accent, borderRadius: 3 },
    completionHint: { color: c.textMuted, fontSize: 11, marginTop: 6 },
    bodyText: { color: c.textBody, fontSize: 14, lineHeight: 22 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: c.border2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
    chipText: { color: c.textSub, fontSize: 13 },
    langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    langName: { color: c.textSub, fontSize: 14 },
    langBadge: { backgroundColor: c.accentBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: c.accentBorder },
    langLevel: { color: c.accent, fontSize: 12, fontWeight: '600' },
    timelineItem: { flexDirection: 'row', gap: 12, paddingBottom: 16 },
    timelineItemBorder: { borderBottomWidth: 1, borderBottomColor: c.border, marginBottom: 16 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent, marginTop: 5, flexShrink: 0 },
    timelineContent: { flex: 1 },
    expRole: { color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
    expCompany: { color: c.textMuted, fontSize: 12, marginBottom: 4 },
    expDesc: { color: c.textBody, fontSize: 13, lineHeight: 20 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 12 },
    emptyText: { color: c.textMuted, fontSize: 16, fontWeight: '600' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },

    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: { flex: 1, backgroundColor: c.card2, borderRadius: 12, padding: 12, alignItems: 'center', gap: 5, borderWidth: 1, borderColor: c.border },
    statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    statValue: { color: c.text, fontSize: 20, fontWeight: '800' },
    statLabel: { color: c.textMuted, fontSize: 11, fontWeight: '600' },

    docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
    docIcon: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: c.accentBorder, backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    docName: { color: c.text, fontSize: 14, fontWeight: '600' },
    defaultBadge: { backgroundColor: c.accentBg, borderRadius: 20, borderWidth: 1, borderColor: c.accentBorder, paddingHorizontal: 8, paddingVertical: 3 },
    outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', borderWidth: 1, borderColor: c.accentBorder, borderRadius: 10, paddingVertical: 10 },

    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    settingLabel: { color: c.text, fontSize: 15, fontWeight: '600' },
  });
}
