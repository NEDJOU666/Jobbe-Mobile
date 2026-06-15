import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { fs, sp, isSmall } from '@/lib/scale';

export interface Job {
  id: string; title: string; description: string;
  postType: 'JOB' | 'INTERNSHIP';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  locationType: 'REMOTE' | 'ONSITE' | 'HYBRID';
  location: string;
  properties: { experienceLevel?: string; salaryMin?: number; salaryMax?: number; currency?: string; skills?: string[] };
  firm: { name: string; city: string; country: string; status?: string; isVerified?: boolean };
  _count?: { applications: number };
  applicationCount?: number;
  createdAt: string; isSaved?: boolean;
}

const EMP: Record<string, string> = { FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Contract', INTERNSHIP: 'Internship' };
const LOC: Record<string, string> = { REMOTE: 'Remote', ONSITE: 'On-site', HYBRID: 'Hybrid' };
const LVL: Record<string, string> = { JUNIOR: 'Junior', MID: 'Mid-level', SENIOR: 'Senior', STUDENT: 'Student' };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
}

interface Props {
  job: Job; onPress?: () => void;
  onSave?: (id: string, saved: boolean) => void;
  onHide?: (id: string) => void;
}

const HIT = { top: 10, bottom: 10, left: 10, right: 10 };

function JobCardInner({ job, onPress, onSave, onHide }: Props) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [saved, setSaved] = useState(job.isSaved ?? false);
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const { salaryMin, salaryMax, currency = 'XAF', skills = [], experienceLevel } = job.properties ?? {};

  const details = [
    EMP[job.employmentType],
    LOC[job.locationType],
    experienceLevel ? LVL[experienceLevel] : null,
    salaryMin != null ? `${currency} ${salaryMin.toLocaleString()}${salaryMax ? ' – ' + salaryMax.toLocaleString() : ''}` : null,
  ].filter(Boolean).join('  ·  ');

  const handleSave = () => {
    const next = !saved;
    setSaved(next);
    onSave?.(job.id, next);
  };

  const firmInitial = (job as any).properties?.scrapedCompany?.charAt(0)?.toUpperCase()
    ?? job.firm?.name?.charAt(0)?.toUpperCase() ?? '?';
  const displayFirmName = (job as any).properties?.scrapedCompany || job.firm?.name || '—';
  const displayFirmCity = job.firm?.city || (job as any).location || '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.row}>
        <Text style={styles.meta}>
          {timeAgo(job.createdAt)}{(job._count?.applications ?? job.applicationCount) != null ? `  ·  ${job._count?.applications ?? job.applicationCount} applied` : ''}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setHidden(true); onHide?.(job.id); }} hitSlop={HIT}>
            <Ionicons name="thumbs-down-outline" size={17} color={c.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave} hitSlop={HIT}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={17} color={saved ? c.accent : c.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
      <Text style={styles.details}>{details}</Text>

      <Text style={styles.desc} numberOfLines={expanded ? undefined : 2}>{job.description}</Text>
      {job.description.length > 100 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} hitSlop={HIT}>
          <Text style={styles.more}>{expanded ? 'less' : 'more'}</Text>
        </TouchableOpacity>
      )}

      {skills.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginBottom: 2 }}>
          <View style={styles.skillRow}>
            {skills.map((s) => (
              <View key={s} style={styles.skillChip}><Text style={styles.skillText}>{s}</Text></View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.firmAvatar}><Text style={styles.firmInitial}>{firmInitial}</Text></View>
        <View style={styles.firmInfo}>
          <Text style={styles.firmName} numberOfLines={1}>{displayFirmName}</Text>
          {displayFirmCity ? <Text style={styles.firmCity} numberOfLines={1}>{displayFirmCity}</Text> : null}
        </View>
        {(job.firm.isVerified || job.firm.status === 'VERIFIED') && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={c.accent} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        <View style={[styles.typeTag, job.postType === 'INTERNSHIP' && styles.typeTagIntern]}>
          <Text style={[styles.typeTagText, job.postType === 'INTERNSHIP' && styles.typeTagTextIntern]}>
            {job.postType === 'JOB' ? 'Job' : 'Internship'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const JobCard = memo(JobCardInner);

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    card: { backgroundColor: c.card, marginHorizontal: sp(isSmall ? 10 : 14), marginBottom: sp(10), borderRadius: 16, padding: sp(isSmall ? 12 : 16), borderWidth: 1, borderColor: c.border },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    meta: { color: c.textMuted, fontSize: fs(12), flex: 1, marginRight: 8 },
    actions: { flexDirection: 'row', gap: 6 },
    actionBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: fs(isSmall ? 15 : 17), fontWeight: '700', color: c.text, lineHeight: fs(isSmall ? 21 : 23), marginBottom: 6 },
    details: { fontSize: fs(12), color: c.textBody, lineHeight: fs(18), marginBottom: 10 },
    desc: { fontSize: fs(13), color: c.textBody, lineHeight: fs(20), marginBottom: 2 },
    more: { color: c.accent, fontSize: fs(13), fontWeight: '600', marginBottom: 2 },
    skillRow: { flexDirection: 'row', gap: 7 },
    skillChip: { borderWidth: 1, borderColor: c.border2, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
    skillText: { color: c.textSub, fontSize: 12, fontWeight: '500' },
    divider: { height: 1, backgroundColor: c.border, marginVertical: 12 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    firmAvatar: { width: 30, height: 30, borderRadius: 8, backgroundColor: c.card2, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    firmInitial: { color: c.accent, fontSize: 13, fontWeight: '700' },
    firmInfo: { flex: 1, minWidth: 0 },
    firmName: { color: c.textSub, fontSize: 12, fontWeight: '600' },
    firmCity: { color: c.textMuted, fontSize: 11, marginTop: 1 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.accentBg, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 },
    verifiedText: { color: c.accent, fontSize: 11, fontWeight: '600' },
    typeTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.accentBg, flexShrink: 0 },
    typeTagIntern: { backgroundColor: c.card2 },
    typeTagText: { color: c.accent, fontSize: 11, fontWeight: '600' },
    typeTagTextIntern: { color: '#7986CB' },
  });
}
