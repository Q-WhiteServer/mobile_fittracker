/**
 * exercises.js — Tab "Temukan"
 *
 * Menampilkan katalog latihan dari backend (tabel `exercises`).
 * - Fetch dari GET /exercises saat layar difokuskan
 * - Cache ke AsyncStorage untuk mode offline
 * - Filter berdasarkan kategori & level kesulitan
 * - Search real-time berdasarkan nama gerakan
 * - Klik kartu → navigasi ke /exercise/[id]
 */

import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { api } from '../../api';
import { cacheExercises, getCachedExercises } from '../../localStore';
import { colors } from '../../theme';

// ── Konstanta filter ─────────────────────────────────────────────────────────
const KATEGORI_LIST = ['Semua', 'Kekuatan', 'Kardio', 'Core', 'Full Body', 'Peregangan'];
const LEVEL_LIST    = ['Semua', 'Pemula', 'Menengah', 'Lanjutan'];

// Peta warna per kategori
const KATEGORI_COLOR = {
  Kekuatan:    { bg: '#FEF3C7', text: '#D97706', icon: 'barbell-outline' },
  Kardio:      { bg: '#FEE2E2', text: '#DC2626', icon: 'flame-outline' },
  Core:        { bg: '#E0F2FE', text: '#0369A1', icon: 'body-outline' },
  'Full Body': { bg: '#ECFDF5', text: '#059669', icon: 'fitness-outline' },
  Peregangan:  { bg: '#F3E8FF', text: '#7C3AED', icon: 'leaf-outline' },
};
const DEFAULT_COLOR = { bg: '#F3F4F6', text: '#6B7280', icon: 'ellipsis-horizontal-outline' };

// Peta warna badge level
const LEVEL_COLOR = {
  Pemula:    { bg: '#D1FAE5', text: '#059669' },
  Menengah:  { bg: '#FEF3C7', text: '#D97706' },
  Lanjutan:  { bg: '#FEE2E2', text: '#DC2626' },
};

