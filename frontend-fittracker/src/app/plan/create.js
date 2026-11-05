import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createPlan } from '../../localStore';
import { getCachedExercises } from '../../localStore';
import { Field, Card, Button, Badge, EmptyState, SectionHeader } from '../../components/ui';
import { colors, typography } from '../../theme';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function PlanCreateScreen() {
  const [namaPlan, setNamaPlan] = useState('');
  const [tanggal, setTanggal] = useState(today());
  const [catatan, setCatatan] = useState('');
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected] = useState([]); // array of { id_exercise, nama_gerakan, kategori, level_kesulitan, durasi, target_set, target_reps }
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => setExercises(await getCachedExercises()))();
    }, [])
  );

  function toggle(ex) {
    const exists = selected.find((s) => s.id_exercise === ex.id_exercise);
    if (exists) {
      setSelected(selected.filter((s) => s.id_exercise !== ex.id_exercise));
    } else {
      setSelected([
        ...selected,
        {
          id_exercise: ex.id_exercise,
          nama_gerakan: ex.nama_gerakan,
          kategori: ex.kategori,
          level_kesulitan: ex.level_kesulitan,
          durasi: ex.durasi,
          target_set: 3,
          target_reps: 10,
        },
      ]);
    }
  }

  async function handleCreate() {
    if (!namaPlan.trim()) {
      Alert.alert('Peringatan', 'Nama jadwal wajib diisi.');
      return;
    }
    let hari = null;
    try {
      const d = new Date(tanggal);
      hari = HARI[d.getDay()];
    } catch (e) {
      /* abaikan */
    }
    setSaving(true);
    try {
      const plan = await createPlan({
        nama_plan: namaPlan.trim(),
        tanggal,
        hari,
        catatan: catatan.trim(),
        exercises: selected,
      });
      router.replace(`/plan/${plan.id}`);
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat membuat jadwal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={typography.title}>Buat Jadwal Latihan</Text>
      <Text style={typography.subtitle}>Susun rencana latihan Anda.</Text>

      <Text style={typography.label}>Nama Jadwal</Text>
      <Field value={namaPlan} onChangeText={setNamaPlan} placeholder="mis. Latihan Pagi Senin" />

      <Text style={typography.label}>Tanggal (YYYY-MM-DD)</Text>
      <Field value={tanggal} onChangeText={setTanggal} />

      <Text style={typography.label}>Catatan (opsional)</Text>
      <Field value={catatan} onChangeText={setCatatan} multiline />

      <SectionHeader title={`Pilih Latihan (${selected.length})`} />
      {exercises.length === 0 ? (
        <EmptyState title="Katalog belum dimuat" subtitle="Buka tab Latihan dulu untuk memuat katalog." />
      ) : (
        exercises.map((ex) => {
          const on = selected.some((s) => s.id_exercise === ex.id_exercise);
          return (
            <Pressable key={ex.id_exercise} onPress={() => toggle(ex)}>
              <Card style={[styles.item, on && { borderColor: colors.primary, backgroundColor: colors.primary + '0F' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{ex.nama_gerakan}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                    <Badge text={ex.kategori} color={colors.accent} />
                    <Badge text={ex.level_kesulitan} color={colors.muted} />
                  </View>
                </View>
                <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? colors.primary : colors.muted} />
              </Card>
            </Pressable>
          );
        })
      )}

      <Button title="Simpan Jadwal" loading={saving} onPress={handleCreate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
