import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Image } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { cacheExercises, getCachedExercises } from '../../localStore';
import { Card, Chip, Badge, Field, EmptyState, Loading } from '../../components/ui';
import { colors, typography } from '../../theme';

const FOKUS_LIST = ['Semua', 'Otot Perut', 'Lengan', 'Dada', 'Seluruh tubuh'];
const LEVEL_LIST = ['Semua', 'Rendah', 'Menengah', 'Atas'];

const MOCK_PROGRAMS = [
  {
    id: '1',
    title: 'Core Aktif',
    meta: 'Otot Perut • Menengah • 15 menit',
    offline: true,
    icon: 'flame-outline',
  },
  {
    id: '2',
    title: 'Plank & Stabilitas',
    meta: 'Otot Perut • Menengah • 8 menit',
    offline: true,
    icon: 'pulse-outline',
  },
];

const WEEK_DAYS = [
  { day: 'Sen', date: '12' },
  { day: 'Sel', date: '13' },
  { day: 'Rab', date: '14', active: true },
  { day: 'Kam', date: '15' },
  { day: 'Jum', date: '16' },
  { day: 'Sab', date: '17' },
  { day: 'Min', date: '18' },
];

const OLAHRAGA_IMG = null; // Ganti dengan require setelah bundler clear

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [fokus, setFokus] = useState('Semua');
  const [level, setLevel] = useState('Semua');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getExercises({});
      setExercises(res.exercises || []);
      await cacheExercises(res.exercises || []);
      setOffline(false);
    } catch (e) {
      setOffline(true);
      setExercises(await getCachedExercises());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (fokus !== 'Semua' && ex.kategori !== fokus) return false;
      if (level !== 'Semua' && ex.level_kesulitan !== level) return false;
      if (q && !ex.nama_gerakan.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [exercises, fokus, level, q]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top Bar / Header ── */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.dateHeader}>Rabu, 14 Oktober 2026</Text>
          <Text style={styles.greetingHeader}>Halo, Valentina. Siap bergerak?</Text>
        </View>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>VM</Text>
        </View>
      </View>

      <Text style={styles.mainTitle}>Latihan</Text>

      {/* ── Kalender Mingguan ── */}
      <View style={styles.calendarHeaderRow}>
        <Text style={styles.calendarMonth}>Oktober 2026</Text>
        <Text style={styles.calendarRange}>12–18 Okt</Text>
      </View>
      <View style={styles.weekContainer}>
        {WEEK_DAYS.map((item, index) => (
          <View
            key={index}
            style={[styles.weekDayBox, item.active && styles.weekDayBoxActive]}
          >
            <Text style={[styles.weekDayName, item.active && styles.textActive]}>
              {item.day}
            </Text>
            <Text style={[styles.weekDayNum, item.active && styles.textActive]}>
              {item.date}
            </Text>
            {item.active && <View style={styles.activeDot} />}
          </View>
        ))}
      </View>

      {/* ── Target Mingguan ── */}
      <View style={styles.targetCard}>
        <View style={styles.targetRow}>
          <Text style={styles.targetTitle}>Target mingguan</Text>
          <Text style={styles.targetValue}>2 / 4 latihan</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={styles.progressBarFill} />
        </View>
        <Text style={styles.targetSubtitle}>
          Dua sesi lagi untuk mencapai targetmu!
        </Text>
      </View>

      {/* ── Jadwal Hari Ini ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Jadwal hari ini</Text>
        <Pressable>
          <Text style={styles.linkGreen}>Lihat jadwal</Text>
        </Pressable>
      </View>

      <View style={styles.scheduleCard}>
        <View style={styles.scheduleImageWrap}>
          {/* Menggunakan asset olahraga.jpg */}
          {OLAHRAGA_IMG ? (
            <Image
              source={OLAHRAGA_IMG}
              style={styles.scheduleImg}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.scheduleImg, { backgroundColor: colors.primary, opacity: 0.85 }]} />
          )}
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={14} color="#111827" />
            <Text style={styles.durationText}>25 menit</Text>
          </View>
        </View>
        <View style={styles.scheduleContent}>
          <View style={styles.scheduleSubRow}>
            <Text style={styles.scheduleInfo}>18.00 • Latihan di rumah</Text>
            <View style={styles.offlineRow}>
              <Ionicons name="cloud-download-outline" size={12} color="#059669" />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          </View>
          <Text style={styles.scheduleMainTitle}>Core & Kekuatan</Text>
          <Text style={styles.scheduleMeta}>
            Otot Perut • Menengah • 6 gerakan
          </Text>

          <Pressable style={styles.startButton} onPress={() => router.push('/timer')}>
            <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.startText}>Mulai latihan</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Tombol Sesuaikan Latihan ── */}
      <Pressable style={styles.customCard} onPress={() => router.push('/plan/create')}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.customIconBox}>
            <Ionicons name="options-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.customTitle}>Sesuaikan Latihan</Text>
            <Text style={styles.customSubtitle}>Susun program versimu sendiri.</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>

      {/* ── Temukan Latihan yang Pas ── */}
      <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
        Temukan latihan yang pas
      </Text>
      <Text style={styles.filterLabel}>Fokus otot</Text>
      <View style={styles.chips}>
        {FOKUS_LIST.map((k) => (
          <Chip key={k} label={k} active={fokus === k} onPress={() => setFokus(k)} />
        ))}
      </View>

      <Text style={styles.filterLabel}>Tingkat kesulitan</Text>
      <View style={styles.chips}>
        {LEVEL_LIST.map((l) => (
          <Chip key={l} label={l} active={level === l} onPress={() => setLevel(l)} />
        ))}
      </View>

      {/* ── Pilihan Untukmu ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Pilihan untukmu</Text>
        <Text style={styles.programCountText}>2 program</Text>
      </View>

      {MOCK_PROGRAMS.map((prog) => (
        <Pressable key={prog.id} style={styles.programCard}>
          <View style={styles.programIconBox}>
            <Ionicons name={prog.icon} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.programTitle}>{prog.title}</Text>
            <Text style={styles.programMeta}>{prog.meta}</Text>
            <View style={styles.offlineRow}>
              <Ionicons name="cloud-download-outline" size={12} color="#059669" />
              <Text style={styles.offlineText}>Tersedia offline</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateHeader: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  greetingHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#047857',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarMonth: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  calendarRange: {
    fontSize: 12,
    color: '#6B7280',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weekDayBox: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    width: '13.5%',
  },
  weekDayBoxActive: {
    backgroundColor: colors.primary,
  },
  weekDayName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  weekDayNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  textActive: {
    color: '#FFFFFF',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 6,
  },
  targetCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  targetTitle: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  targetValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    width: '50%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  targetSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
  },
  linkGreen: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  scheduleImageWrap: {
    height: 160,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 12,
  },
  scheduleImg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  durationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 4,
  },
  scheduleContent: {
    padding: 16,
  },
  scheduleSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleInfo: {
    fontSize: 12,
    color: '#6B7280',
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  offlineText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 4,
    fontWeight: '500',
  },
  scheduleMainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  scheduleMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 14,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  customCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  customIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#065F46',
  },
  customSubtitle: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  filterLabel: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 8,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  programCountText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  programIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  programMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 4,
  },
});