import {
  StyleSheet, View, Text, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, TextInput, Alert,
} from 'react-native';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyOtpScreen() {
  const { verifyEmail, sendVerificationOtp, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit code');
      return;
    }
    try {
      await verifyEmail(otp);
      Alert.alert('Success', 'Email verified!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (err: any) {
      Alert.alert('Verification Failed', 'Invalid code. Please try again.');
    }
  };

  const handleResend = async () => {
    try {
      await sendVerificationOtp();
      Alert.alert('Success', 'Code sent to your email');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to send code. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.logoArea}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>JOBFINDER</Text>
            <View style={styles.logoDot} />
          </View>
        </Animated.View>

        {/* Icon */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.iconArea}>
          <View style={styles.iconWrapper}>
            <Ionicons name="mail-outline" size={40} color="#14A800" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(220).duration(500)}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to your email address. Enter it below to verify.
          </Text>
        </Animated.View>

        {/* OTP Input */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={styles.fieldLabel}>Verification code</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            placeholderTextColor="#CCC"
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isLoading}
          />
        </Animated.View>

        {/* Verify Button */}
        <Animated.View entering={FadeInDown.delay(380).duration(500)}>
          <TouchableOpacity
            style={[styles.verifyBtn, (otp.length !== 6 || isLoading) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={otp.length !== 6 || isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.verifyBtnText}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Resend */}
        <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendCooldown > 0 || isLoading}
          >
            <Text style={[
              styles.resendLink,
              (resendCooldown > 0 || isLoading) && styles.resendDisabled
            ]}>
              {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },

  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end' },
  logoText: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  logoDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#14A800', marginBottom: 5, marginLeft: 2,
  },

  iconArea: { alignItems: 'center', marginBottom: 28 },
  iconWrapper: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#14A80014', borderWidth: 1, borderColor: '#14A80035',
    alignItems: 'center', justifyContent: 'center',
  },

  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 10, textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: '#9BA1A6', textAlign: 'center', lineHeight: 22,
  },

  fieldLabel: { color: '#ccc', fontSize: 13, fontWeight: '500', marginBottom: 12, marginTop: 32 },
  otpInput: {
    backgroundColor: '#1A1A1A', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#2A2A2A',
    height: 60, fontSize: 28, fontWeight: '600', color: '#fff',
    textAlign: 'center', letterSpacing: 8,
  },

  verifyBtn: {
    backgroundColor: '#14A800', borderRadius: 10,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 28,
  },
  btnDisabled: { opacity: 0.5 },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  resendText: { color: '#9BA1A6', fontSize: 14 },
  resendLink: { color: '#14A800', fontSize: 14, fontWeight: '700' },
  resendDisabled: { opacity: 0.5, color: '#666' },
});
