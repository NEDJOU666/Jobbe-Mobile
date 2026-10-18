import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Modal, FlatList, Linking,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/hooks/useT';

const COUNTRIES = [
  'Cameroon', 'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Ethiopia', 'Tanzania',
  'Uganda', 'Rwanda', 'Senegal', "Côte d'Ivoire", 'Benin', 'Togo', 'Mali',
  'Burkina Faso', 'Niger', 'Chad', 'Central African Republic', 'Gabon', 'Congo',
  'DR Congo', 'Angola', 'Mozambique', 'Zimbabwe', 'Zambia', 'Malawi', 'Madagascar',
  'Morocco', 'Tunisia', 'Algeria', 'Egypt', 'France', 'United Kingdom', 'United States',
  'Canada', 'Germany', 'Belgium', 'Switzerland', 'Other',
];

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3004/api';

function GoogleLogo() {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 22, height: 22, borderRadius: 11, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 11, backgroundColor: '#4285F4' }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 11, backgroundColor: '#34A853' }} />
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 11, backgroundColor: '#EA4335' }} />
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 11, backgroundColor: '#FBBC05' }} />
        <View style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, borderRadius: 8, backgroundColor: '#fff' }} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '800', color: '#4285F4', zIndex: 1 }}>G</Text>
    </View>
  );
}

export default function SignUpScreen() {
  const { t } = useT();
  const { signup, sendVerificationOtp, isLoading, error } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [receiveEmails, setReceiveEmails] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [country, setCountry] = useState('Cameroon');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert(t.signUp.errorTitle, t.signUp.errorFillFields);
      return;
    }
    if (password.length < 8) {
      Alert.alert(t.signUp.errorTitle, t.signUp.errorPasswordLength);
      return;
    }
    if (!agreedTerms) {
      Alert.alert(t.signUp.errorTitle, t.signUp.errorAcceptTerms);
      return;
    }

    try {
      await signup(`${firstName} ${lastName}`, email, password, receiveEmails);
      // OTP is auto-sent by the backend on signup — go straight to verify screen
      router.replace('/(auth)/verify-otp');
    } catch (err: any) {
      Alert.alert(t.signUp.signupFailedTitle, error || t.signUp.signupFailedDefault);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: '#0D0D0D' }}
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
          <Text style={styles.tagline}>{t.signUp.tagline}</Text>
        </Animated.View>

        {/* Google */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.85}
            disabled={isLoading}
            onPress={() => WebBrowser.openAuthSessionAsync(
              `${API_BASE}/auth/google?source=mobile`,
              'jobfinder://auth/callback',
            )}
          >
            <GoogleLogo />
            <Text style={styles.googleBtnText}>{t.signUp.continueWithGoogle}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(210).duration(500)} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t.signUp.or}</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Name row */}
        <Animated.View entering={FadeInDown.delay(270).duration(500)} style={styles.nameRow}>
          <View style={styles.nameField}>
            <Text style={styles.fieldLabel}>{t.signUp.firstName}</Text>
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
            <Text style={styles.fieldLabel}>{t.signUp.lastName}</Text>
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
          <Text style={styles.fieldLabel}>{t.signUp.email}</Text>
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
          <Text style={styles.fieldLabel}>{t.signUp.password}</Text>
          <View style={[styles.passwordWrapper, focusedField === 'password' && styles.inputFocused]}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder={t.signUp.passwordPlaceholder}
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
          <Text style={styles.fieldLabel}>{t.signUp.country}</Text>
          <TouchableOpacity
            style={styles.countryPicker}
            activeOpacity={0.8}
            onPress={() => setShowCountryPicker(true)}
          >
            <Text style={styles.countryText}>{country}</Text>
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
              {t.signUp.receiveEmails}
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
              {t.signUp.agreeTermsPrefix}
              <Text style={styles.link} onPress={() => Linking.openURL('https://jobfinder.oxbiy.com/terms')}>{t.signUp.termsOfService}</Text>{t.signUp.includingThe}
              <Text style={styles.link} onPress={() => Linking.openURL('https://jobfinder.oxbiy.com/terms')}>{t.signUp.userAgreement}</Text>{t.signUp.and}
              <Text style={styles.link} onPress={() => Linking.openURL('https://jobfinder.oxbiy.com/about/privacy')}>{t.signUp.privacyPolicy}</Text>{t.signUp.period}
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
              {isLoading ? t.signUp.creatingAccount : t.signUp.createAccount}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Login link */}
        <Animated.View entering={FadeInDown.delay(580).duration(500)} style={styles.footer}>
          <Text style={styles.footerText}>{t.signUp.haveAccount}</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')} disabled={isLoading}>
            <Text style={styles.footerLink}>{t.signUp.logIn}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Country picker modal */}
      <Modal visible={showCountryPicker} transparent animationType="slide" onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowCountryPicker(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>{t.signUp.selectCountry}</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, item === country && styles.pickerItemSelected]}
                  onPress={() => { setCountry(item); setShowCountryPicker(false); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pickerItemText, item === country && styles.pickerItemTextSelected]}>
                    {item}
                  </Text>
                  {item === country && <Ionicons name="checkmark" size={18} color="#14A800" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#dadce0',
    height: 54, marginBottom: 20, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#3c4043' },

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

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingBottom: 40, maxHeight: '70%',
  },
  pickerHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 12 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  pickerItemSelected: { backgroundColor: '#14A80008' },
  pickerItemText: { fontSize: 15, color: '#333' },
  pickerItemTextSelected: { color: '#14A800', fontWeight: '700' },
});
