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

const AVATAR_COLORS     = ['#6EE7B7', '#93C5FD', '#FCA5A5', '#FDE68A', '#C4B5FD'];
const AVATAR_TXT_COLORS = ['#065F46', '#1E40AF', '#991B1B', '#92400E', '#4C1D95'];

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
  try { return new Date(ts).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }); }
  catch { return ''; }
}
function nowIso() { return new Date().toISOString(); }

const MOCK_AGENDA = {
  id: 'agenda-1',
  judul: 'Morning Run 5K –\nSenayan Loop',
  waktu: 'Sabtu, 06:00 WIB',
  lokasi: 'Gate 5 Plaza Barat',
  peserta: 28,
  privasi: 'Publik',
  sudahIkut: false,
};

// ── Mock awal (mutable via state) ────────────────────────────────────────────
function buildMockMessages(userId, userName) {
  return [
    { type: 'date',   key: 'date-mock',   label: 'Sabtu, 24 Mei' },
    { type: 'system', key: 'sys-1',       text: 'Budi Santoso bergabung via tautan undangan' },
    {
      type: 'msg', key: 'mock-1',
      id_user: 'admin', nama_lengkap: 'Dimas (Admin)', peran: 'admin',
      pesan: 'Halo teman-teman runners! 🏃\nBesok Sabtu kita ada jadwal lari pagi santai pace 6:30 - 7:00. Jangan lupa bawa tumbler ya!',
      created_at: nowIso(),
    },
    { type: 'agenda', key: 'agenda-1', data: { ...MOCK_AGENDA } },
    {
      type: 'msg', key: 'mock-2',
      id_user: 'siti', nama_lengkap: 'Siti Rahma', peran: 'member',
      pesan: 'Bisa nitip tas di gate 5 gak ya mas?',
      created_at: nowIso(),
    },
    {
      type: 'msg', key: 'mock-3',
      id_user: 'admin', nama_lengkap: 'Dimas (Admin)', peran: 'admin',
      pesan: 'Bisa, ada mobil marshal standby dari jam 05:30 👋',
      created_at: nowIso(),
      reply_pesan: 'Bisa nitip tas di gate 5 gak ya mas?',
      reply_nama: 'Siti Rahma',
    },
    {
      type: 'msg', key: 'mock-4',
      id_user: userId || 'me', nama_lengkap: userName || 'Kamu', peran: 'member',
      pesan: 'Siap ikutan! Sampai ketemu besok pagi 🏃🔥',
      created_at: nowIso(),
    },
  ];
}

