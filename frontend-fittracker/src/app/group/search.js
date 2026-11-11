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
const AVATAR_COLORS = ['#6EE7B7', '#93C5FD', '#FCA5A5', '#FDE68A', '#C4B5FD'];
function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

export default function GroupSearchScreen() {
  const [query, setQuery] = useState('');
  const [kategori, setKategori] = useState('Semua');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [joining, setJoining] = useState({});

  const doSearch = useCallback(async (q, kat) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.getGroups({ q: q || undefined, kategori: kat === 'Semua' ? undefined : kat });
      setGroups(res.groups || []);
    } catch (e) {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search saat kategori ganti
  const handleKategori = (k) => {
    setKategori(k);
    doSearch(query, k);
  };

  async function handleJoin(id_group) {
    setJoining((prev) => ({ ...prev, [id_group]: true }));
    try {
      await api.joinGroup(id_group);
      setGroups((prev) =>
        prev.map((g) =>
          g.id_group === id_group ? { ...g, sudah_gabung: 1, jumlah_anggota: g.jumlah_anggota + 1 } : g
        )
      );
    } catch (e) {
      /* sudah gabung atau offline */
    } finally {
      setJoining((prev) => ({ ...prev, [id_group]: false }));
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={MINT} />
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

        {/* Kategori chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {KATEGORI.map((k) => {
            const active = kategori === k;
            return (
              <Pressable key={k} style={[s.chip, active && s.chipActive]} onPress={() => handleKategori(k)}>
                <Text style={[s.chipText, active && s.chipTextActive]}>{k}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={s.list}>
        {/* Section header */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Rekomendasi untukmu</Text>
          <Text style={s.sectionRight}>Paling aktif</Text>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={MINT} />
          </View>
        ) : !searched ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="people-outline" size={48} color={BORDER} />
            <Text style={{ color: TEXT_MUTED, marginTop: 12, textAlign: 'center' }}>
              Ketik nama grup atau pilih kategori untuk mulai mencari.
            </Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="search-outline" size={48} color={BORDER} />
            <Text style={{ color: TEXT_MUTED, marginTop: 12 }}>Tidak ada grup ditemukan.</Text>
          </View>
        ) : (
          groups.map((g) => {
            const ini = initials(g.nama_group);
            const avatarBg = avatarColor(g.nama_group);
            const isJoining = joining[g.id_group];
            return (
              <Pressable key={g.id_group} onPress={() => router.push(`/group/${g.id_group}`)}>
                <View style={s.card}>
                  {/* Avatar */}
                  <View style={[s.avatar, { backgroundColor: avatarBg }]}>
                    <Text style={s.avatarText}>{ini}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.groupName}>{g.nama_group}</Text>
                    <Text style={s.groupMeta}>
                      {g.kategori || 'Umum'} • {g.jumlah_anggota} anggota
                    </Text>
                    {g.deskripsi ? (
                      <Text style={s.groupDesc} numberOfLines={2}>{g.deskripsi}</Text>
                    ) : null}

                    {/* Footer card */}
                    <View style={s.cardFooter}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="globe-outline" size={13} color={GRAY} />
                        <Text style={s.cardStatus}>
                          {g.privasi === 'privat' ? 'Privat' : 'Publik'} • Aktif
                        </Text>
                      </View>
                      {g.sudah_gabung ? (
                        <View style={s.joinedBadge}>
                          <Ionicons name="checkmark" size={12} color={MINT} />
                          <Text style={s.joinedText}>Bergabung</Text>
                        </View>
                      ) : (
                        <Pressable
                          style={[s.joinBtn, isJoining && { opacity: 0.6 }]}
                          onPress={() => handleJoin(g.id_group)}
                          disabled={!!isJoining}
                        >
                          {isJoining
                            ? <ActivityIndicator size={12} color={MINT} />
                            : <Text style={s.joinBtnText}>+ Bergabung</Text>}
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { color: MINT, fontWeight: '600', fontSize: 15, marginLeft: 4 },
  title: { fontSize: 26, fontWeight: 'bold', color: TEXT },
  subtitle: { fontSize: 14, color: TEXT_MUTED, marginBottom: 14 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 14, paddingHorizontal: 14, height: 48,
  },
  searchInput: { flex: 1, fontSize: 15, color: TEXT },

  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1.5, borderColor: BORDER,
    marginRight: 8, backgroundColor: '#FFF',
  },
  chipActive: { backgroundColor: MINT_LIGHT, borderColor: MINT },
  chipText: { fontSize: 13, fontWeight: '600', color: GRAY },
  chipTextActive: { color: MINT },

  list: { padding: 16, paddingBottom: 40 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: TEXT },
  sectionRight: { fontSize: 13, color: TEXT_MUTED },

  card: {
    flexDirection: 'row', backgroundColor: '#FFF',
    borderRadius: 16, borderWidth: 1, borderColor: BORDER,
    padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: 'bold', color: '#065F46' },
  groupName: { fontSize: 15, fontWeight: '700', color: TEXT },
  groupMeta: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  groupDesc: { fontSize: 13, color: GRAY, marginTop: 4, lineHeight: 18 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  cardStatus: { fontSize: 12, color: TEXT_MUTED, marginLeft: 4 },
  joinBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: MINT_LIGHT, borderRadius: 999,
    borderWidth: 1, borderColor: MINT,
  },
  joinBtnText: { fontSize: 13, fontWeight: '700', color: MINT },
  joinedBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: MINT_LIGHT, borderRadius: 999,
  },
  joinedText: { fontSize: 12, fontWeight: '600', color: MINT, marginLeft: 4 },
});
