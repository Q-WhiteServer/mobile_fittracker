/**
 * plan/[id].js — Detail Jadwal Latihan
 *
 * Strategi load:
 *   1. Coba GET /plans/:id dari backend → dapat plan + exercises lengkap
 *   2. Fallback ke AsyncStorage lokal jika offline
 *
 * Setiap mutasi (tambah/hapus latihan, hapus plan) langsung dikirim ke
 * backend via api.js, lalu data di-reload dari sumber yang sama.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, Modal, Alert, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import {
  getPlan, updatePlan, deletePlan,
  getCachedExercises, cacheExercises,
} from '../../localStore';
import { Card, Field, Badge, Button, EmptyState, SectionHeader, Loading } from '../../components/ui';
import { colors, typography } from '../../theme';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatTanggal(t) {
  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t;
    return `${HARI[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch { return t; }
}

// ── Komponen kartu latihan dalam jadwal ──────────────────────────────────────
function ExerciseItem({ pe, onRemove, onTimer, onLog }) {
  return (
    <Card style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: colors.text }}>{pe.nama_gerakan}</Text>
        <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
          <Badge text={`${pe.target_set} set × ${pe.target_reps} reps`} color={colors.primary} />
          {pe.kategori ? <Badge text={pe.kategori} color={colors.accent} /> : null}
          {pe.level_kesulitan ? <Badge text={pe.level_kesulitan} color={colors.muted} /> : null}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <Pressable style={styles.miniBtn} onPress={onTimer}>
            <Ionicons name="timer-outline" size={16} color={colors.primary} />
            <Text style={styles.miniText}>Mulai</Text>
          </Pressable>
          <Pressable style={[styles.miniBtn, { marginLeft: 8 }]} onPress={onLog}>
            <Ionicons name="create-outline" size={16} color={colors.accent} />
            <Text style={[styles.miniText, { color: colors.accent }]}>Catat</Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close-circle-outline" size={22} color={colors.muted} />
      </Pressable>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams();

  // plan dari backend: { id_plan, nama_plan, tanggal, hari, catatan, exercises: [...] }
  const [plan,       setPlan]       = useState(null);
  const [planLocal,  setPlanLocal]  = useState(null); // referensi lokal untuk id_plan
  const [exercises,  setExercises]  = useState([]);   // katalog untuk modal tambah
  const [loading,    setLoading]    = useState(true);
  const [offline,    setOffline]    = useState(false);

  const [showAdd,  setShowAdd]  = useState(false);
  const [pickSet,  setPickSet]  = useState('3');
  const [pickReps, setPickReps] = useState('10');
  const [saving,   setSaving]   = useState(false);

  // ── Load: backend dulu, fallback lokal ───────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    try {
      // Cari id_plan backend: id lokal bisa berupa string pendek, id backend integer
      // Cek lokal store untuk mapping id → id_plan
      const localPlan = await getPlan(id);
      setPlanLocal(localPlan);
      const backendId = localPlan?.id_plan ?? id;

      const res = await api.getPlan(backendId);
      // Backend response: { plan: {...}, exercises: [{id_plan_exercise, id_exercise, nama_gerakan, ...}] }
      const merged = {
        ...res.plan,
        id: id, // pertahankan id lokal untuk navigasi
        exercises: res.exercises || [],
      };
      setPlan(merged);
    } catch {
      // Fallback ke AsyncStorage lokal
      setOffline(true);
      const local = await getPlan(id);
      setPlan(local);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load katalog latihan untuk modal tambah (dari cache / backend)
  const loadExercises = useCallback(async () => {
    try {
      const cached = await getCachedExercises();
      if (cached.length > 0) { setExercises(cached); return; }
      const res = await api.getExercises({});
      const list = res.exercises || [];
      await cacheExercises(list);
      setExercises(list);
    } catch {
      setExercises(await getCachedExercises());
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      loadExercises();
    }, [load, loadExercises])
  );

  // ── Latihan yang belum ada di plan (untuk modal tambah) ──────────────────
  function notInPlan() {
    if (!plan) return exercises;
    const ids = new Set((plan.exercises || []).map((e) => String(e.id_exercise)));
    return exercises.filter((e) => !ids.has(String(e.id_exercise)));
  }

  // ── Tambah latihan ke jadwal ─────────────────────────────────────────────
  async function handleAdd(ex) {
    setSaving(true);
    try {
      const backendId = planLocal?.id_plan ?? id;
      if (!offline && backendId && !String(backendId).startsWith('l')) {
        // Kirim langsung ke backend: POST /plans/:id/exercises
        await api.addPlanExercise(backendId, {
          id_exercise: ex.id_exercise,
          target_set:  Number(pickSet)  || 3,
          target_reps: Number(pickReps) || 10,
        });
      } else {
        // Fallback: simpan lokal
        const { addExerciseToPlan } = await import('../../localStore');
        await addExerciseToPlan(id, ex, Number(pickSet) || 3, Number(pickReps) || 10);
      }
      await load();
      setShowAdd(false);
    } catch (e) {
      Alert.alert('Gagal', e.message || 'Tidak dapat menambah latihan.');
    } finally {
      setSaving(false);
    }
  }

  // ── Hapus latihan dari jadwal ────────────────────────────────────────────
  async function handleRemove(pe) {
    // Konfirmasi
    Alert.alert('Hapus Latihan', `Hapus "${pe.nama_gerakan}" dari jadwal ini?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            const backendId = planLocal?.id_plan ?? id;
            if (!offline && pe.id_plan_exercise && !String(backendId).startsWith('l')) {
              // Backend: PUT /plans/:id dengan exercises yang difilter
              const remaining = (plan.exercises || [])
                .filter((e) => e.id_plan_exercise !== pe.id_plan_exercise)
                .map((e) => ({
                  id_exercise: e.id_exercise,
                  target_set:  e.target_set,
                  target_reps: e.target_reps,
                }));
              await api.updatePlan(backendId, {
                nama_plan: plan.nama_plan,
                tanggal:   plan.tanggal,
                hari:      plan.hari,
                catatan:   plan.catatan,
                exercises: remaining,
              });
            } else {
              // Fallback lokal
              const { removeExerciseFromPlan } = await import('../../localStore');
              await removeExerciseFromPlan(id, pe.id_plan_exercise);
            }
            await load();
          } catch (e) {
            Alert.alert('Gagal', e.message || 'Tidak dapat menghapus latihan.');
          }
        },
      },
    ]);
  }

  // ── Hapus seluruh jadwal ─────────────────────────────────────────────────
  function handleDelete() {
    Alert.alert('Hapus Jadwal', 'Yakin ingin menghapus jadwal ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            const backendId = planLocal?.id_plan ?? id;
            if (!offline && backendId && !String(backendId).startsWith('l')) {
              await api.deletePlan(backendId);
            }
            // Hapus dari lokal juga
            await deletePlan(id);
            router.replace('/(tabs)/schedule');
          } catch (e) {
            Alert.alert('Gagal', e.message || 'Tidak dapat menghapus jadwal.');
          }
        },
      },
    ]);
  }

  // ── Render: loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Loading label="Memuat jadwal..." />
      </View>
    );
  }

  // ── Render: plan tidak ditemukan ─────────────────────────────────────────
  if (!plan) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 }}>
        <EmptyState
          title="Jadwal tidak ditemukan"
          subtitle="Jadwal ini mungkin sudah dihapus atau belum tersinkron."
          action={<Button title="Kembali" onPress={() => router.back()} />}
        />
      </View>
    );
  }

  const planExercises = plan.exercises || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

        {/* ── Badge offline ── */}
        {offline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#B45309" />
            <Text style={styles.offlineTxt}>Mode offline — data mungkin belum terbaru</Text>
          </View>
        )}

        {/* ── Header plan ── */}
        <View style={[styles.row, { marginBottom: 4 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.planTitle}>{plan.nama_plan}</Text>
            <Text style={[typography.muted, { marginTop: 2 }]}>{formatTanggal(plan.tanggal)}</Text>
            {plan.hari ? <Text style={[typography.muted]}>{plan.hari}</Text> : null}
          </View>
          <Pressable onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </Pressable>
        </View>

        {plan.catatan ? (
          <Text style={[typography.body, { marginTop: 6, marginBottom: 12, color: colors.muted }]}>
            {plan.catatan}
          </Text>
        ) : null}

        {/* ── Daftar latihan ── */}
        <SectionHeader title={`Latihan (${planExercises.length})`} />

        {planExercises.length === 0 ? (
          <EmptyState
            title="Belum ada latihan"
            subtitle="Tambahkan latihan ke jadwal ini."
            action={<Button title="+ Tambah Latihan" onPress={() => setShowAdd(true)} />}
          />
        ) : (
          planExercises.map((pe) => (
            <ExerciseItem
              key={pe.id_plan_exercise ?? pe.id_exercise}
              pe={pe}
              onRemove={() => handleRemove(pe)}
              onTimer={() => router.push(
                `/timer?nama=${encodeURIComponent(pe.nama_gerakan)}&durasi=${pe.durasi || 30}`
              )}
              onLog={() => router.push({
                pathname: '/log/create',
                params: {
                  id_exercise:  String(pe.id_exercise),
                  nama_gerakan: pe.nama_gerakan,
                  kategori:     pe.kategori || '',
                  durasi:       String(pe.durasi || 0),
                },
              })}
            />
          ))
        )}

        <Button
          title="+ Tambah Latihan"
          variant="outline"
          onPress={() => setShowAdd(true)}
          style={{ marginTop: 8 }}
        />

      </ScrollView>

      {/* ── Modal: Tambah Latihan ── */}
      <Modal
        visible={showAdd}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <SectionHeader title="Tambah Latihan ke Jadwal" />

            {/* Target set & reps */}
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={typography.label}>Target Set</Text>
                <Field
                  value={pickSet}
                  onChangeText={(v) => setPickSet(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.label}>Target Reps</Text>
                <Field
                  value={pickReps}
                  onChangeText={(v) => setPickReps(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Daftar latihan yang belum ada di plan */}
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {notInPlan().length === 0 ? (
                <EmptyState title="Semua latihan sudah ditambah" />
              ) : (
                notInPlan().map((ex) => (
                  <Pressable
                    key={ex.id_exercise}
                    style={[styles.option, saving && { opacity: 0.5 }]}
                    onPress={() => !saving && handleAdd(ex)}
                    disabled={saving}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: colors.text }}>{ex.nama_gerakan}</Text>
                      <Text style={typography.muted}>{ex.kategori} • {ex.level_kesulitan}</Text>
                    </View>
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>

            <Button
              title="Tutup"
              variant="outline"
              onPress={() => setShowAdd(false)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center' },
  planTitle:{ fontSize: 22, fontWeight: 'bold', color: colors.text },
  item:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  miniBtn:  {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, borderWidth: 1, borderColor: colors.border,
  },
  miniText: { marginLeft: 4, fontSize: 13, fontWeight: '700', color: colors.primary },
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:    {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 34,
  },
  option: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF3C7', borderRadius: 10,
    padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  offlineTxt: { fontSize: 12, color: '#B45309', marginLeft: 8 },
});
