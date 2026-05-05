import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRef, useState, useEffect } from 'react';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CODE_LENGTH = 6;

export default function VerifyOTPScreen() {
  const [otp, setOtp] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));

  // Per-box scale animation values (declared individually — no hooks in loops)
  const s0 = useSharedValue(1);
  const s1 = useSharedValue(1);
  const s2 = useSharedValue(1);
  const s3 = useSharedValue(1);
  const s4 = useSharedValue(1);
  const s5 = useSharedValue(1);
  const scales = [s0, s1, s2, s3, s4, s5];

  const boxStyles = scales.map((s) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }))
  );

  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const popBox = (index: number) => {
    scales[index].value = withSequence(
      withSpring(1.18, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 10 })
    );
  };

  const handleChange = (text: string, index: number) => {
    const char = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = char;
    setOtp(next);
    if (char) {
      popBox(index);
      if (index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const next = [...otp];
      next[index - 1] = '';
      setOtp(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setCountdown(59);
    setCanResend(false);
    setOtp(Array(CODE_LENGTH).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const isComplete = otp.every((d) => d !== '');

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

        {/* Icon + Title */}
        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.titleArea}>
          <View style={styles.iconWrapper}>
            <Ionicons name="mail-outline" size={30} color="#14A800" />
          </View>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailHighlight}>your@email.com</Text>
          </Text>
        </Animated.View>

        {/* OTP boxes */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.otpRow}>
          {Array(CODE_LENGTH).fill(0).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.otpBox,
                otp[i] ? styles.otpBoxFilled : null,
                focusedIndex === i && !otp[i] ? styles.otpBoxFocused : null,
                boxStyles[i],
              ]}
            >
              <TextInput
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={styles.otpInput}
                value={otp[i]}
                onChangeText={(text) => handleChange(text, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                onFocus={() => setFocusedIndex(i)}
                keyboardType="number-pad"
                maxLength={2}
                caretHidden
                selectTextOnFocus
              />
            </Animated.View>
          ))}
        </Animated.View>

        {/* Resend */}
        <Animated.View entering={FadeInDown.delay(420).duration(500)} style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <Text style={styles.resendActive}>Resend code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendCountdown}>
              Resend code in <Text style={styles.resendTimer}>{countdown}s</Text>
            </Text>
          )}
        </Animated.View>

        {/* Verify */}
        <Animated.View entering={FadeInDown.delay(520).duration(500)}>
          <TouchableOpacity
            style={[styles.verifyBtn, !isComplete && styles.verifyBtnDisabled]}
            disabled={!isComplete}
            activeOpacity={0.85}
          >
            <Text style={styles.verifyBtnText}>Verify email</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Wrong email */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.wrongRow}>
          <Text style={styles.wrongText}>Wrong email? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.wrongLink}>Change it</Text>
          </TouchableOpacity>
        </Animated.View>
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

  titleArea: { alignItems: 'center', marginBottom: 40 },
  iconWrapper: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#14A80014', borderWidth: 1, borderColor: '#14A80035',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#9BA1A6', textAlign: 'center', lineHeight: 22 },
  emailHighlight: { color: '#fff', fontWeight: '600' },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  otpBox: {
    width: 48, height: 58, borderRadius: 14,
    backgroundColor: '#1A1A1A', borderWidth: 1.5, borderColor: '#2A2A2A',
    alignItems: 'center', justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: '#14A800',
    backgroundColor: '#14A80012',
  },
  otpBoxFocused: {
    borderColor: '#14A800',
  },
  otpInput: {
    width: '100%', height: '100%',
    textAlign: 'center',
    fontSize: 22, fontWeight: '700', color: '#fff',
  },

  resendRow: { alignItems: 'center', marginBottom: 32 },
  resendCountdown: { fontSize: 14, color: '#555' },
  resendTimer: { color: '#14A800', fontWeight: '700' },
  resendActive: { fontSize: 14, color: '#14A800', fontWeight: '700' },

  verifyBtn: {
    backgroundColor: '#14A800', borderRadius: 10,
    height: 54, alignItems: 'center', justifyContent: 'center',
  },
  verifyBtnDisabled: { opacity: 0.4 },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  wrongRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 22,
  },
  wrongText: { color: '#555', fontSize: 13 },
  wrongLink: { color: '#14A800', fontSize: 13, fontWeight: '600' },
});
