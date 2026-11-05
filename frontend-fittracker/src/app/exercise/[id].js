import { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { getCachedExercises, getPlans, addExerciseToPlan } from '../../localStore';
import { Screen, Card, Badge, Button, Loading, EmptyState } from '../../components/ui';
import { colors, typography } from '../../theme';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams();
  const [ex, setEx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [adding, setAdding] = useState(false);

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

  if (loading) return <Screen><Loading label="Memuat detail..." /></Screen>;
  if (!ex) return <Screen><EmptyState title="Latihan tidak ditemukan" action={<Button title="Kembali" onPress={() => router.back()} />} /></Screen>;

  return (
    <Screen>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>{ex.nama_gerakan}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 12 }}>
        <Badge text={ex.kategori} color={colors.accent} />
        <Badge
          text={ex.level_kesulitan}
          color={ex.level_kesulitan === 'Pemula' ? colors.success : ex.level_kesulitan === 'Menengah' ? colors.warn : colors.danger}
        />
        {ex.durasi > 0 && <Badge text={`${ex.durasi} detik`} color={colors.muted} />}
      </View>

      {ex.deskripsi ? (
        <Card>
          <Text style={typography.label}>Deskripsi</Text>
          <Text style={typography.body}>{ex.deskripsi}</Text>
        </Card>
      ) : null}

      {ex.instruksi ? (
        <Card>
          <Text style={typography.label}>Instruksi Teknis</Text>
          <Text style={typography.body}>{ex.instruksi}</Text>
        </Card>
      ) : null}

      <Card style={{ borderColor: colors.primary + '33', backgroundColor: colors.primary + '0F' }}>
        <Text style={[typography.body, { fontWeight: '700', color: colors.primary }]}>Panduan Video (US-10)</Text>
        {ex.url_video ? (
          <Button title="Tonton Video Panduan" variant="outline" onPress={() => Alert.alert('Video', ex.url_video)} style={{ marginTop: 10 }} />
        ) : (
          <Text style={[typography.muted, { marginTop: 6 }]}>Video panduan berinstruktur belum tersedia untuk gerakan ini.</Text>
        )}
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Button title="Mulai Latihan" onPress={() => router.push(`/timer?nama=${encodeURIComponent(ex.nama_gerakan)}&durasi=${ex.durasi || 30}`)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Catat Latihan"
            variant="outline"
            onPress={() => router.push({ pathname: '/log/create', params: { id_exercise: String(ex.id_exercise), nama_gerakan: ex.nama_gerakan, kategori: ex.kategori, durasi: String(ex.durasi || 0) } })}
          />
        </View>
      </View>

      <Button title="+ Tambah ke Jadwal" variant="outline" onPress={() => { loadPlans(); setShowPlanModal(true); }} style={{ marginTop: 10 }} />

      <Modal visible={showPlanModal} animationType="slide" transparent onRequestClose={() => setShowPlanModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={typography.section}>Pilih Jadwal</Text>
            {plans.length === 0 ? (
              <EmptyState title="Belum ada jadwal" subtitle="Buat jadwal terlebih dahulu." action={<Button title="Buat Jadwal" onPress={() => { setShowPlanModal(false); router.push('/plan/create'); }} />} />
            ) : (
              plans.map((p) => (
                <Pressable key={p.id} onPress={() => handleAddToPlan(p.id)} disabled={adding} style={styles.planRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>{p.nama_plan}</Text>
                    <Text style={typography.muted}>{p.tanggal} • {p.exercises?.length || 0} gerakan</Text>
                  </View>
                  <Ionicons name="add-circle" size={22} color={colors.primary} />
                </Pressable>
              ))
            )}
            <Button title="Tutup" variant="outline" onPress={() => setShowPlanModal(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
});
