import { api, API_URL } from '@/lib/api';
import { secureStorage } from '@/utils/secureStorage';
import { useT } from '@/hooks/useT';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getSteps(t: ReturnType<typeof useT>['t']) {
  return [
    { id: 'basic',  title: t.onboarding.stepBasicTitle,    subtitle: t.onboarding.stepBasicSubtitle,          icon: 'person-outline' },
    { id: 'about',  title: t.onboarding.stepAboutTitle,     subtitle: t.onboarding.stepAboutSubtitle,  icon: 'document-text-outline' },
    { id: 'skills', title: t.onboarding.stepSkillsTitle,   subtitle: t.onboarding.stepSkillsSubtitle,         icon: 'flash-outline' },
    { id: 'career', title: t.onboarding.stepCareerTitle,  subtitle: t.onboarding.stepCareerSubtitle,   icon: 'briefcase-outline' },
  ] as const;
}

export default function OnboardingScreen() {
  const { t } = useT();
  const STEPS = useMemo(() => getSteps(t), [t]);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0 — Basic
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');

  // Step 1 — About
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');

  // Step 2 — Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Step 3 — Career
  const [openToWork, setOpenToWork] = useState(false);
  const [cvName, setCvName] = useState<string | null>(null);
  const [cvUri, setCvUri] = useState<string | null>(null);
  const [cvMime, setCvMime] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput('');
  };

  const pickCv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setCvUri(asset.uri);
      setCvName(asset.name);
      setCvMime(asset.mimeType ?? 'application/pdf');
    } catch {
      Alert.alert(t.onboarding.errorTitle, t.onboarding.pickerErrorMessage);
    }
  };

  const uploadCv = async (token: string) => {
    if (!cvUri || !cvName) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: cvUri, name: cvName, type: cvMime ?? 'application/pdf' } as any);
      form.append('documentType', 'RESUME');
      form.append('name', cvName.replace(/\.[^/.]+$/, ''));
      await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
    } catch {
      Alert.alert(t.onboarding.uploadFailedTitle, t.onboarding.uploadFailedMessage);
    } finally {
      setUploading(false);
    }
  };

  const finish = async (skip = false) => {
    setSaving(true);
    try {
      const token = await secureStorage.getAccessToken();
      if (!token) { router.replace('/(tabs)'); return; }

      if (cvUri) await uploadCv(token);

      const payload: Record<string, any> = { profileCompleted: true };
      if (!skip) {
        if (name.trim())     payload.name = name.trim();
        if (location.trim()) payload.location = location.trim();
        if (phone.trim())    payload.phone = phone.trim();
        if (headline.trim()) payload.headline = headline.trim();
        if (bio.trim())      payload.bio = bio.trim();
        if (skills.length)   payload.skills = skills;
        payload.openToWork = openToWork;
      }

      await api.patch('/profile', payload).catch(() => {});
    } finally {
      setSaving(false);
      router.replace('/(tabs)');
    }
  };

  const goNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const goSkip = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish(true);
  };

  const currentStep = STEPS[step];

  // Hardware back: go to previous step; block exit on step 0 to keep user in flow
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 0) { setStep((s) => s - 1); return true; }
      return true; // block hardware back on first step — user must skip or finish
    });
    return () => sub.remove();
  }, [step]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>JobFinder</Text>
          <TouchableOpacity onPress={goSkip}>
            <Text style={styles.skipBtn}>{step === STEPS.length - 1 ? t.onboarding.skipFinish : t.onboarding.skip}</Text>
          </TouchableOpacity>
        </View>

        {/* Progress dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive, i < step && styles.dotDone]} />
          ))}
        </View>

        {/* Step title */}
        <View style={styles.stepHeader}>
          <View style={styles.stepIconWrap}>
            <Ionicons name={currentStep.icon as any} size={26} color="#14A800" />
          </View>
          <View>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepSubtitle}>{currentStep.subtitle}</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Step 0: Basic Info ── */}
          {step === 0 && (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>{t.onboarding.fullName}</Text>
                <TextInput style={styles.input} placeholder={t.onboarding.fullNamePlaceholder} placeholderTextColor="#555"
                  value={name} onChangeText={setName} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t.onboarding.location} <Text style={styles.optional}>{t.onboarding.optional}</Text></Text>
                <TextInput style={styles.input} placeholder={t.onboarding.locationPlaceholder} placeholderTextColor="#555"
                  value={location} onChangeText={setLocation} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t.onboarding.phone} <Text style={styles.optional}>{t.onboarding.optional}</Text></Text>
                <TextInput style={styles.input} placeholder={t.onboarding.phonePlaceholder} placeholderTextColor="#555"
                  value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
            </View>
          )}

          {/* ── Step 1: About ── */}
          {step === 1 && (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>{t.onboarding.headline} <Text style={styles.optional}>{t.onboarding.optional}</Text></Text>
                <TextInput style={styles.input} placeholder={t.onboarding.headlinePlaceholder} placeholderTextColor="#555"
                  value={headline} onChangeText={(v) => v.length <= 160 && setHeadline(v)} />
                <Text style={styles.charCount}>{headline.length}/160</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t.onboarding.bio} <Text style={styles.optional}>{t.onboarding.optional}</Text></Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder={t.onboarding.bioPlaceholder}
                  placeholderTextColor="#555"
                  value={bio}
                  onChangeText={(v) => v.length <= 1000 && setBio(v)}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{bio.length}/1000</Text>
              </View>
            </View>
          )}

          {/* ── Step 2: Skills ── */}
          {step === 2 && (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>{t.onboarding.addSkills}</Text>
                <View style={styles.skillInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={t.onboarding.skillPlaceholder}
                    placeholderTextColor="#555"
                    value={skillInput}
                    onChangeText={setSkillInput}
                    onSubmitEditing={addSkill}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.addBtn} onPress={addSkill}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              {skills.length > 0 && (
                <View style={styles.tags}>
                  {skills.map((s) => (
                    <View key={s} style={styles.tag}>
                      <Text style={styles.tagText}>{s}</Text>
                      <TouchableOpacity onPress={() => setSkills((prev) => prev.filter((x) => x !== s))}>
                        <Ionicons name="close" size={14} color="#14A800" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {skills.length === 0 && (
                <Text style={styles.emptyHint}>{t.onboarding.noSkillsHint}</Text>
              )}
            </View>
          )}

          {/* ── Step 3: Career / CV ── */}
          {step === 3 && (
            <View style={styles.form}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t.onboarding.openToWork}</Text>
                  <Text style={styles.toggleHint}>{t.onboarding.openToWorkHint}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, openToWork && styles.toggleOn]}
                  onPress={() => setOpenToWork((v) => !v)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.toggleThumb, openToWork && styles.toggleThumbOn]} />
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t.onboarding.uploadCv} <Text style={styles.optional}>{t.onboarding.optional}</Text></Text>
                {cvName ? (
                  <View style={styles.cvCard}>
                    <Ionicons name="document-text-outline" size={22} color="#14A800" />
                    <Text style={styles.cvName} numberOfLines={1}>{cvName}</Text>
                    <TouchableOpacity onPress={() => { setCvUri(null); setCvName(null); setCvMime(null); }}>
                      <Ionicons name="close-circle" size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.cvPicker} onPress={pickCv} activeOpacity={0.75}>
                    <Ionicons name="cloud-upload-outline" size={28} color="#555" />
                    <Text style={styles.cvPickerText}>{t.onboarding.cvPickerText}</Text>
                    <Text style={styles.cvPickerHint}>{t.onboarding.cvPickerHint}</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.cvNote}>
                  {t.onboarding.cvNote}
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, (saving || uploading) && styles.btnDisabled]}
            onPress={goNext}
            activeOpacity={0.85}
            disabled={saving || uploading}
          >
            {saving || uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.nextBtnText}>
                  {step === STEPS.length - 1 ? t.onboarding.finishSetup : t.onboarding.continueBtn}
                </Text>
                <Ionicons name={step === STEPS.length - 1 ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  appName: { color: '#14A800', fontSize: 18, fontWeight: '800' },
  skipBtn: { color: '#888', fontSize: 14, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 20 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#2a2a2a' },
  dotActive: { backgroundColor: '#14A800' },
  dotDone: { backgroundColor: '#0d7a00' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, marginBottom: 24 },
  stepIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#14A80018', alignItems: 'center', justifyContent: 'center' },
  stepTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  stepSubtitle: { color: '#888', fontSize: 13, marginTop: 2 },
  scroll: { paddingHorizontal: 20 },
  form: { gap: 18 },
  field: { gap: 6 },
  label: { color: '#ccc', fontSize: 13, fontWeight: '600' },
  optional: { color: '#666', fontWeight: '400' },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2e2e2e', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },
  textarea: { minHeight: 120, paddingTop: 12 },
  charCount: { color: '#555', fontSize: 11, textAlign: 'right' },
  skillInputRow: { flexDirection: 'row', gap: 10 },
  addBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#14A800', alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#14A80018', borderWidth: 1, borderColor: '#14A80040', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { color: '#14A800', fontSize: 13, fontWeight: '600' },
  emptyHint: { color: '#555', fontSize: 13, fontStyle: 'italic' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2e2e2e', borderRadius: 14, padding: 14 },
  toggleHint: { color: '#666', fontSize: 12, marginTop: 2 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#333', justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: '#14A800' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  cvPicker: { borderWidth: 1, borderColor: '#2e2e2e', borderStyle: 'dashed', borderRadius: 14, padding: 24, alignItems: 'center', gap: 8 },
  cvPickerText: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  cvPickerHint: { color: '#666', fontSize: 12 },
  cvCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#14A80015', borderWidth: 1, borderColor: '#14A80040', borderRadius: 12, padding: 14 },
  cvName: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  cvNote: { color: '#555', fontSize: 11, lineHeight: 16 },
  footer: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e1e1e', backgroundColor: '#0D0D0D' },
  nextBtn: { height: 52, borderRadius: 14, backgroundColor: '#14A800', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.5 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
