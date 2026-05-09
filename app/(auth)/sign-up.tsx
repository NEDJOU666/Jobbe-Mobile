import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function SignUpScreen() {
  const { signup, sendVerificationOtp, isLoading, error } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [receiveEmails, setReceiveEmails] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (!agreedTerms) {
      Alert.alert('Error', 'You must accept the terms and conditions');
      return;
    }

    try {
      await signup(`${firstName} ${lastName}`, email, password, receiveEmails);
      // OTP is auto-sent by the backend on signup — go straight to verify screen
      router.replace('/(auth)/verify-otp');
    } catch (err: any) {
      Alert.alert('Signup Failed', error || 'Please try again');
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

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
        {/* Back */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
        </Animated.View>

        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.logoArea}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>JOBFINDER</Text>
            <View style={styles.logoDot} />
          </View>
          <Text style={styles.tagline}>Sign up to find work you love</Text>
        </Animated.View>

        {/* Google */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85} disabled={isLoading}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(210).duration(500)} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Name row */}
        <Animated.View entering={FadeInDown.delay(270).duration(500)} style={styles.nameRow}>
          <View style={styles.nameField}>
            <Text style={styles.fieldLabel}>First name</Text>
            <TextInput
              style={inputStyle('firstName')}
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor="#999"
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField(null)}
              editable={!isLoading}
            />
          </View>
          <View style={styles.nameField}>
            <Text style={styles.fieldLabel}>Last name</Text>
            <TextInput
              style={inputStyle('lastName')}
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor="#999"
              onFocus={() => setFocusedField('lastName')}
              onBlur={() => setFocusedField(null)}
              editable={!isLoading}
            />
          </View>
        </Animated.View>

        {/* Email */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={inputStyle('email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#999"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            editable={!isLoading}
          />
        </Animated.View>

        {/* Password */}
        <Animated.View entering={FadeInDown.delay(370).duration(500)}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[styles.passwordWrapper, focusedField === 'password' && styles.inputFocused]}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Password (8 or more characters)"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Country */}
        <Animated.View entering={FadeInDown.delay(420).duration(500)}>
          <Text style={styles.fieldLabel}>Country</Text>
          <TouchableOpacity style={styles.countryPicker} activeOpacity={0.8}>
            <Text style={styles.countryText}>Cameroon</Text>
            <Ionicons name="chevron-down" size={18} color="#888" />
          </TouchableOpacity>
        </Animated.View>

        {/* Checkboxes */}
        <Animated.View entering={FadeInDown.delay(470).duration(500)} style={styles.checkboxSection}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setReceiveEmails(!receiveEmails)}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={[styles.checkbox, receiveEmails && styles.checkboxChecked]}>
              {receiveEmails && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>
              Send me helpful emails to find rewarding work and job leads.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedTerms(!agreedTerms)}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
              {agreedTerms && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>
              Yes, I understand and agree to the{' '}
              <Text style={styles.link}>Terms of Service</Text>, including the{' '}
              <Text style={styles.link}>User Agreement</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(530).duration(500)}>
          <TouchableOpacity
            style={[styles.createBtn, (!agreedTerms || isLoading) && styles.createBtnDisabled]}
            disabled={!agreedTerms || isLoading}
            activeOpacity={0.85}
            onPress={handleSignup}
          >
            <Text style={styles.createBtnText}>
              {isLoading ? 'Creating account...' : 'Create my account'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Login link */}
        <Animated.View entering={FadeInDown.delay(580).duration(500)} style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')} disabled={isLoading}>
            <Text style={styles.footerLink}>Log In</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },

  logoArea: { alignItems: 'center', marginBottom: 28 },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  logoText: { fontSize: 34, fontWeight: '800', color: '#000', letterSpacing: 2 },
  logoDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#14A800', marginBottom: 6, marginLeft: 2,
  },
  tagline: { fontSize: 18, fontWeight: '600', color: '#111', textAlign: 'center' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a73e8', borderRadius: 10,
    height: 54, marginBottom: 20, gap: 10,
  },
  googleG: { fontSize: 18, fontWeight: '800', color: '#fff' },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E8E8' },
  dividerText: { color: '#aaa', marginHorizontal: 14, fontSize: 13 },

  nameRow: { flexDirection: 'row', gap: 12 },
  nameField: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#222', marginBottom: 6, marginTop: 16 },

  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10,
    height: 50, paddingHorizontal: 14, fontSize: 15, color: '#000',
  },
  inputFocused: { borderColor: '#14A800' },

  passwordWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10, height: 50,
    marginTop: 16,
  },
  passwordInput: { flex: 1, paddingHorizontal: 14, fontSize: 15, color: '#000' },

  countryPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10,
    height: 50, paddingHorizontal: 14, marginTop: 16,
  },
  countryText: { fontSize: 15, color: '#000' },

  checkboxSection: { marginTop: 24, gap: 16 },
  checkboxRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkbox: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 1.5, borderColor: '#CCC',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#14A800', borderColor: '#14A800' },
  checkboxLabel: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
  link: { color: '#14A800', fontWeight: '600' },

  createBtn: {
    backgroundColor: '#14A800', borderRadius: 10,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 28,
  },
  createBtnDisabled: { opacity: 0.45 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#888', fontSize: 14 },
  footerLink: { color: '#14A800', fontSize: 14, fontWeight: '700' },
});
