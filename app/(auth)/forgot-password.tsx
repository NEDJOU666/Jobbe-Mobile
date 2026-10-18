import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/hooks/useT';

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordScreen() {
  const { forgotPassword, resetPassword, isLoading } = useAuth();
  const { t } = useT();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: send code ────────────────────────────────────────────────────────
  const handleSendCode = async () => {
    if (!email.trim()) { Alert.alert(t.forgotPassword.errorTitle, t.forgotPassword.enterEmailError); return; }
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStep('code');
      startCooldown();
    } catch {
      Alert.alert(t.forgotPassword.errorTitle, t.forgotPassword.genericError);
    }
  };

  const handleResend = async () => {
    try {
      await forgotPassword(email.trim().toLowerCase());
      startCooldown();
      Alert.alert(t.forgotPassword.sentTitle, t.forgotPassword.codeSentMessage);
    } catch {
      Alert.alert(t.forgotPassword.errorTitle, t.forgotPassword.resendFailedError);
    }
  };

  // ── Step 2: verify code → go to new password ─────────────────────────────────
  const handleConfirmCode = () => {
    if (otp.length !== 6) { Alert.alert(t.forgotPassword.errorTitle, t.forgotPassword.enterCodeError); return; }
    setStep('password');
  };

  // ── Step 3: reset password ───────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(t.forgotPassword.errorTitle, t.forgotPassword.fillPasswordsError);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t.forgotPassword.errorTitle, t.forgotPassword.passwordsMismatchError);
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(t.forgotPassword.errorTitle, t.forgotPassword.passwordTooShortError);
      return;
    }
    try {
      await resetPassword(email.trim().toLowerCase(), otp, newPassword);
      Alert.alert(t.forgotPassword.successTitle, t.forgotPassword.passwordResetMessage, [
        { text: t.forgotPassword.okButton, onPress: () => router.replace('/(auth)/sign-in') },
      ]);
    } catch (err: any) {
      Alert.alert(t.forgotPassword.errorTitle, t.forgotPassword.invalidCodeError);
      setStep('email');
      setOtp('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Back button */}
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step === 'code') { setStep('email'); setOtp(''); }
            else if (step === 'password') { setStep('code'); }
            else { router.back(); }
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.logoArea}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>JOBFINDER</Text>
            <View style={styles.logoDot} />
          </View>
        </Animated.View>

        {/* ── STEP 1: Email ─────────────────────────────────────────────────── */}
        {step === 'email' && (
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.iconArea}>
              <View style={styles.iconWrapper}>
                <Ionicons name="lock-closed-outline" size={30} color="#14A800" />
              </View>
            </View>

            <Text style={styles.title}>{t.forgotPassword.title}</Text>
            <Text style={styles.subtitle}>
              {t.forgotPassword.subtitle}
            </Text>

            <Text style={styles.fieldLabel}>{t.forgotPassword.emailLabel}</Text>
            <View style={[styles.inputWrapper, focused === 'email' && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={18} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t.forgotPassword.emailPlaceholder}
                placeholderTextColor="#555"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, (!email || isLoading) && styles.btnDisabled]}
              disabled={!email || isLoading}
              onPress={handleSendCode}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>
                {isLoading ? t.forgotPassword.sendingButton : t.forgotPassword.sendCodeButton}
              </Text>
            </TouchableOpacity>

            <View style={styles.backRow}>
              <Ionicons name="arrow-back" size={14} color="#14A800" />
              <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                <Text style={styles.backLink}> {t.forgotPassword.backToLogin}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── STEP 2: 6-digit code ──────────────────────────────────────────── */}
        {step === 'code' && (
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.iconArea}>
              <View style={styles.iconWrapper}>
                <Ionicons name="mail-outline" size={30} color="#14A800" />
              </View>
            </View>

            <Text style={styles.title}>{t.forgotPassword.checkEmailTitle}</Text>
            <Text style={styles.subtitle}>
              {t.forgotPassword.codeSentToPrefix}{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <Text style={styles.fieldLabel}>{t.forgotPassword.codeLabel}</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#333"
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.actionBtn, (otp.length !== 6 || isLoading) && styles.btnDisabled]}
              disabled={otp.length !== 6 || isLoading}
              onPress={handleConfirmCode}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>{t.forgotPassword.continueButton}</Text>
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>{t.forgotPassword.didntReceiveCode}</Text>
              <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || isLoading}>
                <Text style={[styles.resendLink, resendCooldown > 0 && styles.resendDisabled]}>
                  {resendCooldown > 0 ? `${t.forgotPassword.resendCountdownPrefix}${resendCooldown}${t.forgotPassword.resendCountdownSuffix}` : t.forgotPassword.resendButton}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── STEP 3: New password ──────────────────────────────────────────── */}
        {step === 'password' && (
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.iconArea}>
              <View style={styles.iconWrapper}>
                <Ionicons name="checkmark-circle-outline" size={30} color="#14A800" />
              </View>
            </View>

            <Text style={styles.title}>{t.forgotPassword.newPasswordTitle}</Text>
            <Text style={styles.subtitle}>
              {t.forgotPassword.codeVerifiedSubtitle}
            </Text>

            <Text style={styles.fieldLabel}>{t.forgotPassword.newPasswordLabel}</Text>
            <View style={[styles.inputWrapper, focused === 'password' && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t.forgotPassword.newPasswordPlaceholder}
                placeholderTextColor="#555"
                value={newPassword}
                onChangeText={setNewPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18} color="#666" style={{ marginRight: 12 }}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>{t.forgotPassword.confirmPasswordLabel}</Text>
            <View style={[styles.inputWrapper, focused === 'confirm' && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t.forgotPassword.confirmPasswordPlaceholder}
                placeholderTextColor="#555"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused(null)}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, isLoading && styles.btnDisabled]}
              disabled={isLoading}
              onPress={handleResetPassword}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>
                {isLoading ? t.forgotPassword.resettingButton : t.forgotPassword.resetPasswordButton}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Step indicators */}
        <View style={styles.steps}>
          {(['email', 'code', 'password'] as Step[]).map((s, i) => (
            <View
              key={s}
              style={[styles.stepDot, step === s && styles.stepDotActive,
                (['email', 'code', 'password'] as Step[]).indexOf(step) > i && styles.stepDotDone]}
            />
          ))}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { paddingHorizontal: 24, paddingTop: 56 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48 },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },

  logoArea: { alignItems: 'center', marginBottom: 32, marginTop: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end' },
  logoText: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  logoDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#14A800', marginBottom: 4, marginLeft: 2,
  },

  iconArea: { alignItems: 'center', marginBottom: 20 },
  iconWrapper: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#14A80014', borderWidth: 1, borderColor: '#14A80035',
    alignItems: 'center', justifyContent: 'center',
  },

  title: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#9BA1A6', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emailHighlight: { color: '#fff', fontWeight: '600' },

  fieldLabel: { color: '#ccc', fontSize: 13, fontWeight: '500', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#2A2A2A',
    paddingHorizontal: 14, height: 54, marginBottom: 16,
  },
  inputFocused: { borderColor: '#14A800' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 15 },

  otpInput: {
    backgroundColor: '#1A1A1A', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#2A2A2A',
    height: 72, fontSize: 32, fontWeight: '700', color: '#fff',
    textAlign: 'center', letterSpacing: 10, marginBottom: 24,
  },

  actionBtn: {
    backgroundColor: '#14A800', borderRadius: 10,
    height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  btnDisabled: { opacity: 0.45 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { color: '#9BA1A6', fontSize: 14 },
  resendLink: { color: '#14A800', fontSize: 14, fontWeight: '700' },
  resendDisabled: { opacity: 0.4 },

  backRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  backLink: { color: '#14A800', fontSize: 14, fontWeight: '600' },

  steps: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 40 },
  stepDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#2A2A2A',
  },
  stepDotActive: { backgroundColor: '#14A800', width: 20 },
  stepDotDone: { backgroundColor: '#14A80066' },
});
