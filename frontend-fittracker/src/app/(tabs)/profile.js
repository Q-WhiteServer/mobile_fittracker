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
    menurunkan_berat: 'Menurunkan berat badan',
    menambah_massa:   'Menambah massa otot',
    menjaga_kebugaran:'Menjaga kebugaran',
    meningkatkan_kekuatan: 'Meningkatkan kekuatan',
  };
  return map[v] || v;
}
function todaySync() {
  const d = new Date();
  return `hari ini, ${d.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.getMonth()]} • ${String(d.getHours()).padStart(2,'0')}.${String(d.getMinutes()).padStart(2,'0')}`;
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
    jenis_kelamin: null, usia: '', tinggi: '', berat: '',
    level_aktivitas: null, tujuan: null, catatan_kesehatan: '',
  });
  const [reminderEnabled,   setReminderEnabled]   = useState(false);
  const [communityEnabled,  setCommunityEnabled]  = useState(true);
  const [reminderTime,      setReminderTime]      = useState('17:00');
  const [saving,            setSaving]            = useState(false);
  const [showEditModal,     setShowEditModal]     = useState(false);
  const [showTimeModal,     setShowTimeModal]     = useState(false);
  const [timeInput,         setTimeInput]         = useState('17:00');

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
            usia:              p.usia  != null ? String(p.usia)  : '',
            tinggi:            p.tinggi != null ? String(p.tinggi) : '',
            berat:             p.berat  != null ? String(p.berat)  : '',
            level_aktivitas:   p.level_aktivitas   || null,
            tujuan:            p.tujuan            || null,
            catatan_kesehatan: p.catatan_kesehatan || '',
          });
        }
        const s = await getSettings();
        setReminderEnabled(!!s.reminderEnabled);
        setReminderTime(s.reminderTime || '17:00');
        setTimeInput(s.reminderTime || '17:00');
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

  // ── Toggle notifikasi komunitas ────────────────────────────────────────────
  async function toggleCommunity(value) {
    setCommunityEnabled(value);
    // Simpan ke settings
    const s = await getSettings();
    await saveSettings({ ...s, communityEnabled: value });
  }

  // ── Simpan waktu pengingat ─────────────────────────────────────────────────
  async function saveReminderTime() {
    if (!/^\d{2}:\d{2}$/.test(timeInput)) {
      Alert.alert('Format Salah', 'Gunakan format HH:MM, contoh: 17:00'); return;
    }
    setReminderTime(timeInput);
    const settings = { reminderEnabled, reminderTime: timeInput };
    await saveSettings(settings);
    if (reminderEnabled) {
      try { await scheduleReminder(timeInput); } catch { /* ignore */ }
    }
    setShowTimeModal(false);
  }

  // ── Test notifikasi ────────────────────────────────────────────────────────
  async function handleTest() {
    try {
      await sendTestNotification();
      Alert.alert('Terkirim', 'Notifikasi uji coba akan muncul dalam 1 detik.');
    } catch (e) {
      Alert.alert('Gagal', e.message);
    }
  }

  // ── Data profil untuk tampilan ─────────────────────────────────────────────
  const ini     = initials(user?.nama_lengkap);
  const usernameSlug = (user?.nama_lengkap || '').toLowerCase().replace(/\s+/g, '.');
  const hasPhysical  = profile.usia || profile.tinggi || profile.berat;

  // Jadwal berikutnya (placeholder — bisa disambungkan ke plans)
  const nextSchedule = 'Hari ini • 18.00';

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
              <Text style={s.profileName}>{user?.nama_lengkap || '—'}</Text>
              <Text style={s.profileUsername}>@{usernameSlug}</Text>
              <Text style={s.profileEmail}>{user?.email || '—'}</Text>
            </View>
            <Pressable style={s.editIconBtn} onPress={() => setShowEditModal(true)}>
              <Ionicons name="pencil" size={16} color={MINT} />
            </Pressable>
          </View>
        </View>

        {/* ── Cloud Sync Banner ── */}
        <View style={s.syncBanner}>
          <View style={s.syncIconWrap}>
            <Ionicons name="cloud-done-outline" size={22} color={MINT} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.syncTitle}>Cloud tersinkronisasi</Text>
            <Text style={s.syncSub}>Terakhir: {todaySync()}</Text>
          </View>
          <View style={s.syncDot} />
        </View>
        <Text style={s.syncNote}>
          Jadwal dan log tetap bisa diakses offline. Perubahan akan disinkronkan saat online.
        </Text>

        {/* ── Section: Pengingat & Notifikasi ── */}
        <Text style={s.sectionTitle}>Pengingat &amp; notifikasi</Text>
        <View style={s.card}>
          {/* Item 1: Pengingat latihan */}
          <View style={s.settingRow}>
            <View style={[s.settingIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="alarm-outline" size={18} color="#D97706" />
            </View>
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

          {/* Item 1b: Waktu pengingat (muncul jika aktif) */}
          {reminderEnabled && (
            <>
              <Pressable style={s.settingRow} onPress={() => { setTimeInput(reminderTime); setShowTimeModal(true); }}>
                <View style={[s.settingIcon, { backgroundColor: MINT_L }]}>
                  <Ionicons name="time-outline" size={18} color={MINT} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.settingLabel}>Waktu pengingat</Text>
                  <Text style={s.settingDesc}>Setiap hari pukul {reminderTime}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </Pressable>
              <Pressable style={[s.settingRow, { paddingTop: 8 }]} onPress={handleTest}>
                <View style={[s.settingIcon, { backgroundColor: MINT_LL }]}>
                  <Ionicons name="notifications-outline" size={18} color={MINT} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.settingLabel}>Uji coba notifikasi</Text>
                  <Text style={s.settingDesc}>Kirim notifikasi percobaan sekarang.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </Pressable>
              <View style={s.divider} />
            </>
          )}

          {/* Item 2: Jadwal berikutnya */}
          <Pressable style={s.settingRow}>
            <View style={[s.settingIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.settingLabel}>Jadwal berikutnya</Text>
              <Text style={[s.settingDesc, { color: MINT, fontWeight: '600' }]}>{nextSchedule}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MUTED} />
          </Pressable>

          <View style={s.divider} />

          {/* Item 3: Aktivitas komunitas */}
          <View style={s.settingRow}>
            <View style={[s.settingIcon, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="people-outline" size={18} color="#8B5CF6" />
            </View>
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
          {hasPhysical ? (
            <>
              {/* Ringkasan 3 kolom */}
              <View style={s.physRow}>
                <PhysCol value={profile.usia  || '—'} unit="th"  label="Usia" />
                <View style={s.physDivider} />
                <PhysCol value={profile.tinggi || '—'} unit="cm"  label="Tinggi" />
                <View style={s.physDivider} />
                <PhysCol value={profile.berat  || '—'} unit="kg"  label="Berat badan" />
              </View>

              {/* Tujuan */}
              {profile.tujuan && (
                <View style={s.tujuanRow}>
                  <Ionicons name="flag-outline" size={16} color={MINT} />
                  <Text style={s.tujuanTxt}>
                    Tujuan: <Text style={{ color: MINT, fontWeight: '700' }}>{tujuanLabel(profile.tujuan)}</Text>
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={s.emptyPhys}>
              <Ionicons name="body-outline" size={36} color={BORDER} />
              <Text style={s.emptyPhysTxt}>Data fisik belum diisi.</Text>
            </View>
          )}

          {/* Tombol edit */}
          <Pressable style={s.editPhysBtn} onPress={() => setShowEditModal(true)}>
            <Ionicons name="pencil-outline" size={15} color={MINT} />
            <Text style={s.editPhysTxt}>Perbarui data fisik</Text>
          </Pressable>
        </View>

        {/* ── Section: Sistem ── */}
        <Text style={s.sectionTitle}>Sistem</Text>
        <View style={s.card}>
          <SystemRow icon="download-outline" iconBg="#EFF6FF" iconColor="#3B82F6"
            label="Unduhan offline" right={<Text style={s.sysRight}>148 MB</Text>} />
          <View style={s.divider} />
          <SystemRow icon="language-outline" iconBg="#F5F3FF" iconColor="#8B5CF6"
            label="Bahasa" right={<Text style={s.sysRight}>Indonesia</Text>} />
          <View style={s.divider} />
          <SystemRow icon="help-circle-outline" iconBg="#FEF3C7" iconColor="#D97706"
            label="Bantuan &amp; privasi" right={<Ionicons name="chevron-forward" size={16} color={MUTED} />} />
          <View style={s.divider} />
          <SystemRow icon="information-circle-outline" iconBg={MINT_LL} iconColor={MINT}
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
          <Ionicons name="log-out-outline" size={20} color={RED} />
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
            {/* Jenis Kelamin */}
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

            {/* Usia + Tinggi */}
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

            {/* Berat */}
            <Text style={s.formLabel}>Berat (kg)</Text>
            <TextInput style={s.formInput} value={profile.berat} onChangeText={(v) => setField('berat', v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" placeholder="67.8" placeholderTextColor={MUTED} />

            {/* Level Aktivitas */}
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

            {/* Tujuan */}
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

            {/* Catatan Kesehatan */}
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

      {/* ── Modal: Atur Waktu Pengingat ── */}
      <Modal visible={showTimeModal} transparent animationType="slide">
        <View style={s.overlayCenter}>
          <View style={s.timeCard}>
            <Text style={s.timeCardTitle}>Atur Waktu Pengingat</Text>
            <Text style={s.timeCardSub}>Format 24 jam (HH:MM)</Text>
            <TextInput
              style={s.timeInput}
              value={timeInput}
              onChangeText={setTimeInput}
              keyboardType="numeric"
              placeholder="17:00"
              placeholderTextColor={MUTED}
              autoFocus
              maxLength={5}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Pressable style={s.timeBtnCancel} onPress={() => setShowTimeModal(false)}>
                <Text style={{ color: GRAY, fontWeight: '600' }}>Batal</Text>
              </Pressable>
              <Pressable style={s.timeBtnSave} onPress={saveReminderTime}>
                <Text style={{ color: WHITE, fontWeight: '700' }}>Simpan</Text>
              </Pressable>
            </View>
          </View>
        </View>
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

function SystemRow({ icon, iconBg, iconColor, label, right }) {
  return (
    <View style={s.settingRow}>
      <View style={[s.settingIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[s.settingLabel, { flex: 1, marginLeft: 12 }]}>{label}</Text>
      {right}
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 40 },

  // Header
  headerRow: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title:     { fontSize: 28, fontWeight: 'bold', color: TEXT },
  subtitle:  { fontSize: 14, color: MUTED, marginTop: 2 },

  // Card
  card: {
    backgroundColor: WHITE, borderRadius: 18,
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    overflow: 'hidden',
  },

  // Profile
  profileRow:     { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatarCircle:   { width: 56, height: 56, borderRadius: 28, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 20, fontWeight: 'bold', color: WHITE },
  profileName:    { fontSize: 17, fontWeight: 'bold', color: TEXT },
  profileUsername:{ fontSize: 13, color: MUTED, marginTop: 1 },
  profileEmail:   { fontSize: 13, color: GRAY, marginTop: 2 },
  editIconBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: MINT_LL, borderWidth: 1, borderColor: MINT_L, alignItems: 'center', justifyContent: 'center' },

  // Sync Banner
  syncBanner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: MINT_L, borderRadius: 14, marginHorizontal: 16, padding: 14, marginBottom: 8 },
  syncIconWrap:{ width: 38, height: 38, borderRadius: 10, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  syncTitle:   { fontSize: 14, fontWeight: '700', color: MINT_D },
  syncSub:     { fontSize: 12, color: MINT, marginTop: 1 },
  syncDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: MINT, marginLeft: 8 },
  syncNote:    { fontSize: 12, color: GRAY, marginHorizontal: 20, marginBottom: 20, lineHeight: 18 },

  // Section title
  sectionTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginHorizontal: 20, marginBottom: 10 },

  // Setting rows
  settingRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel:{ fontSize: 14, fontWeight: '600', color: TEXT },
  settingDesc: { fontSize: 12, color: MUTED, marginTop: 2 },
  divider:     { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },
  sysRight:    { fontSize: 13, color: MUTED, fontWeight: '500' },

  // Physical data
  physRow:     { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 8 },
  physDivider: { width: 1, backgroundColor: BORDER },
  physVal:     { fontSize: 20, fontWeight: 'bold', color: TEXT },
  physUnit:    { fontSize: 13, fontWeight: '400', color: MUTED },
  physLabel:   { fontSize: 11, color: MUTED, marginTop: 2 },
  tujuanRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 6 },
  tujuanTxt:   { fontSize: 13, color: GRAY },
  emptyPhys:   { alignItems: 'center', paddingVertical: 24 },
  emptyPhysTxt:{ color: MUTED, marginTop: 8 },
  editPhysBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: MINT, backgroundColor: MINT_LL },
  editPhysTxt: { fontSize: 14, fontWeight: '700', color: MINT },

  // Logout
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: RED, backgroundColor: RED_L },
  logoutTxt:  { fontSize: 15, fontWeight: '700', color: RED },

  // Modal edit data fisik
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

  // Modal waktu
  overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  timeCard:      { backgroundColor: WHITE, borderRadius: 20, padding: 24, width: '80%' },
  timeCardTitle: { fontSize: 18, fontWeight: 'bold', color: TEXT, marginBottom: 4 },
  timeCardSub:   { fontSize: 13, color: MUTED, marginBottom: 16 },
  timeInput:     { fontSize: 36, fontWeight: 'bold', color: TEXT, textAlign: 'center', borderBottomWidth: 2, borderBottomColor: MINT, paddingVertical: 8 },
  timeBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center' },
  timeBtnSave:   { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: MINT, alignItems: 'center' },
});
