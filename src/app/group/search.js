import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../../api';

const MINT = '#10B981';
const MINT_LIGHT = '#D1FAE5';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';
const TEXT = '#111827';
const TEXT_MUTED = '#6B7280';
const BG = '#F9FAFB';

const KATEGORI = ['Semua', 'Lari', 'Kekuatan', 'Yoga', 'Bersepeda'];

// Warna avatar berdasarkan inisial
const AVATAR_COLORS = ['#D1FAE5', '#E0F2FE', '#FEE2E2', '#FEF3C7', '#EDE9FE'];
const AVATAR_TEXT_COLORS = ['#047857', '#0369A1', '#B91C1C', '#B45309', '#6D28D9'];

function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const idx = Math.abs(h) % AVATAR_COLORS.length;
  return { bg: AVATAR_COLORS[idx], text: AVATAR_TEXT_COLORS[idx] };
}

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

const MOCK_GROUPS = [
  {
    id_group: 'mock-1',
    nama_group: 'Lari Pagi Indonesia',
    kategori: 'Lari',
    jumlah_anggota: 342,
    deskripsi: 'Mulai hari dengan 3–5 km. Semua kecepatan diterima, yang penting konsisten!',
    privasi: 'publik',
    sudah_gabung: 0,
  },
  {
    id_group: 'mock-2',
    nama_group: 'Yoga Biar Rileks',
    kategori: 'Yoga',
    jumlah_anggota: 215,
    deskripsi: 'Ruang tenang untuk yoga, mobilitas, dan berbagi rutinitas pemulihan.',
    privasi: 'publik',
    sudah_gabung: 0,
  },
  {
    id_group: 'mock-3',
    nama_group: 'Bodyweight Squad',
    kategori: 'Kekuatan',
    jumlah_anggota: 176,
    deskripsi: 'Bangun kekuatan tanpa alat. Tantangan seru dan dukungan setiap minggu.',
    privasi: 'publik',
    sudah_gabung: 0,
  },
];

