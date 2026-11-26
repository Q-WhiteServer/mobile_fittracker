import { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme';

export const ADD_EXERCISE_KEY = '@fittracker_add_exercise_result';

export default function AddExerciseScreen() {
  const [namaGerakan, setNamaGerakan] = useState('');
  const [jumlahSet,   setJumlahSet]   = useState('3');
  const [repsDurasi,  setRepsDurasi]  = useState('12');
  const [istirahat,   setIstirahat]   = useState('45');
  const [saving,      setSaving]      = useState(false);

  async function handleTambah() {
    if (!namaGerakan.trim()) {
      Alert.alert('Peringatan', 'Nama gerakan wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const gerakan = {
        id_exercise:     `custom-${Date.now()}`,
        nama_gerakan:    namaGerakan.trim(),
        target_set:      Number(jumlahSet)  || 3,
        target_reps:     Number(repsDurasi) || 12,
        istirahat:       Number(istirahat)  || 45,
        durasi:          0,
        kategori:        'Lainnya',
        level_kesulitan: 'Menengah',
      };
      await AsyncStorage.setItem(ADD_EXERCISE_KEY, JSON.stringify(gerakan));
      router.back();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menambahkan gerakan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
          <Text style={s.backTxt}>Kembali</Text>
        </Pressable>

        {/* Ikon gear biru di kanan */}
        <View style={s.gearCircle}>
          <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
        </View>
      </View>

      {/* ── Judul ── */}
      <View style={s.titleWrap}>
        <Text style={s.title}>Tambah Gerakan Baru</Text>
        <Text style={s.subtitle}>Isi detail gerakan baru untuk program latihanmu.</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Nama Gerakan */}
        <Text style={s.label}>Nama Gerakan</Text>
        <TextInput
          style={s.input}
          value={namaGerakan}
          onChangeText={setNamaGerakan}
          placeholder="Masukkan nama gerakan"
          placeholderTextColor="#9CA3AF"
          autoFocus
        />

        {/* Jumlah Set */}
        <Text style={s.label}>Jumlah Set</Text>
        <TextInput
          style={s.input}
          value={jumlahSet}
          onChangeText={setJumlahSet}
          keyboardType="numeric"
          placeholder="3"
          placeholderTextColor="#9CA3AF"
        />

        {/* Repetisi / Durasi */}
        <Text style={s.label}>Repetisi atau Durasi</Text>
        <TextInput
          style={s.input}
          value={repsDurasi}
          onChangeText={setRepsDurasi}
          keyboardType="numeric"
          placeholder="12"
          placeholderTextColor="#9CA3AF"
        />

        {/* Istirahat per Set */}
        <Text style={s.label}>Istirahat per Set (detik)</Text>
        <TextInput
          style={s.input}
          value={istirahat}
          onChangeText={setIstirahat}
          keyboardType="numeric"
          placeholder="45"
          placeholderTextColor="#9CA3AF"
        />

      </ScrollView>

      {/* ── Tombol Tambah ── */}
      <View style={s.footer}>
        <Pressable
          style={[s.addBtn, saving && { opacity: 0.7 }]}
          onPress={handleTambah}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={s.addTxt}>Tambah Gerakan</Text>
            </>
          )}
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn:   { flexDirection: 'row', alignItems: 'center' },
  backTxt:   { fontSize: 15, fontWeight: '600', color: '#111827', marginLeft: 6 },
  gearCircle:{
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Judul */
  titleWrap: { paddingHorizontal: 20, marginBottom: 20 },
  title:    { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280' },

  /* Form */
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  label: {
    fontSize: 14, fontWeight: '600', color: '#374151',
    marginBottom: 8, marginTop: 16,
  },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: '#111827',
    backgroundColor: '#F9FAFB',
  },

  /* Footer */
  footer: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 54, borderRadius: 14,
  },
  addTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
