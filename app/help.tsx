import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

const FAQS = [
  { q: 'How do I apply for a job?', a: 'Open a job listing and tap "Apply Now". Select your resume, optionally write a cover letter, then submit. You can track your application in the Applications tab.' },
  { q: 'What are credits used for?', a: "Credits boost your application visibility to recruiters. Applying with credits makes your profile appear higher in the recruiter's applicant list." },
  { q: 'How do I update my resume?', a: 'Go to the Documents screen from the drawer menu. You can upload new files (PDF, DOC) and set a document as your default resume.' },
  { q: 'Can I apply without credits?', a: 'Yes! Credits are optional boosts. You can always apply for free — your application will still be reviewed by the recruiter.' },
  { q: 'How do I get notified about new jobs?', a: "Enable push notifications in Settings. You'll be alerted when new jobs matching your profile are posted." },
  { q: 'What does "Open to Work" mean?', a: '"Open to Work" signals to recruiters that you\'re actively looking. It can lead to direct invitations from companies.' },
];

const CONTACT = [
  { icon: 'mail-outline', label: 'Email Support', sub: 'support@jobbe.cm', color: '#1565C0' },
  { icon: 'logo-whatsapp', label: 'WhatsApp', sub: '+237 6XX XXX XXX', color: '#25D366' },
  { icon: 'chatbubble-ellipses-outline', label: 'Live Chat', sub: 'Mon–Fri 9am–5pm WAT', color: '#14A800' },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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

        <Text style={styles.sectionTitle}>Contact Us</Text>
        {CONTACT.map(({ icon, label, sub, color }) => (
          <TouchableOpacity key={label} style={styles.contactCard} activeOpacity={0.8}>
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
          <TouchableOpacity key={i} style={[styles.faqCard, openFaq === i && styles.faqCardOpen]} onPress={() => toggle(i)} activeOpacity={0.85}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ}>{q}</Text>
              <Ionicons name={openFaq === i ? 'chevron-up' : 'chevron-down'} size={16} color={c.textMuted} />
            </View>
            {openFaq === i && <Text style={styles.faqA}>{a}</Text>}
          </TouchableOpacity>
        ))}

        <Text style={styles.versionText}>Jobbe v1.0.0 · © 2025 Jobbe Inc.</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

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
    sectionTitle: { color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    contactCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, marginBottom: 10 },
    contactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    contactInfo: { flex: 1 },
    contactLabel: { color: c.textSub, fontSize: 14, fontWeight: '600' },
    contactSub: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    faqCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 16, marginBottom: 8 },
    faqCardOpen: { borderColor: c.accentBorder, backgroundColor: c.accentBg },
    faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    faqQ: { color: c.textSub, fontSize: 14, fontWeight: '600', flex: 1 },
    faqA: { color: c.textBody, fontSize: 13, lineHeight: 21, marginTop: 12 },
    versionText: { color: c.textDim, fontSize: 11, textAlign: 'center', marginTop: 20 },
  });
}
