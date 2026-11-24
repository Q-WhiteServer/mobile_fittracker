/**
 * program/[id].js — Detail Program Latihan
 *
 * Params (dari router.push):
 *   id         — id program
 *   judul      — nama program
 *   kategori   — kategori (Kekuatan, Kardio, dll)
 *   fokus      — fokus tubuh
 *   meta       — metadata (durasi • level)
 *   offline    — "true" / "false"
 *   img        — tidak di-pass (gambar diambil dari data lokal)
 */

import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView,
  StyleSheet, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

// ── Aset lokal ───────────────────────────────────────────────────────────────
let IMG_KEKUATAN = null;
let IMG_KARDIO   = null;
try { IMG_KEKUATAN = require('../../../assets/olahraga.jpg');   } catch {}
try { IMG_KARDIO   = require('../../../assets/hero-login.jpg'); } catch {}

// ── Data detail per program ──────────────────────────────────────────────────
const PROGRAM_DATA = {
  '1': {
    img: IMG_KEKUATAN,
    gerakan: [
      { nama: 'Squat',       reps: 15, durasi: 0,  level: 'Rendah'   },
      { nama: 'Push Up',     reps: 12, durasi: 0,  level: 'Rendah'   },
      { nama: 'Plank',       reps: 30, durasi: 30, level: 'Rendah'   },
      { nama: 'Lunges',      reps: 12, durasi: 0,  level: 'Rendah'   },
      { nama: 'Mountain Climber', reps: 20, durasi: 0, level: 'Menengah' },
    ],
    deskripsi: 'Program kekuatan penuh menggunakan berat badan sendiri. Cocok dilakukan di rumah tanpa alat apapun.',
    totalMenit: 20,
    totalGerakan: 5,
    totalRound: 3,
  },
  '2': {
    img: IMG_KARDIO,
    gerakan: [
      { nama: 'Jumping Jack', reps: 30, durasi: 0,  level: 'Rendah'   },
      { nama: 'High Knees',   reps: 20, durasi: 0,  level: 'Menengah' },
      { nama: 'Burpee',       reps: 10, durasi: 0,  level: 'Menengah' },
      { nama: 'Jump Squat',   reps: 15, durasi: 0,  level: 'Menengah' },
    ],
    deskripsi: 'Latihan kardio intensitas sedang tanpa alat. Bakar kalori dan tingkatkan stamina dengan gerakan dinamis.',
    totalMenit: 15,
    totalGerakan: 4,
    totalRound: 3,
  },
  '3': {
    img: null,
    gerakan: [
      { nama: 'Child Pose',    reps: 60, durasi: 60, level: 'Rendah' },
      { nama: 'Cat Cow Stretch', reps: 10, durasi: 0, level: 'Rendah' },
      { nama: 'Downward Dog',  reps: 30, durasi: 30, level: 'Rendah' },
      { nama: 'Warrior I',     reps: 30, durasi: 30, level: 'Rendah' },
    ],
    deskripsi: 'Sesi yoga pagi untuk memulai hari dengan tenang. Fokus pada pernapasan dan kelenturan tubuh.',
    totalMenit: 20,
    totalGerakan: 4,
    totalRound: 2,
  },
  '4': {
    img: IMG_KEKUATAN,
    gerakan: [
      { nama: 'Pike Push Up',   reps: 10, durasi: 0, level: 'Menengah' },
      { nama: 'Diamond Push Up', reps: 10, durasi: 0, level: 'Menengah' },
      { nama: 'Tricep Dip',     reps: 12, durasi: 0, level: 'Menengah' },
      { nama: 'Chin Up',        reps: 8,  durasi: 0, level: 'Menengah' },
    ],
    deskripsi: 'Fokus pembentukan otot lengan atas: bisep, trisep, dan bahu. Tingkat menengah dengan 4 gerakan efektif.',
    totalMenit: 25,
    totalGerakan: 4,
    totalRound: 4,
  },
};

