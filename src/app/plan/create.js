import { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createPlan } from '../../localStore';
import { getCachedExercises } from '../../localStore';
import { Field, Card, Button, Badge, EmptyState, SectionHeader, Chip } from '../../components/ui';
import { colors, typography } from '../../theme';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const FOKUS_LIST = ['Seluruh tubuh', 'Otot Perut', 'Lengan', 'Dada'];
const LEVEL_LIST = ['Rendah', 'Menengah', 'Atas'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function PlanCreateScreen() {
  const [namaPlan, setNamaPlan] = useState('Full Body Favorit');
  const [tanggal, setTanggal] = useState(today());
  const [jam, setJam] = useState('18.00');
  const [fokus, setFokus] = useState('Seluruh tubuh');
  const [level, setLevel] = useState('Menengah');
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected] = useState([]); 
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [namaGerakan, setNamaGerakan] = useState('');
  const [kategoriGerakan, setKategoriGerakan] = useState('');
  const [levelGerakan, setLevelGerakan] = useState('Menengah');

  function handleTambahGerakan() {
    if (!namaGerakan.trim()) {
      Alert.alert('Peringatan', 'Nama gerakan wajib diisi.');
      return;
    }
    const id = `custom-${Date.now()}`;
    setSelected((prev) => [
      ...prev,
      {
        id_exercise: id,
        nama_gerakan: namaGerakan.trim(),
        kategori: kategoriGerakan.trim() || 'Lainnya',
        level_kesulitan: levelGerakan,
        durasi: 30,
        target_set: 3,
        target_reps: 12,
      },
    ]);
    setNamaGerakan('');
    setKategoriGerakan('');
    setLevelGerakan('Menengah');
    setShowAddModal(false);
  }

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
          durasi: ex.durasi || 30,
          target_set: 3,
          target_reps: 12,
        },
      ]);
    }
  }

  async function handleCreate() {
    if (!namaPlan.trim()) {
      Alert.alert('Peringatan', 'Nama program wajib diisi.');
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
        jam,
        hari,
        catatan: `Fokus: ${fokus}, Level: ${level}`,
        exercises: selected,
      });
      router.replace(`/plan/${plan.id}`);
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat membuat jadwal.');
    } finally {
      setSaving(false);
    }
  }

  // Hitung total estimasi sederhana berdasarkan jumlah gerakan terpilih
  const totalEstimasiMenit = selected.length * 6;
  const totalSet = selected.length * 3;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {/* Tombol Kembali */}
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color="#111827" />
        <Text style={styles.backText}>Kembali</Text>
      </Pressable>

      <Text style={styles.mainTitle}>Sesuaikan Latihan</Text>
      <Text style={styles.subtitle}>Program buatanmu, sesuai ritmemu.</Text>

      {/* Nama Program */}
      <Text style={styles.label}>Nama program</Text>
      <Field value={namaPlan} onChangeText={setNamaPlan} placeholder="mis. Full Body Favorit" />

      {/* Fokus Otot */}
      <Text style={styles.label}>Fokus otot</Text>
      <View style={styles.chipsRow}>
        {FOKUS_LIST.map((item) => (
          <Chip key={item} label={item} active={fokus === item} onPress={() => setFokus(item)} />
        ))}
      </View>

      {/* Tingkat Kesulitan */}
      <Text style={styles.label}>Tingkat kesulitan</Text>
      <View style={styles.chipsRow}>
        {LEVEL_LIST.map((item) => (
          <Chip key={item} label={item} active={level === item} onPress={() => setLevel(item)} />
        ))}
      </View>

      {/* Bagian Gerakan Pilihan */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Gerakan pilihan</Text>
        <Pressable>
          <Text style={styles.linkAction}>Susun ulang</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionSub}>Geser pegangan untuk mengubah urutan.</Text>

      {/* List Gerakan Terpilih / Katalog */}
      {exercises.length === 0 ? (
        <EmptyState title="Katalog belum dimuat" subtitle="Buka tab Latihan dulu untuk memuat katalog." />
      ) : (
        exercises.map((ex) => {
          const on = selected.some((s) => s.id_exercise === ex.id_exercise);
          return (
            <Pressable key={ex.id_exercise} onPress={() => toggle(ex)}>
              <Card style={[styles.itemCard, on && styles.itemCardActive]}>
                <View style={styles.dragIconBox}>
                  <Ionicons name="reorder-two-outline" size={18} color="#9CA3AF" />
                </View>
                <View style={styles.exIconBox}>
                  <Ionicons name="fitness-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.exTitle}>{ex.nama_gerakan}</Text>
                  <Text style={styles.exMeta}>3 set × 12 repetisi • Istirahat 45 detik</Text>
                </View>
                <Ionicons name="create-outline" size={18} color="#9CA3AF" />
              </Card>
            </Pressable>
          );
        })
      )}

      {/* Tombol Tambah Gerakan */}
      <Pressable style={styles.addExerciseButton} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={18} color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={styles.addExerciseText}>Tambah gerakan</Text>
      </Pressable>

      {/* Modal Tambah Gerakan */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Tambah Gerakan</Text>

          <Text style={styles.modalLabel}>Nama gerakan *</Text>
          <TextInput
            style={styles.modalInput}
            value={namaGerakan}
            onChangeText={setNamaGerakan}
            placeholder="mis. Push Up"
            placeholderTextColor="#9CA3AF"
            autoFocus
          />

          <Text style={styles.modalLabel}>Kategori</Text>
          <TextInput
            style={styles.modalInput}
            value={kategoriGerakan}
            onChangeText={setKategoriGerakan}
            placeholder="mis. Dada, Lengan, Core"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.modalLabel}>Tingkat kesulitan</Text>
          <View style={styles.chipsRow}>
            {['Rendah', 'Menengah', 'Atas'].map((l) => (
              <Pressable
                key={l}
                style={[styles.levelChip, levelGerakan === l && styles.levelChipActive]}
                onPress={() => setLevelGerakan(l)}
              >
                <Text style={[styles.levelChipText, levelGerakan === l && styles.levelChipTextActive]}>
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.modalSaveBtn} onPress={handleTambahGerakan}>
            <Text style={styles.modalSaveBtnText}>Tambahkan</Text>
          </Pressable>
          <Pressable style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)}>
            <Text style={styles.modalCancelText}>Batal</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Kartu Estimasi */}
      <View style={styles.estimasiCard}>
        <Ionicons name="time-outline" size={20} color={colors.primary} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.estimasiTitle}>Estimasi {totalEstimasiMenit || 18} menit</Text>
          <Text style={styles.estimasiSub}>{selected.length || 3} gerakan • {totalSet || 9} set • Tanpa alat</Text>
        </View>
      </View>

      {/* Jadwalkan Latihan */}
      <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 12 }]}>Jadwalkan latihan</Text>
      <View style={styles.rowInputs}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Hari / Tanggal</Text>
          <Field value={tanggal} onChangeText={setTanggal} placeholder="YYYY-MM-DD" icon="calendar-outline" />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>Jam</Text>
          <Field value={jam} onChangeText={setJam} placeholder="18.00" icon="time-outline" />
        </View>
      </View>

      {/* Tombol Simpan */}
      <Button title="Simpan program" loading={saving} onPress={handleCreate} style={styles.saveButton} />

      <Text style={styles.offlineFooter}>
        <Ionicons name="cloud-download-outline" size={12} color="#059669" /> Disimpan di perangkat, tersedia offline
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 6,
    fontWeight: '500',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  linkAction: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  itemCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#ECFDF5',
  },
  dragIconBox: {
    marginRight: 8,
  },
  exIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  exMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addExerciseButton: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  addExerciseText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  estimasiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  estimasiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065F46',
  },
  estimasiSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
  },
  offlineFooter: {
    textAlign: 'center',
    fontSize: 12,
    color: '#059669',
    marginTop: 16,
    fontWeight: '500',
  },

  /* ── Modal Tambah Gerakan ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    marginTop: 4,
  },
  levelChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  levelChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  levelChipTextActive: {
    color: '#FFFFFF',
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelBtn: {
    alignItems: 'center',
    marginTop: 12,
  },
  modalCancelText: {
    fontSize: 14,
    color: '#6B7280',
  },
});