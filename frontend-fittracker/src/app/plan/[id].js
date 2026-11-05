import { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPlan, updatePlan, removeExerciseFromPlan, addExerciseToPlan, getCachedExercises, deletePlan } from '../../localStore';
import { Screen, Card, Field, Badge, Button, EmptyState, SectionHeader, Loading } from '../../components/ui';
import { colors, typography } from '../../theme';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatTanggal(t) {
  try {
    const d = new Date(t);
    return `${HARI[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return t;
  }
}

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams();
  const [plan, setPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [pickSet, setPickSet] = useState('3');
  const [pickReps, setPickReps] = useState('10');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setPlan(await getPlan(id));
    setExercises(await getCachedExercises());
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function notInPlan() {
    if (!plan) return exercises;
    const ids = (plan.exercises || []).map((e) => e.id_exercise);
    return exercises.filter((e) => !ids.includes(e.id_exercise));
  }

  async function handleAdd(ex) {
    setSaving(true);
    try {
      await addExerciseToPlan(id, ex, Number(pickSet) || 3, Number(pickReps) || 10);
      await load();
      setShowAdd(false);
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat menambah latihan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(peId) {
    await removeExerciseFromPlan(id, peId);
    await load();
  }

  function handleDelete() {
    Alert.alert('Hapus Jadwal', 'Yakin ingin menghapus jadwal ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deletePlan(id);
          router.replace('/schedule');
        },
      },
    ]);
  }

  if (!plan) return <Screen><Loading label="Memuat jadwal..." /></Screen>;

  return (
    <Screen>
      <View style={[styles.row, { marginBottom: 4 }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text }}>{plan.nama_plan}</Text>
          <Text style={typography.muted}>{formatTanggal(plan.tanggal)}</Text>
        </View>
        <Pressable onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>
      {plan.catatan ? <Text style={[typography.body, { marginTop: 6, marginBottom: 8 }]}>{plan.catatan}</Text> : null}

      <SectionHeader title={`Latihan (${plan.exercises?.length || 0})`} />
      {(!plan.exercises || plan.exercises.length === 0) ? (
        <EmptyState title="Belum ada latihan" subtitle="Tambahkan latihan ke jadwal ini." action={<Button title="+ Tambah Latihan" onPress={() => setShowAdd(true)} />} />
      ) : (
        plan.exercises.map((pe) => (
          <Card key={pe.id_plan_exercise || pe.id_exercise} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{pe.nama_gerakan}</Text>
              <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                <Badge text={`${pe.target_set} set × ${pe.target_reps} reps`} color={colors.primary} />
                {pe.kategori ? <Badge text={pe.kategori} color={colors.accent} /> : null}
              </View>
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <Pressable style={styles.miniBtn} onPress={() => router.push(`/timer?nama=${encodeURIComponent(pe.nama_gerakan)}&durasi=${pe.durasi || 30}`)}>
                  <Ionicons name="timer-outline" size={16} color={colors.primary} /><Text style={styles.miniText}>Mulai</Text>
                </Pressable>
                <Pressable style={[styles.miniBtn, { marginLeft: 8 }]} onPress={() => router.push({ pathname: '/log/create', params: { id_exercise: String(pe.id_exercise), nama_gerakan: pe.nama_gerakan, kategori: pe.kategori || '', durasi: String(pe.durasi || 0) } })}>
                  <Ionicons name="create-outline" size={16} color={colors.accent} /><Text style={[styles.miniText, { color: colors.accent }]}>Catat</Text>
                </Pressable>
              </View>
            </View>
            <Pressable onPress={() => handleRemove(pe.id_plan_exercise)}>
              <Ionicons name="close-circle-outline" size={22} color={colors.muted} />
            </Pressable>
          </Card>
        ))
      )}

      <Button title="+ Tambah Latihan" variant="outline" onPress={() => setShowAdd(true)} />

      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <SectionHeader title="Tambah Latihan" />
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={typography.label}>Target Set</Text>
                <Field value={pickSet} onChangeText={(v) => setPickSet(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.label}>Target Reps</Text>
                <Field value={pickReps} onChangeText={(v) => setPickReps(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
              </View>
            </View>
            {notInPlan().length === 0 ? (
              <EmptyState title="Semua latihan sudah ditambah" />
            ) : (
              notInPlan().map((ex) => (
                <Pressable key={ex.id_exercise} style={styles.option} onPress={() => handleAdd(ex)}>
                  <Text style={{ fontWeight: '600', color: colors.text }}>{ex.nama_gerakan}</Text>
                  <Text style={typography.muted}>{ex.kategori} • {ex.level_kesulitan}</Text>
                </Pressable>
              ))
            )}
            <Button title="Tutup" variant="outline" onPress={() => setShowAdd(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  miniBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  miniText: { marginLeft: 4, fontSize: 13, fontWeight: '700', color: colors.primary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34, maxHeight: '85%' },
  option: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
});
