import { useState, useCallback } from 'react';
import { View, Text, Pressable, Share, Modal, Alert, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createLog, getCachedExercises } from '../../localStore';
import { Field, Card, Button, SectionHeader, EmptyState } from '../../components/ui';
import { colors, typography } from '../../theme';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function LogCreateScreen() {
  const params = useLocalSearchParams();
  const prefilled = !!(params.nama_gerakan);

  const [namaGerakan, setNamaGerakan] = useState(params.nama_gerakan || '');
  const [idExercise, setIdExercise] = useState(params.id_exercise || null);
  const [kategori, setKategori] = useState(params.kategori || null);
  const [jumlahSet, setJumlahSet] = useState('');
  const [reps, setReps] = useState('');
  const [beban, setBeban] = useState('');
  const [durasi, setDurasi] = useState(params.durasi && Number(params.durasi) > 0 ? params.durasi : '');
  const [catatan, setCatatan] = useState('');
  const [tanggal, setTanggal] = useState(today());
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const [exercises, setExercises] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => setExercises(await getCachedExercises()))();
    }, [])
  );

  function pickExercise(ex) {
    setNamaGerakan(ex.nama_gerakan);
    setIdExercise(String(ex.id_exercise));
    setKategori(ex.kategori);
    if (ex.durasi > 0 && !durasi) setDurasi(String(ex.durasi));
    setShowPicker(false);
  }

  async function handleSave() {
    if (!namaGerakan) {
      Alert.alert('Peringatan', 'Pilih latihan terlebih dahulu.');
      return;
    }
    setSaving(true);
    try {
      const log = await createLog({
        id_exercise: idExercise,
        nama_gerakan: namaGerakan,
        kategori,
        jumlah_set: Number(jumlahSet) || 0,
        reps: Number(reps) || 0,
        beban: Number(beban) || 0,
        durasi: Number(durasi) || 0,
        catatan,
        tanggal,
      });
      setSavedId(log.id);
      Alert.alert('Berhasil', 'Latihan berhasil dicatat!', [
        { text: 'Bagikan', onPress: () => handleShare(log) },
        { text: 'Selesai', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat menyimpan catatan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleShare(log) {
    // US-11: Bagikan ringkasan sesi latihan ke media sosial.
    const ringkasan =
      `🏋️ Sesi latihan FitTracker saya hari ini:\n` +
      `• ${log.nama_gerakan} — ${log.jumlah_set} set × ${log.reps} reps` +
      (log.beban ? ` • ${log.beban} kg` : '') +
      `\nTanggal: ${log.tanggal}`;
    try {
      await Share.share({ message: ringkasan });
    } catch (e) {
      /* pengguna membatalkan */
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={typography.title}>Catat Latihan</Text>
        <Text style={typography.subtitle}>Simpan set, repetisi, dan beban Anda.</Text>

        <Text style={typography.label}>Latihan</Text>
        <Pressable onPress={() => setShowPicker(true)}>
          <Card style={styles.pickerRow}>
            <Text style={{ color: namaGerakan ? colors.text : colors.muted }}>
              {namaGerakan || 'Pilih latihan...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.muted} />
          </Card>
        </Pressable>

        <View style={styles.row2}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={typography.label}>Jumlah Set</Text>
            <Field value={jumlahSet} onChangeText={(v) => setJumlahSet(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.label}>Repetisi</Text>
            <Field value={reps} onChangeText={(v) => setReps(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.row2}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={typography.label}>Beban (kg)</Text>
            <Field value={beban} onChangeText={(v) => setBeban(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.label}>Durasi (detik)</Text>
            <Field value={durasi} onChangeText={(v) => setDurasi(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
          </View>
        </View>

        <Text style={typography.label}>Tanggal (YYYY-MM-DD)</Text>
        <Field value={tanggal} onChangeText={setTanggal} />

        <Text style={typography.label}>Catatan (opsional)</Text>
        <Field value={catatan} onChangeText={setCatatan} placeholder="Mis. terasa berat di set terakhir" multiline />

        <Button title="Simpan Catatan" loading={saving} onPress={handleSave} />
        {savedId && <Button title="Bagikan Ringkasan" variant="outline" onPress={() => handleShare({ nama_gerakan: namaGerakan, jumlah_set: Number(jumlahSet) || 0, reps: Number(reps) || 0, beban: Number(beban) || 0, tanggal })} />}
      </ScrollView>

      <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <SectionHeader title="Pilih Latihan" />
            {exercises.length === 0 ? (
              <EmptyState title="Belum ada katalog" subtitle="Buka tab Latihan untuk memuat katalog." action={<Button title="Tutup" variant="outline" onPress={() => setShowPicker(false)} />} />
            ) : (
              exercises.map((ex) => (
                <Pressable key={ex.id_exercise} style={styles.option} onPress={() => pickExercise(ex)}>
                  <Text style={{ fontWeight: '600', color: colors.text }}>{ex.nama_gerakan}</Text>
                  <Text style={typography.muted}>{ex.kategori} • {ex.level_kesulitan}</Text>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row2: { flexDirection: 'row' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34, maxHeight: '80%' },
  option: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
});
