/**
 * home.js — Tab "Latihan" (Beranda)
 *
 * Statistik diambil dari GET /stats (backend).
 * Jadwal hari ini diambil dari GET /plans (backend/lokal).
 * Kalender mingguan dinamis mengikuti tanggal nyata.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Image, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { getStats as getStatsLocal, refreshPlansFromBackend, getPlans } from '../../localStore';
import { colors } from '../../theme';

// ── Aset gambar ──────────────────────────────────────────────────────────────
let OLAHRAGA_IMG = null;
try { OLAHRAGA_IMG = require('../../../assets/olahraga.jpg'); } catch {}

// ── Konstanta filter (UI dekoratif) ──────────────────────────────────────────
const FOKUS_LIST = ['Otot Perut', 'Lengan', 'Dada', 'Seluruh tubuh'];
const LEVEL_LIST = ['Rendah', 'Menengah', 'Atas'];

// ── Helper tanggal ────────────────────────────────────────────────────────────
const HARI_ID  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const HARI_SHORT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                  'Juli','Agustus','September','Oktober','November','Desember'];
const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function todayLabel() {
  const d = new Date();
  return `${HARI_ID[d.getDay()]}, ${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/** Bangun 7 hari dari Senin minggu ini */
function buildWeekDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Minggu
  // Senin = dow==1 → offset 0; Minggu = dow==0 → offset -6
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    return {
      short: HARI_SHORT[d.getDay()],
      date:  d.getDate(),
      month: d.getMonth(),
      year:  d.getFullYear(),
      isToday: d.toDateString() === today.toDateString(),
      iso: d.toISOString().slice(0, 10),
    };
  });
}

/** Format tanggal ISO ke label singkat */
function fmtTanggal(iso) {
  try {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return `${HARI_SHORT[date.getDay()]}, ${d} ${BULAN_SHORT[m - 1]}`;
  } catch { return iso; }
}

