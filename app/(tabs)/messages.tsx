'use client';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, BackHandler, FlatList, Image, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import {
  useInboxThreads, useThreadMessages, useSendMessage,
  type InboxThread,
} from '@/hooks/useInbox';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
}

interface ActiveConvo {
  applicationId: string;
  firmName: string;
  firmLogo: string | null;
  postTitle: string;
}

export default function InboxTab() {
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [active, setActive] = useState<ActiveConvo | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const { applicationId: paramAppId, firmName: paramFirm, postTitle: paramPost } =
    useLocalSearchParams<{ applicationId?: string; firmName?: string; postTitle?: string }>();

  const { data: threads = [], isLoading, refetch, isRefetching } = useInboxThreads();
  const { data: msgData, isLoading: msgsLoading } = useThreadMessages(active?.applicationId ?? null);
  const messages = msgData?.messages ?? [];
  const { mutate: send, isPending: sending } = useSendMessage();

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0);

  // Open a thread from the thread list
  const openThread = (thread: InboxThread) => {
    setActive({
      applicationId: thread.applicationId,
      firmName: thread.firm.name,
      firmLogo: thread.firm.logo,
      postTitle: thread.postTitle,
    });
  };

  // Close thread → go back to thread list
  const closeThread = () => {
    setActive(null);
    setNewMsg('');
  };

  // Hardware back button: close thread if open, otherwise default behavior
  useEffect(() => {
    if (!active) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeThread();
      return true;
    });
    return () => sub.remove();
  }, [active]);

  // Auto-open when navigated here from application detail with params
  useEffect(() => {
    if (!paramAppId || active || isLoading) return;
    const match = threads.find((t) => t.applicationId === paramAppId);
    if (match) {
      openThread(match);
    } else if (paramAppId) {
      // No thread yet — open a new conversation view
      setActive({
        applicationId: paramAppId,
        firmName: paramFirm ?? 'Firm',
        firmLogo: null,
        postTitle: paramPost ?? '',
      });
    }
  }, [paramAppId, threads, isLoading]);

  // After first message sent, thread appears in inbox — update header with firm logo
  useEffect(() => {
    if (!active) return;
    const match = threads.find((t) => t.applicationId === active.applicationId);
    if (match && !active.firmLogo && match.firm.logo) {
      setActive((a) => a ? { ...a, firmLogo: match.firm.logo } : a);
    }
  }, [threads]);

  const handleSend = () => {
    if (!newMsg.trim() || !active) return;
    const body = newMsg.trim();
    setNewMsg('');
    send({ applicationId: active.applicationId, body }, {
      onSuccess: () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150),
    });
  };

  /* ── Thread / Conversation view ─────────────────────────────────── */
  if (active) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.threadHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={closeThread}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={c.text} />
            </TouchableOpacity>
            <View style={styles.threadFirmAvatar}>
              {active.firmLogo
                ? <Image source={{ uri: active.firmLogo }} style={StyleSheet.absoluteFill} />
                : <Text style={styles.threadFirmInitial}>{active.firmName?.charAt(0)?.toUpperCase() ?? '?'}</Text>}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.threadFirmName} numberOfLines={1}>{active.firmName}</Text>
              <Text style={styles.threadPostTitle} numberOfLines={1}>{active.postTitle}</Text>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {msgsLoading ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <ActivityIndicator color={c.accent} />
              </View>
            ) : messages.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60, gap: 10 }}>
                <Ionicons name="chatbubble-outline" size={44} color={c.border3} />
                <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: '600' }}>No messages yet</Text>
                <Text style={{ color: c.textDim, fontSize: 12, textAlign: 'center', paddingHorizontal: 32 }}>
                  Start the conversation with {active.firmName}
                </Text>
              </View>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender.id === user?.id;
                return (
                  <View key={msg.id} style={[styles.msgRow, isMe && styles.msgRowMe]}>
                    <View style={[styles.msgAvatar, isMe ? styles.msgAvatarMe : styles.msgAvatarThem]}>
                      {msg.sender.profile_image
                        ? <Image source={{ uri: msg.sender.profile_image }} style={StyleSheet.absoluteFill} />
                        : <Text style={{ color: isMe ? c.accent : '#7986CB', fontSize: 12, fontWeight: '700' }}>
                            {msg.sender.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </Text>}
                    </View>
                    <View style={[styles.msgBubbleWrap, isMe && { alignItems: 'flex-end' }]}>
                      <Text style={[styles.msgSender, isMe && { textAlign: 'right', color: c.textMuted }]}>
                        {isMe ? 'You' : msg.sender.name}
                      </Text>
                      <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
                        <Text style={[styles.msgText, isMe && { color: '#fff' }]}>{msg.body}</Text>
                      </View>
                      <Text style={[styles.msgTime, isMe && { textAlign: 'right' }]}>
                        {timeAgo(msg.createdAt)}
                        {msg.readAt && isMe ? <Text style={{ color: c.accent }}> · Read</Text> : null}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={newMsg}
              onChangeText={setNewMsg}
              placeholder={`Message ${active.firmName}…`}
              placeholderTextColor={c.textMuted}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!newMsg.trim() || sending) && { opacity: 0.45 }]}
              onPress={handleSend}
              disabled={!newMsg.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  /* ── Thread list ─────────────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        {totalUnread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : threads.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="chatbubbles-outline" size={52} color={c.border3} />
          <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: '600' }}>No messages yet</Text>
          <Text style={{ color: c.textDim, fontSize: 13, textAlign: 'center' }}>
            Once a recruiter contacts you about your application, conversations will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(t) => t.threadId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.threadItem}
              onPress={() => openThread(item)}
              activeOpacity={0.75}
            >
              <View style={styles.firmLogoWrap}>
                {item.firm.logo
                  ? <Image source={{ uri: item.firm.logo }} style={StyleSheet.absoluteFill} />
                  : <Text style={styles.firmLogoInitial}>{item.firm.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text
                    style={[styles.threadFirmLabel, item.unreadCount > 0 && { color: c.text, fontWeight: '700' }]}
                    numberOfLines={1}
                  >
                    {item.firm.name}
                  </Text>
                  {item.lastMessage && (
                    <Text style={styles.threadTime}>{timeAgo(item.lastMessage.createdAt)}</Text>
                  )}
                </View>
                <Text style={styles.threadPost} numberOfLines={1}>{item.postTitle}</Text>
                {item.lastMessage && (
                  <Text
                    style={[styles.threadPreview, item.unreadCount > 0 && { color: c.textSub, fontWeight: '600' }]}
                    numberOfLines={1}
                  >
                    {item.lastMessage.senderId === user?.id ? 'You: ' : ''}{item.lastMessage.body}
                  </Text>
                )}
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.unreadDot}>
                  <Text style={styles.unreadDotText}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },

    /* thread list */
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { color: c.text, fontSize: 22, fontWeight: '800', flex: 1 },
    unreadBadge: { backgroundColor: c.accent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    unreadBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    threadItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border },
    firmLogoWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
    firmLogoInitial: { color: c.accent, fontSize: 18, fontWeight: '800' },
    threadFirmLabel: { color: c.textBody, fontSize: 14, fontWeight: '600', flex: 1 },
    threadPost: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    threadPreview: { color: c.textMuted, fontSize: 13, marginTop: 3 },
    threadTime: { color: c.textDim, fontSize: 11, flexShrink: 0 },
    unreadDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    unreadDotText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    /* thread view */
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    threadHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.card },
    threadFirmAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
    threadFirmInitial: { color: c.accent, fontSize: 16, fontWeight: '700' },
    threadFirmName: { color: c.text, fontSize: 15, fontWeight: '700' },
    threadPostTitle: { color: c.textMuted, fontSize: 12 },

    /* messages */
    msgList: { padding: 16, gap: 16 },
    msgRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
    msgRowMe: { flexDirection: 'row-reverse' },
    msgAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, borderWidth: 1, borderColor: c.border2 },
    msgAvatarMe: { backgroundColor: c.accentBg },
    msgAvatarThem: { backgroundColor: '#7986CB18' },
    msgBubbleWrap: { flex: 1, maxWidth: '80%', gap: 3 },
    msgSender: { color: '#7986CB', fontSize: 11, fontWeight: '700', paddingHorizontal: 2 },
    msgBubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
    msgBubbleMe: { backgroundColor: c.accent, borderBottomRightRadius: 4 },
    msgBubbleThem: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderBottomLeftRadius: 4 },
    msgText: { color: c.text, fontSize: 14, lineHeight: 20 },
    msgTime: { color: c.textDim, fontSize: 10, paddingHorizontal: 2 },

    /* input */
    inputRow: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.card, alignItems: 'flex-end' },
    input: { flex: 1, backgroundColor: c.input, borderWidth: 1, borderColor: c.border2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: c.text, fontSize: 14, maxHeight: 120 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  });
}
