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

const MINT       = '#10B981';
const MINT_DARK  = '#059669';
const MINT_LIGHT = '#D1FAE5';
const MINT_BUBBLE= '#DCFCE7';
const GRAY       = '#6B7280';
const BORDER     = '#E5E7EB';
const TEXT       = '#111827';
const TEXT_MUTED = '#9CA3AF';
const BG         = '#F9FAFB';

const AVATAR_COLORS    = ['#6EE7B7', '#93C5FD', '#FCA5A5', '#FDE68A', '#C4B5FD'];
const AVATAR_TXT_COLORS= ['#065F46', '#1E40AF', '#991B1B', '#92400E', '#4C1D95'];

function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const idx = Math.abs(h) % AVATAR_COLORS.length;
  return { bg: AVATAR_COLORS[idx], text: AVATAR_TXT_COLORS[idx] };
}
function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}
function fmtTime(ts) {
  try { return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}
function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch { return ''; }
}

// ── Mock agenda untuk tampilan referensi ──
const MOCK_AGENDA = {
  id: 'agenda-1',
  judul: 'Morning Run 5K –\nSenayan Loop',
  waktu: 'Sabtu, 06:00 WIB',
  lokasi: 'Gate 5 Plaza Barat',
  peserta: 28,
  privasi: 'Publik',
  sudahIkut: false,
};

