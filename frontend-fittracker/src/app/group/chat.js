import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

const MINT = '#10B981';
const MINT_LIGHT = '#D1FAE5';
const MINT_BUBBLE = '#DCFCE7';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';
const TEXT = '#111827';
const TEXT_MUTED = '#6B7280';
const BG = '#F9FAFB';

const AVATAR_COLORS = ['#6EE7B7', '#93C5FD', '#FCA5A5', '#FDE68A', '#C4B5FD'];
function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}
function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return '';
  }
}

export default function GroupChatScreen() {
  const { id, nama } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const flatRef = useRef(null);
  const lastSeenRef = useRef(0);

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.getMessages(id);
      const msgs = res.messages || [];
      setMessages(msgs);
      if (msgs.length > 0) lastSeenRef.current = msgs[msgs.length - 1].id_message;
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMessages();
    // Poll setiap 5 detik
    const timer = setInterval(async () => {
      try {
        const res = await api.getMessages(id);
        const msgs = res.messages || [];
        setMessages((prev) => {
          const newMsgs = msgs.filter((m) => m.id_message > lastSeenRef.current);
          if (newMsgs.length > 0) setUnreadCount((c) => c + newMsgs.length);
          return msgs;
        });
      } catch { /* offline */ }
    }, 5000);
    return () => clearInterval(timer);
  }, [loadMessages, id]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    const payload = { pesan: trimmed };
    if (replyTo) payload.reply_to = replyTo.id_message;
    setText('');
    setReplyTo(null);
    try {
      await api.sendMessage(id, payload);
      await loadMessages();
      flatRef.current?.scrollToEnd({ animated: true });
      setUnreadCount(0);
    } catch { /* offline */ }
    finally { setSending(false); }
  }

  function scrollToBottom() {
    flatRef.current?.scrollToEnd({ animated: true });
    setUnreadCount(0);
    if (messages.length > 0) lastSeenRef.current = messages[messages.length - 1].id_message;
  }

  // Group messages by date
  const grouped = [];
  let lastDate = '';
  messages.forEach((m) => {
    const d = new Date(m.created_at).toDateString();
    if (d !== lastDate) {
      grouped.push({ type: 'date', key: `date-${d}`, label: fmtDate(m.created_at) });
      lastDate = d;
    }
    grouped.push({ ...m, type: 'msg', key: String(m.id_message) });
  });

  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <View style={s.dateDivider}>
          <Text style={s.dateLabel}>{item.label}</Text>
        </View>
      );
    }

    const isMe = item.id_user === user?.id_user;
    const ini = initials(item.nama_lengkap);
    const avColor = avatarColor(item.nama_lengkap);

    return (
      <Pressable onLongPress={() => setReplyTo(item)}>
        <View style={[s.msgRow, isMe && s.msgRowMe]}>
          {!isMe && (
            <View style={[s.avatar, { backgroundColor: avColor }]}>
              <Text style={s.avatarText}>{ini}</Text>
            </View>
          )}
          <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
            {!isMe && (
              <View style={s.senderRow}>
                <Text style={s.senderName}>{item.nama_lengkap}</Text>
                {item.peran === 'admin' && (
                  <View style={s.hostBadge}><Text style={s.hostText}>HOST</Text></View>
                )}
              </View>
            )}
            {item.reply_to && (
              <View style={s.replyBox}>
                <Text style={s.replyName}>{item.reply_nama}</Text>
                <Text style={s.replyText} numberOfLines={1}>{item.reply_pesan}</Text>
              </View>
            )}
            <Text style={[s.msgText, isMe && s.msgTextMe]}>{item.pesan}</Text>
            <Text style={[s.msgTime, isMe && s.msgTimeMe]}>{fmtTime(item.created_at)}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* App Bar */}
      <View style={s.appBar}>
        <Pressable onPress={() => router.back()} style={s.appBarBack}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </Pressable>
        <View style={[s.appBarAvatar, { backgroundColor: avatarColor(nama || 'G') }]}>
          <Text style={s.appBarAvatarText}>{initials(nama || 'Grup')}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.appBarName} numberOfLines={1}>{nama || 'Grup'}</Text>
          <Text style={s.appBarSub}>anggota grup</Text>
        </View>
        <Pressable style={s.appBarAction}><Ionicons name="search-outline" size={20} color={GRAY} /></Pressable>
        <Pressable style={s.appBarAction}><Ionicons name="ellipsis-vertical" size={20} color={GRAY} /></Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={MINT} />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={grouped}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            contentContainerStyle={s.msgList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <Ionicons name="chatbubbles-outline" size={48} color={BORDER} />
                <Text style={{ color: TEXT_MUTED, marginTop: 12 }}>Belum ada pesan. Mulai obrolan!</Text>
              </View>
            }
          />
        )}

        {/* Reply preview */}
        {replyTo && (
          <View style={s.replyPreview}>
            <Ionicons name="return-down-forward-outline" size={16} color={MINT} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={s.replyPreviewName}>{replyTo.nama_lengkap}</Text>
              <Text style={s.replyPreviewText} numberOfLines={1}>{replyTo.pesan}</Text>
            </View>
            <Pressable onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={18} color={GRAY} />
            </Pressable>
          </View>
        )}

        {/* Input bar */}
        <View style={s.inputBar}>
          <Pressable style={s.addBtn}><Ionicons name="add" size={22} color={GRAY} /></Pressable>
          <View style={s.inputWrap}>
            <Ionicons name="happy-outline" size={20} color={GRAY} style={{ marginRight: 6 }} />
            <TextInput
              style={s.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Kirim pesan..."
              placeholderTextColor={TEXT_MUTED}
              multiline
            />
          </View>
          <Pressable
            style={[s.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size={16} color="#FFF" />
              : <Ionicons name="send" size={18} color="#FFF" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* FAB scroll down */}
      {unreadCount > 0 && (
        <Pressable style={s.fab} onPress={scrollToBottom}>
          <Ionicons name="chevron-down" size={20} color="#FFF" />
          <View style={s.fabBadge}><Text style={s.fabBadgeText}>{unreadCount}</Text></View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  appBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  appBarBack: { padding: 4, marginRight: 4 },
  appBarAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  appBarAvatarText: { fontSize: 13, fontWeight: 'bold', color: '#065F46' },
  appBarName: { fontSize: 15, fontWeight: '700', color: TEXT },
  appBarSub: { fontSize: 11, color: TEXT_MUTED },
  appBarAction: { padding: 8 },

  msgList: { paddingHorizontal: 12, paddingVertical: 12 },

  dateDivider: { alignItems: 'center', marginVertical: 12 },
  dateLabel: { fontSize: 12, color: TEXT_MUTED, backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  msgRowMe: { justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8, alignSelf: 'flex-end' },
  avatarText: { fontSize: 11, fontWeight: 'bold', color: '#065F46' },

  bubble: {
    maxWidth: '75%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  bubbleThem: { backgroundColor: '#FFF', borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: MINT_BUBBLE, borderBottomRightRadius: 4 },

  senderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  senderName: { fontSize: 12, fontWeight: '700', color: MINT },
  hostBadge: { backgroundColor: MINT, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6 },
  hostText: { fontSize: 9, fontWeight: 'bold', color: '#FFF' },

  replyBox: { backgroundColor: '#F3F4F6', borderLeftWidth: 3, borderLeftColor: MINT, borderRadius: 6, padding: 6, marginBottom: 6 },
  replyName: { fontSize: 11, fontWeight: '700', color: MINT },
  replyText: { fontSize: 12, color: GRAY },

  msgText: { fontSize: 14, color: TEXT, lineHeight: 20 },
  msgTextMe: { color: '#065F46' },
  msgTime: { fontSize: 10, color: TEXT_MUTED, marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMe: { color: '#6EE7B7' },

  replyPreview: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: MINT_LIGHT, paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  replyPreviewName: { fontSize: 12, fontWeight: '700', color: MINT },
  replyPreviewText: { fontSize: 12, color: GRAY },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER, marginRight: 8,
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderRadius: 24, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 12, paddingVertical: 8, minHeight: 40, maxHeight: 100,
  },
  textInput: { flex: 1, fontSize: 14, color: TEXT, maxHeight: 80 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: MINT, alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },

  fab: {
    position: 'absolute', bottom: 80, right: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: MINT, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  fabBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#EF4444', borderRadius: 999,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  fabBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFF' },
});
