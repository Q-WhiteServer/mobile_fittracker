import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, Modal, Alert, StyleSheet,
  ScrollView, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { getCachedExercises, getPlans, addExerciseToPlan } from '../../localStore';
import { Loading, Button, EmptyState } from '../../components/ui';
import { colors } from '../../theme';

// ── Palet ─────────────────────────────────────────────────────────────────────
const MINT    = '#10B981';
const MINT_D  = '#059669';
const MINT_L  = '#D1FAE5';
const MINT_LL = '#ECFDF5';
const TEXT    = '#111827';
const MUTED   = '#6B7280';
const BORDER  = '#E5E7EB';
const BG      = '#F9FAFB';
const WHITE   = '#FFFFFF';

const SCREEN_W = Dimensions.get('window').width;
const BANNER_H = 240;

// ── Daftar gerakan default (ditampilkan selagi data dari API dimuat) ──────────
const DEFAULT_GERAKAN = [
  { no: 1, nama: 'Pemanasan',                  detail: '45 detik' },
  { no: 2, nama: 'Goblet Squat',               detail: '12 repetisi' },
  { no: 3, nama: 'Push-Up Lutut',              detail: '10 repetisi' },
  { no: 4, nama: 'Plank',                      detail: '30 detik' },
  { no: 5, nama: 'Glute Bridge',               detail: '12 repetisi' },
  { no: 6, nama: 'Pendinginan & Peregangan',   detail: '60 detik' },
];

