/**
 * exercises.js — Tab "Temukan" (Discover)
 *
 * Tampilan statis sesuai desain:
 * - Header + bookmark
 * - Search bar
 * - Filter chip: Untukmu, Kekuatan, Kardio, Yoga
 * - Grid 2 kolom rekomendasi program (statis, tidak bisa diklik)
 * - Daftar peregangan (statis, tidak bisa diklik)
 */

import { useState, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

// ── Aset gambar ───────────────────────────────────────────────────────────────
let IMG_OLAHRAGA = null;
try { IMG_OLAHRAGA = require('../../../assets/olahraga.jpg'); } catch {}

// Kedua kartu program pakai gambar yang sama agar tidak ada teks overlay
const IMG_KEKUATAN = IMG_OLAHRAGA;
const IMG_KARDIO   = IMG_OLAHRAGA;

// ── Data ──────────────────────────────────────────────────────────────────────
const FILTERS = ['Untukmu', 'Kekuatan', 'Kardio', 'Yoga'];

const ALL_PROGRAMS = [
  {
    id: '1', img: IMG_KEKUATAN,
    kategori: 'Kekuatan', fokus: 'Seluruh tubuh',
    judul: 'Kuat dari Rumah', meta: '20 menit • Rendah',
    offline: true, filter: ['Untukmu', 'Kekuatan'],
  },
  {
    id: '2', img: IMG_KARDIO,
    kategori: 'Kardio', fokus: 'Seluruh tubuh',
    judul: 'Kardio Tanpa Alat', meta: '15 menit • Menengah',
    offline: true, filter: ['Untukmu', 'Kardio'],
  },
  {
    id: '3', img: null,
    kategori: 'Yoga', fokus: 'Fleksibilitas',
    judul: 'Yoga Pagi', meta: '20 menit • Rendah',
    offline: false, filter: ['Yoga'],
  },
  {
    id: '4', img: IMG_OLAHRAGA,
    kategori: 'Kekuatan', fokus: 'Lengan',
    judul: 'Upper Body Blast', meta: '25 menit • Menengah',
    offline: true, filter: ['Kekuatan'],
  },
];

const PEREGANGAN = [
  {
    id: 'p1',
    icon: 'sunny-outline', iconBg: '#FEF3C7', iconColor: '#D97706',
    label: 'Pemanasan / Warm-up',
    judul: 'Siap Bergerak',
    meta: '5 menit • Dinamis • Rendah',
    offline: true,
  },
  {
    id: 'p2',
    icon: 'leaf-outline', iconBg: '#E0F2FE', iconColor: '#0369A1',
    label: 'Pendinginan / Cool-down',
    judul: 'Rileks & Pulih',
    meta: '8 menit • Statis • Rendah',
    offline: true,
  },
];

// ── Kartu program — statis (View, bukan Pressable) ────────────────────────────
function ProgramCard({ item }) {
  return (
    <View style={s.programCard}>
      {/* Gambar */}
      <View style={s.programImgWrap}>
        {item.img ? (
          <Image source={item.img} style={s.programImg} resizeMode="cover" />
        ) : (
          <View style={[s.programImg, { backgroundColor: colors.primary, opacity: 0.7 }]} />
        )}
        {/* Ikon bookmark dekoratif */}
        <View style={s.bookmarkDeco}>
          <Ionicons name="bookmark-outline" size={15} color="#FFF" />
        </View>
      </View>

      {/* Info */}
      <View style={s.programInfo}>
        <Text style={s.programKat} numberOfLines={1}>
          {item.kategori} • {item.fokus}
        </Text>
        <Text style={s.programJudul} numberOfLines={2}>{item.judul}</Text>
        <Text style={s.programMeta} numberOfLines={1}>{item.meta}</Text>
        {item.offline && (
          <View style={s.offlineRow}>
            <Ionicons name="cloud-download-outline" size={11} color={colors.primary} />
            <Text style={s.offlineTxt}>Offline</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Kartu peregangan — statis (View, bukan Pressable) ─────────────────────────
function PeregangCard({ item }) {
  return (
    <View style={s.peregCard}>
      <View style={[s.peregIconBox, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={22} color={item.iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={s.peregLabel}>{item.label}</Text>
        <Text style={s.peregJudul}>{item.judul}</Text>
        <Text style={s.peregMeta}>{item.meta}</Text>
        {item.offline && (
          <View style={s.offlineRow}>
            <Ionicons name="cloud-download-outline" size={11} color={colors.primary} />
            <Text style={s.offlineTxt}>Tersedia offline</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function DiscoverScreen() {
  const [query,        setQuery]  = useState('');
  const [activeFilter, setFilter] = useState('Untukmu');
  const [programs]                = useState(ALL_PROGRAMS);

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const matchFilter = p.filter.includes(activeFilter);
      const matchQuery  = query.trim() === ''
        || p.judul.toLowerCase().includes(query.toLowerCase())
        || p.kategori.toLowerCase().includes(query.toLowerCase())
        || p.fokus.toLowerCase().includes(query.toLowerCase());
      return matchFilter && matchQuery;
    });
  }, [programs, activeFilter, query]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── 1. Header ── */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Temukan</Text>
            <Text style={s.subtitle}>Gerakan baru, semangat baru.</Text>
          </View>
          {/* Ikon bookmark dekoratif */}
          <View style={s.bookmarkHeaderBtn}>
            <Ionicons name="bookmark-outline" size={22} color={colors.primary} />
          </View>
        </View>

        {/* ── 2. Search Bar ── */}
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Cari latihan atau program"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* ── 2. Filter Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipScroll}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <Pressable
                key={f}
                style={[s.chip, active && s.chipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[s.chipTxt, active && s.chipTxtActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── 3. Rekomendasi Program ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Rekomendasi program</Text>
          {/* Statis — bukan Pressable */}
          <Text style={s.linkGreen}>Lihat semua</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="search-outline" size={40} color="#E5E7EB" />
            <Text style={s.emptyTxt}>Tidak ada program ditemukan.</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {filtered.map((item) => (
              <ProgramCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* ── 4. Peregangan ── */}
        <View style={[s.sectionRow, { marginTop: 24 }]}>
          <Text style={s.sectionTitle}>Peregangan</Text>
          {/* Statis — bukan Pressable */}
          <Text style={s.linkGreen}>Lihat semua</Text>
        </View>
        <Text style={s.sectionDesc}>
          Siapkan tubuh sebelum latihan, pulihkan setelahnya.
        </Text>

        {PEREGANGAN.map((item) => (
          <PeregangCard key={item.id} item={item} />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
const CARD_W = '48%';

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingBottom: 48 },

  /* Header */
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
  },
  title:    { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  bookmarkHeaderBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Search */
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
    marginHorizontal: 20, marginBottom: 14,
    paddingHorizontal: 14, height: 50,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },

  /* Chips */
  chipScroll: { paddingHorizontal: 20, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF', marginRight: 10,
  },
  chipActive:    { borderColor: colors.primary, backgroundColor: '#ECFDF5' },
  chipTxt:       { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTxtActive: { color: colors.primary },

  /* Section */
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  linkGreen:    { fontSize: 13, color: colors.primary, fontWeight: '600' },
  sectionDesc:  {
    fontSize: 13, color: '#6B7280',
    paddingHorizontal: 20, marginBottom: 12, lineHeight: 18,
  },

  /* Grid program 2 kolom */
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  programCard: {
    width: CARD_W,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 12, marginHorizontal: '1%',
  },
  programImgWrap: { height: 110, position: 'relative' },
  programImg: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
  },
  bookmarkDeco: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  programInfo:  { padding: 12 },
  programKat:   { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  programJudul: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  programMeta:  { fontSize: 11, color: '#6B7280', marginBottom: 6 },

  /* Peregangan */
  peregCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    marginHorizontal: 20, marginBottom: 12, padding: 14,
  },
  peregIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  peregLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  peregJudul: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  peregMeta:  { fontSize: 12, color: '#6B7280', marginBottom: 4 },

  /* Shared */
  offlineRow: { flexDirection: 'row', alignItems: 'center' },
  offlineTxt: { fontSize: 11, color: colors.primary, marginLeft: 4, fontWeight: '500' },

  /* Empty */
  emptyWrap: { alignItems: 'center', paddingVertical: 32 },
  emptyTxt:  { fontSize: 14, color: '#9CA3AF', marginTop: 10 },
});