// ── Komponen baris gerakan ───────────────────────────────────────────────────
function GerakanRow({ item, index }) {
  return (
    <View style={s.gerakanRow}>
      <View style={s.gerakanNum}>
        <Text style={s.gerakanNumTxt}>{index + 1}</Text>
      </View>
      <View style={s.gerakanIconBox}>
        <Ionicons name="fitness-outline" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.gerakanNama}>{item.nama}</Text>
        <Text style={s.gerakanMeta}>
          {item.durasi > 0 ? `${item.durasi} detik` : `${item.reps} repetisi`}
          {' '}• {item.level}
        </Text>
      </View>
      <View style={[s.levelBadge, item.level === 'Menengah' && s.levelBadgeMed]}>
        <Text style={[s.levelBadgeTxt, item.level === 'Menengah' && s.levelBadgeTxtMed]}>
          {item.level}
        </Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ProgramDetailScreen() {
  const params = useLocalSearchParams();
  const id      = params.id      || '1';
  const judul   = params.judul   || 'Program Latihan';
  const kategori= params.kategori|| 'Kekuatan';
  const fokus   = params.fokus   || 'Seluruh tubuh';
  const offline = params.offline === 'true';

  const data = PROGRAM_DATA[id] || PROGRAM_DATA['1'];
  const [bookmarked, setBookmarked] = useState(false);

  function mulaiLatihan() {
    router.push({
      pathname: '/timer',
      params: {
        exercises: JSON.stringify(
          data.gerakan.map((g) => ({ nama: g.nama, reps: g.reps, durasi: g.durasi }))
        ),
        total_round: String(data.totalRound),
        rest_sec: '45',
      },
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header gambar ── */}
        <View style={s.imgWrap}>
          {data.img ? (
            <Image source={data.img} style={s.heroImg} resizeMode="cover" />
          ) : (
            <View style={[s.heroImg, { backgroundColor: colors.primary, opacity: 0.8 }]} />
          )}
          {/* Overlay gradien simulasi */}
          <View style={s.heroOverlay} />

          {/* Tombol kembali */}
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </Pressable>

          {/* Tombol bookmark */}
          <Pressable style={s.bmBtn} onPress={() => setBookmarked((b) => !b)}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color="#FFF"
            />
          </Pressable>

          {/* Teks overlay */}
          <View style={s.heroText}>
            <Text style={s.heroKategori}>{kategori} • {fokus}</Text>
            <Text style={s.heroJudul}>{judul}</Text>
          </View>
        </View>

        {/* ── Statistik ringkas ── */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={s.statVal}>{data.totalMenit} menit</Text>
            <Text style={s.statLbl}>Durasi</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Ionicons name="fitness-outline" size={20} color={colors.primary} />
            <Text style={s.statVal}>{data.totalGerakan} gerakan</Text>
            <Text style={s.statLbl}>Gerakan</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            <Text style={s.statVal}>{data.totalRound}×</Text>
            <Text style={s.statLbl}>Putaran</Text>
          </View>
          {offline && (
            <>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
                <Text style={[s.statVal, { color: colors.primary }]}>Siap</Text>
                <Text style={s.statLbl}>Offline</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Deskripsi ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tentang program</Text>
          <Text style={s.descTxt}>{data.deskripsi}</Text>
        </View>

        {/* ── Daftar gerakan ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Daftar gerakan</Text>
          <Text style={s.sectionSub}>
            {data.totalGerakan} gerakan × {data.totalRound} putaran
          </Text>
          {data.gerakan.map((g, i) => (
            <GerakanRow key={i} item={g} index={i} />
          ))}
        </View>

        {/* ── Tombol aksi ── */}
        <View style={s.actionWrap}>
          <Pressable style={s.btnMulai} onPress={mulaiLatihan}>
            <Ionicons name="play" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={s.btnMulaiTxt}>Mulai Latihan</Text>
          </Pressable>
          <Pressable
            style={s.btnJadwal}
            onPress={() => router.push('/plan/create')}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={s.btnJadwalTxt}>Tambah ke Jadwal</Text>
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

  /* Hero */
  imgWrap:     { height: 260, position: 'relative' },
  heroImg:     { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,40,20,0.45)',
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  bmBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroText:    { position: 'absolute', bottom: 20, left: 20, right: 20 },
  heroKategori:{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  heroJudul:   { fontSize: 24, fontWeight: 'bold', color: '#FFF' },

  /* Stats */
  statsRow: {
    flexDirection: 'row', backgroundColor: '#FFF',
    marginHorizontal: 16, marginTop: -20,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },
  statVal:     { fontSize: 14, fontWeight: 'bold', color: '#111827', marginTop: 6 },
  statLbl:     { fontSize: 11, color: '#6B7280', marginTop: 2 },

  /* Section */
  section:     { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle:{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  sectionSub:  { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  descTxt:     { fontSize: 14, color: '#4B5563', lineHeight: 22 },

  /* Gerakan row */
  gerakanRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14,
    padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  gerakanNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  gerakanNumTxt: { fontSize: 13, fontWeight: 'bold', color: colors.primary },
  gerakanIconBox:{
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
  },
  gerakanNama:  { fontSize: 14, fontWeight: '700', color: '#111827' },
  gerakanMeta:  { fontSize: 12, color: '#6B7280', marginTop: 2 },
  levelBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, backgroundColor: '#D1FAE5',
  },
  levelBadgeTxt:    { fontSize: 11, fontWeight: '600', color: colors.primary },
  levelBadgeMed:    { backgroundColor: '#FEF3C7' },
  levelBadgeTxtMed: { color: '#D97706' },

  /* Tombol */
  actionWrap:  { paddingHorizontal: 20, marginTop: 28 },
  btnMulai: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, height: 54, borderRadius: 14, marginBottom: 12,
  },
  btnMulaiTxt:  { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  btnJadwal: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: '#ECFDF5',
  },
  btnJadwalTxt: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
});