export default function GroupChatScreen() {
  const { id, nama, anggota } = useLocalSearchParams();
  const { user } = useAuth();

  // ── State ─────────────────────────────────────────────────────────────────
  // displayData menyimpan semua item (mock + pesan baru dari API atau lokal)
  const [displayData, setDisplayData] = useState(() =>
    buildMockMessages(user?.id_user, user?.nama_lengkap)
  );
  const [loading,     setLoading]     = useState(true);
  const [text,        setText]        = useState('');
  const [sending,     setSending]     = useState(false);
  const [replyTo,     setReplyTo]     = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [agenda,      setAgenda]      = useState(MOCK_AGENDA);

  const flatRef      = useRef(null);
  const lastSeenRef  = useRef(0);
  const inputRef     = useRef(null);

  // ── Transformasi pesan API → format display ───────────────────────────────
  function msgToDisplay(msgs) {
    const items = [];
    let lastDate = '';
    msgs.forEach((m) => {
      const d = new Date(m.created_at).toDateString();
      if (d !== lastDate) {
        items.push({ type: 'date', key: `date-${d}`, label: fmtDate(m.created_at) });
        lastDate = d;
      }
      items.push({ ...m, type: 'msg', key: String(m.id_message) });
    });
    return items;
  }

  // ── Load pesan dari API ───────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try {
      const res  = await api.getMessages(id);
      const msgs = res.messages || [];
      if (msgs.length > 0) {
        setDisplayData(msgToDisplay(msgs));
        lastSeenRef.current = msgs[msgs.length - 1].id_message;
      }
      // jika kosong, biarkan mock tetap tampil
    } catch { /* offline — tampilkan mock */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    loadMessages();
    const timer = setInterval(async () => {
      try {
        const res  = await api.getMessages(id);
        const msgs = res.messages || [];
        if (msgs.length > 0) {
          const newMsgs = msgs.filter((m) => m.id_message > lastSeenRef.current);
          if (newMsgs.length > 0) {
            setUnreadCount((c) => c + newMsgs.length);
            setDisplayData(msgToDisplay(msgs));
            lastSeenRef.current = msgs[msgs.length - 1].id_message;
          }
        }
      } catch { /* offline */ }
    }, 5000);
    return () => clearInterval(timer);
  }, [loadMessages, id]);

  // ── Scroll ke bawah setelah data berubah ─────────────────────────────────
  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [displayData]);

  // ── Kirim pesan ───────────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // Kosongkan input & tutup reply segera (UX responsif)
    setText('');
    const sentReplyTo = replyTo;
    setReplyTo(null);
    setSending(true);

    // Tambah bubble optimistik ke state lokal
    const tempKey  = `local-${Date.now()}`;
    const tempMsg  = {
      type:        'msg',
      key:         tempKey,
      id_user:     user?.id_user || 'me',
      nama_lengkap:user?.nama_lengkap || 'Kamu',
      peran:       'member',
      pesan:       trimmed,
      created_at:  new Date().toISOString(),
      ...(sentReplyTo ? {
        reply_pesan: sentReplyTo.pesan,
        reply_nama:  sentReplyTo.nama_lengkap,
      } : {}),
    };
    setDisplayData((prev) => [...prev, tempMsg]);

    // Kirim ke backend
    try {
      const payload = { pesan: trimmed };
      if (sentReplyTo?.id_message) payload.reply_to = sentReplyTo.id_message;
      await api.sendMessage(id, payload);
      // Refresh dari backend untuk sinkronisasi id_message resmi
      const res  = await api.getMessages(id);
      const msgs = res.messages || [];
      if (msgs.length > 0) {
        setDisplayData(msgToDisplay(msgs));
        lastSeenRef.current = msgs[msgs.length - 1].id_message;
      }
    } catch {
      // Offline — bubble optimistik tetap tampil, pesan tersimpan di state
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    flatRef.current?.scrollToEnd({ animated: true });
    setUnreadCount(0);
  }

  // ── Render item ───────────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <View style={s.dateDivider}>
          <Text style={s.dateLabel}>{item.label}</Text>
        </View>
      );
    }

    if (item.type === 'system') {
      return (
        <View style={s.systemRow}>
          <Ionicons name="person-add-outline" size={13} color={GRAY} style={{ marginRight: 6 }} />
          <Text style={s.systemText}>{item.text}</Text>
        </View>
      );
    }

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
              <Text style={s.agendaPrivasi}>{ag.privasi}</Text>
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
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[s.miniAvatar, { marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i }]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
            ))}
            <Text style={s.agendaPesertaText}>{ag.peserta} orang bergabung</Text>
          </View>
          <Pressable
            style={[s.agendaBtn, ag.sudahIkut && s.agendaBtnJoined]}
            onPress={() => setAgenda((prev) => {
              const updated = { ...prev, sudahIkut: !prev.sudahIkut };
              // Sinkronkan ke displayData
              setDisplayData((d) => d.map((x) =>
                x.type === 'agenda' ? { ...x, data: updated } : x
              ));
              return updated;
            })}
          >
            <Ionicons name="checkmark" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={s.agendaBtnText}>
              {ag.sudahIkut ? 'Sudah Ikut ✓' : '✓ Ikut Lari (+1)'}
            </Text>
          </Pressable>
        </View>
      );
    }

    // Pesan biasa
    const isMe  = item.id_user === user?.id_user || item.id_user === 'me';
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
  const hasText = text.trim().length > 0;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* App Bar */}
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
        <Pressable style={s.appBarAction}><Ionicons name="search-outline"       size={20} color={GRAY} /></Pressable>
        <Pressable style={s.appBarAction}><Ionicons name="call-outline"         size={20} color={GRAY} /></Pressable>
        <Pressable style={s.appBarAction}><Ionicons name="ellipsis-vertical"    size={20} color={GRAY} /></Pressable>
        <View style={[s.appBarRightAvatar, { backgroundColor: MINT }]}>
          <Ionicons name="person" size={16} color="#FFF" />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
            onContentSizeChange={() =>
              flatRef.current?.scrollToEnd({ animated: false })
            }
            keyboardShouldPersistTaps="handled"
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
          <Pressable style={s.addBtn}>
            <Ionicons name="add" size={22} color={GRAY} />
          </Pressable>
          <View style={s.inputWrap}>
            <Ionicons name="happy-outline" size={20} color={GRAY} style={{ marginRight: 6 }} />
            <TextInput
              ref={inputRef}
              style={s.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Kirim pesan..."
              placeholderTextColor={TEXT_MUTED}
              multiline
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
            />
          </View>
          <Pressable
            style={[s.sendBtn, (!hasText || sending) && s.sendBtnMuted]}
            onPress={hasText ? handleSend : undefined}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size={16} color="#FFF" />
            ) : hasText ? (
              <Ionicons name="send" size={18} color="#FFF" />
            ) : (
              <Ionicons name="mic-outline" size={20} color="#FFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* FAB scroll down */}
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

  appBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  appBarBack:        { padding: 4, marginRight: 2 },
  appBarAvatar:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  appBarAvatarText:  { fontSize: 13, fontWeight: 'bold' },
  appBarName:        { fontSize: 15, fontWeight: '700', color: TEXT },
  appBarSub:         { fontSize: 11, color: TEXT_MUTED },
  appBarAction:      { padding: 7 },
  appBarRightAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },

  msgList: { paddingHorizontal: 12, paddingVertical: 10, paddingBottom: 20 },

  dateDivider: { alignItems: 'center', marginVertical: 14 },
  dateLabel: {
    fontSize: 12, color: TEXT_MUTED,
    backgroundColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: 999,
  },

  systemRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  systemText: { fontSize: 12, color: TEXT_MUTED, fontStyle: 'italic' },

  agendaCard: {
    backgroundColor: '#FFF', borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    padding: 14, marginVertical: 8, marginHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  agendaHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  agendaIconBox:    { width: 38, height: 38, borderRadius: 10, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' },
  agendaTagLabel:   { fontSize: 10, fontWeight: '700', color: MINT_DARK, letterSpacing: 0.5 },
  agendaPrivasi:    { fontSize: 11, color: MINT_DARK, fontWeight: '600', marginTop: 2 },
  agendaJudul:      { fontSize: 17, fontWeight: 'bold', color: TEXT, marginBottom: 8, lineHeight: 22 },
  agendaMetaRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  agendaMetaText:   { fontSize: 12, color: GRAY, marginLeft: 4 },
  agendaPesertaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  miniAvatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: MINT_DARK, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFF',
  },
  agendaPesertaText: { fontSize: 12, color: GRAY, marginLeft: 10 },
  agendaBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: MINT, borderRadius: 12, height: 44 },
  agendaBtnJoined:   { backgroundColor: MINT_DARK },
  agendaBtnText:     { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  msgRowMe:   { justifyContent: 'flex-end' },
  avatar:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8, alignSelf: 'flex-end' },
  avatarText: { fontSize: 11, fontWeight: 'bold' },

  bubble:     { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  bubbleThem: { backgroundColor: '#FFF', borderBottomLeftRadius: 4 },
  bubbleMe:   { backgroundColor: MINT_BUBBLE, borderBottomRightRadius: 4 },

  senderRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  senderName: { fontSize: 12, fontWeight: '700', color: MINT },
  hostBadge:  { backgroundColor: MINT_DARK, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6 },
  hostText:   { fontSize: 9, fontWeight: 'bold', color: '#FFF' },

  replyBox:  { backgroundColor: '#F3F4F6', borderLeftWidth: 3, borderLeftColor: MINT, borderRadius: 6, padding: 6, marginBottom: 6 },
  replyName: { fontSize: 11, fontWeight: '700', color: MINT },
  replyText: { fontSize: 12, color: GRAY },

  msgText:   { fontSize: 14, color: TEXT, lineHeight: 20 },
  msgTextMe: { color: '#065F46' },
  msgTime:   { fontSize: 10, color: TEXT_MUTED, marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMe: { color: '#6EE7B7' },

  replyPreview:     { flexDirection: 'row', alignItems: 'center', backgroundColor: MINT_LIGHT, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORDER },
  replyPreviewName: { fontSize: 12, fontWeight: '700', color: MINT },
  replyPreviewText: { fontSize: 12, color: GRAY },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderRadius: 24,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 12, paddingVertical: 8,
    minHeight: 40, maxHeight: 120,
  },
  textInput:    { flex: 1, fontSize: 14, color: TEXT, maxHeight: 100 },
  sendBtn:      { width: 42, height: 42, borderRadius: 21, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sendBtnMuted: { backgroundColor: '#9CA3AF' },

  fab: {
    position: 'absolute', bottom: 80, right: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: MINT, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  fabBadge:     { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1 },
  fabBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFF' },
});
