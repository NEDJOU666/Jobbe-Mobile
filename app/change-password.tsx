import { api } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/hooks/useT';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { t } = useT();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = !!current && next.length >= 8 && next === confirm && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: current, newPassword: next });
      Alert.alert(t.changePassword.successTitle, t.changePassword.successMessage, [
        { text: t.changePassword.ok, onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const raw = err?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join('\n') : (raw ?? t.changePassword.errorDefault);
      Alert.alert(t.changePassword.errorTitle, String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.changePassword.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={32} color={c.accent} />
        </View>
        <Text style={styles.desc}>
          {t.changePassword.description}
        </Text>

        <FieldRow
          label={t.changePassword.currentPassword} value={current} onChange={setCurrent}
          show={showCurrent} onToggle={() => setShowCurrent((v) => !v)} c={c} styles={styles}
        />
        <FieldRow
          label={t.changePassword.newPassword} value={next} onChange={setNext}
          show={showNext} onToggle={() => setShowNext((v) => !v)} c={c} styles={styles}
        />
        {tooShort && <Text style={styles.hint}>{t.changePassword.tooShortHint}</Text>}

        <FieldRow
          label={t.changePassword.confirmPassword} value={confirm} onChange={setConfirm}
          show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} c={c} styles={styles}
        />
        {mismatch && <Text style={[styles.hint, styles.hintError]}>{t.changePassword.mismatchHint}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveBtnText}>{t.changePassword.updateButton}</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function FieldRow({ label, value, onChange, show, onToggle, c, styles }: {
  label: string; value: string; onChange: (t: string) => void;
  show: boolean; onToggle: () => void; c: any; styles: any;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="••••••••"
          placeholderTextColor={c.textDim}
        />
        <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} size={20} color={c.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingBottom: 12,
    },
    iconBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border2,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
    iconWrap: {
      alignSelf: 'center', width: 72, height: 72, borderRadius: 36,
      backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder,
      alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: 8,
    },
    desc: { color: c.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
    fieldGroup: { marginBottom: 16 },
    label: { color: c.textBody, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border2,
      paddingHorizontal: 14, height: 52,
    },
    input: { flex: 1, color: c.text, fontSize: 15 },
    hint: { color: c.textMuted, fontSize: 12, marginTop: -8, marginBottom: 8, paddingHorizontal: 2 },
    hintError: { color: '#C62828' },
    footer: {
      paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12,
      borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bg,
    },
    saveBtn: {
      height: 52, borderRadius: 14, backgroundColor: c.accent,
      alignItems: 'center', justifyContent: 'center',
    },
    saveBtnDisabled: { opacity: 0.45 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
