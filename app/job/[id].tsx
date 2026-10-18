import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fs, isSmall } from '@/lib/scale';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useJob } from '@/hooks/useJobs';
import { useToggleSave, useSaved } from '@/hooks/useSaved';
import { useCheckApplied } from '@/hooks/useApplications';
import { useCredits } from '@/hooks/useCredits';
import { useT } from '@/hooks/useT';

function daysLeft(iso: string, t: ReturnType<typeof useT>['t']) {
  const diff = new Date(iso).getTime() - Date.now();
  const d = Math.ceil(diff / 86400000);
  return d > 0 ? `${d}${t.jobDetail.daysLeftSuffix}` : t.jobDetail.deadlinePassed;
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const qc = useQueryClient();
  const { t } = useT();

  const EMP: Record<string, string> = { FULL_TIME: t.jobDetail.employmentFullTime, PART_TIME: t.jobDetail.employmentPartTime, CONTRACT: t.jobDetail.employmentContract, INTERNSHIP: t.jobDetail.employmentInternship };
  const LOC: Record<string, string> = { REMOTE: t.jobDetail.locationRemote, ONSITE: t.jobDetail.locationOnsite, HYBRID: t.jobDetail.locationHybrid };
  const LVL: Record<string, string> = { JUNIOR: t.jobDetail.levelJunior, MID: t.jobDetail.levelMid, SENIOR: t.jobDetail.levelSenior, STUDENT: t.jobDetail.levelStudent };

  const { data: job, isLoading, isError } = useJob(id ?? '');
  const { data: savedJobs = [] } = useSaved();
  const { mutate: toggleSave } = useToggleSave();
  const { data: appliedData } = useCheckApplied(id ?? '');
  const { data: creditsData } = useCredits();

  const saved = savedJobs.some((s) => s.post?.id === id);
  const applied = appliedData?.applied ?? false;

  const handleSave = () => {
    toggleSave(id ?? '', {
      onSuccess: () => qc.invalidateQueries({ queryKey: ['saved'] }),
    });
  };

  const handleShare = async () => {
    if (!job) return;
    const url = `https://jobfinder.oxbiy.com/jobs/${job.id}`;
    try {
      await Share.share({
        title: job.title,
        message: `${job.title} at ${job.firm?.name ?? 'a company'}\n\n${url}`,
        url,
      });
    } catch {}
  };

  const handleApply = () => {
    if (!job) return;
    const props     = (job as any).properties ?? {};
    const isScraped = !!(job as any).source;

    // Scraped + email found → normal in-app apply (backend emails company silently)
    if (isScraped && props.applyEmail) {
      router.push(`/apply/${job.id}`);
      return;
    }

    // Scraped + no email → in-app apply (application saved to DB)
    if (isScraped && !(job as any).properties?.applyEmail) {
      router.push(`/apply/${job.id}`);
      return;
    }

    // Regular external post → open in system browser
    if (job.applyType === 'EXTERNAL' && (job as any).applyUrl) {
      Linking.openURL((job as any).applyUrl);
      return;
    }

    // Regular internal post
    router.push(`/apply/${job.id}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }]}>
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  if (isError || !job) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
        <Text style={{ color: c.textMuted }}>{t.jobDetail.loadErrorText}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: c.accentBg, borderRadius: 10 }}>
          <Text style={{ color: c.accent, fontWeight: '600' }}>{t.jobDetail.goBackButton}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { title, description, postType, employmentType, locationType, location, properties, firm, _count, viewCount, applicationDeadline, applyType, source, sourceUrl } = job;
  const creditCost: number = job.creditCost ?? 1;
  const creditBalance = creditsData?.balance ?? null;
  const canAfford = creditBalance === null || creditBalance >= creditCost;
  const isScraped = !!source;
  const { salaryMin, salaryMax, currency = 'XAF', skills = [], requirements = [], benefits = [], experienceLevel, scrapedCompany, companyAbout, education, experience } = properties ?? {};
  const displayCompany = isScraped && scrapedCompany ? scrapedCompany : firm.name;
  const displayLocation = location || (isScraped ? '' : `${firm.city}, ${firm.country}`);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleSave}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? c.accent : c.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={c.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Company card */}
        <View style={styles.companyCard}>
          {isScraped ? (
            <View style={[styles.companyAvatar, { backgroundColor: '#FFF8E1', borderColor: '#FFE082' }]}>
              <Ionicons name="hardware-chip-outline" size={24} color="#F59E0B" />
            </View>
          ) : (
            <View style={styles.companyAvatar}><Text style={styles.companyInitial}>{firm.name?.charAt(0)?.toUpperCase() ?? '?'}</Text></View>
          )}
          <View style={styles.companyInfo}>
            <View style={styles.companyNameRow}>
              <Text style={styles.companyName}>{displayCompany}</Text>
              {!isScraped && (firm as any).status === 'VERIFIED' && <Ionicons name="checkmark-circle" size={15} color={c.accent} />}
              {isScraped && <Ionicons name="globe-outline" size={13} color="#F59E0B" />}
            </View>
            <Text style={styles.companyMeta}>{isScraped ? (job as any).source : `${firm.city} · ${(firm as any).domain_role}`}</Text>
          </View>
        </View>

        <Text style={styles.jobTitle}>{title}</Text>

        {/* Location text */}
        {displayLocation ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={c.textMuted} />
            <Text style={styles.locationText}>{displayLocation}</Text>
          </View>
        ) : null}

        {/* Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={styles.chipsRow}>
            {postType === 'INTERNSHIP' && (
              <View style={[styles.chip, styles.internshipChip]}><Text style={[styles.chipText, styles.internshipChipText]}>{t.jobDetail.internshipChip}</Text></View>
            )}
            {[EMP[employmentType], LOC[locationType], experienceLevel ? LVL[experienceLevel] : null].filter(Boolean).map((chip) => (
              <View key={chip} style={styles.chip}><Text style={styles.chipText}>{chip}</Text></View>
            ))}
            {creditCost > 0 && (
              <View style={styles.creditChip}>
                <Ionicons name="wallet-outline" size={12} color="#92400e" />
                <Text style={styles.creditChipText}>{creditCost} {creditCost !== 1 ? t.jobDetail.creditUnitPlural : t.jobDetail.creditUnitSingular} {t.jobDetail.toApplySuffix}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Salary */}
        {salaryMin != null && (
          <View style={styles.salaryCard}>
            <Ionicons name="cash-outline" size={18} color={c.accent} />
            <Text style={styles.salaryText}>
              {currency} {salaryMin.toLocaleString()}{salaryMax ? ` – ${salaryMax.toLocaleString()}` : ''}
              <Text style={styles.salaryPeriod}>{t.jobDetail.monthSuffix}</Text>
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color={c.textBody} />
            <Text style={styles.statText}>{_count?.applications ?? 0}{t.jobDetail.appliedCountSuffix}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color={c.textBody} />
            <Text style={styles.statText}>{viewCount}{t.jobDetail.viewsCountSuffix}</Text>
          </View>
          {applicationDeadline && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#E65100" />
                <Text style={[styles.statText, { color: '#E65100' }]}>{daysLeft(applicationDeadline, t)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.jobDetail.aboutRoleTitle}</Text>
          <Text style={styles.sectionBody}>{description}</Text>
        </View>

        {/* Requirements */}
        {requirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.jobDetail.requirementsTitle}</Text>
            {requirements.map((r: string, i: number) => (
              <View key={i} style={styles.reqRow}>
                <View style={styles.reqDot} />
                <Text style={styles.reqText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.jobDetail.skillsTitle}</Text>
            <View style={styles.skillsGrid}>
              {skills.map((s: string) => (
                <View key={s} style={styles.skillChip}><Text style={styles.skillText}>{s}</Text></View>
              ))}
            </View>
          </View>
        )}

        {/* Benefits */}
        {benefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.jobDetail.benefitsTitle}</Text>
            <View style={styles.skillsGrid}>
              {benefits.map((b: string) => (
                <View key={b} style={styles.benefitChip}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" />
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Education requirement */}
        {education ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.jobDetail.educationTitle}</Text>
            <View style={styles.infoBox}>
              <Ionicons name="school-outline" size={18} color={c.accent} />
              <Text style={styles.infoBoxText}>{education}</Text>
            </View>
          </View>
        ) : null}

        {/* Experience requirement */}
        {experience ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.jobDetail.experienceTitle}</Text>
            <View style={styles.infoBox}>
              <Ionicons name="briefcase-outline" size={18} color={c.accent} />
              <Text style={styles.infoBoxText}>{experience}</Text>
            </View>
          </View>
        ) : null}

        {/* About firm — scraped posts all share one placeholder system firm
            record, so its team size/industry/country are meaningless noise
            for them (always "Agrégateur" etc.). Only show that real-firm
            grid for actual firm-created posts; scraped posts get whatever
            companyAbout the AI could pull from the posting itself, plus the
            post's own location. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.jobDetail.aboutCompanyPrefix}{displayCompany}</Text>
          {isScraped ? (
            <>
              {companyAbout ? (
                <Text style={[styles.sectionBody, { marginBottom: 12 }]}>{companyAbout}</Text>
              ) : (
                <Text style={[styles.sectionBody, { marginBottom: 12, fontStyle: 'italic', opacity: 0.7 }]}>
                  {t.jobDetail.noCompanyDescription}
                </Text>
              )}
              <View style={styles.firmGridItem}>
                <Ionicons name="location-outline" size={16} color={c.accent} />
                <View>
                  <Text style={styles.firmGridLabel}>{t.jobDetail.locationLabel}</Text>
                  <Text style={styles.firmGridValue}>{location || '—'}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.firmGrid}>
              {[
                { icon: 'location-outline',  label: t.jobDetail.locationLabel, value: firm.city },
                { icon: 'people-outline',    label: t.jobDetail.teamSizeLabel, value: (firm as any).size ?? '—' },
                { icon: 'briefcase-outline', label: t.jobDetail.industryLabel,  value: (firm as any).domain_role },
                { icon: 'globe-outline',     label: t.jobDetail.countryLabel,   value: firm.country },
              ].map(({ icon, label, value }) => (
                <View key={label} style={styles.firmGridItem}>
                  <Ionicons name={icon as any} size={16} color={c.accent} />
                  <View>
                    <Text style={styles.firmGridLabel}>{label}</Text>
                    <Text style={styles.firmGridValue}>{value}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={c.accent} />
        </TouchableOpacity>

        {applied ? (
          <View style={[styles.applyBtn, styles.appliedBtn]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={18} color={c.accent} />
              <Text style={[styles.applyBtnText, { color: c.accent }]}>{t.jobDetail.appliedBadge}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.applyBtn, !canAfford && styles.applyBtnWarn]}
            activeOpacity={0.85}
            onPress={canAfford ? handleApply : () => router.push('/credits')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.applyBtnText}>
                {!canAfford ? t.jobDetail.buyCreditsButton : applyType === 'EXTERNAL' ? t.jobDetail.applyOnWebsiteButton : t.jobDetail.applyNowButton}
              </Text>
              {applyType === 'EXTERNAL' && canAfford && (
                <Ionicons name="open-outline" size={15} color="#fff" />
              )}
            </View>
            {creditCost > 0 && (
              <Text style={styles.applyBtnSub}>
                {canAfford
                  ? `· ${creditCost} ${creditCost !== 1 ? t.jobDetail.creditUnitPlural : t.jobDetail.creditUnitSingular}${creditBalance !== null ? `  ·  ${t.jobDetail.balanceLabel}: ${creditBalance}` : ''}`
                  : `${t.jobDetail.needPrefix}${creditCost} ${creditCost !== 1 ? t.jobDetail.creditUnitPlural : t.jobDetail.creditUnitSingular}${t.jobDetail.needSuffix}`}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
    headerActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: 16 },
    companyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    companyAvatar: { width: 52, height: 52, borderRadius: 14, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center' },
    companyInitial: { color: c.accent, fontSize: 22, fontWeight: '800' },
    companyInfo: { flex: 1 },
    companyNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    companyName: { color: c.textSub, fontSize: 15, fontWeight: '600' },
    companyMeta: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    jobTitle: { fontSize: fs(isSmall ? 20 : 24), fontWeight: '800', color: c.text, lineHeight: fs(isSmall ? 26 : 30), marginBottom: 14 },
    chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { borderWidth: 1, borderColor: c.border2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexShrink: 0 },
    chipText: { color: c.textBody, fontSize: fs(12), flexShrink: 0 },
    salaryCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder, borderRadius: 12, padding: 14, marginBottom: 16 },
    salaryText: { color: c.accent, fontSize: fs(17), fontWeight: '700' },
    salaryPeriod: { fontSize: 13, fontWeight: '400', color: c.accent, opacity: 0.6 },
    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 24, gap: 12 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
    statText: { color: c.textBody, fontSize: 12 },
    statDivider: { width: 1, height: 16, backgroundColor: c.border2 },
    section: { marginBottom: 28 },
    sectionTitle: { color: c.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },
    sectionBody: { color: c.textBody, fontSize: 14, lineHeight: 24 },
    reqRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    reqDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent, marginTop: 7, flexShrink: 0 },
    reqText: { color: c.textBody, fontSize: 14, lineHeight: 22, flex: 1 },
    skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillChip: { borderWidth: 1, borderColor: c.border2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
    skillText: { color: c.textSub, fontSize: 13 },
    benefitChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0fdf4' },
    benefitText: { color: '#15803d', fontSize: 13 },
    firmGrid: { gap: 14 },
    firmGridItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    firmGridLabel: { color: c.textMuted, fontSize: 11 },
    firmGridValue: { color: c.textSub, fontSize: 13, fontWeight: '500' },
    cta: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bg },
    saveBtn: { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    applyBtn: { flex: 1, minHeight: 52, borderRadius: 14, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    applyBtnWarn: { backgroundColor: '#E65100' },
    appliedBtn: { backgroundColor: c.accentBg, borderWidth: 1.5, borderColor: c.accent },
    applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    applyBtnSub: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '500', marginTop: 2 },
    creditChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#fbbf2480', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fef3c7', flexShrink: 0 },
    creditChipText: { color: '#92400e', fontSize: 12, fontWeight: '700' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
    locationText: { color: c.textMuted, fontSize: 13 },
    internshipChip: { backgroundColor: '#f3e8ff', borderColor: '#d8b4fe' },
    internshipChipText: { color: '#7c3aed' },
    infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder, borderRadius: 12, padding: 14 },
    infoBoxText: { color: c.textBody, fontSize: 14, lineHeight: 22, flex: 1 },
  });
}
