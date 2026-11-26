import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

// ── Aset gambar jadwal ──────────────────────────────────────────────────────
const OLAHRAGA_IMG = require('../../../assets/olahraga.jpg');

// ── Data statis ─────────────────────────────────────────────────────────────
const WEEK_DAYS = [
  { day: 'Sen', date: '12' },
  { day: 'Sel', date: '13' },
  { day: 'Rab', date: '14', active: true },
  { day: 'Kam', date: '15' },
  { day: 'Jum', date: '16' },
  { day: 'Sab', date: '17' },
  { day: 'Min', date: '18' },
];

const FOKUS_LIST  = ['Otot Perut', 'Lengan', 'Dada', 'Seluruh tubuh'];
const LEVEL_LIST  = ['Rendah', 'Menengah', 'Atas'];

const MOCK_PROGRAMS = [
  { id: '1', title: 'Core Aktif',       meta: 'Otot Perut • Menengah • 15 menit', icon: 'flame-outline' },
  { id: '2', title: 'Plank & Stabilitas', meta: 'Otot Perut • Menengah • 8 menit',  icon: 'pulse-outline' },
];

// ── Helper tanggal ───────────────────────────────────────────────────────────
const HARI   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN  = ['Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember'];
function todayStr() {
  const d = new Date();
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const { user } = useAuth();

  const namaDepan = user?.nama_lengkap?.split(' ')[0] || 'Kamu';
  const ini = (user?.nama_lengkap || 'U')
    .split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

  const [fokus, setFokus] = useState('Otot Perut');
  const [level, setLevel] = useState('Menengah');
  const [activeDay, setActiveDay] = useState('14');

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header Sapaan ──────────────────────────────────────────────── */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.dateText}>{todayStr()}</Text>
          <Text style={s.greetText}>Halo, {namaDepan}. Siap bergerak?</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{ini}</Text>
        </View>
      </View>

      {/* ── Judul ─────────────────────────────────────────────────────── */}
      <Text style={s.pageTitle}>Latihan</Text>

      {/* ── Kalender Mingguan ─────────────────────────────────────────── */}
      <View style={s.calHeaderRow}>
        <Text style={s.calMonth}>Oktober 2026</Text>
        <Text style={s.calRange}>12–18 Okt</Text>
      </View>
      <View style={s.weekRow}>
        {WEEK_DAYS.map((item, i) => {
          const isActive = activeDay === item.date;
          return (
            <Pressable
              key={i}
              style={[s.dayBox, isActive && s.dayBoxActive]}
              onPress={() => setActiveDay(item.date)}
            >
              <Text style={[s.dayName, isActive && s.textWhite]}>{item.day}</Text>
              <Text style={[s.dayNum,  isActive && s.textWhite]}>{item.date}</Text>
              {isActive && <View style={s.activeDot} />}
            </Pressable>
          );
        })}
      </View>

      {/* ── Target Mingguan ───────────────────────────────────────────── */}
      <View style={s.targetCard}>
        <View style={s.targetRow}>
          <Text style={s.targetLabel}>Target mingguan</Text>
          <Text style={s.targetVal}>2 / 4 latihan</Text>
        </View>
        <View style={s.progressBg}>
          <View style={s.progressFill} />
        </View>
        <Text style={s.targetSub}>Dua sesi lagi untuk mencapai targetmu!</Text>
      </View>

      {/* ── Jadwal Hari Ini ───────────────────────────────────────────── */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>Jadwal hari ini</Text>
        <Pressable onPress={() => router.push('/schedule')}>
          <Text style={s.linkGreen}>Lihat jadwal</Text>
        </Pressable>
      </View>

      <View style={s.scheduleCard}>
        {/* Gambar */}
        <View style={s.imgWrap}>
          <Image source={OLAHRAGA_IMG} style={s.scheduleImg} resizeMode="cover" />
          <View style={s.durationBadge}>
            <Ionicons name="time-outline" size={13} color="#111827" />
            <Text style={s.durationTxt}>25 menit</Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.scheduleBody}>
          <View style={s.scheduleMetaRow}>
            <Text style={s.scheduleInfoTxt}>18.00 • Latihan di rumah</Text>
            <View style={s.offlinePill}>
              <Ionicons name="cloud-download-outline" size={11} color="#059669" />
              <Text style={s.offlineTxt}>Offline</Text>
            </View>
          </View>
          <Text style={s.scheduleTitle}>Core &amp; Kekuatan</Text>
          <Text style={s.scheduleSub}>Otot Perut • Menengah • 6 gerakan</Text>
          <Pressable style={s.startBtn} onPress={() => router.push('/timer')}>
            <Ionicons name="play" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={s.startTxt}>Mulai latihan</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Sesuaikan Latihan ─────────────────────────────────────────── */}
      <Pressable style={s.customCard} onPress={() => router.push('/plan/create')}>
        <View style={s.customLeft}>
          <View style={s.customIconBox}>
            <Ionicons name="options-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={s.customTitle}>Sesuaikan Latihan</Text>
            <Text style={s.customSub}>Susun program versimu sendiri.</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>

      {/* ── Temukan Latihan yang Pas ──────────────────────────────────── */}
      <Text style={[s.sectionTitle, { marginTop: 4, marginBottom: 14 }]}>
        Temukan latihan yang pas
      </Text>

      <Text style={s.filterLabel}>Fokus otot</Text>
      <View style={s.chipRow}>
        {FOKUS_LIST.map((k) => {
          const active = fokus === k;
          return (
            <Pressable
              key={k}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setFokus(k)}
            >
              <Text style={[s.chipTxt, active && s.chipTxtActive]}>{k}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.filterLabel}>Tingkat kesulitan</Text>
      <View style={s.chipRow}>
        {LEVEL_LIST.map((l) => {
          const active = level === l;
          return (
            <Pressable
              key={l}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setLevel(l)}
            >
              <Text style={[s.chipTxt, active && s.chipTxtActive]}>{l}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Pilihan Untukmu ───────────────────────────────────────────── */}
      <View style={[s.sectionRow, { marginTop: 16 }]}>
        <Text style={s.sectionTitle}>Pilihan untukmu</Text>
        <Text style={s.countBadge}>2 program</Text>
      </View>

      {MOCK_PROGRAMS.map((prog) => (
        <View key={prog.id} style={s.programCard}>
          <View style={s.programIconBox}>
            <Ionicons name={prog.icon} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.programTitle}>{prog.title}</Text>
            <Text style={s.programMeta}>{prog.meta}</Text>
            <View style={s.offlinePill}>
              <Ionicons name="cloud-download-outline" size={11} color="#059669" />
              <Text style={s.offlineTxt}>Tersedia offline</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      ))}
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
const PRIMARY   = colors.primary;   // #10B981
const PRIMARY_L = '#D1FAE5';
const PRIMARY_LL= '#ECFDF5';

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },

  /* Header */
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 6,
  },
  dateText:  { fontSize: 12, color: '#6B7280' },
  greetText: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: PRIMARY_L,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
  },
  avatarTxt: { fontSize: 13, fontWeight: 'bold', color: '#047857' },

  /* Judul halaman */
  pageTitle: {
    fontSize: 28, fontWeight: 'bold', color: '#111827',
    marginBottom: 18,
  },

  /* Kalender */
  calHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  calMonth: { fontSize: 14, fontWeight: '700', color: '#111827' },
  calRange: { fontSize: 12, color: '#6B7280' },
  weekRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayBox: {
    alignItems: 'center', paddingVertical: 10,
    borderRadius: 14, backgroundColor: '#FFFFFF',
    width: '13.2%',
  },
  dayBoxActive: { backgroundColor: PRIMARY },
  dayName:  { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  dayNum:   { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  textWhite:{ color: '#FFFFFF' },
  activeDot:{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFFFFF', marginTop: 5 },

  /* Target mingguan */
  targetCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, marginBottom: 24,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  targetRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  targetLabel:{ fontSize: 13, color: '#4B5563', fontWeight: '600' },
  targetVal:  { fontSize: 13, fontWeight: 'bold', color: PRIMARY },
  progressBg: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 8 },
  progressFill:{ width: '50%', height: '100%', backgroundColor: PRIMARY, borderRadius: 3 },
  targetSub:  { fontSize: 12, color: '#6B7280' },

  /* Section */
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  linkGreen:    { fontSize: 13, color: PRIMARY, fontWeight: '600' },
  countBadge:   { fontSize: 12, color: '#059669', fontWeight: '600' },

  /* Jadwal card */
  scheduleCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    overflow: 'hidden', marginBottom: 14,
  },
  imgWrap: { height: 150, position: 'relative', justifyContent: 'flex-end', padding: 10 },
  scheduleImg: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
  },
  durationBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  durationTxt: { fontSize: 12, fontWeight: 'bold', color: '#111827', marginLeft: 4 },
  scheduleBody:    { padding: 14 },
  scheduleMetaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  scheduleInfoTxt: { fontSize: 12, color: '#6B7280' },
  offlinePill: { flexDirection: 'row', alignItems: 'center' },
  offlineTxt:  { fontSize: 11, color: '#059669', marginLeft: 3, fontWeight: '500' },
  scheduleTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  scheduleSub:   { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  startBtn: {
    flexDirection: 'row', backgroundColor: PRIMARY,
    height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  startTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  /* Sesuaikan card */
  customCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#A7F3D0', backgroundColor: PRIMARY_LL,
    borderRadius: 16, padding: 14, marginBottom: 24,
  },
  customLeft:   { flexDirection: 'row', alignItems: 'center' },
  customIconBox:{
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: PRIMARY_L, alignItems: 'center', justifyContent: 'center',
  },
  customTitle:  { fontSize: 15, fontWeight: 'bold', color: '#065F46' },
  customSub:    { fontSize: 12, color: '#047857', marginTop: 2 },

  /* Filter chip */
  filterLabel: { fontSize: 13, color: '#4B5563', fontWeight: '500', marginBottom: 8, marginTop: 2 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 8, marginBottom: 8,
  },
  chipActive:    { borderColor: PRIMARY, backgroundColor: PRIMARY_LL },
  chipTxt:       { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTxtActive: { color: PRIMARY },

  /* Program card */
  programCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 16, padding: 14, marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  programIconBox:{ width: 44, height: 44, borderRadius: 12, backgroundColor: PRIMARY_LL, alignItems: 'center', justifyContent: 'center' },
  programTitle:  { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  programMeta:   { fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 4 },
});
