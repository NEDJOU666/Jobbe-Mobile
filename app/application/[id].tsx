import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/hooks/useT';
import {
  useApplicationDetail, useConfirmInterview,
  useCancelInterview, useRespondOffer,
  type MeetingPlatform,
} from '@/hooks/useApplications';
import { useSendApplicationMessage } from '@/hooks/useInbox';

// ─── Constants ────────────────────────────────────────────────────────────────

function getStatusMeta(t: any): Record<string, { label: string; color: string }> {
  return {
    PENDING_REVIEW:    { label: t.applicationDetail.statusPendingReview,    color: '#B45309' },
    FORWARDED_TO_FIRM: { label: t.applicationDetail.statusForwardedToFirm, color: '#0369A1' },
    REVIEWING:         { label: t.applicationDetail.statusReviewing,          color: '#7C3AED' },
    SHORTLISTED:       { label: t.applicationDetail.statusShortlisted,        color: '#6D28D9' },
    INTERVIEW:         { label: t.applicationDetail.statusInterview,           color: '#4F46E5' },
    OFFER:             { label: t.applicationDetail.statusOfferReceived,     color: '#16A34A' },
    REJECTED:          { label: t.applicationDetail.statusRejected,            color: '#DC2626' },
  };
}

function getPlatformLabel(t: any): Record<MeetingPlatform, string> {
  return {
    ZOOM: t.applicationDetail.platformZoom, GOOGLE_MEET: t.applicationDetail.platformGoogleMeet, TEAMS: t.applicationDetail.platformTeams,
    PHONE: t.applicationDetail.platformPhone, IN_PERSON: t.applicationDetail.platformInPerson, OTHER: t.applicationDetail.platformOther,
  };
}

const INTERVIEW_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: '#4F46E5', CONFIRMED: '#16A34A',
  COMPLETED: '#6B7280', CANCELLED: '#DC2626', RESCHEDULED: '#D97706',
}

