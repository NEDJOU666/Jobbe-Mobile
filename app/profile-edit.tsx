import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/hooks/useT';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const { t } = useT();
  const styles = useMemo(() => makeStyles(c), [c]);

  const { data, isLoading, isError, refetch } = useProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();

  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [openToWork, setOpenToWork] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [langInput, setLangInput] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data || hydrated) return;
    setName(data.name ?? '');
    setPhone(data.phone ?? '');
    setHeadline(data.profile?.headline ?? '');
    setBio(data.profile?.bio ?? '');
    setLocation(data.profile?.location ?? '');
    setWebsite(data.profile?.website ?? '');
    setLinkedin(data.profile?.linkedin ?? '');
    setGithub(data.profile?.github ?? '');
    setOpenToWork(data.profile?.openToWork ?? false);
    setSkills(data.profile?.skills ?? []);
    setLanguages(data.profile?.languages ?? []);
    setAvatarUrl(data.avatar ?? data.profile_image ?? null);
    setHydrated(true);
  }, [data, hydrated]);

  const initial = (name || user?.name || '?').charAt(0).toUpperCase();

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput('');
  };
  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  const addLanguage = () => {
    const lang = langInput.trim();
    const level = levelInput.trim();
    if (!lang) return;
    const entry = level ? `${lang}:${level}` : lang;
    if (!languages.includes(entry)) setLanguages((prev) => [...prev, entry]);
    setLangInput(''); setLevelInput('');
  };
  const removeLang = (s: string) => setLanguages((prev) => prev.filter((x) => x !== s));
  const parseLang = (s: string) => { const [l, lv] = s.split(':'); return { lang: l ?? s, level: lv ?? '' }; };

  const handleChangePhoto = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'image/jpeg' } as any);
    formData.append('documentType', 'OTHER');
    formData.append('name', 'avatar');
    setUploadingPhoto(true);
    try {
      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarUrl(data.url);
      updateProfile({ avatar: data.url });
    } catch {
      Alert.alert(t.profileEdit.uploadFailedTitle, t.profileEdit.uploadFailedMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert(t.profileEdit.nameRequiredTitle, t.profileEdit.nameRequiredMessage);
      return;
    }
    updateProfile(
      {
        name: name.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        location: location.trim(),
        phone: phone.trim(),
        // Only send URL fields when non-empty to pass backend validation
        ...(website.trim() && { website: website.trim() }),
        ...(linkedin.trim() && { linkedin: linkedin.trim() }),
        ...(github.trim() && { github: github.trim() }),
        openToWork,
        skills,
        languages,
      },
      {
        onSuccess: () => router.back(),
        onError: (err: any) => {
          Alert.alert(t.profileEdit.saveFailedTitle, err?.response?.data?.error ?? t.profileEdit.saveFailedDefault);
        },
      },
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} disabled={isSaving}>
          <Ionicons name="close" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.profileEdit.title}</Text>
        <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={onSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{t.profileEdit.save}</Text>}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={c.accent} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
          <Text style={styles.emptyText}>{t.profileEdit.loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>{t.profileEdit.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              {avatarUrl
                ? <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                : <Text style={styles.avatarText}>{initial}</Text>}
            </View>
            <TouchableOpacity onPress={handleChangePhoto} disabled={uploadingPhoto} style={styles.changePhotoBtn}>
              {uploadingPhoto
                ? <ActivityIndicator color={c.accent} size="small" />
                : <>
                    <Ionicons name="camera-outline" size={16} color={c.accent} />
                    <Text style={styles.changePhotoText}>{t.profileEdit.changePhoto}</Text>
                  </>}
            </TouchableOpacity>
          </View>

          {/* Basic info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.profileEdit.basicInfo}</Text>
            <Field c={c} label={t.profileEdit.fullName} value={name} onChangeText={setName} placeholder={t.profileEdit.fullNamePlaceholder} />
            <Field c={c} label={t.profileEdit.professionalTitle} value={headline} onChangeText={setHeadline} placeholder={t.profileEdit.professionalTitlePlaceholder} />
            <Field c={c} label={t.profileEdit.location} value={location} onChangeText={setLocation} placeholder={t.profileEdit.locationPlaceholder} />
            <Field c={c} label={t.profileEdit.phone} value={phone} onChangeText={setPhone} placeholder={t.profileEdit.phonePlaceholder} keyboardType="phone-pad" />
          </View>

          {/* Online presence */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.profileEdit.onlinePresence}</Text>
            <Field c={c} label={t.profileEdit.website} value={website} onChangeText={setWebsite} placeholder={t.profileEdit.websitePlaceholder} keyboardType="url" />
            <Field c={c} label={t.profileEdit.linkedin} value={linkedin} onChangeText={setLinkedin} placeholder={t.profileEdit.linkedinPlaceholder} keyboardType="url" />
            <Field c={c} label={t.profileEdit.github} value={github} onChangeText={setGithub} placeholder={t.profileEdit.githubPlaceholder} keyboardType="url" />
          </View>

          {/* Bio */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.profileEdit.aboutMe}</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={bio}
              onChangeText={setBio}
              placeholder={t.profileEdit.bioPlaceholder}
              placeholderTextColor={c.textDim}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length} / 500</Text>
          </View>

          {/* Skills */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.profileEdit.skills}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={skillInput}
                onChangeText={setSkillInput}
                placeholder={t.profileEdit.addSkillPlaceholder}
                placeholderTextColor={c.textDim}
                onSubmitEditing={addSkill}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addSkill}>
                <Ionicons name="add" size={18} color={c.accent} />
              </TouchableOpacity>
            </View>
            <View style={styles.chipGrid}>
              {skills.map((s) => (
                <TouchableOpacity key={s} style={styles.chip} onPress={() => removeSkill(s)}>
                  <Text style={styles.chipText}>{s}</Text>
                  <Ionicons name="close" size={12} color={c.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.profileEdit.languages}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={langInput}
                onChangeText={setLangInput}
                placeholder={t.profileEdit.languagePlaceholder}
                placeholderTextColor={c.textDim}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={levelInput}
                onChangeText={setLevelInput}
                placeholder={t.profileEdit.levelPlaceholder}
                placeholderTextColor={c.textDim}
                onSubmitEditing={addLanguage}
                returnKeyType="done"
              />
              <TouchableOpacity style={[styles.addBtn, { alignSelf: 'center' }]} onPress={addLanguage}>
                <Ionicons name="add" size={18} color={c.accent} />
              </TouchableOpacity>
            </View>
            <View style={styles.chipGrid}>
              {languages.map((raw) => {
                const { lang, level } = parseLang(raw);
                return (
                  <TouchableOpacity key={raw} style={styles.chip} onPress={() => removeLang(raw)}>
                    <Text style={styles.chipText}>{lang}{level ? ` · ${level}` : ''}</Text>
                    <Ionicons name="close" size={12} color={c.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.profileEdit.availability}</Text>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>{t.profileEdit.openToWork}</Text>
                <Text style={styles.toggleSub}>{t.profileEdit.openToWorkHint}</Text>
              </View>
              <Switch
                value={openToWork}
                onValueChange={setOpenToWork}
                trackColor={{ false: c.border2, true: c.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

function Field({ c, label, value, onChangeText, placeholder, keyboardType }: {
  c: any; label: string; value: string;
  onChangeText: (t: string) => void; placeholder?: string; keyboardType?: any
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{ backgroundColor: c.bg, borderWidth: 1, borderColor: c.border2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, color: c.text, fontSize: 14 }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textDim}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
    iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: c.accent, borderRadius: 10 },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    scroll: { paddingHorizontal: 16, paddingTop: 8 },
    avatarSection: { alignItems: 'center', marginBottom: 24, gap: 10 },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: c.accentBorder },
    avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
    changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: c.accentBorder, backgroundColor: c.accentBg },
    changePhotoText: { color: c.accent, fontSize: 14, fontWeight: '600' },
    card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16, marginBottom: 16 },
    cardTitle: { color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 14 },
    input: { backgroundColor: c.bg, borderWidth: 1, borderColor: c.border2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, color: c.text, fontSize: 14 },
    textarea: { minHeight: 110, textAlignVertical: 'top', lineHeight: 22, marginBottom: 4 },
    charCount: { color: c.textDim, fontSize: 11, textAlign: 'right' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    addBtn: { width: 44, height: 44, borderWidth: 1, borderColor: c.accent, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: c.border2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    chipText: { color: c.textSub, fontSize: 13 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggleLabel: { color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 2 },
    toggleSub: { color: c.textMuted, fontSize: 12 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 12 },
    emptyText: { color: c.textMuted, fontSize: 16, fontWeight: '600' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },
  });
}
