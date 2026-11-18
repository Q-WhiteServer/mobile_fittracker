import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, Switch, Alert, StyleSheet,
  ScrollView, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getProfile, saveProfile } from '../../localStore';
import { api } from '../../api';
import { getSettings, saveSettings } from '../../storage';
import { scheduleReminder, cancelReminder, sendTestNotification } from '../../notifications';

// ── Palet ────────────────────────────────────────────────────────────────────
const MINT    = '#10B981';
const MINT_D  = '#059669';
const MINT_L  = '#D1FAE5';
const MINT_LL = '#ECFDF5';
const GRAY    = '#6B7280';
const BORDER  = '#E5E7EB';
const TEXT    = '#111827';
const MUTED   = '#9CA3AF';
const BG      = '#F9FAFB';
const WHITE   = '#FFFFFF';
const RED     = '#EF4444';
const RED_L   = '#FEF2F2';

// ── Helpers ──────────────────────────────────────────────────────────────────
function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}
function tujuanLabel(v) {
  const map = {
    menurunkan_berat: 'menurunkan berat badan',
    menambah_massa:   'menambah massa otot',
    menjaga_kebugaran:'menjaga kebugaran',
    meningkatkan_kekuatan: 'meningkatkan kekuatan',
  };
  return map[v] || v;
}
function todaySync() {
  const d = new Date();
  return `hari ini, ${d.getDate()} Okt • ${String(d.getHours()).padStart(2,'0')}.${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── Konstanta form ────────────────────────────────────────────────────────────
const GENDER   = [{ v:'L', label:'Laki-laki' }, { v:'P', label:'Perempuan' }];
const AKTIVITAS = [
  { v:'rendah', label:'Rendah' }, { v:'sedang', label:'Sedang' },
  { v:'aktif', label:'Aktif' },   { v:'sangat_aktif', label:'Sangat Aktif' },
];
const TUJUAN = [
  { v:'menurunkan_berat',       label:'Turunkan Berat' },
  { v:'menambah_massa',         label:'Tambah Massa' },
  { v:'menjaga_kebugaran',      label:'Jaga Kebugaran' },
  { v:'meningkatkan_kekuatan',  label:'Tingkatkan Kekuatan' },
];

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState({
    jenis_kelamin: null, usia: '24', tinggi: '165', berat: '67.8',
    level_aktivitas: null, tujuan: 'menurunkan_berat', catatan_kesehatan: '',
  });
  const [reminderEnabled,   setReminderEnabled]   = useState(true);
  const [communityEnabled,  setCommunityEnabled]  = useState(true);
  const [reminderTime,      setReminderTime]      = useState('18:00');
  const [saving,            setSaving]            = useState(false);
  const [showEditModal,     setShowEditModal]     = useState(false);
  const [showTimeModal,     setShowTimeModal]     = useState(false);
  const [timeInput,         setTimeInput]         = useState('18:00');

  // ── Load data ──────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      (async () => {
        let p = await getProfile();
        if (!p) {
          try { const res = await api.getProfile(); if (res.profile) p = res.profile; }
          catch { /* offline */ }
        }
        if (p) {
          setProfile({
            jenis_kelamin:     p.jenis_kelamin     || null,
            usia:              p.usia  != null ? String(p.usia)  : '24',
            tinggi:            p.tinggi != null ? String(p.tinggi) : '165',
            berat:             p.berat  != null ? String(p.berat)  : '67.8',
            level_aktivitas:   p.level_aktivitas   || null,
            tujuan:            p.tujuan            || 'menurunkan_berat',
            catatan_kesehatan: p.catatan_kesehatan || '',
          });
        }
        const s = await getSettings();
        setReminderEnabled(s.reminderEnabled ?? true);
        setReminderTime(s.reminderTime || '18:00');
        setTimeInput(s.reminderTime || '18:00');
      })();
    }, [])
  );

  function setField(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  // ── Simpan data fisik ──────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    const data = {
      jenis_kelamin:     profile.jenis_kelamin || null,
      usia:              profile.usia   ? Number(profile.usia)   : null,
      tinggi:            profile.tinggi ? Number(profile.tinggi) : null,
      berat:             profile.berat  ? Number(profile.berat)  : null,
      level_aktivitas:   profile.level_aktivitas  || null,
      tujuan:            profile.tujuan           || null,
      catatan_kesehatan: profile.catatan_kesehatan || null,
    };
    try {
      await saveProfile(data);
      setShowEditModal(false);
      Alert.alert('Berhasil', 'Data fisik berhasil diperbarui.');
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyimpan data fisik.');
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle pengingat latihan ───────────────────────────────────────────────
  async function toggleReminder(value) {
    setReminderEnabled(value);
    const settings = { reminderEnabled: value, reminderTime };
    await saveSettings(settings);
    try {
      if (value) {
        await scheduleReminder(reminderTime);
      } else {
        await cancelReminder();
      }
    } catch (e) {
      setReminderEnabled(false);
      await saveSettings({ ...settings, reminderEnabled: false });
    }
  }

  // ── Toggle notifikasi komunitas ────────────────────────────────────────────
  async function toggleCommunity(value) {
    setCommunityEnabled(value);
    const s = await getSettings();
    await saveSettings({ ...s, communityEnabled: value });
  }

  // ── Simpan waktu pengingat ─────────────────────────────────────────────────
  async function saveReminderTime() {
    if (!/^\d{2}:\d{2}$/.test(timeInput)) {
      Alert.alert('Format Salah', 'Gunakan format HH:MM, contoh: 18:00'); return;
    }
    setReminderTime(timeInput);
    const settings = { reminderEnabled, reminderTime: timeInput };
    await saveSettings(settings);
    if (reminderEnabled) {
      try { await scheduleReminder(timeInput); } catch { /* ignore */ }
    }
    setShowTimeModal(false);
  }

  // ── Data profil untuk tampilan ─────────────────────────────────────────────
  const ini     = initials(user?.nama_lengkap || 'Valentina Mesy');
  const name    = user?.nama_lengkap || 'Valentina Mesy';
  const usernameSlug = (name).toLowerCase().replace(/\s+/g, '.');

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Pengaturan</Text>
            <Text style={s.subtitle}>Atur FitTracker sesuai kebutuhanmu.</Text>
          </View>
        </View>

        {/* ── Profile Card ── */}
        <View style={s.card}>
          <View style={s.profileRow}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>{ini}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.profileName}>{name}</Text>
              <Text style={s.profileUsername}>@{usernameSlug}</Text>
              <Text style={s.profileEmail}>{user?.email || 'valentina.mesy@gmail.com'}</Text>
            </View>
            <Pressable style={s.editIconBtn} onPress={() => setShowEditModal(true)}>
              <Ionicons name="pencil" size={16} color={MINT} />
            </Pressable>
          </View>
        </View>

        {/* ── Cloud Sync Banner ── */}
        <View style={s.syncBanner}>
          <View style={s.syncIconWrap}>
            <Ionicons name="cloud-outline" size={18} color={MINT} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.syncTitle}>Cloud tersinkronisasi</Text>
            <Text style={s.syncSub}>Terakhir: {todaySync()}</Text>
          </View>
        </View>
        <Text style={s.syncNote}>
          Jadwal dan log tetap bisa diakses offline. Perubahan akan disinkronkan saat online.
        </Text>

        {/* ── Section: Pengingat & Notifikasi ── */}
        <Text style={s.sectionTitle}>Pengingat &amp; notifikasi</Text>
        <View style={s.card}>
          {/* Item 1: Pengingat latihan */}
          <View style={s.settingRow}>
            <Ionicons name="alarm-outline" size={20} color={MUTED} style={s.rowIcon} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.settingLabel}>Pengingat latihan</Text>
              <Text style={s.settingDesc}>Ingatkan 15 menit sebelum jadwal.</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={toggleReminder}
              thumbColor={WHITE}
              trackColor={{ false: BORDER, true: MINT }}
            />
          </View>

          <View style={s.divider} />

          {/* Item 2: Jadwal berikutnya */}
          <Pressable style={s.settingRow}>
            <Ionicons name="calendar-outline" size={20} color={MUTED} style={s.rowIcon} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.settingLabel}>Jadwal berikutnya</Text>
              <Text style={[s.settingDesc, { color: MINT }]}>Hari ini • 18.00</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MUTED} />
          </Pressable>

          <View style={s.divider} />

          {/* Item 3: Aktivitas komunitas */}
          <View style={s.settingRow}>
            <Ionicons name="people-outline" size={20} color={MUTED} style={s.rowIcon} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.settingLabel}>Aktivitas komunitas</Text>
              <Text style={s.settingDesc}>Kabar grup dan tantangan baru.</Text>
            </View>
            <Switch
              value={communityEnabled}
              onValueChange={toggleCommunity}
              thumbColor={WHITE}
              trackColor={{ false: BORDER, true: MINT }}
            />
          </View>
        </View>

        {/* ── Section: Data Fisik & Tujuan ── */}
        <Text style={s.sectionTitle}>Data fisik &amp; tujuan</Text>
        <View style={s.card}>
          <View style={s.physRow}>
            <PhysCol value={profile.usia} unit="th"  label="Usia" />
            <View style={s.physDivider} />
            <PhysCol value={profile.tinggi} unit="cm"  label="Tinggi" />
            <View style={s.physDivider} />
            <PhysCol value={profile.berat} unit="kg"  label="Berat badan" />
          </View>

          {profile.tujuan && (
            <View style={s.tujuanRow}>
              <Ionicons name="disc-outline" size={14} color={MINT} />
              <Text style={s.tujuanTxt}>
                Tujuan: <Text style={{ color: MINT, fontWeight: '700' }}>{tujuanLabel(profile.tujuan)}</Text>
              </Text>
            </View>
          )}

          {/* Tombol edit */}
          <Pressable style={s.editPhysBtn} onPress={() => setShowEditModal(true)}>
            <Ionicons name="pencil-outline" size={15} color={MINT} style={{ marginRight: 6 }} />
            <Text style={s.editPhysTxt}>Perbarui data fisik</Text>
          </Pressable>
        </View>

        {/* ── Section: Sistem ── */}
        <Text style={s.sectionTitle}>Sistem</Text>
        <View style={s.card}>
          <SystemRow icon="download-outline" iconColor={MUTED}
            label="Unduhan offline" right={<Text style={s.sysRight}>12 program • 148 MB</Text>} chevron />
          <View style={s.divider} />
          <SystemRow icon="language-outline" iconColor={MUTED}
            label="Bahasa" right={<Text style={s.sysRight}>Indonesia</Text>} />
          <View style={s.divider} />
          <SystemRow icon="help-circle-outline" iconColor={MUTED}
            label="Bantuan & privasi" chevron />
          <View style={s.divider} />
          <SystemRow icon="information-circle-outline" iconColor={MUTED}
            label="Tentang FitTracker" right={<Text style={s.sysRight}>v1.4.0</Text>} />
        </View>

        {/* ── Logout ── */}
        <Pressable
          style={s.logoutBtn}
          onPress={() =>
            Alert.alert('Keluar Akun', 'Yakin ingin keluar?', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Keluar', style: 'destructive', onPress: logout },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={18} color={RED} style={{ marginRight: 6 }} />
          <Text style={s.logoutTxt}>Keluar akun</Text>
        </Pressable>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Modal: Edit Data Fisik ── */}
      <Modal visible={showEditModal} animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: WHITE }}>
          <View style={s.modalHeader}>
            <Pressable onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color={GRAY} />
            </Pressable>
            <Text style={s.modalTitle}>Perbarui Data Fisik</Text>
            <Pressable onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={MINT} />
                : <Text style={s.modalSave}>Simpan</Text>}
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <Text style={s.formLabel}>Jenis Kelamin</Text>
            <View style={s.chipRow}>
              {GENDER.map((g) => (
                <Pressable
                  key={g.v}
                  style={[s.chip, profile.jenis_kelamin === g.v && s.chipActive]}
                  onPress={() => setField('jenis_kelamin', g.v)}
                >
                  <Text style={[s.chipTxt, profile.jenis_kelamin === g.v && s.chipTxtActive]}>{g.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.formLabel}>Usia (th)</Text>
                <TextInput style={s.formInput} value={profile.usia} onChangeText={(v) => setField('usia', v.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder="24" placeholderTextColor={MUTED} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.formLabel}>Tinggi (cm)</Text>
                <TextInput style={s.formInput} value={profile.tinggi} onChangeText={(v) => setField('tinggi', v.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder="165" placeholderTextColor={MUTED} />
              </View>
            </View>

            <Text style={s.formLabel}>Berat (kg)</Text>
            <TextInput style={s.formInput} value={profile.berat} onChangeText={(v) => setField('berat', v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" placeholder="67.8" placeholderTextColor={MUTED} />

            <Text style={s.formLabel}>Level Aktivitas</Text>
            <View style={s.chipRow}>
              {AKTIVITAS.map((a) => (
                <Pressable
                  key={a.v}
                  style={[s.chip, profile.level_aktivitas === a.v && s.chipActive]}
                  onPress={() => setField('level_aktivitas', a.v)}
                >
                  <Text style={[s.chipTxt, profile.level_aktivitas === a.v && s.chipTxtActive]}>{a.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.formLabel}>Tujuan</Text>
            <View style={s.chipRow}>
              {TUJUAN.map((t) => (
                <Pressable
                  key={t.v}
                  style={[s.chip, profile.tujuan === t.v && s.chipActive]}
                  onPress={() => setField('tujuan', t.v)}
                >
                  <Text style={[s.chipTxt, profile.tujuan === t.v && s.chipTxtActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.formLabel}>Catatan Kesehatan (opsional)</Text>
            <TextInput
              style={[s.formInput, { height: 80, textAlignVertical: 'top' }]}
              value={profile.catatan_kesehatan}
              onChangeText={(v) => setField('catatan_kesehatan', v)}
              placeholder="mis. riwayat cedera lutut"
              placeholderTextColor={MUTED}
              multiline
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PhysCol({ value, unit, label }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={s.physVal}>{value} <Text style={s.physUnit}>{unit}</Text></Text>
      <Text style={s.physLabel}>{label}</Text>
    </View>
  );
}

function SystemRow({ icon, iconColor, label, right, chevron }) {
  return (
    <View style={s.settingRow}>
      <Ionicons name={icon} size={20} color={iconColor || MUTED} style={s.rowIcon} />
      <Text style={[s.settingLabel, { flex: 1, marginLeft: 12 }]}>{label}</Text>
      {right}
      {chevron && <Ionicons name="chevron-forward" size={16} color={MUTED} style={{ marginLeft: 6 }} />}
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 40 },

  headerRow: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title:     { fontSize: 24, fontWeight: '700', color: TEXT },
  subtitle:  { fontSize: 13, color: MUTED, marginTop: 2 },

  card: {
    backgroundColor: WHITE, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden',
  },

  profileRow:     { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatarCircle:   { width: 48, height: 48, borderRadius: 24, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 16, fontWeight: 'bold', color: WHITE },
  profileName:    { fontSize: 15, fontWeight: '700', color: TEXT },
  profileUsername:{ fontSize: 12, color: MUTED, marginTop: 1 },
  profileEmail:   { fontSize: 12, color: MUTED, marginTop: 1 },
  editIconBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: MINT_LL, borderWidth: 1, borderColor: MINT_L, alignItems: 'center', justifyContent: 'center' },

  syncBanner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: MINT_LL, borderRadius: 14, marginHorizontal: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: MINT_L },
  syncIconWrap:{ width: 30, height: 30, borderRadius: 8, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  syncTitle:   { fontSize: 13, fontWeight: '700', color: MINT_D },
  syncSub:     { fontSize: 11, color: MINT, marginTop: 1 },
  syncNote:    { fontSize: 12, color: GRAY, marginHorizontal: 20, marginBottom: 16, lineHeight: 18 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: TEXT, marginHorizontal: 20, marginBottom: 8 },

  settingRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  rowIcon:     { width: 22 },
  settingIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel:{ fontSize: 14, fontWeight: '500', color: TEXT },
  settingDesc: { fontSize: 12, color: MUTED, marginTop: 1 },
  divider:     { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },
  sysRight:    { fontSize: 13, color: MUTED },

  physRow:     { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 8 },
  physDivider: { width: 1, backgroundColor: BORDER },
  physVal:     { fontSize: 20, fontWeight: 'bold', color: TEXT },
  physUnit:    { fontSize: 12, fontWeight: '400', color: MUTED },
  physLabel:   { fontSize: 11, color: MUTED, marginTop: 2 },
  tujuanRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 6 },
  tujuanTxt:   { fontSize: 12, color: GRAY },
  editPhysBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginBottom: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: MINT, backgroundColor: WHITE },
  editPhysTxt: { fontSize: 14, fontWeight: '600', color: MINT },

  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: WHITE },
  logoutTxt:  { fontSize: 14, fontWeight: '600', color: RED },

  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalTitle:  { fontSize: 17, fontWeight: 'bold', color: TEXT },
  modalSave:   { fontSize: 15, fontWeight: '700', color: MINT },
  formLabel:   { fontSize: 13, fontWeight: '600', color: TEXT, marginBottom: 8, marginTop: 16 },
  formInput:   { borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: TEXT, backgroundColor: BG },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  chipActive:  { backgroundColor: MINT_L, borderColor: MINT },
  chipTxt:     { fontSize: 13, fontWeight: '600', color: GRAY },
  chipTxtActive:{ color: MINT },
});