function getInterviewStatusLabel(t: any): Record<string, string> {
  return {
    SCHEDULED: t.applicationDetail.interviewStatusScheduled,
    CONFIRMED: t.applicationDetail.interviewStatusConfirmed,
    COMPLETED: t.applicationDetail.interviewStatusCompleted,
    CANCELLED: t.applicationDetail.interviewStatusCancelled,
    RESCHEDULED: t.applicationDetail.interviewStatusRescheduled,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function timeAgo(iso: string, t: any) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return t.applicationDetail.justNow
  if (m < 60) return `${m}${t.applicationDetail.minutesAgoSuffix}`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}${t.applicationDetail.hoursAgoSuffix}`
  return `${Math.floor(h / 24)}${t.applicationDetail.daysAgoSuffix}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const styles = useMemo(() => makeStyles(c), [c])
  const { t } = useT()
  const STATUS_META = useMemo(() => getStatusMeta(t), [t])
  const PLATFORM_LABEL = useMemo(() => getPlatformLabel(t), [t])
  const INTERVIEW_STATUS_LABEL = useMemo(() => getInterviewStatusLabel(t), [t])

  const { data: app, isLoading, isError, refetch } = useApplicationDetail(id ?? '')

  const { mutate: confirmInterview, isPending: isConfirming } = useConfirmInterview()
  const { mutate: cancelInterview, isPending: isCancelling } = useCancelInterview()
  const { mutate: respondOffer, isPending: isResponding } = useRespondOffer()
  const { mutate: sendMsg, isPending: isSending } = useSendApplicationMessage()

  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleNote, setRescheduleNote] = useState('')

  // Hardware back: close reschedule modal if open, else default navigation
  useEffect(() => {
    if (!showReschedule) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowReschedule(false);
      return true;
    });
    return () => sub.remove();
  }, [showReschedule]);

  const handleConfirm = useCallback(() => {
    if (!app?.interview) return
    Alert.alert(t.applicationDetail.confirmInterviewAlertTitle, t.applicationDetail.confirmInterviewAlertMessage, [
      { text: t.applicationDetail.cancelButton, style: 'cancel' },
      {
        text: t.applicationDetail.confirmButton, onPress: () =>
          confirmInterview(app.interview!.id, {
            onSuccess: () => refetch(),
          }),
      },
    ])
  }, [app, confirmInterview, refetch, t])

  const handleCancel = useCallback(() => {
    if (!app?.interview) return
    Alert.alert(t.applicationDetail.cancelInterviewAlertTitle, t.applicationDetail.cancelInterviewAlertMessage, [
      { text: t.applicationDetail.noButton, style: 'cancel' },
      {
        text: t.applicationDetail.yesCancelButton, style: 'destructive', onPress: () =>
          cancelInterview(app.interview!.id, {
            onSuccess: () => refetch(),
          }),
      },
    ])
  }, [app, cancelInterview, refetch, t])

  const handleReschedule = useCallback(() => {
    if (!app?.interview || !rescheduleDate.trim()) return
    const currentDate = `${formatDate(app.interview.scheduled_at)} at ${formatTime(app.interview.scheduled_at)}`
    const body = [
      `${t.applicationDetail.rescheduleMessageIntroPrefix}${currentDate}${t.applicationDetail.rescheduleMessageIntroSuffix}`,
      `${t.applicationDetail.rescheduleMessagePreferredPrefix}${rescheduleDate.trim()}`,
      rescheduleNote.trim() ? `${t.applicationDetail.rescheduleMessageNotePrefix}${rescheduleNote.trim()}` : '',
      t.applicationDetail.rescheduleMessageThanks,
    ].filter(Boolean).join('\n')

    sendMsg({ applicationId: id!, body }, {
      onSuccess: () => {
        setShowReschedule(false)
        setRescheduleDate('')
        setRescheduleNote('')
        router.push({
          pathname: '/(tabs)/messages',
          params: { applicationId: id!, firmName: app.firm.name, postTitle: app.post.title },
        })
      },
    })
  }, [app, id, rescheduleDate, rescheduleNote, sendMsg, t])

  const handleAcceptOffer = useCallback(() => {
    if (!app) return
    Alert.alert(t.applicationDetail.acceptOfferAlertTitle, t.applicationDetail.acceptOfferAlertMessage, [
      { text: t.applicationDetail.cancelButton, style: 'cancel' },
      {
        text: t.applicationDetail.acceptButton, onPress: () =>
          respondOffer({ applicationId: id!, action: 'accept' }, {
            onSuccess: () => refetch(),
          }),
      },
    ])
  }, [app, id, respondOffer, refetch, t])

  const handleDeclineOffer = useCallback(() => {
    if (!app) return
    Alert.alert(t.applicationDetail.declineOfferAlertTitle, t.applicationDetail.declineOfferAlertMessage, [
      { text: t.applicationDetail.cancelButton, style: 'cancel' },
      {
        text: t.applicationDetail.declineButton, style: 'destructive', onPress: () =>
          respondOffer({ applicationId: id!, action: 'decline' }, {
            onSuccess: () => refetch(),
          }),
      },
    ])
  }, [app, id, respondOffer, refetch, t])

  // ─── Loading / Error ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }]}>
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    )
  }

  if (isError || !app) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
        <Text style={{ color: c.textMuted }}>{t.applicationDetail.loadErrorText}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: c.accent, fontWeight: '600' }}>{t.applicationDetail.goBackButton}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const currentStatus = app.status[app.status.length - 1] ?? 'PENDING_REVIEW'
  const curMeta = STATUS_META[currentStatus] ?? { label: currentStatus, color: '#666' }
  const isScraped = !!app.post.source
  // Handle both old format (bare URL string) and new format ({ name, url })
  const docs = Array.isArray(app.documents)
    ? app.documents.map((d: any) =>
        typeof d === 'string'
          ? { name: d.split('/').pop() ?? 'Document', url: d }
          : d
      ).filter((d: any) => d?.url)
    : []
  const interviewActive = app.interview?.status === 'SCHEDULED' || app.interview?.status === 'CONFIRMED'
  const interviewStatusColor = INTERVIEW_STATUS_COLOR[app.interview?.status ?? ''] ?? '#666'

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{app.post.title}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{app.firm.name}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: curMeta.color + '18', borderColor: curMeta.color + '44' }]}>
          <Text style={[styles.statusPillText, { color: curMeta.color }]}>{curMeta.label}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── Status Timeline ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t.applicationDetail.applicationProgressLabel}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.timeline}>
              {app.status.map((s, i) => {
                const m = STATUS_META[s] ?? { label: s, color: '#888' }
                const isLast = i === app.status.length - 1
                return (
                  <View key={i} style={styles.timelineStep}>
                    <View style={[styles.timelineDot, {
                      backgroundColor: isLast ? m.color : m.color + '44',
                      width: isLast ? 12 : 9, height: isLast ? 12 : 9,
                      borderRadius: isLast ? 6 : 4.5,
                      borderWidth: isLast ? 2 : 0,
                      borderColor: isLast ? m.color + '55' : 'transparent',
                    }]} />
                    <Text style={[styles.timelineLabel, { color: isLast ? c.text : c.textMuted, fontWeight: isLast ? '700' : '500' }]}>
                      {m.label}
                    </Text>
                    {i < app.status.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                )
              })}
            </View>
          </ScrollView>
          <Text style={styles.metaText}>{t.applicationDetail.appliedOnPrefix}{formatDate(app.createdAt)}</Text>
        </View>

        {/* ── Offer Card ──────────────────────────────────────────────────── */}
        {app.offer && (
          <View style={[styles.card, { borderColor: '#16A34A44' }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trophy-outline" size={16} color="#16A34A" />
              <Text style={[styles.sectionTitleText, { color: '#16A34A' }]}>{t.applicationDetail.jobOfferTitle}</Text>
              {app.offer.status !== 'PENDING' && (
                <View style={[styles.smallBadge, {
                  backgroundColor: app.offer.status === 'ACCEPTED' ? '#dcfce7' : '#fee2e2',
                  borderColor: app.offer.status === 'ACCEPTED' ? '#86efac' : '#fca5a5',
                }]}>
                  <Text style={{ color: app.offer.status === 'ACCEPTED' ? '#16A34A' : '#DC2626', fontSize: 11, fontWeight: '700' }}>
                    {app.offer.status === 'ACCEPTED' ? t.applicationDetail.offerAcceptedBadge : t.applicationDetail.offerDeclinedBadge}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.salaryBox}>
              <Text style={styles.salaryLabel}>{t.applicationDetail.monthlySalaryLabel}</Text>
              <Text style={styles.salaryAmount}>{Number(app.offer.salary).toLocaleString()} XAF</Text>
            </View>

            <View style={styles.offerRow}>
              <Ionicons name="calendar-outline" size={14} color={c.textMuted} />
              <Text style={styles.offerMeta}>{t.applicationDetail.startDateLabel} <Text style={{ color: c.text, fontWeight: '600' }}>{formatDate(app.offer.startDate)}</Text></Text>
            </View>

            {app.offer.deadline && (
              <View style={styles.offerRow}>
                <Ionicons name="time-outline" size={14} color="#D97706" />
                <Text style={[styles.offerMeta, { color: '#D97706' }]}>{t.applicationDetail.respondByLabel} <Text style={{ fontWeight: '700' }}>{formatDate(app.offer.deadline)}</Text></Text>
              </View>
            )}

            {app.offer.notes && (
              <Text style={[styles.offerMeta, { color: c.textBody, marginTop: 8 }]}>{app.offer.notes}</Text>
            )}

            {app.offer.status === 'PENDING' && (
              <View style={styles.offerActions}>
                <TouchableOpacity
                  style={[styles.offerBtn, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
                  onPress={handleDeclineOffer}
                  disabled={isResponding}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                  <Text style={[styles.offerBtnText, { color: '#DC2626' }]}>{t.applicationDetail.declineButton}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.offerBtn, { backgroundColor: '#16A34A', borderColor: '#16A34A', flex: 1 }]}
                  onPress={handleAcceptOffer}
                  disabled={isResponding}
                >
                  {isResponding
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                        <Text style={[styles.offerBtnText, { color: '#fff' }]}>{t.applicationDetail.acceptOfferButton}</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Interview Card ───────────────────────────────────────────────── */}
        {app.interview && (
          <View style={[styles.card, { borderColor: interviewStatusColor + '44' }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="videocam-outline" size={16} color={interviewStatusColor} />
              <Text style={[styles.sectionTitleText, { color: interviewStatusColor }]}>{t.applicationDetail.interviewTitle}</Text>
              <View style={[styles.smallBadge, { backgroundColor: interviewStatusColor + '18', borderColor: interviewStatusColor + '55' }]}>
                <Text style={{ color: interviewStatusColor, fontSize: 11, fontWeight: '700' }}>{INTERVIEW_STATUS_LABEL[app.interview.status] ?? app.interview.status}</Text>
              </View>
            </View>

            <View style={styles.interviewGrid}>
              <View style={styles.interviewRow}>
                <Ionicons name="calendar-outline" size={14} color={c.textMuted} />
                <Text style={styles.interviewDetail}>{formatDate(app.interview.scheduled_at)}</Text>
              </View>
              <View style={styles.interviewRow}>
                <Ionicons name="time-outline" size={14} color={c.textMuted} />
                <Text style={styles.interviewDetail}>{formatTime(app.interview.scheduled_at)} · {app.interview.duration_min} min</Text>
              </View>
              <View style={styles.interviewRow}>
                <Ionicons name={app.interview.platform === 'PHONE' ? 'call-outline' : app.interview.platform === 'IN_PERSON' ? 'location-outline' : 'videocam-outline'} size={14} color={c.textMuted} />
                <Text style={styles.interviewDetail}>{PLATFORM_LABEL[app.interview.platform]}</Text>
              </View>
              {app.interview.location && (
                <View style={styles.interviewRow}>
                  <Ionicons name="pin-outline" size={14} color={c.textMuted} />
                  <Text style={styles.interviewDetail} numberOfLines={2}>{app.interview.location}</Text>
                </View>
              )}
              {app.interview.agenda && (
                <View style={[styles.interviewRow, { alignItems: 'flex-start' }]}>
                  <Ionicons name="document-text-outline" size={14} color={c.textMuted} style={{ marginTop: 2 }} />
                  <Text style={[styles.interviewDetail, { flex: 1 }]} numberOfLines={4}>{app.interview.agenda}</Text>
                </View>
              )}
            </View>

            {app.interview.meeting_link && (
              <TouchableOpacity
                style={styles.meetingLinkBtn}
                onPress={() => Linking.openURL(app.interview!.meeting_link!)}
              >
                <Ionicons name="videocam-outline" size={16} color={interviewStatusColor} />
                <Text style={[styles.meetingLinkText, { color: interviewStatusColor }]}>{t.applicationDetail.joinMeetingButton}</Text>
                <Ionicons name="open-outline" size={14} color={interviewStatusColor} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}

            {app.interview.feedback && (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackLabel}>{t.applicationDetail.feedbackLabel}</Text>
                <Text style={styles.feedbackText}>{app.interview.feedback}</Text>
                {app.interview.rating && (
                  <Text style={styles.ratingText}>{'★'.repeat(app.interview.rating)}{'☆'.repeat(5 - (app.interview.rating ?? 0))} {app.interview.rating}/5</Text>
                )}
              </View>
            )}

            {interviewActive && (
              <View style={styles.interviewActions}>
                {app.interview.status === 'SCHEDULED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: interviewStatusColor, flex: 1 }]}
                    onPress={handleConfirm}
                    disabled={isConfirming}
                  >
                    {isConfirming
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <><Ionicons name="checkmark-circle-outline" size={16} color="#fff" /><Text style={[styles.actionBtnText, { color: '#fff' }]}>{t.applicationDetail.confirmAttendanceButton}</Text></>
                    }
                  </TouchableOpacity>
                )}
                <View style={styles.interviewActionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtnOutline, { borderColor: interviewStatusColor + '88' }]}
                    onPress={() => setShowReschedule(true)}
                  >
                    <Ionicons name="calendar-outline" size={15} color={interviewStatusColor} />
                    <Text style={[styles.actionBtnOutlineText, { color: interviewStatusColor }]}>{t.applicationDetail.rescheduleButton}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtnOutline, { borderColor: '#DC262688' }]}
                    onPress={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling
                      ? <ActivityIndicator color="#DC2626" size="small" />
                      : <><Ionicons name="close-circle-outline" size={15} color="#DC2626" /><Text style={[styles.actionBtnOutlineText, { color: '#DC2626' }]}>{t.applicationDetail.cancelButton}</Text></>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Message Firm ─────────────────────────────────────────────────── */}
        {!isScraped && (
          <TouchableOpacity
            style={styles.messageFirmCard}
            onPress={() => router.push({
              pathname: '/(tabs)/messages',
              params: { applicationId: id!, firmName: app.firm.name, postTitle: app.post.title },
            })}
            activeOpacity={0.8}
          >
            <View style={styles.messageFirmLeft}>
              <View style={styles.messageFirmIcon}>
                <Ionicons name="chatbubbles-outline" size={20} color={c.accent} />
              </View>
              <View>
                <Text style={styles.messageFirmTitle}>{t.applicationDetail.messagesTitle}</Text>
                <Text style={styles.messageFirmSub}>{t.applicationDetail.chatWithPrefix}{app.firm.name}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </TouchableOpacity>
        )}

        {/* ── Cover Letter ─────────────────────────────────────────────────── */}
        {app.coverLetter && (
          <View style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="document-text-outline" size={15} color={c.accent} />
              <Text style={styles.sectionTitleText}>{t.applicationDetail.coverLetterTitle}</Text>
            </View>
            <Text style={styles.bodyText}>{app.coverLetter}</Text>
          </View>
        )}

        {/* ── Documents ────────────────────────────────────────────────────── */}
        {docs.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="attach-outline" size={15} color={c.accent} />
              <Text style={styles.sectionTitleText}>{t.applicationDetail.documentsTitle}</Text>
            </View>
            {docs.map((doc, i) => (
              <TouchableOpacity
                key={i}
                style={styles.docRow}
                onPress={() => doc.url && Linking.openURL(doc.url)}
              >
                <Ionicons name="document-outline" size={16} color={c.accent} />
                <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                <Ionicons name="open-outline" size={14} color={c.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Application Details ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t.applicationDetail.applicationDetailsLabel}</Text>
          {[
            { label: t.applicationDetail.appliedOnLabel, value: formatDate(app.createdAt) },
            { label: t.applicationDetail.lastUpdatedLabel, value: formatDate(app.statusUpdatedAt) },
            app.post.applicationDeadline && { label: t.applicationDetail.jobDeadlineLabel, value: formatDate(app.post.applicationDeadline) },
            app.salaryExpectation && { label: t.applicationDetail.salaryExpectationLabel, value: `${app.salaryExpectation.toLocaleString()}${t.applicationDetail.xafPerMonthSuffix}` },
          ].filter(Boolean).map((row: any) => (
            <View key={row.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue}>{row.value}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.viewJobBtn}
            onPress={() => router.push(`/job/${app.post.id}`)}
          >
            <Ionicons name="briefcase-outline" size={14} color={c.accent} />
            <Text style={[styles.viewJobText, { color: c.accent }]}>{t.applicationDetail.viewJobPostingButton}</Text>
            <Ionicons name="chevron-forward" size={14} color={c.accent} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Reschedule Modal ──────────────────────────────────────────────── */}
      <Modal visible={showReschedule} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t.applicationDetail.requestRescheduleTitle}</Text>
            {app.interview && (
              <Text style={styles.modalSub}>
                {t.applicationDetail.currentPrefix}{formatDate(app.interview.scheduled_at)} at {formatTime(app.interview.scheduled_at)}
              </Text>
            )}

            <Text style={styles.modalFieldLabel}>{t.applicationDetail.preferredDateTimeLabel}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t.applicationDetail.preferredDateTimePlaceholder}
              placeholderTextColor={c.textMuted}
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
            />

            <Text style={styles.modalFieldLabel}>{t.applicationDetail.additionalNoteLabel}</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder={t.applicationDetail.additionalNotePlaceholder}
              placeholderTextColor={c.textMuted}
              value={rescheduleNote}
              onChangeText={setRescheduleNote}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: c.card, borderColor: c.border2 }]}
                onPress={() => { setShowReschedule(false); setRescheduleDate(''); setRescheduleNote('') }}
              >
                <Text style={{ color: c.textBody, fontWeight: '600' }}>{t.applicationDetail.cancelButton}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: c.accent, flex: 1, opacity: rescheduleDate.trim() ? 1 : 0.4 }]}
                onPress={handleReschedule}
                disabled={!rescheduleDate.trim() || isSending}
              >
                {isSending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="send-outline" size={15} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700' }}>{t.applicationDetail.sendRequestButton}</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
    headerSub: { color: c.textMuted, fontSize: 12, marginTop: 1 },
    statusPill: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
    statusPillText: { fontSize: 11, fontWeight: '700' },
    backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg },
    card: { backgroundColor: c.card, marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border },
    sectionLabel: { color: c.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
    sectionTitleText: { color: c.text, fontSize: 14, fontWeight: '700', flex: 1 },
    smallBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
    metaText: { color: c.textDim, fontSize: 12, marginTop: 10 },

    // Timeline
    timeline: { flexDirection: 'row', alignItems: 'flex-start', gap: 0, paddingVertical: 4 },
    timelineStep: { flexDirection: 'row', alignItems: 'center' },
    timelineDot: { marginTop: 2 },
    timelineLabel: { fontSize: 11, marginLeft: 5, maxWidth: 70, textAlign: 'center' },
    timelineLine: { width: 16, height: 2, backgroundColor: c.border2, marginHorizontal: 3 },

    // Offer
    salaryBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
    salaryLabel: { color: '#16A34A', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    salaryAmount: { color: '#14532D', fontSize: 24, fontWeight: '900', marginTop: 2 },
    offerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    offerMeta: { color: c.textBody, fontSize: 13 },
    offerActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    offerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
    offerBtnText: { fontSize: 14, fontWeight: '700' },

    // Interview
    interviewGrid: { gap: 8, marginBottom: 8 },
    interviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    interviewDetail: { color: c.textBody, fontSize: 13, flex: 1 },
    meetingLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8 },
    meetingLinkText: { fontSize: 13, fontWeight: '600', flex: 1 },
    feedbackBox: { backgroundColor: c.input, borderRadius: 10, padding: 12, marginTop: 10 },
    feedbackLabel: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
    feedbackText: { color: c.textBody, fontSize: 13, lineHeight: 20 },
    ratingText: { color: '#D97706', fontSize: 13, fontWeight: '700', marginTop: 6 },
    interviewActions: { gap: 8, marginTop: 12 },
    interviewActionsRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
    actionBtnText: { fontSize: 14, fontWeight: '700' },
    actionBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
    actionBtnOutlineText: { fontSize: 13, fontWeight: '700' },

    // Message Firm button
    messageFirmCard: { backgroundColor: c.card, marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    messageFirmLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    messageFirmIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center' },
    messageFirmTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
    messageFirmSub: { color: c.textMuted, fontSize: 12, marginTop: 2 },

    // Cover letter / body
    bodyText: { color: c.textBody, fontSize: 14, lineHeight: 22 },

    // Documents
    docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: c.border2, paddingHorizontal: 14, marginBottom: 8, backgroundColor: c.input },
    docName: { color: c.textSub, fontSize: 13, fontWeight: '500', flex: 1 },

    // Details table
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
    detailLabel: { color: c.textMuted, fontSize: 13 },
    detailValue: { color: c.textSub, fontSize: 13, fontWeight: '600' },
    viewJobBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
    viewJobText: { fontSize: 13, fontWeight: '600', flex: 1 },

    // Reschedule modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border2, alignSelf: 'center', marginBottom: 4 },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: '800' },
    modalSub: { color: c.textMuted, fontSize: 13, backgroundColor: c.card, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: c.border2 },
    modalFieldLabel: { color: c.textBody, fontSize: 13, fontWeight: '600' },
    modalInput: { backgroundColor: c.input, borderRadius: 12, borderWidth: 1, borderColor: c.border2, paddingHorizontal: 14, paddingVertical: 12, color: c.text, fontSize: 14 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  })
}
