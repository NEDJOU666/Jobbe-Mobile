import { useCredits, type CreditTransaction } from '@/hooks/useCredits';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PLANS = [
  { id: 'basic',   name: 'Basic',   price: '2 500',  credits: 10, bonusCredits: 0,  popular: false, perks: ['10 applications boost', 'Basic profile badge', '7 days validity'] },
  { id: 'pro',     name: 'Pro',     price: '7 500',  credits: 35, bonusCredits: 5,  popular: true,  perks: ['35 + 5 bonus credits', 'Pro profile badge', 'Priority in search', '30 days validity'] },
  { id: 'premium', name: 'Premium', price: '15 000', credits: 80, bonusCredits: 20, popular: false, perks: ['80 + 20 bonus credits', 'Premium badge', 'Featured profile', 'Direct recruiter contacts', '60 days validity'] },
];

const TX_LABEL: Record<CreditTransaction['type'], string> = {
  PURCHASE: 'Credits purchased',
  SPEND: 'Credits spent',
  REFUND: 'Credits refunded',
  BONUS: 'Bonus credits',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CreditsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const { data, isLoading, isError, refetch } = useCredits();
  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credits</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={c.accent} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
          <Text style={styles.emptyText}>Could not load credits</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLabel}>Available credits</Text>
            <View style={styles.balanceRow}>
              <Ionicons name="wallet-outline" size={22} color={c.accent} />
              <Text style={styles.balanceValue}>{balance}</Text>
            </View>
            <Text style={styles.balanceHint}>1 credit = 1 boosted application</Text>
          </View>
          <View style={styles.balanceCircle}>
            <Text style={styles.balanceCircleNum}>{balance}</Text>
            <Text style={styles.balanceCircleLabel}>credits</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Top Up</Text>
        <Text style={styles.sectionHint}>Buy credits to boost your applications and stand out to recruiters.</Text>

        {PLANS.map((plan) => (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.planCardPopular]}>
            {plan.popular && <View style={styles.popularBadge}><Text style={styles.popularText}>Most Popular</Text></View>}
            <View style={styles.planTop}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.planCredits}>{plan.credits} credits</Text>
                  {plan.bonusCredits > 0 && (
                    <View style={styles.bonusBadge}>
                      <Text style={styles.bonusText}>+{plan.bonusCredits} bonus</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planCurrency}>XAF</Text>
              </View>
            </View>
            <View style={styles.planPerks}>
              {plan.perks.map((p) => (
                <View key={p} style={styles.perkRow}>
                  <Ionicons name="checkmark-circle" size={15} color={c.accent} />
                  <Text style={styles.perkText}>{p}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.buyBtn, plan.popular && styles.buyBtnPopular]} activeOpacity={0.85}>
              <Text style={[styles.buyBtnText, plan.popular && styles.buyBtnTextPopular]}>Buy {plan.name}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Transaction History</Text>
        {transactions.length === 0 ? (
          <Text style={styles.sectionHint}>No transactions yet.</Text>
        ) : (
          transactions.map((tx) => {
            const positive = tx.amount > 0;
            return (
              <View key={tx.id} style={styles.historyRow}>
                <View style={[styles.historyIcon, { backgroundColor: positive ? '#14A80018' : '#C6282818' }]}>
                  <Ionicons name={positive ? 'add-circle-outline' : 'remove-circle-outline'} size={18} color={positive ? '#14A800' : '#C62828'} />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDesc}>{tx.description ?? TX_LABEL[tx.type]}</Text>
                  <Text style={styles.historyDate}>{formatDate(tx.createdAt)}</Text>
                </View>
                <Text style={[styles.historyCredits, { color: positive ? '#14A800' : '#C62828' }]}>
                  {positive ? '+' : ''}{tx.amount}
                </Text>
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
      )}
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
    balanceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.card, borderWidth: 1, borderColor: c.accentBorder, borderRadius: 20, padding: 20, marginBottom: 24 },
    balanceLeft: { gap: 4 },
    balanceLabel: { color: c.textMuted, fontSize: 13 },
    balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    balanceValue: { color: c.text, fontSize: 32, fontWeight: '800' },
    balanceHint: { color: c.textDim, fontSize: 11 },
    balanceCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.accentBg, borderWidth: 2, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center' },
    balanceCircleNum: { color: c.accent, fontSize: 22, fontWeight: '800' },
    balanceCircleLabel: { color: c.accent, fontSize: 10, opacity: 0.7 },
    sectionTitle: { color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    sectionHint: { color: c.textMuted, fontSize: 13, marginBottom: 16 },
    planCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 18, marginBottom: 14 },
    planCardPopular: { borderColor: c.accent, backgroundColor: c.accentBg },
    popularBadge: { alignSelf: 'flex-start', backgroundColor: c.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12 },
    popularText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    planName: { color: c.text, fontSize: 17, fontWeight: '800' },
    planCredits: { color: c.textBody, fontSize: 13, marginTop: 2 },
    bonusBadge: { backgroundColor: '#F57F1720', borderRadius: 6, borderWidth: 1, borderColor: '#F57F1740', paddingHorizontal: 6, paddingVertical: 2 },
    bonusText: { color: '#F57F17', fontSize: 10, fontWeight: '700' },
    planPrice: { color: c.text, fontSize: 22, fontWeight: '800' },
    planCurrency: { color: c.textMuted, fontSize: 12 },
    planPerks: { gap: 8, marginBottom: 16 },
    perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    perkText: { color: c.textBody, fontSize: 13 },
    buyBtn: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    buyBtnPopular: { backgroundColor: c.accent, borderColor: c.accent },
    buyBtnText: { color: c.accent, fontSize: 15, fontWeight: '700' },
    buyBtnTextPopular: { color: '#fff' },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    historyIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    historyInfo: { flex: 1 },
    historyDesc: { color: c.textSub, fontSize: 13 },
    historyDate: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    historyCredits: { fontSize: 14, fontWeight: '700', flexShrink: 0 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 12 },
    emptyText: { color: c.textMuted, fontSize: 16, fontWeight: '600' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },
  });
}
