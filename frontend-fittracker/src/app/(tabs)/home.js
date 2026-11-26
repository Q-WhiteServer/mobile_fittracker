import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView,
  StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { getStats as getStatsLocal } from '../../localStore';
import { colors } from '../../theme';

// ── Aset gambar ──────────────────────────────────────────────────────────────
let OLAHRAGA_IMG = null;
try { OLAHRAGA_IMG = require('../../../assets/olahraga.jpg'); } catch {}

// ── Konstanta ─────────────────────────────────────────────────────────────────
const FOKUS_LIST = ['Otot Perut', 'Lengan', 'Dada', 'Seluruh tubuh'];
const LEVEL_LIST = ['Rendah', 'Menengah', 'Atas'];

const MOCK_PROGRAMS = [
  { id: '1', title: 'Core Aktif',         meta: 'Otot Perut • Menengah • 15 menit', icon: 'flame-outline' },
  { id: '2', title: 'Plank & Stabilitas', meta: 'Otot Perut • Menengah • 8 menit',  icon: 'pulse-outline' },
];

const HARI_ID    = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const HARI_SHORT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const BULAN_ID   = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];
const BULAN_SHORT= ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayLabel() {
  const d = new Date();
  return `${HARI_ID[d.getDay()]}, ${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function buildWeekDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    return {
      short:   HARI_SHORT[d.getDay()],
      date:    d.getDate(),
      month:   d.getMonth(),
      year:    d.getFullYear(),
      isToday: d.toDateString() === today.toDateString(),
      iso:     d.toISOString().slice(0, 10),
    };
  });
}

function initials(name) {
  return (name || 'U').split(' ').slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '').join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const { user } = useAuth();

  const [stats,        setStats]        = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [weekDays]                      = useState(() => buildWeekDays());
  const [activeDay,    setActiveDay]    = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [fokus, setFokus] = useState('Otot Perut');
  const [level, setLevel] = useState('Menengah');

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoadingStats(true);
      try {
        const res = await api.getStats();
        setStats(res.stats);
      } catch {
        try { setStats(await getStatsLocal()); } catch { setStats(null); }
      } finally {
        setLoadingStats(false);
      }
    })();
  }, []));

  const namaDepan = user?.nama_lengkap?.split(' ')[0] || 'Kamu';
  const ini       = initials(user?.nama_lengkap);

  const targetMinggu  = 4;
  const latihanMinggu = stats?.latihan_minggu_ini ?? 2;
  const progressPct   = Math.min(latihanMinggu / targetMinggu, 1);
  const sisaLatihan   = Math.max(targetMinggu - latihanMinggu, 0);

  const firstDay   = weekDays[0];
  const lastDay    = weekDays[6];
  const bulanLabel = `${BULAN_ID[firstDay.month]} ${firstDay.year}`;
  const rangeLabel = `${firstDay.date}–${lastDay.date} ${BULAN_SHORT[lastDay.month]}`;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. Header Sapaan & Profil ── */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.dateText}>{todayLabel()}</Text>
          <Text style={s.greetText}>Halo, {namaDepan}. Siap bergerak?</Text>
        </View>
        <Pressable style={s.avatar} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={s.avatarTxt}>{ini}</Text>
        </Pressable>
      </View>

      <Text style={s.pageTitle}>Latihan</Text>

      {/* ── 2. Kalender Mingguan ── */}
      <View style={s.calHeaderRow}>
        <Text style={s.calMonth}>{bulanLabel}</Text>
        <Text style={s.calRange}>{rangeLabel}</Text>
      </View>
      <View style={s.weekRow}>
        {weekDays.map((item) => {
          const isActive = item.iso === activeDay;
          return (
            <Pressable
              key={item.iso}
              style={[s.dayBox, isActive && s.dayBoxActive]}
              onPress={() => setActiveDay(item.iso)}
            >
              <Text style={[s.dayName, isActive && s.textWhite]}>{item.short}</Text>
              <Text style={[s.dayNum,  isActive && s.textWhite]}>{item.date}</Text>
              {item.isToday && (
                <View style={[s.activeDot,
                  { backgroundColor: isActive ? '#FFF' : colors.primary }
                ]} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── 3. Target Mingguan ── */}
      {loadingStats ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : (
        <View style={s.targetCard}>
          <View style={s.targetRow}>
            <Text style={s.targetLabel}>Target mingguan</Text>
            <Text style={s.targetVal}>{latihanMinggu} / {targetMinggu} latihan</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${Math.round(progressPct * 100)}%` }]} />
          </View>
          <Text style={s.targetSub}>
            {sisaLatihan === 0
              ? '🎉 Target minggu ini tercapai!'
              : `${sisaLatihan === 2 ? 'Dua' : sisaLatihan} sesi lagi untuk mencapai targetmu!`}
          </Text>
        </View>
      )}

      {/* ── 4. Jadwal Hari Ini ── */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>Jadwal hari ini</Text>
        <Pressable onPress={() => router.push('/(tabs)/schedule')}>
          <Text style={s.linkGreen}>Lihat jadwal</Text>
        </Pressable>
      </View>

      {/* Card jadwal (mock sesuai desain) */}
      <View style={s.scheduleCard}>
        <View style={s.imgWrap}>
          {OLAHRAGA_IMG ? (
            <Image source={OLAHRAGA_IMG} style={s.scheduleImg} resizeMode="cover" />
          ) : (
            <View style={[s.scheduleImg, { backgroundColor: colors.primary, opacity: 0.8 }]} />
          )}
          <View style={s.durationBadge}>
            <Ionicons name="time-outline" size={13} color="#111827" />
            <Text style={s.durationTxt}>25 menit</Text>
          </View>
        </View>
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

      {/* ── Sesuaikan Latihan ── */}
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

      {/* ── 5. Filter "Temukan latihan yang pas" ── */}
      <Text style={[s.sectionTitle, { marginBottom: 14 }]}>
        Temukan latihan yang pas
      </Text>

      <Text style={s.filterLabel}>Fokus otot</Text>
      <View style={s.chipRow}>
        {FOKUS_LIST.map((k) => (
          <Pressable
            key={k}
            style={[s.chip, fokus === k && s.chipActive]}
            onPress={() => setFokus(k)}
          >
            <Text style={[s.chipTxt, fokus === k && s.chipTxtActive]}>{k}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.filterLabel}>Tingkat kesulitan</Text>
      <View style={s.chipRow}>
        {LEVEL_LIST.map((l) => (
          <Pressable
            key={l}
            style={[s.chip, level === l && s.chipActive]}
            onPress={() => setLevel(l)}
          >
            <Text style={[s.chipTxt, level === l && s.chipTxtActive]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── 6. Pilihan Untukmu ── */}
      <View style={[s.sectionRow, { marginTop: 16 }]}>
        <Text style={s.sectionTitle}>Pilihan untukmu</Text>
        <Text style={s.countBadge}>2 program</Text>
      </View>

      {MOCK_PROGRAMS.map((prog) => (
        <Pressable
          key={prog.id}
          style={s.programCard}
          onPress={() => router.push({ pathname: `/program/${prog.id}`, params: { id: prog.id } })}
        >
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
        </Pressable>
      ))}

      {/* ── Tombol akses GIF Test ── */}
      <Pressable
        style={s.gifTestBtn}
        onPress={() => router.push('/gif-test')}
      >
        <Text style={s.gifTestIcon}>🎞️</Text>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.gifTestTitle}>Test GIF Animasi</Text>
          <Text style={s.gifTestSub}>Ketuk untuk buka halaman percobaan GIF</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </Pressable>

    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
const PRIMARY    = colors.primary;
const PRIMARY_L  = '#D1FAE5';
const PRIMARY_LL = '#ECFDF5';

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },

  /* Header */
  headerRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  dateText:   { fontSize: 12, color: '#6B7280' },
  greetText:  { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: PRIMARY, alignItems: 'center',
    justifyContent: 'center', marginLeft: 12,
  },
  avatarTxt: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 18 },

  /* Kalender */
  calHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  calMonth:  { fontSize: 14, fontWeight: '700', color: '#111827' },
  calRange:  { fontSize: 12, color: '#6B7280' },
  weekRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayBox: {
    alignItems: 'center', paddingVertical: 10,
    borderRadius: 14, backgroundColor: '#FFFFFF',
    width: '13.2%',
  },
  dayBoxActive: { backgroundColor: PRIMARY },
  dayName:   { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  dayNum:    { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  textWhite: { color: '#FFFFFF' },
  activeDot: { width: 5, height: 5, borderRadius: 3, marginTop: 5 },

  /* Loading */
  loadingBox: {
    paddingVertical: 20, alignItems: 'center', marginBottom: 16,
  },

  /* Target mingguan */
  targetCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, marginBottom: 24,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  targetRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  targetLabel: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  targetVal:   { fontSize: 13, fontWeight: 'bold', color: PRIMARY },
  progressBg:  { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 8 },
  progressFill:{ height: '100%', backgroundColor: PRIMARY, borderRadius: 3 },
  targetSub:   { fontSize: 12, color: '#6B7280' },

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
  scheduleImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  durationBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  durationTxt:    { fontSize: 12, fontWeight: 'bold', color: '#111827', marginLeft: 4 },
  scheduleBody:   { padding: 14 },
  scheduleMetaRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  scheduleInfoTxt:{ fontSize: 12, color: '#6B7280' },
  offlinePill:    { flexDirection: 'row', alignItems: 'center' },
  offlineTxt:     { fontSize: 11, color: '#059669', marginLeft: 3, fontWeight: '500' },
  scheduleTitle:  { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  scheduleSub:    { fontSize: 13, color: '#6B7280', marginBottom: 14 },
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
  customLeft:    { flexDirection: 'row', alignItems: 'center' },
  customIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: PRIMARY_L, alignItems: 'center', justifyContent: 'center',
  },
  customTitle: { fontSize: 15, fontWeight: 'bold', color: '#065F46' },
  customSub:   { fontSize: 12, color: '#047857', marginTop: 2 },

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
  programIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: PRIMARY_LL, alignItems: 'center', justifyContent: 'center',
  },
  programTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  programMeta:  { fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 4 },

  /* GIF Test button */
  gifTestBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    padding: 14, marginTop: 4,
  },
  gifTestIcon:  { fontSize: 24 },
  gifTestTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  gifTestSub:   { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
