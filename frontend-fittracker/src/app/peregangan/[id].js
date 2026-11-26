/**
 * peregangan/[id].js — Detail Peregangan
 *
 * Params (dari router.push):
 *   id    — id peregangan ('p1' atau 'p2')
 *   judul — nama peregangan
 *   label — sub-label (mis. "Pemanasan / Warm-up")
 *   meta  — metadata
 */

import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

// ── Data detail per peregangan ───────────────────────────────────────────────
const PEREGANGAN_DATA = {
  p1: {
    icon:      'sunny-outline',
    iconColor: '#D97706',
    iconBg:    '#FEF3C7',
    warna:     '#B45309',
    bgHeader:  '#FFFBEB',
    deskripsi: 'Pemanasan dinamis untuk menyiapkan otot dan sendi sebelum latihan. Tingkatkan aliran darah dan kurangi risiko cedera.',
    manfaat:   ['Meningkatkan sirkulasi darah', 'Mengurangi risiko cedera', 'Meningkatkan performa latihan', 'Menyiapkan sistem saraf'],
    gerakan: [
      { nama: 'Neck Roll',          durasi: 30, instruksi: 'Putar kepala perlahan searah jarum jam, 15 detik setiap arah.' },
      { nama: 'Arm Circle',         durasi: 30, instruksi: 'Putar lengan ke depan dan belakang dengan gerakan besar.' },
      { nama: 'Hip Circle',         durasi: 30, instruksi: 'Putar pinggul searah dan berlawanan jarum jam masing-masing 15 detik.' },
      { nama: 'Leg Swing',          durasi: 30, instruksi: 'Ayunkan kaki ke depan-belakang dan kiri-kanan, 15 kali setiap kaki.' },
      { nama: 'High Knees (lambat)', durasi: 30, instruksi: 'Angkat lutut bergantian dengan tempo lambat selama 30 detik.' },
    ],
    totalMenit: 5,
    totalRound: 1,
  },
  p2: {
    icon:      'leaf-outline',
    iconColor: '#0369A1',
    iconBg:    '#E0F2FE',
    warna:     '#0369A1',
    bgHeader:  '#F0F9FF',
    deskripsi: 'Pendinginan statis untuk memulihkan otot setelah latihan. Kurangi nyeri, tingkatkan fleksibilitas, dan percepat pemulihan.',
    manfaat:   ['Mengurangi nyeri otot', 'Menurunkan detak jantung perlahan', 'Meningkatkan fleksibilitas', 'Mempercepat pemulihan'],
    gerakan: [
      { nama: 'Standing Quad Stretch', durasi: 30, instruksi: 'Pegang pergelangan kaki, tahan 30 detik setiap sisi.' },
      { nama: 'Hamstring Stretch',     durasi: 30, instruksi: 'Duduk, julurkan kaki lurus, raih ujung kaki, tahan 30 detik.' },
      { nama: 'Child Pose',            durasi: 45, instruksi: 'Berlutut, julurkan tangan ke depan, tahan 45 detik.' },
      { nama: 'Cat-Cow Stretch',       durasi: 30, instruksi: 'Posisi merangkak, lengkungkan dan cekungkan punggung bergantian.' },
      { nama: 'Seated Spinal Twist',   durasi: 30, instruksi: 'Duduk, putar badan ke kiri dan kanan, tahan 15 detik setiap sisi.' },
    ],
    totalMenit: 8,
    totalRound: 1,
  },
};

