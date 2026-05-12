import { useApply } from '@/hooks/useApplications';
import { useDocuments } from '@/hooks/useDocuments';
import { useJob } from '@/hooks/useJobs';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = ['Resume', 'Cover Letter', 'Review'];

export default function ApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = typeof id === 'string' ? id : '';
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const { data: job } = useJob(postId);
  const { data: docs = [] } = useDocuments();
  const { mutate: apply, isPending } = useApply();

  const resumes = useMemo(() => docs.filter((d) => d.documentType === 'RESUME'), [docs]);
  const defaultResume = useMemo(() => resumes.find((d) => d.isDefault) ?? resumes[0], [resumes]);

  const [step, setStep] = useState(0);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!selectedDocId && defaultResume) setSelectedDocId(defaultResume.id);
  }, [defaultResume, selectedDocId]);

  const selectedDoc = docs.find((d) => d.id === selectedDocId);
  const goNext = () => setStep((s) => s + 1);
  const goBack = () => { if (step === 0) router.back(); else setStep((s) => s - 1); };

  const handleSubmit = () => {
    if (!postId) {
      Alert.alert('Invalid job', 'This job link is invalid. Please go back and try again.');
      return;
    }
    apply(
      { postId, coverLetter, resumeName: selectedDoc?.name },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? 'Submission failed. Please try again.';
          Alert.alert('Application failed', msg);
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
        <View style={styles.successWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={c.textMuted} />
          <Text style={styles.successTitle}>Invalid job</Text>
          <Text style={styles.successMsg}>This job link is invalid. Please go back and pick a job from the list.</Text>
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
        <View style={styles.successWrap}>
          <View style={styles.successCircle}><Ionicons name="checkmark" size={48} color={c.accent} /></View>
          <Text style={styles.successTitle}>Application Sent!</Text>
          <Text style={styles.successMsg}>Your application has been submitted to {job?.firm?.name ?? 'the company'}. They'll review it and get back to you.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Back to Jobs</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={goBack}>
          <Ionicons name={step === 0 ? 'close' : 'arrow-back'} size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply</Text>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {step === 0 && <StepResume c={c} styles={styles} docs={resumes} selectedDoc={selectedDocId} onSelect={setSelectedDocId} />}
        {step === 1 && <StepCoverLetter c={c} styles={styles} value={coverLetter} onChange={setCoverLetter} />}
        {step === 2 && <StepReview c={c} styles={styles} doc={selectedDoc} coverLetter={coverLetter} jobTitle={job?.title ?? '—'} firm={job?.firm?.name ?? '—'} />}
        <View style={{ height: 110 }} />
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 12 }]}>
        {step < 2 ? (
          <TouchableOpacity style={[styles.nextBtn, step === 0 && !selectedDocId && styles.btnDisabled]} activeOpacity={0.85} disabled={step === 0 && !selectedDocId} onPress={goNext}>
            <Text style={styles.nextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextBtn, isPending && styles.btnDisabled]} activeOpacity={0.85} disabled={isPending} onPress={handleSubmit}>
            {isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Text style={styles.nextBtnText}>Submit Application</Text><Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} /></>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function StepResume({ c, styles, docs, selectedDoc, onSelect }: { c: any; styles: any; docs: any[]; selectedDoc: string | null; onSelect: (id: string) => void }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Select your resume</Text>
      <Text style={styles.sectionHint}>Choose one of your uploaded documents</Text>
      {docs.length === 0 && (
        <View style={{ padding: 20, alignItems: 'center', gap: 8 }}>
          <Ionicons name="document-outline" size={40} color={c.border3} />
          <Text style={{ color: c.textMuted, fontSize: 13 }}>No resumes uploaded yet</Text>
        </View>
      )}
      {docs.map((doc) => {
        const selected = selectedDoc === doc.id;
        return (
          <TouchableOpacity key={doc.id} style={[styles.docCard, selected && styles.docCardSelected]} onPress={() => onSelect(doc.id)} activeOpacity={0.8}>
            <View style={[styles.docIcon, { backgroundColor: selected ? c.accentBg : c.card2 }]}>
              <Ionicons name="document-text-outline" size={22} color={selected ? c.accent : c.textMuted} />
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docName}>{doc.name}</Text>
              <Text style={styles.docSize}>{doc.size ?? ''}</Text>
            </View>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity style={styles.uploadBtn} onPress={() => router.push('/documents')}>
        <Ionicons name="add-circle-outline" size={20} color={c.accent} />
        <Text style={styles.uploadText}>Upload new resume</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepCoverLetter({ c, styles, value, onChange }: { c: any; styles: any; value: string; onChange: (t: string) => void }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Cover letter</Text>
      <Text style={styles.sectionHint}>Optional — tell the recruiter why you're the right fit</Text>
      <TextInput style={styles.textarea} placeholder="e.g. I'm excited about this role because..." placeholderTextColor={c.textDim} value={value} onChangeText={(t) => t.length <= 1000 && onChange(t)} multiline numberOfLines={8} textAlignVertical="top" />
      <Text style={styles.charCount}>{value.length} / 1000</Text>
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={16} color="#F57F17" />
        <Text style={styles.tipText}>Keep it short (3–5 sentences). Mention the role, your key skill, and why this company.</Text>
      </View>
    </View>
  );
}

function StepReview({ c, styles, doc, coverLetter, jobTitle, firm }: { c: any; styles: any; doc?: { name: string; size?: string | null }; coverLetter: string; jobTitle: string; firm: string }) {
  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.sectionTitle}>Review your application</Text>
      <Text style={styles.sectionHint}>Check everything before submitting</Text>
      <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Position</Text><Text style={styles.reviewValue}>{jobTitle}</Text></View>
      <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Company</Text><Text style={styles.reviewValue}>{firm}</Text></View>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewCardLabel}>Resume</Text>
        <View style={styles.reviewDocRow}>
          <Ionicons name="document-text-outline" size={18} color={c.accent} />
          <Text style={styles.reviewDocName}>{doc?.name ?? '—'}</Text>
          <Text style={styles.reviewDocSize}>{doc?.size}</Text>
        </View>
      </View>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewCardLabel}>Cover Letter</Text>
        {coverLetter.trim()
          ? <Text style={styles.reviewCoverText} numberOfLines={5}>{coverLetter}</Text>
          : <Text style={styles.reviewCoverEmpty}>No cover letter added</Text>}
      </View>
      <View style={styles.consentRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color={c.textMuted} />
        <Text style={styles.consentText}>By submitting, you agree to share your profile and resume with the employer.</Text>
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
    sectionHint: { color: c.textMuted, fontSize: 13, marginBottom: 16 },
    docCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, marginBottom: 10 },
    docCardSelected: { borderColor: c.accent, backgroundColor: c.accentBg },
    docIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    docInfo: { flex: 1 },
    docName: { color: c.textSub, fontSize: 14, fontWeight: '600' },
    docSize: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    radioSelected: { borderColor: c.accent },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: c.border2, borderStyle: 'dashed', justifyContent: 'center' },
    uploadText: { color: c.accent, fontSize: 14, fontWeight: '600' },
    textarea: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, borderRadius: 14, padding: 14, color: c.text, fontSize: 14, minHeight: 180, lineHeight: 22 },
    charCount: { color: c.textDim, fontSize: 11, textAlign: 'right', marginTop: 6 },
    tipCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#F57F1710', borderWidth: 1, borderColor: '#F57F1725', borderRadius: 12, padding: 12, marginTop: 16 },
    tipText: { color: '#F57F17', fontSize: 13, lineHeight: 19, flex: 1 },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
    reviewLabel: { color: c.textMuted, fontSize: 13 },
    reviewValue: { color: c.textSub, fontSize: 14, fontWeight: '600' },
    reviewCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, gap: 10 },
    reviewCardLabel: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    reviewDocRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    reviewDocName: { color: c.textSub, fontSize: 14, fontWeight: '600', flex: 1 },
    reviewDocSize: { color: c.textMuted, fontSize: 12 },
    reviewCoverText: { color: c.textBody, fontSize: 13, lineHeight: 20 },
    reviewCoverEmpty: { color: c.textDim, fontSize: 13, fontStyle: 'italic' },
    consentRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    consentText: { color: c.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
    cta: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bg },
    nextBtn: { height: 52, borderRadius: 14, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.4 },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
    successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: c.accentBg, borderWidth: 2, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    successTitle: { color: c.text, fontSize: 24, fontWeight: '800' },
    successMsg: { color: c.textBody, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    doneBtn: { marginTop: 12, height: 52, borderRadius: 14, backgroundColor: c.accent, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center' },
    doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
