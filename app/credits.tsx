import { useCredits } from '@/hooks/useCredits';
import { useTheme } from '@/hooks/useTheme';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CreditPack {
  id: string;
  name: string;
  description?: string;
  credits: number;
  bonusCredits: number;
  price: number;
  currency: string;
  label?: string;
}

type PaymentState = 'idle' | 'paying' | 'waiting' | 'success' | 'failed';

const PROVIDERS = [
  { value: 'MTN', label: 'MTN MoMo', color: '#FFC107' },
  { value: 'ORANGE', label: 'Orange Money', color: '#FF6D00' },
] as const;

const TX_LABEL: Record<string, string> = {
  PURCHASE: 'Credits purchased',
  SPEND: 'Credits spent',
  REFUND: 'Credits refunded',
  BONUS: 'Bonus credits',
  ADJUSTMENT: 'Credit adjustment',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function useCreditPacks() {
  return useQuery<CreditPack[]>({
    queryKey: ['credit-packs'],
    queryFn: () => api.get('/credits/packs').then((r) => r.data),
  });
}

export default function CreditsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useCredits();
  const { data: packs = [], isLoading: packsLoading } = useCreditPacks();

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];

  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState<'MTN' | 'ORANGE'>('MTN');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [creditsGranted, setCreditsGranted] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((paymentId: string) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/payments/${paymentId}/status`);
        const data = res.data as { status: string; creditsGranted: number };
        if (data.status === 'SUCCESS') {
          stopPolling();
          setCreditsGranted(data.creditsGranted ?? 0);
          setPaymentState('success');
          queryClient.invalidateQueries({ queryKey: ['credits'] });
          refetch();
        } else if (data.status === 'FAILED') {
          stopPolling();
          setPaymentState('failed');
        } else if (attempts >= 40) {
          stopPolling();
          setPaymentState('failed');
        }
      } catch {}
    }, 3000);
  }, [stopPolling, queryClient, refetch]);

  const openBuy = (pack: CreditPack) => {
    stopPolling();
    setSelectedPack(pack);
    setPhone('');
    setProvider('MTN');
    setPaymentState('idle');
    setCreditsGranted(0);
    setPendingPaymentId(null);
  };

  const closeModal = () => {
    stopPolling();
    setSelectedPack(null);
    setPaymentState('idle');
    setPendingPaymentId(null);
  };

  const handlePay = async () => {
    if (!selectedPack) return;
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 9 || clean.length > 15) {
      Alert.alert('Invalid number', 'Enter a valid mobile money number (9–15 digits).');
      return;
    }
    setPaymentState('paying');
    try {
      const res = await api.post('/payments/fapshi/initiate', {
        packId: selectedPack.id,
        phone: clean,
        provider,
      });
      const data = res.data as { success: boolean; paymentId: string };
      if (data.success && data.paymentId) {
        setPendingPaymentId(data.paymentId);
        setPaymentState('waiting');
        startPolling(data.paymentId);
      } else {
        setPaymentState('idle');
        Alert.alert('Payment Error', 'Could not initiate payment. Please try again.');
      }
    } catch (err: any) {
      setPaymentState('idle');
      const raw = err?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join('\n') : (raw ?? 'Payment failed. Please try again.');
      Alert.alert('Payment Error', String(msg));
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top + 40 }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
        <Text style={styles.emptyText}>Could not load credits</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credits</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLabel}>Available credits</Text>
            <View style={styles.balanceRow}>
              <Ionicons name="wallet-outline" size={22} color={c.accent} />
              <Text style={styles.balanceValue}>{balance}</Text>
            </View>
            <Text style={styles.balanceHint}>1 credit = 100 XAF</Text>
          </View>
          <View style={styles.balanceCircle}>
            <Text style={styles.balanceCircleNum}>{balance}</Text>
            <Text style={styles.balanceCircleLabel}>credits</Text>
          </View>
        </View>

        {/* Packs */}
        <Text style={styles.sectionTitle}>Top Up</Text>
        <Text style={styles.sectionHint}>Buy credits via MTN or Orange Mobile Money.</Text>

        {packsLoading ? (
          <ActivityIndicator color={c.accent} style={{ marginTop: 16 }} />
        ) : packs.length === 0 ? (
          <View style={styles.emptyPacks}>
            <Ionicons name="cash-outline" size={36} color={c.border3} />
            <Text style={styles.emptyText}>No packs available right now.</Text>
          </View>
        ) : (
          packs.map((pack) => {
            const total = pack.credits + pack.bonusCredits;
            const isPopular = pack.label?.toLowerCase() === 'popular';
            return (
              <View key={pack.id} style={[styles.planCard, isPopular && styles.planCardPopular]}>
                {pack.label && (
                  <View style={[styles.popularBadge, !isPopular && styles.labelBadge]}>
                    <Text style={[styles.popularText, !isPopular && { color: c.textMuted }]}>{pack.label}</Text>
                  </View>
                )}
                <View style={styles.planTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{pack.name}</Text>
                    {pack.description ? <Text style={styles.planDesc}>{pack.description}</Text> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Text style={styles.planCredits}>{total} credits</Text>
                      {pack.bonusCredits > 0 && (
                        <View style={styles.bonusBadge}>
                          <Text style={styles.bonusText}>+{pack.bonusCredits} bonus</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.planPrice}>{pack.price.toLocaleString()}</Text>
                    <Text style={styles.planCurrency}>{pack.currency}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.buyBtn, isPopular && styles.buyBtnPopular]}
                  activeOpacity={0.85}
                  onPress={() => openBuy(pack)}
                >
                  <Ionicons name="phone-portrait-outline" size={16} color={isPopular ? '#fff' : c.accent} />
                  <Text style={[styles.buyBtnText, isPopular && styles.buyBtnTextPopular]}>
                    Buy — {pack.price.toLocaleString()} XAF
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Transaction History */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Transaction History</Text>
        {transactions.length === 0 ? (
          <Text style={styles.sectionHint}>No transactions yet.</Text>
        ) : (
          transactions.map((tx) => {
            const isIncoming = tx.amount > 0;
            return (
              <View key={tx.id} style={styles.historyRow}>
                <View style={[styles.historyIcon, { backgroundColor: isIncoming ? '#14A80018' : '#C6282818' }]}>
                  <Ionicons
                    name={isIncoming ? 'add-circle-outline' : 'remove-circle-outline'}
                    size={18}
                    color={isIncoming ? '#14A800' : '#C62828'}
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDesc}>{tx.description ?? TX_LABEL[tx.type] ?? tx.type}</Text>
                  <Text style={styles.historyDate}>{formatDate(tx.createdAt)}</Text>
                </View>
                <Text style={[styles.historyCredits, { color: isIncoming ? '#14A800' : '#C62828' }]}>
                  {isIncoming ? '+' : '-'}{Math.abs(tx.amount)}
                </Text>
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Purchase Modal */}
      <Modal visible={!!selectedPack} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => paymentState === 'idle' && closeModal()}
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>

              {/* SUCCESS */}
              {paymentState === 'success' && (
                <View style={styles.stateBox}>
                  <Ionicons name="checkmark-circle" size={60} color={c.accent} />
                  <Text style={styles.stateTitle}>Payment Confirmed!</Text>
                  <Text style={styles.stateMsg}>
                    <Text style={{ fontWeight: '800' }}>{creditsGranted > 0 ? creditsGranted.toLocaleString() : (selectedPack?.credits ?? 0) + (selectedPack?.bonusCredits ?? 0)} credits</Text>
                    {' '}have been added to your account.
                  </Text>
                  <TouchableOpacity style={[styles.buyBtn, styles.buyBtnPopular, { marginTop: 8 }]} onPress={closeModal}>
                    <Text style={styles.buyBtnTextPopular}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* WAITING */}
              {paymentState === 'waiting' && (
                <View style={styles.stateBox}>
                  <View style={styles.waitingCircle}>
                    <Ionicons name="phone-portrait-outline" size={30} color="#F57F17" />
                  </View>
                  <Text style={styles.stateTitle}>Check Your Phone</Text>
                  <Text style={styles.stateMsg}>
                    A push notification was sent to{' '}
                    <Text style={{ fontWeight: '700' }}>{phone.replace(/\D/g, '')}</Text>.
                    {'\n\n'}Approve the{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {provider === 'MTN' ? 'MTN Mobile Money' : 'Orange Money'}
                    </Text>
                    {' '}payment of{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {selectedPack?.price.toLocaleString()} {selectedPack?.currency}
                    </Text>
                    {' '}on your phone.
                  </Text>
                  <View style={styles.checkingRow}>
                    <ActivityIndicator size="small" color={c.textMuted} />
                    <Text style={styles.checkingText}>Checking status every 3s…</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.buyBtn, { borderColor: c.border2, marginTop: 8 }]}
                    onPress={closeModal}
                  >
                    <Text style={[styles.buyBtnText, { color: c.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* FAILED */}
              {paymentState === 'failed' && (
                <View style={styles.stateBox}>
                  <View style={[styles.waitingCircle, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="close-circle-outline" size={30} color="#C62828" />
                  </View>
                  <Text style={[styles.stateTitle, { color: '#C62828' }]}>Payment Failed</Text>
                  <Text style={styles.stateMsg}>
                    The payment was declined or expired. Please try again.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                    <TouchableOpacity
                      style={[styles.buyBtn, { flex: 1, borderColor: c.border2 }]}
                      onPress={closeModal}
                    >
                      <Text style={[styles.buyBtnText, { color: c.textMuted }]}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.buyBtn, styles.buyBtnPopular, { flex: 1 }]}
                      onPress={() => setPaymentState('idle')}
                    >
                      <Text style={styles.buyBtnTextPopular}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* IDLE / FORM */}
              {(paymentState === 'idle' || paymentState === 'paying') && (
                <>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalTitle}>Complete Purchase</Text>
                      <Text style={styles.modalSubtitle}>{selectedPack?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={closeModal}>
                      <Ionicons name="close" size={22} color={c.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Pack summary */}
                  <View style={styles.packSummary}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="wallet-outline" size={18} color="#F57F17" />
                      <Text style={styles.summaryCredits}>
                        {((selectedPack?.credits ?? 0) + (selectedPack?.bonusCredits ?? 0)).toLocaleString()} credits
                      </Text>
                    </View>
                    <Text style={styles.summaryPrice}>
                      {selectedPack?.price.toLocaleString()} {selectedPack?.currency}
                    </Text>
                  </View>

                  {/* Provider selector */}
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <View style={styles.providerRow}>
                    {PROVIDERS.map((p) => (
                      <TouchableOpacity
                        key={p.value}
                        style={[
                          styles.providerBtn,
                          provider === p.value && { borderColor: c.accent, backgroundColor: c.accentBg },
                        ]}
                        onPress={() => setProvider(p.value)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.providerDot, { backgroundColor: p.color }]} />
                        <Text style={[
                          styles.providerLabel,
                          provider === p.value && { color: c.accent, fontWeight: '700' },
                        ]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Phone input */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Mobile Money Number</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="phone-portrait-outline" size={18} color={c.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="e.g. 6XXXXXXXX"
                      placeholderTextColor={c.textDim}
                      keyboardType="phone-pad"
                      maxLength={15}
                    />
                  </View>
                  <Text style={styles.inputHint}>
                    {provider === 'MTN' ? 'MTN MoMo' : 'Orange Money'} number (Cameroon)
                  </Text>

                  <TouchableOpacity
                    style={[styles.buyBtn, styles.buyBtnPopular, paymentState === 'paying' && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                    onPress={handlePay}
                    disabled={paymentState === 'paying' || !phone.trim()}
                  >
                    {paymentState === 'paying' ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="flash" size={16} color="#fff" />
                        <Text style={styles.buyBtnTextPopular}>
                          Pay {selectedPack?.price.toLocaleString()} {selectedPack?.currency}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.pushHint}>
                    You'll receive a push notification to approve on your phone.
                  </Text>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { alignItems: 'center', justifyContent: 'center' },
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
    emptyPacks: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    emptyText: { color: c.textMuted, fontSize: 15, fontWeight: '600' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },
    planCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 18, marginBottom: 14 },
    planCardPopular: { borderColor: c.accent, backgroundColor: c.accentBg },
    popularBadge: { alignSelf: 'flex-start', backgroundColor: c.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12 },
    labelBadge: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border2 },
    popularText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    planName: { color: c.text, fontSize: 17, fontWeight: '800' },
    planDesc: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    planCredits: { color: c.textBody, fontSize: 13, marginTop: 2 },
    bonusBadge: { backgroundColor: '#F57F1720', borderRadius: 6, borderWidth: 1, borderColor: '#F57F1740', paddingHorizontal: 6, paddingVertical: 2 },
    bonusText: { color: '#F57F17', fontSize: 10, fontWeight: '700' },
    planPrice: { color: c.text, fontSize: 22, fontWeight: '800' },
    planCurrency: { color: c.textMuted, fontSize: 12 },
    buyBtn: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: c.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    buyBtnPopular: { backgroundColor: c.accent, borderColor: c.accent },
    buyBtnText: { color: c.accent, fontSize: 15, fontWeight: '700' },
    buyBtnTextPopular: { color: '#fff', fontSize: 15, fontWeight: '700' },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    historyIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    historyInfo: { flex: 1 },
    historyDesc: { color: c.textSub, fontSize: 13 },
    historyDate: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    historyCredits: { fontSize: 14, fontWeight: '700', flexShrink: 0 },
    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border2, alignSelf: 'center', marginBottom: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: '800' },
    modalSubtitle: { color: c.textMuted, fontSize: 13, marginTop: 2 },
    packSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.bg, borderRadius: 14, padding: 14, marginBottom: 16 },
    summaryCredits: { color: c.text, fontSize: 15, fontWeight: '700' },
    summaryPrice: { color: c.accent, fontSize: 16, fontWeight: '800' },
    providerRow: { flexDirection: 'row', gap: 10 },
    providerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: c.border2 },
    providerDot: { width: 12, height: 12, borderRadius: 6 },
    providerLabel: { color: c.textSub, fontSize: 13, fontWeight: '500' },
    inputLabel: { color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg, borderRadius: 12, borderWidth: 1, borderColor: c.border2, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 6 },
    input: { flex: 1, color: c.text, fontSize: 15 },
    inputHint: { color: c.textDim, fontSize: 11, marginBottom: 20 },
    pushHint: { color: c.textDim, fontSize: 11, textAlign: 'center', marginTop: 10 },
    // State screens
    stateBox: { alignItems: 'center', gap: 12, paddingVertical: 16 },
    stateTitle: { color: c.text, fontSize: 20, fontWeight: '800' },
    stateMsg: { color: c.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21 },
    waitingCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center' },
    checkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    checkingText: { color: c.textDim, fontSize: 12 },
  });
}