export default function GroupChatScreen() {
  const { id, nama, anggota } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [replyTo, setReplyTo]     = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [agenda, setAgenda]       = useState(MOCK_AGENDA);
  const flatRef = useRef(null);
  const lastSeenRef = useRef(0);

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.getMessages(id);
      const msgs = res.messages || [];
      setMessages(msgs);
      if (msgs.length > 0) lastSeenRef.current = msgs[msgs.length - 1].id_message;
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    loadMessages();
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

  // Kelompokkan pesan berdasarkan tanggal
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

  // Jika belum ada pesan, tampilkan mock agar terlihat seperti referensi
  const displayData = grouped.length > 0 ? grouped : [
    { type: 'date', key: 'date-mock', label: 'Sabtu, 24 Mei' },
    { type: 'system', key: 'sys-1', text: 'Budi Santoso bergabung via tautan undangan' },
    {
      type: 'msg', key: 'mock-1',
      id_user: 'admin', nama_lengkap: 'Dimas (Admin)', peran: 'admin',
      pesan: 'Halo teman-teman runners! 🏃\nBesok Sabtu kita ada jadwal lari pagi santai pace 6:30 - 7:00. Jangan lupa bawa tumbler ya!',
      created_at: new Date().toISOString(),
    },
    { type: 'agenda', key: 'agenda-1', data: MOCK_AGENDA },
    {
      type: 'msg', key: 'mock-2',
      id_user: 'siti', nama_lengkap: 'Siti Rahma', peran: 'member',
      pesan: 'Bisa nitip tas di gate 5 gak ya mas?',
      created_at: new Date().toISOString(),
    },
    {
      type: 'msg', key: 'mock-3',
      id_user: 'admin', nama_lengkap: 'Dimas (Admin)', peran: 'admin',
      pesan: 'Bisa, ada mobil marshal standby dari jam 05:30 👋',
      created_at: new Date().toISOString(),
      reply_pesan: 'Bisa nitip tas di gate 5 gak ya mas?',
      reply_nama: 'Siti Rahma',
    },
    {
      type: 'msg', key: 'mock-4',
      id_user: user?.id_user || 'me', nama_lengkap: user?.nama_lengkap || 'Kamu', peran: 'member',
      pesan: 'Siap ikutan! Sampai ketemu besok pagi 🏃🔥',
      created_at: new Date().toISOString(),
    },
  ];

  const renderItem = ({ item }) => {
    // ── Pemisah tanggal ──
    if (item.type === 'date') {
      return (
        <View style={s.dateDivider}>
          <Text style={s.dateLabel}>{item.label}</Text>
        </View>
      );
    }

    // ── Pesan sistem (bergabung dll) ──
    if (item.type === 'system') {
      return (
        <View style={s.systemRow}>
          <Ionicons name="person-add-outline" size={13} color={GRAY} style={{ marginRight: 6 }} />
          <Text style={s.systemText}>{item.text}</Text>
        </View>
      );
    }

    // ── Kartu agenda komunitas ──
    if (item.type === 'agenda') {
      const ag = item.data;
      return (
        <View style={s.agendaCard}>
          <View style={s.agendaHeader}>
            <View style={s.agendaIconBox}>
              <Ionicons name="walk-outline" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.agendaTagLabel}>AGENDA KOMUNITAS</Text>
              <View style={s.agendaPrivasiRow}>
                <Text style={s.agendaPrivasi}>{ag.privasi}</Text>
              </View>
            </View>
          </View>
          <Text style={s.agendaJudul}>{ag.judul}</Text>
          <View style={s.agendaMetaRow}>
            <Ionicons name="calendar-outline" size={13} color={GRAY} />
            <Text style={s.agendaMetaText}>{ag.waktu}</Text>
            <Ionicons name="location-outline" size={13} color={GRAY} style={{ marginLeft: 12 }} />
            <Text style={s.agendaMetaText}>{ag.lokasi}</Text>
          </View>
          <View style={s.agendaPesertaRow}>
            {/* Avatar stack dummy */}
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[s.miniAvatar, { marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i }]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
            ))}
            <Text style={s.agendaPesertaText}>{ag.peserta} orang bergabung</Text>
          </View>
          <Pressable
            style={[s.agendaBtn, ag.sudahIkut && s.agendaBtnJoined]}
            onPress={() => setAgenda((prev) => ({ ...prev, sudahIkut: !prev.sudahIkut }))}
          >
            <Ionicons name={ag.sudahIkut ? 'checkmark' : 'checkmark'} size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={s.agendaBtnText}>
              {ag.sudahIkut ? 'Sudah Ikut ✓' : `✓ Ikut Lari (+1)`}
            </Text>
          </Pressable>
        </View>
      );
    }

    // ── Pesan biasa ──
    const isMe = item.id_user === user?.id_user || item.id_user === 'me';
    const avCol = avatarColor(item.nama_lengkap);

    return (
      <Pressable onLongPress={() => setReplyTo(item)}>
        <View style={[s.msgRow, isMe && s.msgRowMe]}>
          {!isMe && (
            <View style={[s.avatar, { backgroundColor: avCol.bg }]}>
              <Text style={[s.avatarText, { color: avCol.text }]}>{initials(item.nama_lengkap)}</Text>
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
            {item.reply_pesan && (
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

  const avBar = avatarColor(nama || 'G');

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* ── App Bar ── */}
      <View style={s.appBar}>
        <Pressable onPress={() => router.back()} style={s.appBarBack}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </Pressable>
        <View style={[s.appBarAvatar, { backgroundColor: avBar.bg }]}>
          <Text style={[s.appBarAvatarText, { color: avBar.text }]}>{initials(nama || 'Grup')}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.appBarName} numberOfLines={1}>{nama || 'Grup'}</Text>
          <Text style={s.appBarSub}>{anggota || '—'} anggota</Text>
        </View>
        <Pressable style={s.appBarAction}><Ionicons name="search-outline" size={20} color={GRAY} /></Pressable>
        <Pressable style={s.appBarAction}><Ionicons name="call-outline" size={20} color={GRAY} /></Pressable>
        <Pressable style={s.appBarAction}><Ionicons name="ellipsis-vertical" size={20} color={GRAY} /></Pressable>
        <View style={[s.appBarRightAvatar, { backgroundColor: MINT }]}>
          <Ionicons name="person" size={16} color="#FFF" />
        </View>
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
            data={displayData}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            contentContainerStyle={s.msgList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* ── Reply preview ── */}
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

        {/* ── Input bar ── */}
        <View style={s.inputBar}>
          <Pressable style={s.addBtn}>
            <Ionicons name="add" size={22} color={GRAY} />
          </Pressable>
          <View style={s.inputWrap}>
            <Pressable style={{ marginRight: 4 }}>
              <Ionicons name="happy-outline" size={20} color={GRAY} />
            </Pressable>
            <TextInput
              style={s.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Kirim pesan..."
              placeholderTextColor={TEXT_MUTED}
              multiline
            />
          </View>
          {text.trim() ? (
            <Pressable
              style={[s.sendBtn, sending && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending
                ? <ActivityIndicator size={16} color="#FFF" />
                : <Ionicons name="send" size={18} color="#FFF" />}
            </Pressable>
          ) : (
            <Pressable style={s.sendBtn}>
              <Ionicons name="mic-outline" size={20} color="#FFF" />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── FAB scroll down ── */}
      {unreadCount > 0 && (
        <Pressable style={s.fab} onPress={scrollToBottom}>
          <Ionicons name="chevron-down" size={20} color="#FFF" />
          <View style={s.fabBadge}>
            <Text style={s.fabBadgeText}>{unreadCount}</Text>
          </View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* ── App bar ── */
  appBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  appBarBack: { padding: 4, marginRight: 2 },
  appBarAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  appBarAvatarText: { fontSize: 13, fontWeight: 'bold' },
  appBarName: { fontSize: 15, fontWeight: '700', color: TEXT },
  appBarSub: { fontSize: 11, color: TEXT_MUTED },
  appBarAction: { padding: 7 },
  appBarRightAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginLeft: 2,
  },

  /* ── List pesan ── */
  msgList: { paddingHorizontal: 12, paddingVertical: 10, paddingBottom: 20 },

  /* ── Pemisah tanggal ── */
  dateDivider: { alignItems: 'center', marginVertical: 14 },
  dateLabel: {
    fontSize: 12, color: TEXT_MUTED,
    backgroundColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: 999,
  },

  /* ── Pesan sistem ── */
  systemRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginVertical: 6,
  },
  systemText: { fontSize: 12, color: TEXT_MUTED, fontStyle: 'italic' },

  /* ── Kartu agenda ── */
  agendaCard: {
    backgroundColor: '#FFF', borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    padding: 14, marginVertical: 8, marginHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  agendaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  agendaIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: MINT, alignItems: 'center', justifyContent: 'center',
  },
  agendaTagLabel: { fontSize: 10, fontWeight: '700', color: MINT_DARK, letterSpacing: 0.5 },
  agendaPrivasiRow: { marginTop: 2 },
  agendaPrivasi: {
    fontSize: 11, color: '#FFF', backgroundColor: MINT_DARK,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  agendaJudul: { fontSize: 17, fontWeight: 'bold', color: TEXT, marginBottom: 8, lineHeight: 22 },
  agendaMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  agendaMetaText: { fontSize: 12, color: GRAY, marginLeft: 4 },
  agendaPesertaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  miniAvatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: MINT_DARK, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFF',
  },
  agendaPesertaText: { fontSize: 12, color: GRAY, marginLeft: 10 },
  agendaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: MINT, borderRadius: 12, height: 44,
  },
  agendaBtnJoined: { backgroundColor: MINT_DARK },
  agendaBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  /* ── Baris pesan ── */
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  msgRowMe: { justifyContent: 'flex-end' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, alignSelf: 'flex-end',
  },
  avatarText: { fontSize: 11, fontWeight: 'bold' },

  bubble: {
    maxWidth: '75%', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  bubbleThem: { backgroundColor: '#FFF', borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: MINT_BUBBLE, borderBottomRightRadius: 4 },

  senderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  senderName: { fontSize: 12, fontWeight: '700', color: MINT },
  hostBadge: {
    backgroundColor: MINT_DARK, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6,
  },
  hostText: { fontSize: 9, fontWeight: 'bold', color: '#FFF' },

  replyBox: {
    backgroundColor: '#F3F4F6', borderLeftWidth: 3, borderLeftColor: MINT,
    borderRadius: 6, padding: 6, marginBottom: 6,
  },
  replyName: { fontSize: 11, fontWeight: '700', color: MINT },
  replyText: { fontSize: 12, color: GRAY },

  msgText: { fontSize: 14, color: TEXT, lineHeight: 20 },
  msgTextMe: { color: '#065F46' },
  msgTime: { fontSize: 10, color: TEXT_MUTED, marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMe: { color: '#6EE7B7' },

  /* ── Reply preview bar ── */
  replyPreview: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: MINT_LIGHT, paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  replyPreviewName: { fontSize: 12, fontWeight: '700', color: MINT },
  replyPreviewText: { fontSize: 12, color: GRAY },

  /* ── Input bar ── */
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderRadius: 24,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 12, paddingVertical: 8,
    minHeight: 40, maxHeight: 100,
  },
  textInput: { flex: 1, fontSize: 14, color: TEXT, maxHeight: 80 },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: MINT, alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },

  /* ── FAB ── */
  fab: {
    position: 'absolute', bottom: 80, right: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: MINT, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  fabBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#EF4444', borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1,
  },
  fabBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFF' },
});
