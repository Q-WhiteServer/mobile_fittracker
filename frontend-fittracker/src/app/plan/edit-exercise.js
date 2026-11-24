import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme';

const EDIT_RESULT_KEY = '@fittracker_edit_exercise_result';

export default function EditExerciseScreen() {
  const params = useLocalSearchParams();

  // Ambil data gerakan dari params
  const [namaGerakan, setNamaGerakan] = useState(params.nama_gerakan || '');
  const [jumlahSet,   setJumlahSet]   = useState(params.target_set   || '3');
  const [repsDurasi,  setRepsDurasi]  = useState(params.target_reps  || '12');
  const [istirahat,   setIstirahat]   = useState(params.istirahat    || '45');
  const [saving, setSaving] = useState(false);

  // Label unit (repetisi atau detik) berdasarkan tipe gerakan
  const isDurasi = Number(params.durasi) > 0 && Number(params.target_reps || 0) === 0;
  const repsLabel = isDurasi ? 'Durasi (detik)' : 'Repetisi';

  async function handleSave() {
    if (!namaGerakan.trim()) {
      Alert.alert('Peringatan', 'Nama gerakan wajib diisi.');
      return;
    }
    if (!jumlahSet || isNaN(Number(jumlahSet)) || Number(jumlahSet) < 1) {
      Alert.alert('Peringatan', 'Jumlah set tidak valid.');
      return;
    }
    setSaving(true);
    try {
      // Simpan hasil edit ke AsyncStorage agar create.js bisa membacanya
      const result = {
        id_exercise:   params.id_exercise,
        nama_gerakan:  namaGerakan.trim(),
        target_set:    Number(jumlahSet),
        target_reps:   Number(repsDurasi),
        istirahat:     Number(istirahat),
        durasi:        isDurasi ? Number(repsDurasi) : Number(params.durasi || 0),
        kategori:      params.kategori      || '',
        level_kesulitan: params.level_kesulitan || '',
      };
      await AsyncStorage.setItem(EDIT_RESULT_KEY, JSON.stringify(result));
      router.back();
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={s.backTxt}>Kembali</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Edit Gerakan</Text>
        <Text style={s.subtitle}>Sesuaikan jumlah set, repetisi, dan waktu istirahat.</Text>

        {/* Nama Gerakan */}
        <Text style={s.label}>Nama Gerakan</Text>
        <TextInput
          style={s.input}
          value={namaGerakan}
          onChangeText={setNamaGerakan}
          placeholder="mis. Push Up"
          placeholderTextColor="#9CA3AF"
        />

        {/* Jumlah Set */}
        <Text style={s.label}>Jumlah Set</Text>
        <View style={s.inputRow}>
          <TextInput
            style={[s.input, s.inputShort]}
            value={String(jumlahSet)}
            onChangeText={setJumlahSet}
            keyboardType="numeric"
            placeholder="3"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={s.unitLabel}>set</Text>
        </View>

        {/* Repetisi / Durasi */}
        <Text style={s.label}>{repsLabel}</Text>
        <View style={s.inputRow}>
          <TextInput
            style={[s.input, s.inputShort]}
            value={String(repsDurasi)}
            onChangeText={setRepsDurasi}
            keyboardType="numeric"
            placeholder={isDurasi ? '30' : '12'}
            placeholderTextColor="#9CA3AF"
          />
          <Text style={s.unitLabel}>{isDurasi ? 'detik' : 'repetisi'}</Text>
        </View>

        {/* Istirahat per Set */}
        <Text style={s.label}>Istirahat per Set (detik)</Text>
        <View style={s.inputRow}>
          <TextInput
            style={[s.input, s.inputShort]}
            value={String(istirahat)}
            onChangeText={setIstirahat}
            keyboardType="numeric"
            placeholder="45"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={s.unitLabel}>detik</Text>
        </View>

        {/* Pratinjau ringkas */}
        <View style={s.previewCard}>
          <Ionicons name="fitness-outline" size={18} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={s.previewTxt}>
            {jumlahSet} set × {repsDurasi} {isDurasi ? 'detik' : 'rep'} • Istirahat {istirahat} detik
          </Text>
        </View>
      </ScrollView>

      {/* ── Tombol Simpan ── */}
      <View style={s.footer}>
        <Pressable
          style={[s.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={s.saveTxt}>Simpan Perubahan</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn:{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backTxt:{ color: colors.primary, fontWeight: '600', fontSize: 15, marginLeft: 6 },

  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  title:  { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle:{ fontSize: 13, color: '#6B7280', marginBottom: 24 },

  label:  { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input:  {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB',
  },
  inputRow:  { flexDirection: 'row', alignItems: 'center' },
  inputShort:{ flex: 1 },
  unitLabel: { marginLeft: 12, fontSize: 14, color: '#6B7280', fontWeight: '500', minWidth: 50 },

  previewCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ECFDF5', borderRadius: 12,
    padding: 14, marginTop: 24,
  },
  previewTxt: { fontSize: 14, color: '#065F46', fontWeight: '500' },

  footer: { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, height: 54, borderRadius: 14,
  },
  saveTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

// Export key agar bisa dipakai di create.js
export { EDIT_RESULT_KEY };
