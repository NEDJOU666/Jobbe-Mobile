import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors: c } = useTheme();
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

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
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
          Alert.alert('Save failed', err?.response?.data?.error ?? 'Could not update profile. Please try again.');
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={onSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={c.accent} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
          <Text style={styles.emptyText}>Could not load profile</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
            <TouchableOpacity><Text style={styles.changePhotoText}>Change photo</Text></TouchableOpacity>
          </View>

          {/* Basic info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Info</Text>
            <Field c={c} label="Full Name" value={name} onChangeText={setName} placeholder="Your name" />
            <Field c={c} label="Professional Title" value={headline} onChangeText={setHeadline} placeholder="e.g. React Native Developer" />
            <Field c={c} label="Location" value={location} onChangeText={setLocation} placeholder="City, Country" />
            <Field c={c} label="Phone" value={phone} onChangeText={setPhone} placeholder="+237 6XX XXX XXX" keyboardType="phone-pad" />
          </View>

          {/* Online presence */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Online Presence</Text>
            <Field c={c} label="Website" value={website} onChangeText={setWebsite} placeholder="https://yoursite.com" keyboardType="url" />
            <Field c={c} label="LinkedIn" value={linkedin} onChangeText={setLinkedin} placeholder="linkedin.com/in/..." keyboardType="url" />
            <Field c={c} label="GitHub" value={github} onChangeText={setGithub} placeholder="github.com/..." keyboardType="url" />
          </View>

          {/* Bio */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About Me</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell employers about yourself..."
              placeholderTextColor={c.textDim}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length} / 500</Text>
          </View>

          {/* Skills */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skills</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={skillInput}
                onChangeText={setSkillInput}
                placeholder="Add a skill..."
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
            <Text style={styles.cardTitle}>Languages</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={langInput}
                onChangeText={setLangInput}
                placeholder="Language"
                placeholderTextColor={c.textDim}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={levelInput}
                onChangeText={setLevelInput}
                placeholder="Level (Native…)"
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
            <Text style={styles.cardTitle}>Availability</Text>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Open to Work</Text>
                <Text style={styles.toggleSub}>Let employers know you&apos;re available</Text>
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
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
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
