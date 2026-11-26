/**
 * program/[id].js — Detail Program Latihan
 *
 * Params (dari router.push):
 *   id       — id program ('1','2','3','4')
 *   judul    — nama program
 *   kategori — kategori (Kekuatan, Kardio, dll)
 *   fokus    — fokus tubuh
 *   offline  — "true"/"false"
 */

import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView,
  StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

// ── Aset ─────────────────────────────────────────────────────────────────────
let IMG_DEFAULT = null;
try { IMG_DEFAULT = require('../../../assets/olahraga.jpg'); } catch {}

// ── Data per program ──────────────────────────────────────────────────────────
const PROGRAM_DATA = {
  '1': {
    img:          IMG_DEFAULT,
    kategori:     'Kekuatan',
    fokus:        'Seluruh tubuh',
    judul:        'Kuat dari Rumah',
    totalMenit:   20,
    kalori:       120,
    totalRound:   3,
    alat:         'Matras, Dumbbell ringan (opsional)',
    deskripsi:    'Program latihan kekuatan seluruh tubuh yang dirancang untuk pemula. Membantu meningkatkan massa otot dan daya tahan tubuh tanpa perlu ke gym.',
    gerakan: [
      { nama: 'Pemanasan',                label: '45 detik',      durasi: 45, reps: 0  },
      { nama: 'Goblet Squat',             label: '12 repetisi',   durasi: 0,  reps: 12 },
      { nama: 'Push-Up Lutut',            label: '10 repetisi',   durasi: 0,  reps: 10 },
      { nama: 'Plank',                    label: '30 detik',      durasi: 30, reps: 0  },
      { nama: 'Glute Bridge',             label: '12 repetisi',   durasi: 0,  reps: 12 },
      { nama: 'Pendinginan & Peregangan', label: '60 detik',      durasi: 60, reps: 0  },
    ],
  },
  '2': {
    img:          IMG_DEFAULT,
    kategori:     'Kardio',
    fokus:        'Seluruh tubuh',
    judul:        'Kardio Tanpa Alat',
    totalMenit:   15,
    kalori:       150,
    totalRound:   3,
    alat:         'Tidak perlu alat',
    deskripsi:    'Latihan kardio intensitas sedang tanpa alat. Bakar kalori dan tingkatkan stamina dengan gerakan dinamis.',
    gerakan: [
      { nama: 'Pemanasan',    label: '30 detik',   durasi: 30, reps: 0  },
      { nama: 'Jumping Jack', label: '30 repetisi',durasi: 0,  reps: 30 },
      { nama: 'High Knees',   label: '20 repetisi',durasi: 0,  reps: 20 },
      { nama: 'Burpee',       label: '10 repetisi',durasi: 0,  reps: 10 },
      { nama: 'Jump Squat',   label: '15 repetisi',durasi: 0,  reps: 15 },
      { nama: 'Pendinginan',  label: '45 detik',   durasi: 45, reps: 0  },
    ],
  },
  '3': {
    img:          null,
    kategori:     'Yoga',
    fokus:        'Fleksibilitas',
    judul:        'Yoga Pagi',
    totalMenit:   20,
    kalori:       80,
    totalRound:   2,
    alat:         'Matras yoga',
    deskripsi:    'Sesi yoga pagi untuk memulai hari dengan tenang. Fokus pada pernapasan dan kelenturan tubuh.',
    gerakan: [
      { nama: 'Child Pose',       label: '60 detik', durasi: 60, reps: 0  },
      { nama: 'Cat-Cow Stretch',  label: '10 repetisi',durasi: 0,  reps: 10 },
      { nama: 'Downward Dog',     label: '30 detik', durasi: 30, reps: 0  },
      { nama: 'Warrior I',        label: '30 detik', durasi: 30, reps: 0  },
      { nama: 'Seated Twist',     label: '30 detik', durasi: 30, reps: 0  },
      { nama: 'Savasana',         label: '60 detik', durasi: 60, reps: 0  },
    ],
  },
  '4': {
    img:          IMG_DEFAULT,
    kategori:     'Kekuatan',
    fokus:        'Lengan',
    judul:        'Upper Body Blast',
    totalMenit:   25,
    kalori:       180,
    totalRound:   4,
    alat:         'Matras, Kursi (untuk dips)',
    deskripsi:    'Fokus pembentukan otot lengan atas: bisep, trisep, dan bahu. Tingkat menengah dengan 4 gerakan efektif.',
    gerakan: [
      { nama: 'Pemanasan',        label: '30 detik',   durasi: 30, reps: 0  },
      { nama: 'Pike Push Up',     label: '10 repetisi',durasi: 0,  reps: 10 },
      { nama: 'Diamond Push Up',  label: '10 repetisi',durasi: 0,  reps: 10 },
      { nama: 'Tricep Dip',       label: '12 repetisi',durasi: 0,  reps: 12 },
      { nama: 'Chin Up',          label: '8 repetisi', durasi: 0,  reps: 8  },
      { nama: 'Pendinginan',      label: '45 detik',   durasi: 45, reps: 0  },
    ],
  },
};