export default function GroupSearchScreen() {
  const [query, setQuery] = useState('');
  const [kategori, setKategori] = useState('Semua');
  const [groups, setGroups] = useState(MOCK_GROUPS);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState({});

  const doSearch = useCallback(async (q, kat) => {
    setLoading(true);
    try {
      const res = await api.getGroups({ q: q || undefined, kategori: kat === 'Semua' ? undefined : kat });
      setGroups(res.groups?.length ? res.groups : MOCK_GROUPS);
    } catch (e) {
      setGroups(MOCK_GROUPS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search saat kategori ganti atau pertama kali render
  const handleKategori = (k) => {
    setKategori(k);
    doSearch(query, k);
  };

  async function handleJoin(id_group, nama_group, jumlah_anggota) {
    setJoining((prev) => ({ ...prev, [id_group]: true }));
    try {
      // Untuk mock id, langsung update state tanpa API
      if (String(id_group).startsWith('mock-')) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id_group === id_group
              ? { ...g, sudah_gabung: 1, jumlah_anggota: g.jumlah_anggota + 1 }
              : g
          )
        );
      } else {
        await api.joinGroup(id_group);
        setGroups((prev) =>
          prev.map((g) =>
            g.id_group === id_group
              ? { ...g, sudah_gabung: 1, jumlah_anggota: g.jumlah_anggota + 1 }
              : g
          )
        );
      }
      // Langsung navigasi ke chat setelah bergabung
      router.push({
        pathname: '/group/chat',
        params: { id: id_group, nama: nama_group, anggota: jumlah_anggota },
      });
    } catch (e) {
      /* sudah gabung atau offline */
    } finally {
      setJoining((prev) => ({ ...prev, [id_group]: false }));
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={TEXT} />
          <Text style={s.backText}>Kembali</Text>
        </Pressable>
        <Text style={s.title}>Cari Grup</Text>
        <Text style={s.subtitle}>Temukan teman dengan semangat yang sama.</Text>

        {/* Search bar */}
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={20} color={GRAY} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Cari nama atau aktivitas grup"
            placeholderTextColor={TEXT_MUTED}
            returnKeyType="search"
            onSubmitEditing={() => doSearch(query, kategori)}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); doSearch('', kategori); }}>
              <Ionicons name="close-circle" size={18} color={GRAY} />
            </Pressable>
          )}
        </View>

        {/* Kategori chips (flexWrap agar turun ke baris berikutnya jika penuh) */}
        <View style={s.chipsContainer}>
          {KATEGORI.map((k) => {
            const active = kategori === k;
            return (
              <Pressable key={k} style={[s.chip, active && s.chipActive]} onPress={() => handleKategori(k)}>
                <Text style={[s.chipText, active && s.chipTextActive]}>{k}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {/* Section header */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Rekomendasi untukmu</Text>
          <Text style={s.sectionRight}>Paling aktif</Text>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={MINT} />
          </View>
        ) : groups.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="search-outline" size={48} color={BORDER} />
            <Text style={{ color: TEXT_MUTED, marginTop: 12 }}>Tidak ada grup ditemukan.</Text>
          </View>
        ) : (
          groups.map((g) => renderCard(g))
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function renderCard(g) {
    const ini = initials(g.nama_group || 'Grup');
    const avColor = avatarColor(g.nama_group || 'Grup');
    const isJoining = joining[g.id_group];

    return (
      <View key={g.id_group} style={s.card}>
        {/* Area klik untuk buka detail grup */}
        <Pressable onPress={() => router.push(`/group/${g.id_group}`)}>
          {/* Baris Atas Kartu (Avatar + Nama & Meta) */}
          <View style={s.cardTopRow}>
            <View style={[s.avatar, { backgroundColor: avColor.bg }]}>
              <Text style={[s.avatarText, { color: avColor.text }]}>{ini}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.groupName}>{g.nama_group}</Text>
              <Text style={s.groupMeta}>
                {g.kategori || 'Umum'} • {g.jumlah_anggota} anggota
              </Text>
            </View>
          </View>

          {/* Deskripsi */}
          {g.deskripsi ? (
            <Text style={s.groupDesc} numberOfLines={2}>{g.deskripsi}</Text>
          ) : null}
        </Pressable>

        {/* Footer card — terpisah dari Pressable atas agar tombol bergabung bisa diklik */}
        <View style={s.cardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="globe-outline" size={13} color={MINT} style={{ marginRight: 4 }} />
            <Text style={s.cardStatus}>
              {g.privasi === 'privat' ? 'Privat' : 'Publik'} • Aktif hari ini
            </Text>
          </View>
          {g.sudah_gabung ? (
            <View style={s.joinedBadge}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
              <Text style={s.joinedText}>Bergabung</Text>
            </View>
          ) : (
            <Pressable
              style={[s.joinBtn, isJoining && { opacity: 0.6 }]}
              onPress={(e) => {
                e.stopPropagation?.();
                handleJoin(g.id_group, g.nama_group, g.jumlah_anggota);
              }}
              disabled={!!isJoining}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isJoining ? (
                <ActivityIndicator size={14} color="#FFF" />
              ) : (
                <>
                  <Ionicons name="add" size={15} color="#FFF" style={{ marginRight: 2 }} />
                  <Text style={s.joinBtnText}>Bergabung</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  }
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backText: { color: TEXT, fontWeight: '600', fontSize: 15, marginLeft: 4 },
  title: { fontSize: 26, fontWeight: 'bold', color: TEXT },
  subtitle: { fontSize: 14, color: TEXT_MUTED, marginBottom: 14 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: TEXT },

  chipsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4,
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: '#FFF',
  },
  chipActive: { backgroundColor: MINT_LIGHT, borderColor: MINT },
  chipText: { fontSize: 13, fontWeight: '600', color: GRAY },
  chipTextActive: { color: MINT },

  list: { padding: 16, paddingBottom: 40 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: TEXT },
  sectionRight: { fontSize: 13, color: TEXT_MUTED },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16, borderWidth: 1, borderColor: BORDER,
    padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: 'bold' },
  groupName: { fontSize: 16, fontWeight: '700', color: TEXT },
  groupMeta: { fontSize: 13, color: TEXT_MUTED, marginTop: 2 },
  groupDesc: { fontSize: 14, color: GRAY, marginTop: 10, lineHeight: 20 },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  cardStatus: { fontSize: 12, color: '#059669', fontWeight: '500' },
  
  joinBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: MINT, borderRadius: 999,
  },
  joinBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  joinedBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: MINT, borderRadius: 999,
  },
  joinedText: { fontSize: 13, fontWeight: '700', color: '#FFF', marginLeft: 4 },
});