import { useApply } from '@/hooks/useApplications';
import { useDocuments } from '@/hooks/useDocuments';
import { useJob } from '@/hooks/useJobs';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/hooks/useT';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = typeof id === 'string' ? id : '';
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { t } = useT();
  const STEPS = [t.applyForm.stepDocuments, t.applyForm.stepCoverLetter, t.applyForm.stepReview];

  const { data: job } = useJob(postId);
  const { data: docs = [] } = useDocuments();
  const { mutate: apply, isPending } = useApply();

  const resumes = useMemo(() => docs.filter((d) => d.documentType === 'RESUME'), [docs]);
  const otherDocs = useMemo(() => docs.filter((d) => d.documentType !== 'RESUME'), [docs]);
  const defaultResume = useMemo(() => resumes.find((d) => d.isDefault) ?? resumes[0], [resumes]);

  const [step, setStep] = useState(0);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelectedDocIds((prev) => prev.length === 0 && defaultResume ? [defaultResume.id] : prev);
  }, [defaultResume]);

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId],
    );
  };

  const selectedDocs = docs.filter((d) => selectedDocIds.includes(d.id));
  const goNext = () => setStep((s) => s + 1);
  const goBack = () => { if (step === 0) router.back(); else setStep((s) => s - 1); };

  // Hardware back button: step backwards through wizard instead of exiting
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [step]); // re-register when step changes so closure has correct step

  const handleSubmit = () => {
    if (!postId) {
      Alert.alert(t.applyForm.invalidJobAlertTitle, t.applyForm.invalidJobAlertMessage);
      return;
    }
    const documents = selectedDocs.filter((d) => d.url != null).map((d) => ({ name: d.name, url: d.url as string }));
    const salaryNum = salaryExpectation ? parseInt(salaryExpectation, 10) : undefined;
    apply(
      {
        postId,
        coverLetter: coverLetter.trim() || undefined,
        documents: documents.length > 0 ? documents : undefined,
        salaryExpectation: salaryNum && !isNaN(salaryNum) ? salaryNum : undefined,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: any) => {
          const raw = err?.response?.data?.message;
          const msg = Array.isArray(raw) ? raw.join('\n') : (raw ?? err?.response?.data?.error ?? t.applyForm.submissionFailedMessage);
          Alert.alert(t.applyForm.applicationFailedAlertTitle, String(msg));
        },
      },
    );
  };

  if (!postId) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={c.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={c.textMuted} />
          <Text style={styles.successTitle}>{t.applyForm.invalidJobTitle}</Text>
          <Text style={styles.successMsg}>{t.applyForm.invalidJobScreenMessage}</Text>
        </View>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={c.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerWrap}>
          <View style={styles.successCircle}><Ionicons name="checkmark" size={48} color={c.accent} /></View>
          <Text style={styles.successTitle}>{t.applyForm.applicationSentTitle}</Text>
          <Text style={styles.successMsg}>
            {t.applyForm.applicationSentPrefix}{(job as any)?.source
              ? ((job as any)?.properties?.scrapedCompany ?? job?.firm?.name ?? t.applyForm.theCompanyFallback)
              : (job?.firm?.name ?? t.applyForm.theCompanyFallback)}{t.applyForm.applicationSentSuffix}
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>{t.applyForm.backToJobsButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={goBack}>
          <Ionicons name={step === 0 ? 'close' : 'arrow-back'} size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.applyForm.applyHeaderTitle}</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.steps}>
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <View key={label} style={styles.stepGroup}>
              <View style={styles.stepRow}>
                <View style={[styles.stepDot, active && styles.stepDotActive, done && styles.stepDotDone]}>
                  {done
                    ? <Ionicons name="checkmark" size={13} color="#fff" />
                    : <Text style={[styles.stepNum, (active || done) && styles.stepNumActive]}>{i + 1}</Text>}
                </View>
                {i < STEPS.length - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <StepDocuments
            c={c} styles={styles} t={t}
            allDocs={docs}
            resumes={resumes}
            otherDocs={otherDocs}
            selectedIds={selectedDocIds}
            onToggle={toggleDoc}
          />
        )}
        {step === 1 && (
          <StepCoverLetter
            c={c} styles={styles} t={t}
            coverLetter={coverLetter}
            onChangeCover={setCoverLetter}
            salaryExpectation={salaryExpectation}
            onChangeSalary={setSalaryExpectation}
            job={job}
          />
        )}
        {step === 2 && (
          <StepReview
            c={c} styles={styles} t={t}
            selectedDocs={selectedDocs}
            coverLetter={coverLetter}
            salaryExpectation={salaryExpectation}
            jobTitle={job?.title ?? '—'}
            firm={(job as any)?.source
              ? ((job as any)?.properties?.scrapedCompany ?? job?.firm?.name ?? '—')
              : (job?.firm?.name ?? '—')}
            isScrapedNoEmail={!!(job as any)?.source && !(job as any)?.properties?.applyEmail}
            sourceUrl={(job as any)?.sourceUrl}
          />
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* CTA */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + 12 }]}>
        {step < 2 ? (
          <TouchableOpacity
            style={[styles.nextBtn, step === 0 && selectedDocIds.length === 0 && docs.length > 0 && styles.btnDisabled]}
            activeOpacity={0.85}
            disabled={step === 0 && selectedDocIds.length === 0 && docs.length > 0}
            onPress={goNext}
          >
            <Text style={styles.nextBtnText}>{t.applyForm.continueButton}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, isPending && styles.btnDisabled]}
            activeOpacity={0.85}
            disabled={isPending}
            onPress={handleSubmit}
          >
            {isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Text style={styles.nextBtnText}>{t.applyForm.submitApplicationButton}</Text><Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} /></>
            }
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function StepDocuments({ c, styles, t, allDocs, resumes, otherDocs, selectedIds, onToggle }: {
  c: any; styles: any; t: any;
  allDocs: any[]; resumes: any[]; otherDocs: any[];
  selectedIds: string[]; onToggle: (id: string) => void;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{t.applyForm.yourDocumentsTitle}</Text>
      <Text style={styles.sectionHint}>
        {t.applyForm.selectDocumentsHint} {selectedIds.length > 0 ? `${selectedIds.length}${t.applyForm.selectedCountSuffix}` : ''}
      </Text>

      {allDocs.length === 0 ? (
        <View style={styles.emptyDocs}>
          <Ionicons name="document-outline" size={40} color={c.border3} />
          <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center' }}>{t.applyForm.noDocumentsUploadedLine1}{'\n'}{t.applyForm.noDocumentsUploadedLine2}</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => router.push('/documents')}>
            <Ionicons name="add-circle-outline" size={18} color={c.accent} />
            <Text style={styles.uploadText}>{t.applyForm.goToDocumentsButton}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {resumes.length > 0 && (
            <>
              <Text style={styles.docGroupLabel}>{t.applyForm.cvResumeLabel}</Text>
              {resumes.map((doc) => {
                const selected = selectedIds.includes(doc.id);
                return (
                  <TouchableOpacity key={doc.id} style={[styles.docCard, selected && styles.docCardSelected]} onPress={() => onToggle(doc.id)} activeOpacity={0.8}>
                    <View style={[styles.docIcon, { backgroundColor: selected ? c.accentBg : c.card2 }]}>
                      <Ionicons name="document-text-outline" size={22} color={selected ? c.accent : c.textMuted} />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>{doc.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {doc.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>{t.applyForm.defaultBadge}</Text></View>}
                        {doc.size ? <Text style={styles.docSize}>{doc.size}</Text> : null}
                      </View>
                    </View>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          {otherDocs.length > 0 && (
            <>
              <Text style={[styles.docGroupLabel, { marginTop: 14 }]}>{t.applyForm.otherDocumentsLabel}</Text>
              {otherDocs.map((doc) => {
                const selected = selectedIds.includes(doc.id);
                return (
                  <TouchableOpacity key={doc.id} style={[styles.docCard, selected && styles.docCardSelected]} onPress={() => onToggle(doc.id)} activeOpacity={0.8}>
                    <View style={[styles.docIcon, { backgroundColor: selected ? c.accentBg : c.card2 }]}>
                      <Ionicons name="attach-outline" size={22} color={selected ? c.accent : c.textMuted} />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docName}>{doc.name}</Text>
                      <Text style={styles.docSize}>{doc.documentType?.replace(/_/g, ' ') ?? ''}</Text>
                    </View>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.push('/documents')}>
            <Ionicons name="add-circle-outline" size={18} color={c.accent} />
            <Text style={styles.uploadText}>{t.applyForm.uploadNewDocumentButton}</Text>
          </TouchableOpacity>
        </>
      )}
      <Text style={styles.docHint}>{t.applyForm.supportedFormatsHint}</Text>
    </View>
  );
}

function StepCoverLetter({ c, styles, t, coverLetter, onChangeCover, salaryExpectation, onChangeSalary, job }: {
  c: any; styles: any; t: any;
  coverLetter: string; onChangeCover: (t: string) => void;
  salaryExpectation: string; onChangeSalary: (t: string) => void;
  job: any;
}) {
  const hasSalary = job?.properties?.salaryMin || job?.properties?.salaryMax;
  return (
    <View>
      <Text style={styles.sectionTitle}>{t.applyForm.coverLetterTitle}</Text>
      <Text style={styles.sectionHint}>{t.applyForm.coverLetterHint}</Text>
      <TextInput
        style={styles.textarea}
        placeholder={t.applyForm.coverLetterPlaceholder}
        placeholderTextColor={c.textDim}
        value={coverLetter}
        onChangeText={(txt) => txt.length <= 1000 && onChangeCover(txt)}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{coverLetter.length}{t.applyForm.charCountSuffix}</Text>

      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={16} color="#F57F17" />
        <Text style={styles.tipText}>{t.applyForm.coverLetterTip}</Text>
      </View>

      {/* Salary Expectation */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t.applyForm.salaryExpectationTitle}</Text>
      <Text style={styles.sectionHint}>
        {t.applyForm.salaryOptionalLabel}{hasSalary ? `${t.applyForm.salaryPostedRangePrefix}${job.properties?.currency ?? 'XAF'} ${job.properties?.salaryMin?.toLocaleString() ?? '?'}${job.properties?.salaryMax ? ` – ${job.properties.salaryMax.toLocaleString()}` : '+'}` : ''}
      </Text>
      <View style={styles.inputRow}>
        <Text style={styles.currencyLabel}>XAF</Text>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={t.applyForm.salaryPlaceholder}
          placeholderTextColor={c.textDim}
          value={salaryExpectation}
          onChangeText={(txt) => onChangeSalary(txt.replace(/\D/g, ''))}
          keyboardType="numeric"
          returnKeyType="done"
        />
        {salaryExpectation.length > 0 && (
          <TouchableOpacity onPress={() => onChangeSalary('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function StepReview({ c, styles, t, selectedDocs, coverLetter, salaryExpectation, jobTitle, firm, isScrapedNoEmail, sourceUrl }: {
  c: any; styles: any; t: any;
  selectedDocs: any[];
  coverLetter: string; salaryExpectation: string; jobTitle: string; firm: string;
  isScrapedNoEmail?: boolean; sourceUrl?: string;
}) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.sectionTitle}>{t.applyForm.reviewTitle}</Text>
      <Text style={styles.sectionHint}>{t.applyForm.reviewHint}</Text>

      {/* Summary rows */}
      <View style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>{t.applyForm.positionLabel}</Text>
          <Text style={styles.reviewValue} numberOfLines={2}>{jobTitle}</Text>
        </View>
        <View style={[styles.reviewRow, { borderTopWidth: 1, borderTopColor: c.border }]}>
          <Text style={styles.reviewLabel}>{t.applyForm.companyLabel}</Text>
          <Text style={styles.reviewValue}>{firm}</Text>
        </View>
      </View>

      {/* Documents */}
      <View style={styles.reviewCard}>
        <Text style={styles.reviewCardLabel}>{t.applyForm.documentsLabel} ({selectedDocs.length})</Text>
        {selectedDocs.length > 0 ? (
          selectedDocs.map((doc) => (
            <View key={doc.id} style={styles.reviewDocRow}>
              <Ionicons name="document-text-outline" size={16} color={c.accent} />
              <Text style={styles.reviewDocName} numberOfLines={1}>{doc.name}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.reviewCoverEmpty}>{t.applyForm.noDocumentsSelected}</Text>
        )}
      </View>

      {/* Cover letter */}
      <View style={styles.reviewCard}>
        <Text style={styles.reviewCardLabel}>{t.applyForm.coverLetterTitle}</Text>
        {coverLetter.trim()
          ? <Text style={styles.reviewCoverText} numberOfLines={5}>{coverLetter}</Text>
          : <Text style={styles.reviewCoverEmpty}>{t.applyForm.noneAdded}</Text>}
      </View>

      {/* Salary expectation */}
      {salaryExpectation ? (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewCardLabel}>{t.applyForm.salaryExpectationTitle}</Text>
          <Text style={styles.reviewValue}>XAF {parseInt(salaryExpectation, 10).toLocaleString()}{t.applyForm.perMonthSuffix}</Text>
        </View>
      ) : null}

      {/* Scraped notice */}
      {isScrapedNoEmail && sourceUrl && (
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle-outline" size={18} color="#1e88e5" />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.noticeText}>
              {t.applyForm.scrapedNoticeText}
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL(sourceUrl)} activeOpacity={0.8}>
              <Text style={styles.noticeLink}>{t.applyForm.viewOriginalPostingLink}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.consentRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color={c.textMuted} />
        <Text style={styles.consentText}>{t.applyForm.consentText}</Text>
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
    iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    steps: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 20, gap: 0 },
    stepGroup: { alignItems: 'center', flex: 1 },
    stepRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
    stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    stepDotActive: { borderColor: c.accent, backgroundColor: c.accentBg },
    stepDotDone: { backgroundColor: c.accent, borderColor: c.accent },
    stepNum: { color: c.textMuted, fontSize: 12, fontWeight: '700' },
    stepNumActive: { color: c.accent },
    stepLine: { flex: 1, height: 1.5, backgroundColor: c.border2, marginHorizontal: 4 },
    stepLineDone: { backgroundColor: c.accent },
    stepLabel: { color: c.textMuted, fontSize: 11, marginTop: 6, textAlign: 'center' },
    stepLabelActive: { color: c.accent, fontWeight: '600' },
    scroll: { paddingHorizontal: 16, paddingTop: 4 },
    sectionTitle: { color: c.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
    sectionHint: { color: c.textMuted, fontSize: 13, marginBottom: 14 },
    emptyDocs: { alignItems: 'center', gap: 10, padding: 28, borderWidth: 1, borderColor: c.border2, borderRadius: 14, borderStyle: 'dashed', marginBottom: 12 },
    docGroupLabel: { color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    docCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, marginBottom: 8 },
    docCardSelected: { borderColor: c.accent, backgroundColor: c.accentBg },
    docIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    docInfo: { flex: 1 },
    docName: { color: c.textSub, fontSize: 14, fontWeight: '600' },
    docSize: { color: c.textMuted, fontSize: 12 },
    defaultBadge: { backgroundColor: c.accentBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: c.accentBorder },
    defaultBadgeText: { color: c.accent, fontSize: 10, fontWeight: '700' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: c.border2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    checkboxSelected: { backgroundColor: c.accent, borderColor: c.accent },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border2, borderStyle: 'dashed', justifyContent: 'center', marginTop: 8 },
    addMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border2, borderStyle: 'dashed', justifyContent: 'center', marginTop: 4 },
    uploadText: { color: c.accent, fontSize: 13, fontWeight: '600' },
    docHint: { color: c.textDim, fontSize: 11, marginTop: 8 },
    textarea: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, borderRadius: 14, padding: 14, color: c.text, fontSize: 14, minHeight: 160, lineHeight: 22 },
    charCount: { color: c.textDim, fontSize: 11, textAlign: 'right', marginTop: 6 },
    tipCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#F57F1710', borderWidth: 1, borderColor: '#F57F1725', borderRadius: 12, padding: 12, marginTop: 14 },
    tipText: { color: '#F57F17', fontSize: 13, lineHeight: 19, flex: 1 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border2, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
    currencyLabel: { color: c.textMuted, fontSize: 14, fontWeight: '700' },
    input: { color: c.text, fontSize: 15 },
    reviewCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, gap: 0, overflow: 'hidden' },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, gap: 16 },
    reviewLabel: { color: c.textMuted, fontSize: 13, flexShrink: 0 },
    reviewValue: { color: c.textSub, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
    reviewCardLabel: { color: c.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    reviewDocRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    reviewDocName: { color: c.textSub, fontSize: 14, fontWeight: '600', flex: 1 },
    reviewCoverText: { color: c.textBody, fontSize: 13, lineHeight: 20 },
    reviewCoverEmpty: { color: c.textDim, fontSize: 13, fontStyle: 'italic' },
    noticeCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#90caf9', borderRadius: 12, padding: 12 },
    noticeText: { color: '#1565c0', fontSize: 13, lineHeight: 19 },
    noticeLink: { color: '#1e88e5', fontSize: 13, fontWeight: '700' },
    consentRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingBottom: 8 },
    consentText: { color: c.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
    cta: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bg },
    nextBtn: { height: 52, borderRadius: 14, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.4 },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
    successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: c.accentBg, borderWidth: 2, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    successTitle: { color: c.text, fontSize: 24, fontWeight: '800' },
    successMsg: { color: c.textBody, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    doneBtn: { marginTop: 12, height: 52, borderRadius: 14, backgroundColor: c.accent, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center' },
    doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