// ── Komponen baris gerakan ────────────────────────────────────────────────────
function GerakanRow({ item, index, img }) {
  return (
    <View style={s.gerakanRow}>
      {/* Thumbnail */}
      <View style={s.gerakanThumb}>
        {img ? (
          <Image source={img} style={s.gerakanThumbImg} resizeMode="cover" />
        ) : (
          <View style={[s.gerakanThumbImg, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="fitness-outline" size={18} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.gerakanNama}>{index + 1}. {item.nama}</Text>
        <Text style={s.gerakanMeta}>{item.label}</Text>
      </View>

      {/* Ikon info */}
      <View style={s.infoBtn}>
        <Ionicons name="information-circle-outline" size={22} color="#9CA3AF" />
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ProgramDetailScreen() {
  const params = useLocalSearchParams();
  const id     = params.id || '1';

  const data     = PROGRAM_DATA[id] || PROGRAM_DATA['1'];
  const judul    = params.judul    || data.judul;
  const kategori = params.kategori || data.kategori;
  const fokus    = params.fokus    || data.fokus;

  const [bookmarked, setBookmarked] = useState(false);

  function mulaiLatihan() {
    router.push({
      pathname: '/timer',
      params: {
        exercises: JSON.stringify(
          data.gerakan.map((g) => ({ nama: g.nama, reps: g.reps, durasi: g.durasi }))
        ),
        total_round: String(data.totalRound),
        rest_sec:    '45',
      },
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* ── Konten scroll ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >

        {/* ── 1. Banner Gambar ── */}
        <View style={s.imgWrap}>
          {data.img ? (
            <Image source={data.img} style={s.heroImg} resizeMode="cover" />
          ) : (
            <View style={[s.heroImg, { backgroundColor: colors.primary, opacity: 0.75 }]} />
          )}

          {/* Tombol kembali — lingkaran abu */}
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>

          {/* Dua tombol kanan atas: bookmark + unduh */}
          <View style={s.topRightBtns}>
            <Pressable
              style={s.circleBtn}
              onPress={() => setBookmarked((b) => !b)}
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={bookmarked ? colors.primary : '#374151'}
              />
            </Pressable>
            <Pressable style={[s.circleBtn, s.circleBtnGreen]}>
              <Ionicons name="cloud-download-outline" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* ── 2. Judul & Badge ── */}
        <View style={s.titleSection}>
          <Text style={s.kategoriLabel}>{kategori} • {fokus}</Text>
          <Text style={s.judul}>{judul}</Text>

          {/* Badge pill */}
          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Ionicons name="time-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={s.badgeTxt}>{data.totalMenit} menit</Text>
            </View>
            <View style={[s.badge, { marginLeft: 8 }]}>
              <Ionicons name="flame-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={s.badgeTxt}>±{data.kalori} kkal</Text>
            </View>
          </View>

          {/* Deskripsi */}
          <Text style={s.descTxt}>{data.deskripsi}</Text>
        </View>

        {/* ── 3. Card Alat ── */}
        <View style={s.alatCard}>
          <View style={s.alatIconBox}>
            <Ionicons name="barbell-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.alatLabel}>Alat yang dibutuhkan</Text>
            <Text style={s.alatTxt}>{data.alat}</Text>
          </View>
        </View>

        {/* ── 4. Daftar Gerakan ── */}
        <View style={s.gerakanSection}>
          <View style={s.gerakanHeader}>
            <Text style={s.gerakanHeaderTxt}>Daftar Gerakan</Text>
            <Text style={s.gerakanCount}>{data.gerakan.length} Gerakan</Text>
          </View>

          {data.gerakan.map((g, i) => (
            <GerakanRow key={i} item={g} index={i} img={data.img} />
          ))}
        </View>

        {/* Spacer untuk tombol fixed */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── 5. Tombol Mulai Latihan (fixed bawah) ── */}
      <View style={s.bottomBar}>
        <Pressable
          style={({ pressed }) => [s.btnMulai, pressed && { opacity: 0.88 }]}
          onPress={mulaiLatihan}
        >
          <Ionicons name="play" size={18} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={s.btnMulaiTxt}>Mulai Latihan</Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
const PRIMARY    = colors.primary;
const PRIMARY_L  = '#D1FAE5';
const PRIMARY_LL = '#ECFDF5';

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingBottom: 16 },

  /* ── Banner gambar ── */
  imgWrap: {
    height: 240,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  heroImg: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
  },

  /* Tombol kembali — lingkaran abu */
  backBtn: {
    position: 'absolute', top: 14, left: 14,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.90)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
  },

  /* Dua tombol kanan atas */
  topRightBtns: {
    position: 'absolute', top: 14, right: 14,
    alignItems: 'center',
  },
  circleBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.90)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
  },
  circleBtnGreen: {
    backgroundColor: PRIMARY_LL,
  },

  /* ── Judul & Badge ── */
  titleSection: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4,
  },
  kategoriLabel: {
    fontSize: 12, fontWeight: '700', color: PRIMARY, marginBottom: 4,
  },
  judul: {
    fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 10,
  },
  badgeRow: { flexDirection: 'row', marginBottom: 14 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PRIMARY_LL, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: PRIMARY_L,
  },
  badgeTxt: { fontSize: 13, fontWeight: '600', color: PRIMARY },
  descTxt:  { fontSize: 14, color: '#4B5563', lineHeight: 22 },

  /* ── Card Alat ── */
  alatCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PRIMARY_LL,
    borderRadius: 14, marginHorizontal: 16, marginTop: 16,
    padding: 14, borderWidth: 1, borderColor: PRIMARY_L,
  },
  alatIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: PRIMARY_L,
    alignItems: 'center', justifyContent: 'center',
  },
  alatLabel: { fontSize: 11, fontWeight: '700', color: PRIMARY, marginBottom: 2 },
  alatTxt:   { fontSize: 14, fontWeight: 'bold', color: '#065F46' },

  /* ── Daftar Gerakan ── */
  gerakanSection: { paddingHorizontal: 16, marginTop: 24 },
  gerakanHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  gerakanHeaderTxt: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  gerakanCount:     { fontSize: 13, color: PRIMARY, fontWeight: '600' },

  gerakanRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14,
    padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  gerakanThumb: {
    width: 52, height: 52, borderRadius: 12, overflow: 'hidden',
    backgroundColor: PRIMARY_LL,
    alignItems: 'center', justifyContent: 'center',
  },
  gerakanThumbImg: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  gerakanNama: { fontSize: 14, fontWeight: '700', color: '#111827' },
  gerakanMeta: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  infoBtn:     { padding: 4 },

  /* ── Tombol bawah ── */
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  btnMulai: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PRIMARY, height: 54, borderRadius: 14,
  },
  btnMulaiTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
