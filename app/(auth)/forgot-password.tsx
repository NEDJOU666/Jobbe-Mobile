import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView, Platform,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.logoArea}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>JOBFINDER</Text>
            <View style={styles.logoDot} />
          </View>
        </Animated.View>

        {!sent ? (
          <>
            {/* Form state */}
            <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.titleArea}>
              <View style={styles.iconWrapper}>
                <Ionicons name="lock-closed-outline" size={28} color="#14A800" />
              </View>
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send{'\n'}you a link to reset your password.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(280).duration(500)}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={[styles.inputWrapper, focused && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={18} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#555"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(360).duration(500)}>
              <TouchableOpacity
                style={[styles.actionBtn, !email && styles.actionBtnDisabled]}
                disabled={!email}
                onPress={() => setSent(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>Send reset link</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(440).duration(500)} style={styles.backRow}>
              <Ionicons name="arrow-back" size={14} color="#14A800" />
              <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                <Text style={styles.backLink}> Back to Log In</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          /* ── Success state ── */
          <Animated.View entering={FadeIn.duration(500)} style={styles.successArea}>
            {/* Centered header */}
            <View style={styles.successHeader}>
              <View style={styles.successIconWrapper}>
                <Ionicons name="checkmark-circle" size={64} color="#14A800" />
              </View>
              <Text style={styles.successTitle}>Check your inbox</Text>
              <Text style={styles.successSubtitle}>
                We sent a password reset link to{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            {/* Hint card */}
            <View style={styles.hintCard}>
              <Ionicons name="information-circle-outline" size={18} color="#14A800" />
              <Text style={styles.hintText}>
                The link expires in 15 minutes. Check your spam folder if you don't see it.
              </Text>
            </View>

            {/* Full-width primary button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.replace('/(auth)/sign-in')}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Back to Log In</Text>
            </TouchableOpacity>

            {/* Secondary outlined button */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => { setEmail(''); setSent(false); }}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={16} color="#9BA1A6" />
              <Text style={styles.secondaryBtnText}>Use a different email</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { paddingHorizontal: 24, paddingTop: 56 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },

  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end' },
  logoText: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  logoDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#14A800', marginBottom: 5, marginLeft: 2,
  },

  titleArea: { alignItems: 'center', marginBottom: 36 },
  iconWrapper: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#14A80014', borderWidth: 1, borderColor: '#14A80035',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#9BA1A6', textAlign: 'center', lineHeight: 22 },

  fieldLabel: { color: '#ccc', fontSize: 13, fontWeight: '500', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#2A2A2A',
    paddingHorizontal: 14, height: 54, marginBottom: 20,
  },
  inputFocused: { borderColor: '#14A800' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 15 },

  actionBtn: {
    backgroundColor: '#14A800', borderRadius: 10,
    height: 54, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, width: '100%',
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  backRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 24,
  },
  backLink: { color: '#14A800', fontSize: 14, fontWeight: '600' },

  // ── Success ──
  successArea: { alignItems: 'center', paddingTop: 8 },
  successHeader: { alignItems: 'center', marginBottom: 12 },
  successIconWrapper: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#14A80012', borderWidth: 1, borderColor: '#14A80030',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 12 },
  successSubtitle: {
    fontSize: 14, color: '#9BA1A6', textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  emailHighlight: { color: '#fff', fontWeight: '600' },

  hintCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#14A80010', borderWidth: 1, borderColor: '#14A80025',
    borderRadius: 10, padding: 14, marginBottom: 28, width: '100%',
  },
  hintText: { flex: 1, fontSize: 13, color: '#9BA1A6', lineHeight: 20 },

  secondaryBtn: {
    marginTop: 12,
    borderWidth: 1, borderColor: '#2A2A2A',
    backgroundColor: '#141414', borderRadius: 10,
    height: 54, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, width: '100%',
  },
  secondaryBtnText: { color: '#9BA1A6', fontSize: 14, fontWeight: '600' },

  resendBtn: { marginTop: 16 },
  resendBtnText: { color: '#555', fontSize: 13 },
});