// ── Kartu latihan ────────────────────────────────────────────────────────────
function ExerciseCard({ item, onPress }) {
  const kat   = KATEGORI_COLOR[item.kategori]  || DEFAULT_COLOR;
  const level = LEVEL_COLOR[item.level_kesulitan] || { bg: '#F3F4F6', text: '#6B7280' };

  return (
    <Pressable style={s.card} onPress={onPress}>
      {/* Ikon kategori */}
      <View style={[s.cardIcon, { backgroundColor: kat.bg }]}>
        <Ionicons name={kat.icon} size={22} color={kat.text} />
      </View>

      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={s.cardNama} numberOfLines={1}>{item.nama_gerakan}</Text>

        <View style={s.cardMetaRow}>
          {/* Badge level */}
          <View style={[s.badge, { backgroundColor: level.bg }]}>
            <Text style={[s.badgeTxt, { color: level.text }]}>{item.level_kesulitan}</Text>
          </View>
          {/* Badge kategori */}
          <View style={[s.badge, { backgroundColor: kat.bg, marginLeft: 6 }]}>
            <Text style={[s.badgeTxt, { color: kat.text }]}>{item.kategori}</Text>
          </View>
          {/* Durasi (jika berbasis waktu) */}
          {item.durasi > 0 && (
            <View style={s.durasiRow}>
              <Ionicons name="time-outline" size={11} color="#9CA3AF" />
              <Text style={s.durasiTxt}>{item.durasi}d</Text>
            </View>
          )}
        </View>

        {/* Deskripsi singkat */}
        {item.deskripsi ? (
          <Text style={s.cardDesc} numberOfLines={2}>{item.deskripsi}</Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ query, offline }) {
  return (
    <View style={s.emptyWrap}>
      <Ionicons
        name={offline ? 'cloud-offline-outline' : 'search-outline'}
        size={48}
        color="#E5E7EB"
      />
      <Text style={s.emptyTitle}>
        {offline ? 'Tidak ada data offline' : query ? 'Tidak ditemukan' : 'Belum ada latihan'}
      </Text>
      <Text style={s.emptyDesc}>
        {offline
          ? 'Hubungkan ke internet agar katalog latihan bisa dimuat.'
          : query
          ? `Tidak ada latihan yang cocok dengan "${query}".`
          : 'Katalog latihan akan muncul di sini setelah terhubung ke server.'}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ExercisesScreen() {
  const [exercises,    setExercises]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [offline,      setOffline]      = useState(false);
  const [query,        setQuery]        = useState('');
  const [kategori,     setKategori]     = useState('Semua');
  const [level,        setLevel]        = useState('Semua');

  // ── Load dari API, fallback ke cache ──────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getExercises({});
      const list = res.exercises || [];
      setExercises(list);
      await cacheExercises(list);
      setOffline(false);
    } catch {
      const cached = await getCachedExercises();
      setExercises(cached);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { load(); }, [load])
  );

  // ── Filter + search ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (kategori !== 'Semua' && ex.kategori !== kategori) return false;
      if (level !== 'Semua' && ex.level_kesulitan !== level) return false;
      if (query.trim() && !ex.nama_gerakan.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [exercises, kategori, level, query]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.headerRow}>
        <View>
          <Text style={s.title}>Temukan</Text>
          <Text style={s.subtitle}>
            {offline ? '⚡ Mode offline' : `${exercises.length} latihan tersedia`}
          </Text>
        </View>
        {offline && (
          <Pressable style={s.retryBtn} onPress={load}>
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
          </Pressable>
        )}
      </View>

      {/* ── Search Bar ── */}
      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Cari nama latihan..."
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* ── Filter Kategori ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipScroll}
      >
        {KATEGORI_LIST.map((k) => (
          <Pressable
            key={k}
            style={[s.chip, kategori === k && s.chipActive]}
            onPress={() => setKategori(k)}
          >
            <Text style={[s.chipTxt, kategori === k && s.chipTxtActive]}>{k}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Filter Level ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.chipScroll, { paddingTop: 0, marginBottom: 4 }]}
      >
        {LEVEL_LIST.map((l) => (
          <Pressable
            key={l}
            style={[s.chip, s.chipSmall, level === l && s.chipActive]}
            onPress={() => setLevel(l)}
          >
            <Text style={[s.chipTxt, s.chipTxtSmall, level === l && s.chipTxtActive]}>{l}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Konten ── */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingTxt}>Memuat katalog latihan...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
        >
          {/* Info jumlah hasil */}
          {!loading && exercises.length > 0 && (
            <Text style={s.resultCount}>
              {filtered.length} dari {exercises.length} latihan
              {kategori !== 'Semua' ? ` • ${kategori}` : ''}
              {level !== 'Semua' ? ` • ${level}` : ''}
            </Text>
          )}

          {/* Daftar latihan atau empty state */}
          {filtered.length === 0 ? (
            <EmptyState query={query} offline={offline} />
          ) : (
            filtered.map((ex) => (
              <ExerciseCard
                key={ex.id_exercise}
                item={ex}
                onPress={() => router.push(`/exercise/${ex.id_exercise}`)}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },

  /* Header */
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
  },
  title:    { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  retryBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Search */
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
    marginHorizontal: 20, marginBottom: 10,
    paddingHorizontal: 14, height: 50,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },

  /* Chips filter */
  chipScroll: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF', marginRight: 8,
  },
  chipSmall:     { paddingHorizontal: 12, paddingVertical: 6 },
  chipActive:    { borderColor: colors.primary, backgroundColor: '#ECFDF5' },
  chipTxt:       { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTxtSmall:  { fontSize: 12 },
  chipTxtActive: { color: colors.primary },

  /* Loading */
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingTxt:  { marginTop: 12, fontSize: 14, color: '#9CA3AF' },

  /* List */
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  resultCount: { fontSize: 12, color: '#9CA3AF', marginBottom: 10, marginTop: 4 },

  /* Kartu latihan */
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    padding: 14, marginBottom: 10,
  },
  cardIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardNama:    { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  cardDesc:    { fontSize: 12, color: '#6B7280', lineHeight: 17, marginTop: 2 },

  /* Badge */
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
  },
  badgeTxt:  { fontSize: 11, fontWeight: '700' },
  durasiRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  durasiTxt: { fontSize: 11, color: '#9CA3AF', marginLeft: 2 },

  /* Empty */
  emptyWrap:  { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 14, marginBottom: 6 },
  emptyDesc:  { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
