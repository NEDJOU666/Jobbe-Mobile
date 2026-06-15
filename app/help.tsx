import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

const SUPPORT_EMAIL = 'Help-support@oxbiy.com';
const SUPPORT_PHONE = '+237676887147';
const SUPPORT_PHONE_DISPLAY = '+237 676 887 147';

const CONTACT = [
  {
    icon: 'mail-outline',
    label: 'Email Support',
    sub: SUPPORT_EMAIL,
    color: '#1565C0',
    onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
  },
  {
    icon: 'call-outline',
    label: 'Phone Support',
    sub: SUPPORT_PHONE_DISPLAY,
    color: '#14A800',
    onPress: () => Linking.openURL(`tel:${SUPPORT_PHONE}`),
  },
  {
    icon: 'chatbubble-ellipses-outline',
    label: 'Live Chat',
    sub: 'Mon–Fri 8am–6pm WAT',
    color: '#6A1B9A',
    isChat: true,
  },
];

const FAQS = [
  {
    q: 'How do I create a JobFinder account?',
    a: 'Tap "Sign Up" on the welcome screen. You can register with your email or use Google. After email verification, complete your profile to start applying for jobs.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen tap "Forgot Password". Enter your email and we\'ll send a reset code. The code expires after 1 hour.',
  },
  {
    q: 'Can I have both a job seeker and employer account?',
    a: 'Yes. Your JobFinder account works as a job seeker. You can also create or join a firm on the web platform to post jobs.',
  },
  {
    q: 'How do I apply for a job?',
    a: 'Open a job listing and tap "Apply Now". Select your resume, optionally write a cover letter, then submit. You can track your application in the Applications tab.',
  },
  {
    q: 'Can I track my application status?',
    a: 'Yes — go to the Applications tab to see all your submitted applications and their current status in real time.',
  },
  {
    q: 'Can I withdraw an application?',
    a: 'Yes. In the Applications tab, tap Withdraw on any application that is still under review. Finalised applications cannot be withdrawn.',
  },
  {
    q: 'What are credits used for?',
    a: 'Credits boost your application visibility to recruiters. Applying with credits makes your profile appear higher in the recruiter\'s applicant list.',
  },
  {
    q: 'How do I update my resume?',
    a: 'Go to Documents from the drawer menu. You can upload new files (PDF, DOC) and set one as your default resume.',
  },
  {
    q: 'Is JobFinder free for job seekers?',
    a: 'Yes. Creating an account, building your profile, and applying to jobs is completely free. We will never charge candidates.',
  },
  {
    q: 'What does "Open to Work" mean?',
    a: '"Open to Work" signals to recruiters that you\'re actively looking. It can lead to direct interview invitations from companies.',
  },
];

function ChatModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setName(''); setEmail(''); setMessage('');
    setSent(false); setSending(false);
    onClose();
  };

  const submit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/content/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          type: 'support',
          subject: 'Mobile App Support Request',
          message: message.trim(),
        }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        Alert.alert('Error', `Failed to send. Email us at ${SUPPORT_EMAIL}`);
      }
    } catch {
      Alert.alert('Network error', `Please email us at ${SUPPORT_EMAIL}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={reset}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={chatStyles.overlay}>
          <View style={[chatStyles.sheet, { backgroundColor: c.card, paddingBottom: insets.bottom + 20 }]}>
            {/* Header */}
            <View style={[chatStyles.header, { borderBottomColor: c.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={chatStyles.dot} />
                <Text style={[chatStyles.headerTitle, { color: c.text }]}>JobFinder Support</Text>
              </View>
              <TouchableOpacity onPress={reset} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={20} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            {sent ? (
              <View style={chatStyles.sentWrap}>
                <Ionicons name="checkmark-circle" size={52} color="#14A800" />
                <Text style={[chatStyles.sentTitle, { color: c.text }]}>Message sent!</Text>
                <Text style={[chatStyles.sentSub, { color: c.textMuted }]}>
                  Our team will reply to your email within 24 hours on business days.
                </Text>
                <TouchableOpacity style={chatStyles.closeBtn} onPress={reset}>
                  <Text style={chatStyles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={chatStyles.form}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[chatStyles.greeting, { backgroundColor: c.accentBg }]}>
                  <Text style={{ color: c.textBody, fontSize: 13, lineHeight: 19 }}>
                    Hi 👋 How can we help you? Our team replies within 24 hours, Mon–Fri 8am–6pm WAT.
                  </Text>
                </View>

                <Text style={[chatStyles.fieldLabel, { color: c.textBody }]}>Your name</Text>
                <TextInput
                  style={[chatStyles.input, { backgroundColor: c.bg, borderColor: c.border2, color: c.text }]}
                  value={name} onChangeText={setName}
                  placeholder="Full name" placeholderTextColor={c.textDim}
                />

                <Text style={[chatStyles.fieldLabel, { color: c.textBody }]}>Email address</Text>
                <TextInput
                  style={[chatStyles.input, { backgroundColor: c.bg, borderColor: c.border2, color: c.text }]}
                  value={email} onChangeText={setEmail}
                  placeholder="you@example.com" placeholderTextColor={c.textDim}
                  keyboardType="email-address" autoCapitalize="none"
                />

                <Text style={[chatStyles.fieldLabel, { color: c.textBody }]}>Message</Text>
                <TextInput
                  style={[chatStyles.input, chatStyles.textarea, { backgroundColor: c.bg, borderColor: c.border2, color: c.text }]}
                  value={message} onChangeText={setMessage}
                  placeholder="Describe your issue or question…"
                  placeholderTextColor={c.textDim}
                  multiline numberOfLines={4} textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[chatStyles.sendBtn, sending && { opacity: 0.6 }]}
                  onPress={submit} disabled={sending} activeOpacity={0.85}
                >
                  {sending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name="send" size={14} color="#fff" />
                        <Text style={chatStyles.sendBtnText}>Send Message</Text>
                      </>}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [chatVisible, setChatVisible] = useState(false);

  const toggle = (i: number) => setOpenFaq((p) => (p === i ? null : i));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="help-circle-outline" size={36} color={c.accent} />
          </View>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSub}>Find answers or contact our support team.</Text>
        </View>

        {/* Hours strip */}
        <View style={[styles.hoursStrip, { backgroundColor: c.accentBg, borderColor: c.accentBorder }]}>
          <Ionicons name="time-outline" size={14} color={c.accent} />
          <Text style={[styles.hoursText, { color: c.accent }]}>Mon–Fri · 8am–6pm WAT · Yaoundé, Cameroon</Text>
        </View>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        {CONTACT.map(({ icon, label, sub, color, onPress, isChat }) => (
          <TouchableOpacity
            key={label}
            style={styles.contactCard}
            activeOpacity={0.8}
            onPress={isChat ? () => setChatVisible(true) : onPress}
          >
            <View style={[styles.contactIcon, { backgroundColor: color + '18' }]}>
              <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{label}</Text>
              <Text style={styles.contactSub}>{sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.textDim} />
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>FAQ</Text>
        {FAQS.map(({ q, a }, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqCard, openFaq === i && styles.faqCardOpen]}
            onPress={() => toggle(i)}
            activeOpacity={0.85}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ} numberOfLines={openFaq === i ? undefined : 2}>{q}</Text>
              <Ionicons
                name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                size={16} color={c.textMuted}
              />
            </View>
            {openFaq === i && <Text style={styles.faqA}>{a}</Text>}
          </TouchableOpacity>
        ))}

        <Text style={styles.versionText}>Jobbe v1.0.0 · © 2025 JobFinder Global Ltd. · Yaoundé, Cameroon</Text>
        <View style={{ height: 32 }} />
      </ScrollView>

      <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
    </View>
  );
}

const chatStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#14A800' },
  headerTitle: { fontSize: 15, fontWeight: '700' },
  form: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { borderRadius: 12, padding: 14, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, marginBottom: 14,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top', lineHeight: 20 },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#14A800', borderRadius: 12, height: 50, marginTop: 4,
  },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sentWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 12 },
  sentTitle: { fontSize: 20, fontWeight: '800' },
  sentSub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  closeBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24 },
  closeBtnText: { color: '#14A800', fontWeight: '600', fontSize: 14 },
});

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
    iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    scroll: { paddingHorizontal: 16, paddingTop: 4 },
    hero: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    heroIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    heroTitle: { color: c.text, fontSize: 20, fontWeight: '800' },
    heroSub: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    hoursStrip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 20 },
    hoursText: { fontSize: 12, fontWeight: '600' },
    sectionTitle: { color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    contactCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, marginBottom: 10 },
    contactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    contactInfo: { flex: 1 },
    contactLabel: { color: c.textSub, fontSize: 14, fontWeight: '600' },
    contactSub: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    faqCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 16, marginBottom: 8 },
    faqCardOpen: { borderColor: c.accentBorder, backgroundColor: c.accentBg },
    faqHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    faqQ: { color: c.textSub, fontSize: 14, fontWeight: '600', flex: 1 },
    faqA: { color: c.textBody, fontSize: 13, lineHeight: 21, marginTop: 12 },
    versionText: { color: c.textDim, fontSize: 11, textAlign: 'center', marginTop: 20 },
  });
}
