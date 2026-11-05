import { useState, useCallback } from 'react';
import { View, Text, Pressable, Switch, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getProfile, saveProfile } from '../../localStore';
import { api } from '../../api';
import { getSettings, saveSettings } from '../../storage';
import { scheduleReminder, cancelReminder, sendTestNotification } from '../../notifications';
import { Screen, Card, Field, Button, Chip, SectionHeader } from '../../components/ui';
import { colors, typography } from '../../theme';

const GENDER = [
  { v: 'L', label: 'Laki-laki' },
  { v: 'P', label: 'Perempuan' },
];
const AKTIVITAS = [
  { v: 'rendah', label: 'Rendah' },
  { v: 'sedang', label: 'Sedang' },
  { v: 'aktif', label: 'Aktif' },
  { v: 'sangat_aktif', label: 'Sangat Aktif' },
];
const TUJUAN = [
  { v: 'menurunkan_berat', label: 'Turunkan Berat' },
  { v: 'menambah_massa', label: 'Tambah Massa' },
  { v: 'menjaga_kebugaran', label: 'Jaga Kebugaran' },
  { v: 'meningkatkan_kekuatan', label: 'Tingkatkan Kekuatan' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    jenis_kelamin: null, usia: '', tinggi: '', berat: '',
    level_aktivitas: null, tujuan: null, catatan_kesehatan: '',
  });
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('17:00');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        // Data diri: utamakan penyimpanan lokal, isi dari backend jika kosong.
        let p = await getProfile();
        if (!p) {
          try {
            const res = await api.getProfile();
            if (res.profile) p = res.profile;
          } catch (e) {
            /* offline / belum diisi */
          }
        }
        if (p) {
          setProfile({
            jenis_kelamin: p.jenis_kelamin || null,
            usia: p.usia != null ? String(p.usia) : '',
            tinggi: p.tinggi != null ? String(p.tinggi) : '',
            berat: p.berat != null ? String(p.berat) : '',
            level_aktivitas: p.level_aktivitas || null,
            tujuan: p.tujuan || null,
            catatan_kesehatan: p.catatan_kesehatan || '',
          });
        }
        const s = await getSettings();
        setReminderEnabled(!!s.reminderEnabled);
        setReminderTime(s.reminderTime || '17:00');
      })();
    }, [])
  );

  function set(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const data = {
      jenis_kelamin: profile.jenis_kelamin || null,
      usia: profile.usia ? Number(profile.usia) : null,
      tinggi: profile.tinggi ? Number(profile.tinggi) : null,
      berat: profile.berat ? Number(profile.berat) : null,
      level_aktivitas: profile.level_aktivitas || null,
      tujuan: profile.tujuan || null,
      catatan_kesehatan: profile.catatan_kesehatan || null,
    };
    try {
      await saveProfile(data);
      Alert.alert('Berhasil', 'Data diri berhasil disimpan.');
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat menyimpan data diri.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleReminder(value) {
    setReminderEnabled(value);
    const settings = { reminderEnabled: value, reminderTime };
    await saveSettings(settings);
    try {
      if (value) {
        await scheduleReminder(reminderTime);
        Alert.alert('Pengingat Aktif', `Anda akan diingatkan setiap hari pukul ${reminderTime}.`);
      } else {
        await cancelReminder();
      }
    } catch (e) {
      Alert.alert('Pengingat', e.message);
      setReminderEnabled(false);
      await saveSettings({ ...settings, reminderEnabled: false });
    }
  }

  async function handleTestReminder() {
    try {
      await sendTestNotification();
    } catch (e) {
      Alert.alert('Pengingat', e.message);
    }
  }

  return (
    <Screen>
      <Card style={styles.userCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{user?.nama_lengkap}</Text>
          <Text style={typography.muted}>{user?.email}</Text>
        </View>
      </Card>

      <SectionHeader title="Data Diri" />
      <Text style={typography.muted}>Agar program latihan sesuai kondisi & tujuan Anda.</Text>

      <Text style={[typography.label, { marginTop: 8 }]}>Jenis Kelamin</Text>
      <View style={styles.chips}>
        {GENDER.map((g) => (
          <Chip key={g.v} label={g.label} active={profile.jenis_kelamin === g.v} onPress={() => set('jenis_kelamin', g.v)} />
        ))}
      </View>

      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={typography.label}>Usia (tahun)</Text>
          <Field value={profile.usia} onChangeText={(v) => set('usia', v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.label}>Tinggi (cm)</Text>
          <Field value={profile.tinggi} onChangeText={(v) => set('tinggi', v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
        </View>
      </View>

      <Text style={typography.label}>Berat (kg)</Text>
      <Field value={profile.berat} onChangeText={(v) => set('berat', v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />

      <Text style={typography.label}>Level Aktivitas</Text>
      <View style={styles.chips}>
        {AKTIVITAS.map((a) => (
          <Chip key={a.v} label={a.label} active={profile.level_aktivitas === a.v} onPress={() => set('level_aktivitas', a.v)} />
        ))}
      </View>

      <Text style={typography.label}>Tujuan</Text>
      <View style={styles.chips}>
        {TUJUAN.map((t) => (
          <Chip key={t.v} label={t.label} active={profile.tujuan === t.v} onPress={() => set('tujuan', t.v)} />
        ))}
      </View>

      <Text style={typography.label}>Catatan Kesehatan (opsional)</Text>
      <Field value={profile.catatan_kesehatan} onChangeText={(v) => set('catatan_kesehatan', v)} placeholder="mis. riwayat cedera lutut" multiline />

      <Button title="Simpan Data Diri" loading={saving} onPress={handleSave} />

      <SectionHeader title="Pengingat Latihan" />
      <Card style={styles.reminderRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', color: colors.text }}>Aktifkan pengingat harian</Text>
          <Text style={typography.muted}>Notifikasi sebelum jadwal latihan dimulai.</Text>
        </View>
        <Switch value={reminderEnabled} onValueChange={toggleReminder} thumbColor={colors.card} trackColor={{ false: colors.border, true: colors.primary }} />
      </Card>
      {reminderEnabled && (
        <>
          <Text style={typography.label}>Waktu Pengingat (HH:MM)</Text>
          <Field value={reminderTime} onChangeText={setReminderTime} placeholder="17:00" />
          <Button title="Uji Coba Pengingat" variant="outline" onPress={handleTestReminder} />
        </>
      )}

      <View style={{ height: 16 }} />
      <Button title="Keluar Akun" variant="danger" onPress={() => logout()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  userCard: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary + '1A', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6, marginTop: 4 },
  row2: { flexDirection: 'row' },
  reminderRow: { flexDirection: 'row', alignItems: 'center' },
});