// ── Komponen baris gerakan ───────────────────────────────────────────────────
function GerakanRow({ item, index, iconColor }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      style={s.gerakanRow}
      onPress={() => setExpanded((e) => !e)}
    >
      <View style={[s.gerakanNum, { backgroundColor: '#ECFDF5' }]}>
        <Text style={[s.gerakanNumTxt, { color: iconColor }]}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.gerakanNama}>{item.nama}</Text>
        <Text style={s.gerakanDurasi}>{item.durasi} detik</Text>
        {expanded && (
          <Text style={s.gerakanInstruksi}>{item.instruksi}</Text>
        )}
      </View>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={16}
        color="#9CA3AF"
      />
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PeregangDetailScreen() {
  const params = useLocalSearchParams();
  const id    = params.id    || 'p1';
  const data  = PEREGANGAN_DATA[id] || PEREGANGAN_DATA['p1'];

  const judul  = params.judul || (id === 'p1' ? 'Siap Bergerak' : 'Rileks & Pulih');
  const label  = params.label || data.icon;

  function mulaiSesi() {
    router.push({
      pathname: '/timer',
      params: {
        exercises: JSON.stringify(
          data.gerakan.map((g) => ({ nama: g.nama, reps: 1, durasi: g.durasi }))
        ),
        total_round: String(data.totalRound),
        rest_sec: '15',
      },
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header ── */}
        <View style={[s.headerWrap, { backgroundColor: data.bgHeader }]}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={data.warna} />
          </Pressable>

          <View style={[s.headerIconBox, { backgroundColor: data.iconBg }]}>
            <Ionicons name={data.icon} size={40} color={data.iconColor} />
          </View>
          <View style={[s.labelPill, { backgroundColor: data.iconBg }]}>
            <Text style={[s.labelPillTxt, { color: data.warna }]}>{params.label || (id === 'p1' ? 'Pemanasan / Warm-up' : 'Pendinginan / Cool-down')}</Text>
          </View>
          <Text style={s.headerJudul}>{judul}</Text>
          <Text style={s.headerMeta}>{params.meta || `${data.totalMenit} menit • Statis • Rendah`}</Text>

          {/* Offline */}
          <View style={s.offlineRow}>
            <Ionicons name="cloud-download-outline" size={13} color={colors.primary} />
            <Text style={s.offlineTxt}>Tersedia offline</Text>
          </View>
        </View>

        {/* ── Deskripsi ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tentang sesi ini</Text>
          <Text style={s.descTxt}>{data.deskripsi}</Text>
        </View>

        {/* ── Manfaat ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Manfaat</Text>
          <View style={s.manfaatGrid}>
            {data.manfaat.map((m, i) => (
              <View key={i} style={s.manfaatItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={s.manfaatTxt}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Daftar gerakan (expandable) ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Urutan gerakan</Text>
          <Text style={s.sectionSub}>Ketuk gerakan untuk melihat instruksi.</Text>
          {data.gerakan.map((g, i) => (
            <GerakanRow key={i} item={g} index={i} iconColor={data.iconColor} />
          ))}
        </View>

        {/* ── Tombol aksi ── */}
        <View style={s.actionWrap}>
          <Pressable style={s.btnMulai} onPress={mulaiSesi}>
            <Ionicons name="play" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={s.btnMulaiTxt}>Mulai Sesi</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingBottom: 40 },

  /* Header */
  headerWrap: {
    paddingTop: 20, paddingBottom: 28,
    paddingHorizontal: 20, alignItems: 'center',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  headerIconBox: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  labelPill: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 999, marginBottom: 10,
  },
  labelPillTxt: { fontSize: 12, fontWeight: '700' },
  headerJudul:  { fontSize: 26, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 4 },
  headerMeta:   { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 10 },
  offlineRow:   { flexDirection: 'row', alignItems: 'center' },
  offlineTxt:   { fontSize: 12, color: colors.primary, marginLeft: 5, fontWeight: '500' },

  /* Section */
  section:      { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  sectionSub:   { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  descTxt:      { fontSize: 14, color: '#4B5563', lineHeight: 22 },

  /* Manfaat */
  manfaatGrid:  { gap: 8 },
  manfaatItem:  { flexDirection: 'row', alignItems: 'center' },
  manfaatTxt:   { fontSize: 14, color: '#374151', flex: 1 },

  /* Gerakan row */
  gerakanRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  gerakanNum: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', marginRight: 2,
  },
  gerakanNumTxt:    { fontSize: 13, fontWeight: 'bold' },
  gerakanNama:      { fontSize: 14, fontWeight: '700', color: '#111827' },
  gerakanDurasi:    { fontSize: 12, color: '#6B7280', marginTop: 2 },
  gerakanInstruksi: {
    fontSize: 13, color: '#4B5563', marginTop: 8,
    lineHeight: 18, fontStyle: 'italic',
  },

  /* Tombol */
  actionWrap: { paddingHorizontal: 20, marginTop: 28 },
  btnMulai: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, height: 54, borderRadius: 14,
  },
  btnMulaiTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
