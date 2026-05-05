import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView, Platform, ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);

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

        {/* Field */}
        <Animated.View entering={FadeInDown.delay(180).duration(500)}>
          <Text style={styles.fieldLabel}>Username or email</Text>
          <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
            <Ionicons name="person-outline" size={18} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username or Email"
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </Animated.View>

        {/* Continue */}
        <Animated.View entering={FadeInDown.delay(280).duration(500)}>
          <TouchableOpacity style={styles.btnContinue} activeOpacity={0.85}>
            <Text style={styles.btnContinueText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Forgot password */}
        <Animated.View entering={FadeInDown.delay(330).duration(400)} style={styles.forgotRow}>
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
          >
            <Ionicons name="lock-closed-outline" size={13} color="#14A800" />
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Google */}
        <Animated.View entering={FadeInDown.delay(440).duration(500)}>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Apple */}
        <Animated.View entering={FadeInDown.delay(510).duration(500)}>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
            <Ionicons name="logo-apple" size={20} color="#000" />
            <Text style={styles.socialBtnText}>Continue with Apple</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInDown.delay(580).duration(500)} style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
            <Text style={styles.footerLink}>Sign Up</Text>
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

  logoArea: { alignItems: 'center', marginBottom: 52 },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end' },
  logoText: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  logoDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#14A800', marginBottom: 6, marginLeft: 2,
  },

  fieldLabel: { color: '#ccc', fontSize: 13, fontWeight: '500', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 10,
    borderWidth: 1, borderColor: '#2A2A2A',
    paddingHorizontal: 14, height: 54, marginBottom: 16,
  },
  inputWrapperFocused: { borderColor: '#14A800' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 15 },

  btnContinue: {
    backgroundColor: '#14A800', borderRadius: 10,
    height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  btnContinueText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  forgotRow: { alignItems: 'flex-end', marginBottom: 24 },
  forgotBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 4,
  },
  forgotText: { color: '#14A800', fontSize: 13, fontWeight: '600' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A2A' },
  dividerText: { color: '#555', marginHorizontal: 14, fontSize: 12, fontWeight: '600' },

  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    height: 54, marginBottom: 12, gap: 10,
  },
  googleG: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  socialBtnText: { fontSize: 15, fontWeight: '600', color: '#000' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 36 },
  footerText: { color: '#9BA1A6', fontSize: 14 },
  footerLink: { color: '#14A800', fontSize: 14, fontWeight: '700' },
});
