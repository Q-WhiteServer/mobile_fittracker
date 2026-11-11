import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../../api';

const MINT = '#10B981';
const MINT_LIGHT = '#D1FAE5';
const MINT_MID = '#6EE7B7';
const GRAY = '#6B7280';
const GRAY_LIGHT = '#F3F4F6';
const BORDER = '#E5E7EB';
const TEXT = '#111827';
const TEXT_MUTED = '#6B7280';

const KATEGORI = ['Kekuatan', 'Lari', 'Yoga', 'Bersepeda', 'Umum'];

export default function GroupCreateScreen() {
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState('Kekuatan');
  const [privasi, setPrivasi] = useState('publik');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!nama.trim()) {
      Alert.alert('Peringatan', 'Nama grup wajib diisi.');
      return;
    }
    if (nama.length > 40) {
      Alert.alert('Peringatan', 'Nama grup maksimal 40 karakter.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.createGroup({
        nama_group: nama.trim(),
        deskripsi: deskripsi.trim(),
        kategori,
        privasi,
      });
      Alert.alert('Berhasil', 'Grup berhasil dibuat!', [
        { text: 'OK', onPress: () => router.replace(`/group/${res.id_group}`) },
      ]);
    } catch (e) {
      Alert.alert('Gagal', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={MINT} />
          <Text style={s.backText}>Kembali</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Buat Grup</Text>
        <Text style={s.subtitle}>Satukan tujuan, rayakan progres bersama.</Text>

        {/* Upload Foto */}
        <View style={s.photoBox}>
          <Ionicons name="camera-outline" size={28} color={MINT} />
          <View style={{ marginLeft: 12 }}>
            <Text style={s.photoTitle}>Tambah foto grup</Text>
            <Text style={s.photoSub}>Opsional • JPG atau PNG</Text>
          </View>
        </View>

        {/* Nama Grup */}
        <Text style={s.label}>Nama grup</Text>
        <TextInput
          style={s.input}
          value={nama}
          onChangeText={(v) => setNama(v.slice(0, 40))}
          placeholder="Gerak Bareng Jakarta"
          placeholderTextColor={TEXT_MUTED}
        />
        <Text style={s.helper}>{nama.length}/40 karakter</Text>

        {/* Deskripsi */}
        <Text style={s.label}>Deskripsi</Text>
        <TextInput
          style={[s.input, s.textArea]}
          value={deskripsi}
          onChangeText={setDeskripsi}
          placeholder="Teman latihan untuk hidup lebih aktif. Yuk, saling dukung dan konsisten bergerak setiap minggu!"
          placeholderTextColor={TEXT_MUTED}
          multiline
          numberOfLines={4}
        />
        <Text style={s.helper}>Jelaskan tujuan dan aktivitas grupmu.</Text>

        {/* Kategori */}
        <Text style={s.label}>Kategori olahraga</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {KATEGORI.map((k) => {
            const active = kategori === k;
            return (
              <Pressable
                key={k}
                onPress={() => setKategori(k)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{k}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Privasi */}
        <Text style={s.label}>Privasi grup</Text>
        <Pressable
          style={[s.privacyCard, privasi === 'publik' && s.privacyCardActive]}
          onPress={() => setPrivasi('publik')}
        >
          <View style={[s.privacyIcon, privasi === 'publik' && s.privacyIconActive]}>
            <Ionicons name="globe-outline" size={22} color={privasi === 'publik' ? MINT : GRAY} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.privacyTitle, privasi === 'publik' && { color: MINT }]}>Publik</Text>
            <Text style={s.privacyDesc}>Siapa saja dapat menemukan dan langsung bergabung.</Text>
          </View>
          <View style={[s.radio, privasi === 'publik' && s.radioActive]}>
            {privasi === 'publik' && <View style={s.radioDot} />}
          </View>
        </Pressable>

        <Pressable
          style={[s.privacyCard, privasi === 'privat' && s.privacyCardActive]}
          onPress={() => setPrivasi('privat')}
        >
          <View style={[s.privacyIcon, privasi === 'privat' && s.privacyIconActive]}>
            <Ionicons name="lock-closed-outline" size={22} color={privasi === 'privat' ? MINT : GRAY} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.privacyTitle, privasi === 'privat' && { color: MINT }]}>Privat</Text>
            <Text style={s.privacyDesc}>Hanya anggota yang diundang atau disetujui admin.</Text>
          </View>
          <View style={[s.radio, privasi === 'privat' && s.radioActive]}>
            {privasi === 'privat' && <View style={s.radioDot} />}
          </View>
        </Pressable>

        {/* Catatan Admin */}
        <View style={s.adminNote}>
          <Ionicons name="shield-checkmark-outline" size={18} color={MINT} style={{ marginTop: 1 }} />
          <Text style={s.adminNoteText}>
            Kamu akan menjadi admin. Jaga grup tetap positif dan saling menghargai.
          </Text>
        </View>

        {/* Tombol Submit */}
        <Pressable
          style={({ pressed }) => [s.submitBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="people" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={s.submitText}>Buat grup</Text>
            </>
          )}
        </Pressable>

        {/* Footer */}
        <View style={s.footer}>
          <Ionicons name="wifi" size={14} color={MINT} />
          <Text style={s.footerText}>Online • Grup langsung tersedia setelah dibuat</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { color: MINT, fontWeight: '600', fontSize: 15, marginLeft: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 },

  title: { fontSize: 28, fontWeight: 'bold', color: TEXT, marginBottom: 4 },
  subtitle: { fontSize: 15, color: TEXT_MUTED, marginBottom: 24 },

  photoBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderStyle: 'dashed', borderColor: MINT,
    backgroundColor: MINT_LIGHT, borderRadius: 14,
    padding: 18, marginBottom: 24,
  },
  photoTitle: { fontSize: 15, fontWeight: 'bold', color: MINT },
  photoSub: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },

  label: { fontSize: 14, fontWeight: '600', color: TEXT, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: TEXT, backgroundColor: '#FAFAFA',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  helper: { fontSize: 12, color: TEXT_MUTED, marginTop: 6, marginBottom: 20 },

  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1.5, borderColor: BORDER,
    marginRight: 8, backgroundColor: '#FFF',
  },
  chipActive: { backgroundColor: MINT_LIGHT, borderColor: MINT },
  chipText: { fontSize: 14, fontWeight: '600', color: GRAY },
  chipTextActive: { color: MINT },

  privacyCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 14,
    padding: 16, marginBottom: 12, backgroundColor: '#FAFAFA',
  },
  privacyCardActive: { borderColor: MINT, backgroundColor: MINT_LIGHT },
  privacyIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: GRAY_LIGHT, alignItems: 'center', justifyContent: 'center',
  },
  privacyIconActive: { backgroundColor: '#A7F3D0' },
  privacyTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  privacyDesc: { fontSize: 13, color: TEXT_MUTED, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: MINT },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: MINT },

  adminNote: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: MINT_LIGHT, borderRadius: 12,
    padding: 14, marginVertical: 20,
  },
  adminNoteText: { flex: 1, marginLeft: 10, fontSize: 13, color: '#065F46', lineHeight: 20 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: MINT, borderRadius: 14, height: 54, marginBottom: 14,
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  footerText: { fontSize: 13, color: TEXT_MUTED, marginLeft: 6 },
});