// ── Thumbnail placeholder per gerakan (warna berbeda-beda) ───────────────────
const THUMB_COLORS = ['#D1FAE5', '#DBEAFE', '#FEF3C7', '#FCE7F3', '#EDE9FE', '#FEE2E2'];

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams();
  const [ex,            setEx]            = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [plans,         setPlans]         = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [adding,        setAdding]        = useState(false);
  const [bookmarked,    setBookmarked]    = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const res = await api.getExercise(id);
          setEx(res.exercise);
        } catch (e) {
          const cached = await getCachedExercises();
          setEx(cached.find((x) => String(x.id_exercise) === String(id)) || null);
        } finally {
          setLoading(false);
        }
      })();
    }, [id])
  );

  async function loadPlans() {
    setPlans(await getPlans());
  }

  async function handleAddToPlan(planId) {
    if (!ex) return;
    setAdding(true);
    try {
      await addExerciseToPlan(planId, ex, 3, 10);
      Alert.alert('Berhasil', `${ex.nama_gerakan} ditambahkan ke jadwal.`);
      setShowPlanModal(false);
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat menambahkan ke jadwal.');
    } finally {
      setAdding(false);
    }
  }

  function handleStart() {
    if (!ex) return;
    router.push(
      `/timer?nama=${encodeURIComponent(ex.nama_gerakan)}&durasi=${ex.durasi || 30}`
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
        <Loading label="Memuat detail latihan..." />
      </View>
    );
  }

  if (!ex) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG, padding: 24 }}>
        <EmptyState
          title="Latihan tidak ditemukan"
          subtitle="Data latihan ini tidak tersedia."
          action={<Button title="Kembali" onPress={() => router.back()} />}
        />
      </View>
    );
  }

  // Estimasi kalori berdasarkan durasi & kategori
  const estimasiKalori = ex.durasi > 0
    ? Math.round(ex.durasi / 60 * 6)
    : (ex.kategori === 'Kekuatan' ? 80 : ex.kategori === 'Kardio' ? 150 : 60);
  const durasiLabel = ex.durasi > 0
    ? `${ex.durasi >= 60 ? Math.round(ex.durasi / 60) + ' menit' : ex.durasi + ' detik'}`
    : '20 menit';

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Banner Gambar ── */}
        <View style={s.bannerWrap}>
          <Image
            source={require('../../../assets/olahraga.jpg')}
            style={s.bannerImage}
            resizeMode="cover"
          />

          {/* Tombol kembali */}
          <SafeAreaView edges={['top']} style={s.overlayTop}>
            <Pressable style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={TEXT} />
            </Pressable>

            {/* Tombol aksi pojok kanan */}
            <View style={s.actionBtns}>
              <Pressable
                style={s.actionBtn}
                onPress={() => setBookmarked((v) => !v)}
              >
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={bookmarked ? MINT : TEXT}
                />
              </Pressable>
              <Pressable
                style={[s.actionBtn, { marginTop: 8 }]}
                onPress={() => Alert.alert('Unduh', 'Program berhasil disimpan untuk mode offline.')}
              >
                <Ionicons name="download-outline" size={18} color={MINT} />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        {/* ── Konten ── */}
        <View style={s.content}>

          {/* Kategori label */}
          <Text style={s.categoryLabel}>
            {ex.kategori} • {ex.level_kesulitan === 'Pemula' ? 'Seluruh tubuh' : ex.level_kesulitan}
          </Text>

          {/* Judul */}
          <Text style={s.title}>{ex.nama_gerakan}</Text>

          {/* Badge meta */}
          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Ionicons name="time-outline" size={14} color={MUTED} />
              <Text style={s.badgeText}>{durasiLabel}</Text>
            </View>
            <View style={[s.badge, { marginLeft: 8 }]}>
              <Ionicons name="flame-outline" size={14} color={MINT} />
              <Text style={[s.badgeText, { color: MINT }]}>±{estimasiKalori} kkal</Text>
            </View>
          </View>

          {/* Deskripsi */}
          {ex.deskripsi ? (
            <Text style={s.desc}>{ex.deskripsi}</Text>
          ) : (
            <Text style={s.desc}>
              Program latihan kekuatan seluruh tubuh yang dirancang untuk pemula.
              Membantu meningkatkan massa otot dan daya tahan tubuh tanpa perlu ke gym.
            </Text>
          )}

          {/* Card alat */}
          <View style={s.equipmentCard}>
            <View style={s.equipmentIconWrap}>
              <Ionicons name="barbell-outline" size={22} color={MINT} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.equipmentLabel}>Alat yang dibutuhkan</Text>
              <Text style={s.equipmentValue}>Matras, Dumbbell ringan (opsional)</Text>
            </View>
          </View>

          {/* Tambah ke jadwal */}
          <Pressable
            style={s.addPlanBtn}
            onPress={() => { loadPlans(); setShowPlanModal(true); }}
          >
            <Ionicons name="calendar-outline" size={16} color={MINT} />
            <Text style={s.addPlanText}>+ Tambah ke Jadwal</Text>
          </Pressable>

          {/* Daftar Gerakan */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Daftar Gerakan</Text>
            <Text style={s.sectionCount}>{DEFAULT_GERAKAN.length} Gerakan</Text>
          </View>

          {DEFAULT_GERAKAN.map((g, i) => (
            <Pressable
              key={g.no}
              style={s.gerakanCard}
              onPress={() =>
                Alert.alert(
                  g.nama,
                  `${g.detail}\n\n${ex.instruksi || 'Lakukan gerakan dengan kontrol dan napas teratur.'}`,
                )
              }
            >
              {/* Thumbnail */}
              <View style={[s.gerakanThumb, { backgroundColor: THUMB_COLORS[i % THUMB_COLORS.length] }]}>
                <Ionicons name="fitness-outline" size={18} color={MINT_D} />
              </View>

              {/* Info */}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.gerakanName}>{g.no}. {g.nama}</Text>
                <Text style={s.gerakanDetail}>{g.detail}</Text>
              </View>

              {/* Info icon */}
              <View style={s.infoIcon}>
                <Ionicons name="information-circle-outline" size={20} color={MUTED} />
              </View>
            </Pressable>
          ))}

          {/* Instruksi teknis */}
          {ex.instruksi ? (
            <View style={s.instruksiCard}>
              <View style={s.instruksiHeader}>
                <Ionicons name="bulb-outline" size={16} color={MINT} />
                <Text style={s.instruksiTitle}>Tips Teknik</Text>
              </View>
              <Text style={s.instruksiText}>{ex.instruksi}</Text>
            </View>
          ) : null}

          {/* Video */}
          {ex.url_video ? (
            <Pressable
              style={s.videoBtn}
              onPress={() => Alert.alert('Video', ex.url_video)}
            >
              <Ionicons name="play-circle-outline" size={20} color={MINT} />
              <Text style={s.videoBtnText}>Tonton Video Panduan</Text>
            </Pressable>
          ) : null}

          {/* Catat Latihan */}
          <Pressable
            style={s.logBtn}
            onPress={() =>
              router.push({
                pathname: '/log/create',
                params: {
                  id_exercise: String(ex.id_exercise),
                  nama_gerakan: ex.nama_gerakan,
                  kategori: ex.kategori,
                  durasi: String(ex.durasi || 0),
                },
              })
            }
          >
            <Ionicons name="create-outline" size={18} color={MINT} />
            <Text style={s.logBtnText}>Catat Latihan</Text>
          </Pressable>

          <View style={{ height: 90 }} />
        </View>
      </ScrollView>

      {/* ── Tombol Mulai Latihan (fixed bottom) ── */}
      <View style={s.startWrap}>
        <Pressable
          style={({ pressed }) => [s.startBtn, pressed && { opacity: 0.88 }]}
          onPress={handleStart}
        >
          <Ionicons name="play" size={18} color={WHITE} style={{ marginRight: 8 }} />
          <Text style={s.startBtnText}>Mulai Latihan</Text>
        </Pressable>
      </View>

      {/* ── Modal Pilih Jadwal ── */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Tambah ke Jadwal</Text>

            {plans.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="calendar-outline" size={40} color={BORDER} />
                <Text style={{ color: MUTED, marginTop: 8, marginBottom: 16 }}>
                  Belum ada jadwal. Buat jadwal dulu.
                </Text>
                <Pressable
                  style={s.createPlanBtn}
                  onPress={() => { setShowPlanModal(false); router.push('/plan/create'); }}
                >
                  <Text style={s.createPlanBtnText}>Buat Jadwal</Text>
                </Pressable>
              </View>
            ) : (
              plans.map((p) => (
                <Pressable
                  key={p.id}
                  style={s.planRow}
                  onPress={() => handleAddToPlan(p.id)}
                  disabled={adding}
                >
                  <View style={s.planRowIcon}>
                    <Ionicons name="calendar-outline" size={18} color={MINT} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.planName}>{p.nama_plan}</Text>
                    <Text style={s.planMeta}>{p.tanggal} • {p.exercises?.length || 0} gerakan</Text>
                  </View>
                  <Ionicons name="add-circle" size={22} color={MINT} />
                </Pressable>
              ))
            )}

            <Pressable style={s.closePlanBtn} onPress={() => setShowPlanModal(false)}>
              <Text style={s.closePlanBtnText}>Tutup</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── StyleSheet ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 0 },

  // Banner
  bannerWrap:  { width: SCREEN_W, height: BANNER_H, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  overlayTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtns: { alignItems: 'center' },
  actionBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Konten
  content: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingHorizontal: 20, paddingTop: 24 },

  categoryLabel: { fontSize: 13, fontWeight: '700', color: MINT, letterSpacing: 0.3, marginBottom: 4 },
  title:         { fontSize: 26, fontWeight: 'bold', color: TEXT, marginBottom: 12 },

  badgeRow: { flexDirection: 'row', marginBottom: 14 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderRadius: 999, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  badgeText: { fontSize: 13, fontWeight: '600', color: MUTED, marginLeft: 4 },

  desc: { fontSize: 14, color: MUTED, lineHeight: 22, marginBottom: 20 },

  // Alat
  equipmentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: MINT_LL, borderRadius: 14,
    borderWidth: 1, borderColor: MINT_L,
    padding: 14, marginBottom: 16,
  },
  equipmentIconWrap: { width: 42, height: 42, borderRadius: 10, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  equipmentLabel:    { fontSize: 11, fontWeight: '600', color: MINT, marginBottom: 2 },
  equipmentValue:    { fontSize: 14, fontWeight: '700', color: TEXT },

  // Tambah ke jadwal
  addPlanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: MINT, borderRadius: 12,
    paddingVertical: 11, marginBottom: 24,
  },
  addPlanText: { fontSize: 14, fontWeight: '700', color: MINT, marginLeft: 6 },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { fontSize: 17, fontWeight: 'bold', color: TEXT },
  sectionCount:  { fontSize: 13, fontWeight: '600', color: MINT },

  // Gerakan card
  gerakanCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  gerakanThumb: { width: 52, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gerakanName:  { fontSize: 14, fontWeight: '700', color: TEXT },
  gerakanDetail:{ fontSize: 12, color: MUTED, marginTop: 3 },
  infoIcon:     { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  // Instruksi
  instruksiCard: {
    backgroundColor: MINT_LL, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: MINT_L, marginTop: 6, marginBottom: 14,
  },
  instruksiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  instruksiTitle:  { fontSize: 14, fontWeight: '700', color: MINT, marginLeft: 6 },
  instruksiText:   { fontSize: 13, color: '#065F46', lineHeight: 20 },

  // Video
  videoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: MINT, borderRadius: 12,
    paddingVertical: 11, marginBottom: 10,
  },
  videoBtnText: { fontSize: 14, fontWeight: '700', color: MINT, marginLeft: 8 },

  // Log
  logBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingVertical: 11, marginBottom: 10,
  },
  logBtnText: { fontSize: 14, fontWeight: '600', color: MUTED, marginLeft: 8 },

  // Tombol mulai (fixed)
  startWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE, paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: MINT_D, height: 54, borderRadius: 14,
  },
  startBtnText: { fontSize: 16, fontWeight: 'bold', color: WHITE },

  // Modal jadwal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: 'bold', color: TEXT, marginBottom: 16 },
  planRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  planRowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: MINT_LL, alignItems: 'center', justifyContent: 'center' },
  planName:    { fontSize: 14, fontWeight: '700', color: TEXT },
  planMeta:    { fontSize: 12, color: MUTED, marginTop: 2 },
  createPlanBtn: { backgroundColor: MINT, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  createPlanBtnText: { color: WHITE, fontWeight: '700', fontSize: 14 },
  closePlanBtn: {
    marginTop: 16, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  closePlanBtnText: { fontSize: 14, fontWeight: '600', color: MUTED },
});
