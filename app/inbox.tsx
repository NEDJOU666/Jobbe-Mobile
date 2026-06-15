import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import {
  useInboxThreads, useThreadMessages, useSendMessage, useMarkThreadRead,
  type InboxThread,
} from '@/hooks/useInbox';

export default function InboxScreen() {
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [selected, setSelected] = useState<InboxThread | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const { data: threads = [], isLoading, refetch, isRefetching } = useInboxThreads();
  const { data: messages = [], isLoading: msgsLoading } = useThreadMessages(selected?.threadId ?? null);
  const { mutate: send, isPending: sending } = useSendMessage();
  const { mutate: markRead } = useMarkThreadRead();

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0);

  const openThread = (thread: InboxThread) => {
    setSelected(thread);
    if (thread.unreadCount > 0) markRead(thread.threadId);
  };

  const handleSend = () => {
    if (!newMsg.trim() || !selected) return;
    const body = newMsg.trim();
    setNewMsg('');
    send({ threadId: selected.threadId, body }, {
      onSuccess: () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100),
    });
  };

  if (selected) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          {/* Thread header */}
          <View style={styles.threadHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={22} color={c.text} />
            </TouchableOpacity>
            <View style={styles.threadFirmAvatar}>
              {selected.firm.logo
                ? <Image source={{ uri: selected.firm.logo }} style={StyleSheet.absoluteFill} />
                : <Text style={styles.threadFirmInitial}>{selected.firm.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.threadFirmName} numberOfLines={1}>{selected.firm.name}</Text>
              <Text style={styles.threadPostTitle} numberOfLines={1}>{selected.postTitle}</Text>
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
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                <ActivityIndicator color={c.accent} />
              </View>
            ) : messages.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60, gap: 8 }}>
                <Ionicons name="chatbubble-outline" size={40} color={c.border3} />
                <Text style={{ color: c.textMuted, fontSize: 14 }}>No messages yet. Say hello!</Text>
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
                        {msg.readAt && isMe && <Text style={{ color: c.accent }}> · Read</Text>}
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
              placeholder="Type a message..."
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>
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
            <TouchableOpacity style={styles.threadItem} onPress={() => openThread(item)} activeOpacity={0.75}>
              <View style={styles.firmLogoWrap}>
                {item.firm.logo
                  ? <Image source={{ uri: item.firm.logo }} style={StyleSheet.absoluteFill} />
                  : <Text style={styles.firmLogoInitial}>{item.firm.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.threadFirmLabel, item.unreadCount > 0 && { color: c.text }]} numberOfLines={1}>
                    {item.firm.name}
                  </Text>
                  {item.lastMessage && (
                    <Text style={styles.threadTime}>
                      {timeAgo(item.lastMessage.createdAt)}
                    </Text>
                  )}
                </View>
                <Text style={styles.threadPost} numberOfLines={1}>{item.postTitle}</Text>
                {item.lastMessage && (
                  <Text style={[styles.threadPreview, item.unreadCount > 0 && { color: c.textSub, fontWeight: '600' }]} numberOfLines={1}>
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
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    title: { color: c.text, fontSize: 20, fontWeight: '800', flex: 1 },
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

    threadHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.card },
    threadFirmAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
    threadFirmInitial: { color: c.accent, fontSize: 16, fontWeight: '700' },
    threadFirmName: { color: c.text, fontSize: 15, fontWeight: '700' },
    threadPostTitle: { color: c.textMuted, fontSize: 12 },

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

    inputRow: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.card, alignItems: 'flex-end' },
    input: { flex: 1, backgroundColor: c.input, borderWidth: 1, borderColor: c.border2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: c.text, fontSize: 14, maxHeight: 120 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  });
}