function initials(name) {
  return (name || 'U').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

// ── Komponen StatCard ─────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={s.statVal}>{value ?? '—'}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const { user } = useAuth();

  const [stats,       setStats]       = useState(null);
  const [loadingStats,setLoadingStats]= useState(true);
  const [planHariIni, setPlanHariIni] = useState(null);
  const [weekDays]                    = useState(() => buildWeekDays());
  const [activeDay,   setActiveDay]   = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const [fokus, setFokus] = useState('Otot Perut');
  const [level, setLevel] = useState('Menengah');

  // ── Load stats dari API, fallback ke lokal ────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.getStats();
      setStats(res.stats);
    } catch {
      // Fallback ke kalkulasi lokal jika offline
      try {
        const local = await getStatsLocal();
        setStats(local);
      } catch {
        setStats(null);
      }
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── Load jadwal hari ini ──────────────────────────────────────────────────
  const loadPlans = useCallback(async () => {
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      // Coba refresh dari backend dulu
      const fresh = await refreshPlansFromBackend();
      const plans = fresh ?? await getPlans();
      // Ambil plan yang jadwalnya hari ini
      const hariIni = plans.find((p) => p.tanggal?.slice(0, 10) === todayIso) || null;
      setPlanHariIni(hariIni);
    } catch {
      setPlanHariIni(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadPlans();
    }, [loadStats, loadPlans])
  );

  const namaDepan = user?.nama_lengkap?.split(' ')[0] || 'Kamu';
  const ini = initials(user?.nama_lengkap);

  // Kalkulasi progress mingguan
  const targetMinggu   = 4;
  const latihanMinggu  = stats?.latihan_minggu_ini ?? 0;
  const progressPct    = Math.min(latihanMinggu / targetMinggu, 1);
  const sisaLatihan    = Math.max(targetMinggu - latihanMinggu, 0);

  // ── Header bulan + range minggu ───────────────────────────────────────────
  const firstDay  = weekDays[0];
  const lastDay   = weekDays[6];
  const bulanLabel = `${BULAN_ID[firstDay.month]} ${firstDay.year}`;
  const rangeLabel = `${firstDay.date}–${lastDay.date} ${BULAN_SHORT[lastDay.month]}`;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header Sapaan ── */}
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

      {/* ── Kalender Mingguan (dinamis) ── */}
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
              <Text style={[s.dayNum, isActive && s.textWhite]}>{item.date}</Text>
              {item.isToday && <View style={[s.activeDot, { backgroundColor: isActive ? '#FFF' : colors.primary }]} />}
            </Pressable>
          );
        })}
      </View>

      {/* ── Statistik dari API ── */}
      {loadingStats ? (
        <View style={s.statsLoadingBox}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={s.statsLoadingTxt}>Memuat statistik...</Text>
        </View>
      ) : (
        <>
          {/* Target mingguan */}
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
                : `${sisaLatihan} sesi lagi untuk mencapai targetmu!`}
            </Text>
          </View>

          {/* 3 kartu statistik */}
          <View style={s.statsRow}>
            <StatCard
              icon="barbell-outline"
              value={stats?.total_latihan_selesai ?? 0}
              label="Total latihan"
              color={colors.primary}
            />
            <StatCard
              icon="calendar-outline"
              value={stats?.total_jadwal ?? 0}
              label="Jadwal"
              color="#0EA5E9"
            />
            <StatCard
              icon="flame-outline"
              value={stats?.latihan_minggu_ini ?? 0}
              label="Minggu ini"
              color="#F59E0B"
            />
          </View>
        </>
      )}

      {/* ── Jadwal Hari Ini (dari API) ── */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>Jadwal hari ini</Text>
        <Pressable onPress={() => router.push('/(tabs)/schedule')}>
          <Text style={s.linkGreen}>Lihat jadwal</Text>
        </Pressable>
      </View>

      {planHariIni ? (
        /* Ada jadwal hari ini */
        <Pressable
          style={s.scheduleCard}
          onPress={() => router.push(`/plan/${planHariIni.id}`)}
        >
          <View style={s.imgWrap}>
            {OLAHRAGA_IMG ? (
              <Image source={OLAHRAGA_IMG} style={s.scheduleImg} resizeMode="cover" />
            ) : (
              <View style={[s.scheduleImg, { backgroundColor: colors.primary, opacity: 0.8 }]} />
            )}
            <View style={s.durationBadge}>
              <Ionicons name="barbell-outline" size={13} color="#111827" />
              <Text style={s.durationTxt}>
                {planHariIni.exercises?.length || planHariIni.jumlah_latihan || 0} gerakan
              </Text>
            </View>
          </View>
          <View style={s.scheduleBody}>
            <View style={s.scheduleMetaRow}>
              <Text style={s.scheduleInfoTxt}>
                {fmtTanggal(planHariIni.tanggal)} • {planHariIni.hari || ''}
              </Text>
            </View>
            <Text style={s.scheduleTitle} numberOfLines={1}>{planHariIni.nama_plan}</Text>
            {planHariIni.catatan ? (
              <Text style={s.scheduleSub} numberOfLines={2}>{planHariIni.catatan}</Text>
            ) : null}
            <Pressable
              style={s.startBtn}
              onPress={() => router.push('/timer')}
            >
              <Ionicons name="play" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={s.startTxt}>Mulai latihan</Text>
            </Pressable>
          </View>
        </Pressable>
      ) : (
        /* Tidak ada jadwal hari ini */
        <View style={s.emptyScheduleCard}>
          <Ionicons name="calendar-outline" size={28} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={s.emptyScheduleTitle}>Belum ada jadwal hari ini</Text>
          <Text style={s.emptyScheduleSub}>Buat jadwal latihan untuk mulai bergerak.</Text>
          <Pressable style={s.emptyScheduleBtn} onPress={() => router.push('/plan/create')}>
            <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={s.emptyScheduleBtnTxt}>Buat Jadwal</Text>
          </Pressable>
        </View>
      )}

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

      {/* ── Filter + Navigasi ke katalog ── */}
      <Text style={[s.sectionTitle, { marginTop: 4, marginBottom: 14 }]}>
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

      {/* Tombol buka katalog */}
      <Pressable
        style={s.katalogBtn}
        onPress={() => router.push('/(tabs)/exercises')}
      >
        <Ionicons name="search-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={s.katalogTxt}>Lihat Katalog Latihan</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginLeft: 'auto' }} />
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
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
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

  /* Stats loading */
  statsLoadingBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 24, marginBottom: 16,
  },
  statsLoadingTxt: { marginLeft: 10, color: '#9CA3AF', fontSize: 13 },

  /* Stats row */
  statsRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
    marginHorizontal: 3,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  statVal:   { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, textAlign: 'center' },

  /* Target mingguan */
  targetCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, marginBottom: 16,
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

  /* Jadwal card */
  scheduleCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    overflow: 'hidden', marginBottom: 14,
  },
  imgWrap: { height: 150, position: 'relative', justifyContent: 'flex-end', padding: 10 },
  scheduleImg: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
  },
  durationBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  durationTxt:   { fontSize: 12, fontWeight: 'bold', color: '#111827', marginLeft: 4 },
  scheduleBody:  { padding: 14 },
  scheduleMetaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  scheduleInfoTxt:{ fontSize: 12, color: '#6B7280' },
  scheduleTitle:  { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  scheduleSub:    { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  startBtn: {
    flexDirection: 'row', backgroundColor: PRIMARY,
    height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  startTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  /* Empty jadwal */
  emptyScheduleCard: {
    backgroundColor: PRIMARY_LL, borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 14,
    borderWidth: 1, borderColor: PRIMARY_L,
  },
  emptyScheduleTitle: { fontSize: 15, fontWeight: 'bold', color: '#065F46', marginBottom: 4 },
  emptyScheduleSub:   { fontSize: 13, color: '#047857', marginBottom: 14, textAlign: 'center' },
  emptyScheduleBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PRIMARY, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  emptyScheduleBtnTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

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

  /* Tombol katalog */
  katalogBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1.5, borderColor: PRIMARY_L,
    paddingHorizontal: 16, paddingVertical: 14,
    marginTop: 8,
  },
  katalogTxt: { fontSize: 14, fontWeight: '600', color: PRIMARY },
});
