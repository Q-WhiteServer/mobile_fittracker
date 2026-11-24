/**
 * profile.js — Halaman Pengaturan
 *
 * Preferensi notifikasi (reminder_enabled, reminder_time, community_enabled)
 * disimpan & dimuat dari database MySQL melalui GET/PUT /settings.
 * Fallback ke AsyncStorage jika offline.
 *
 * Jadwal berikutnya:
 * - Otomatis diambil dari plan terdekat user (GET /plans)
 * - User bisa override manual lewat modal picker
 * - Disimpan sebagai label ke user_settings.next_schedule_label
 *
 * Notifikasi HP:
 * - scheduleReminder(timeStr) → dijadwalkan 15 menit sebelum waktu latihan
 * - cancelReminder()         → dibatalkan saat toggle dimatikan
 */

import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, Switch, Alert, StyleSheet,
  ScrollView, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getProfile, saveProfile, refreshPlansFromBackend, getPlans } from '../../localStore';
import { api } from '../../api';
import { getSettings as getSettingsLocal, saveSettings as saveSettingsLocal } from '../../storage';
import {
  scheduleReminder,
  cancelReminder,
  requestNotificationPermissions,
} from '../../notifications';

// ── Palet ─────────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}
function tujuanLabel(v) {
  const map = {
    menurunkan_berat:      'menurunkan berat badan',
    menambah_massa:        'menambah massa otot',
    menjaga_kebugaran:     'menjaga kebugaran',
    meningkatkan_kekuatan: 'meningkatkan kekuatan',
  };
  return map[v] || v;
}

/** Format ISO timestamp ke label Indonesia */
function fmtSyncLabel(isoStr) {
  if (!isoStr) return 'belum pernah';
  try {
    const d = new Date(isoStr);
    const HARI  = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    const BLN   = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${HARI[d.getDay()]}, ${d.getDate()} ${BLN[d.getMonth()]} • ${hh}.${mm}`;
  } catch { return 'tidak diketahui'; }
}

/** Ambil jadwal terdekat dari daftar plan (berdasarkan tanggal ≥ hari ini) */
function nearestPlan(plans = []) {
  if (!plans.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = plans
    .filter((p) => p.tanggal >= today)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  return upcoming[0] || null;
}

/** Buat label tampilan dari plan, mis. "Senin, 20 Nov • 18.00" */
function buildScheduleLabel(plan, timeStr) {
  if (!plan) return null;
  try {
    const [y, mo, d] = plan.tanggal.split('-').map(Number);
    const date = new Date(y, mo - 1, d);
    const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const BLN  = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dayLabel = `${HARI[date.getDay()]}, ${d} ${BLN[mo - 1]}`;
    const [hh, mm] = (timeStr || '').split(':');
    const timeLabel = hh && mm ? ` • ${hh}.${mm}` : '';
    return `${dayLabel}${timeLabel}`;
  } catch { return null; }
}

/** Hitung jam pengingat (15 mnt sebelum timeStr) untuk ditampilkan ke user */
function reminderLabel(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m - 15;
  const adj   = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(adj / 60)).padStart(2, '0')}.${String(adj % 60).padStart(2, '0')}`;
}

// ── Konstanta form edit profil ─────────────────────────────────────────────────
const GENDER   = [{ v: 'L', label: 'Laki-laki' }, { v: 'P', label: 'Perempuan' }];
const AKTIVITAS = [
  { v: 'rendah',       label: 'Rendah' },
  { v: 'sedang',       label: 'Sedang' },
  { v: 'aktif',        label: 'Aktif' },
  { v: 'sangat_aktif', label: 'Sangat Aktif' },
];
const TUJUAN = [
  { v: 'menurunkan_berat',       label: 'Turunkan Berat' },
  { v: 'menambah_massa',         label: 'Tambah Massa' },
  { v: 'menjaga_kebugaran',      label: 'Jaga Kebugaran' },
  { v: 'meningkatkan_kekuatan',  label: 'Tingkatkan Kekuatan' },
];

// ═══════════════════════════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const { user, logout, lastSync, isOnline, triggerSync } = useAuth();

  // ── State profil fisik ────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    jenis_kelamin: null, usia: '', tinggi: '', berat: '',
    level_aktivitas: null, tujuan: 'menurunkan_berat', catatan_kesehatan: '',
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving,        setSaving]        = useState(false);

  // ── State notifikasi ──────────────────────────────────────────────────────
  const [reminderEnabled,  setReminderEnabled]  = useState(false);
  const [communityEnabled, setCommunityEnabled] = useState(true);
  const [reminderTime,     setReminderTime]      = useState('17:00');
  const [scheduleLabel,    setScheduleLabel]     = useState(null); // label dinamis
  const [savingSettings,   setSavingSettings]    = useState(false);

  // ── State modal atur waktu + jadwal ──────────────────────────────────────
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [timeInput,          setTimeInput]         = useState('17:00');
  const [plans,              setPlans]             = useState([]);   // daftar plan user
  const [selectedPlan,       setSelectedPlan]      = useState(null); // plan yang dipilih

  // ── Muat semua data saat layar fokus ──────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      (async () => {
        // 1. Profil fisik — coba backend dulu, fallback lokal
        let p = await getProfile();
        if (!p) {
          try {
            const r = await api.getProfile();
            if (r.profile) p = r.profile;
          } catch {}
        }
        if (p) {
          setProfile({
            jenis_kelamin:     p.jenis_kelamin     || null,
            usia:              p.usia  != null ? String(p.usia)   : '',
            tinggi:            p.tinggi != null ? String(p.tinggi) : '',
            berat:             p.berat  != null ? String(p.berat)  : '',
            level_aktivitas:   p.level_aktivitas   || null,
            tujuan:            p.tujuan            || 'menurunkan_berat',
            catatan_kesehatan: p.catatan_kesehatan || '',
          });
        }

        // 2. Settings notifikasi — HANYA dari AsyncStorage (tidak ke backend)
        const sett = await getSettingsLocal();
        setReminderEnabled(sett.reminderEnabled ?? false);
        setReminderTime(sett.reminderTime || '17:00');
        setTimeInput(sett.reminderTime || '17:00');
        setCommunityEnabled(sett.communityEnabled !== false); // default true
        setScheduleLabel(sett.nextScheduleLabel || null);

        // 3. Jadwal plan untuk modal
        try {
          const fresh = await refreshPlansFromBackend();
          const list  = fresh ?? await getPlans();
          setPlans(list || []);
          if (!sett.nextScheduleLabel) {
            const nearest = nearestPlan(list || []);
            if (nearest) {
              const lbl = buildScheduleLabel(nearest, sett.reminderTime || '17:00');
              if (lbl) setScheduleLabel(lbl);
            }
          }
        } catch {}
      })();
    }, [])
  );

  // ── Simpan settings ke AsyncStorage saja (tidak ke backend) ─────────────
  async function persistSettings(patch) {
    const current = await getSettingsLocal();
    const next = {
      reminderEnabled:   patch.reminder_enabled    ?? (current.reminderEnabled   ?? false),
      reminderTime:      patch.reminder_time        ?? (current.reminderTime      || '17:00'),
      communityEnabled:  patch.community_enabled    ?? (current.communityEnabled  !== false),
      nextScheduleLabel: patch.next_schedule_label  ?? (current.nextScheduleLabel || null),
    };
    await saveSettingsLocal(next);
  }

  // ── Toggle pengingat latihan ───────────────────────────────────────────────
  async function toggleReminder(value) {
    setReminderEnabled(value);
    setSavingSettings(true);
    try {
      if (value) {
        // Minta izin dulu
        const granted = await requestNotificationPermissions();
        if (!granted) {
          Alert.alert(
            'Izin Notifikasi Diperlukan',
            'Aktifkan izin notifikasi di Pengaturan HP agar pengingat bisa berjalan.',
            [{ text: 'OK' }]
          );
          setReminderEnabled(false);
          return;
        }
        await scheduleReminder(reminderTime);
        Alert.alert(
          'Pengingat Aktif ✅',
          `Kamu akan diingatkan pukul ${reminderLabel(reminderTime)} setiap hari (15 menit sebelum ${reminderTime.replace(':', '.')}).`
        );
      } else {
        await cancelReminder();
      }
      await persistSettings({ reminder_enabled: value });
    } catch (e) {
      setReminderEnabled(false);
      await persistSettings({ reminder_enabled: false });
      Alert.alert('Gagal', e.message || 'Tidak dapat mengatur pengingat.');
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Toggle notifikasi komunitas ───────────────────────────────────────────
  async function toggleCommunity(value) {
    setCommunityEnabled(value);
    await persistSettings({ community_enabled: value });
  }

  // ── Simpan waktu + jadwal dari modal ─────────────────────────────────────
  async function saveScheduleModal() {
    // Validasi format HH:MM
    if (!/^\d{2}:\d{2}$/.test(timeInput)) {
      Alert.alert('Format Salah', 'Gunakan format HH:MM, contoh: 18:00');
      return;
    }
    setSavingSettings(true);
    const newTime = timeInput;
    setReminderTime(newTime);

    // Buat label dari plan terpilih atau plan terdekat
    const planForLabel = selectedPlan || nearestPlan(plans);
    const newLabel = buildScheduleLabel(planForLabel, newTime)
      || `Setiap hari • ${newTime.replace(':', '.')}`;
    setScheduleLabel(newLabel);

    try {
      // Jadwal ulang notifikasi jika reminder aktif
      if (reminderEnabled) {
        await scheduleReminder(newTime);
      }
      await persistSettings({
        reminder_time:       newTime,
        next_schedule_label: newLabel,
      });
      setShowScheduleModal(false);
      Alert.alert(
        'Tersimpan ✅',
        reminderEnabled
          ? `Pengingat diatur pukul ${reminderLabel(newTime)} (15 mnt sebelum ${newTime.replace(':', '.')}).`
          : 'Jadwal berhasil disimpan.'
      );
    } catch (e) {
      Alert.alert('Gagal', e.message || 'Tidak dapat menyimpan jadwal.');
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Simpan profil fisik ───────────────────────────────────────────────────
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

  function setField(f, v) {
    setProfile((prev) => ({ ...prev, [f]: v }));
  }

  const ini          = initials(user?.nama_lengkap);
  const name         = user?.nama_lengkap || '';
  const usernameSlug = name.toLowerCase().replace(/\s+/g, '.');

  // Label dinamis untuk "Jadwal berikutnya"
  const jadwalLabel = scheduleLabel || (
    nearestPlan(plans)
      ? buildScheduleLabel(nearestPlan(plans), reminderTime) || 'Belum ada jadwal'
      : 'Belum ada jadwal'
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.title}>Pengaturan</Text>
          <Text style={s.subtitle}>Atur FitTracker sesuai kebutuhanmu.</Text>
        </View>

        {/* Kartu profil */}
        <View style={s.card}>
          <View style={s.profileRow}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>{ini}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.profileName}>{name}</Text>
              {usernameSlug ? <Text style={s.profileUsername}>@{usernameSlug}</Text> : null}
              <Text style={s.profileEmail}>{user?.email || ''}</Text>
            </View>
            <Pressable style={s.editIconBtn} onPress={() => setShowEditModal(true)}>
              <Ionicons name="pencil" size={16} color={MINT} />
            </Pressable>
          </View>
        </View>

        {/* Cloud Sync Banner — dinamis */}
        <Pressable
          style={[s.syncBanner, !isOnline && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
          onPress={triggerSync}
          accessibilityLabel="Ketuk untuk sinkronisasi ulang"
        >
          <View style={s.syncIconWrap}>
            <Ionicons
              name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
              size={18}
              color={isOnline ? MINT : '#D97706'}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.syncTitle, !isOnline && { color: '#B45309' }]}>
              {isOnline ? 'Cloud tersinkronisasi' : 'Offline — data tersimpan lokal'}
            </Text>
            <Text style={[s.syncSub, !isOnline && { color: '#D97706' }]}>
              {isOnline
                ? `Terakhir: ${fmtSyncLabel(lastSync)}`
                : 'Ketuk untuk sinkronisasi saat koneksi kembali'}
            </Text>
          </View>
          <Ionicons
            name="refresh-outline"
            size={16}
            color={isOnline ? MINT : '#D97706'}
          />
        </Pressable>

        {/* Section: Pengingat & Notifikasi */}
        <Text style={s.sectionTitle}>Pengingat &amp; notifikasi</Text>
        <View style={s.card}>

          {/* Toggle pengingat */}
          <View style={s.settingRow}>
            <Ionicons name="alarm-outline" size={20} color={MUTED} style={s.rowIcon} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.settingLabel}>Pengingat latihan</Text>
              <Text style={s.settingDesc}>
                {reminderEnabled
                  ? `Aktif • notif pukul ${reminderLabel(reminderTime)}`
                  : 'Ingatkan 15 menit sebelum jadwal.'}
              </Text>
            </View>
            {savingSettings
              ? <ActivityIndicator size="small" color={MINT} />
              : (
                <Switch
                  value={reminderEnabled}
                  onValueChange={toggleReminder}
                  thumbColor={WHITE}
                  trackColor={{ false: BORDER, true: MINT }}
                />
              )}
          </View>

          <View style={s.divider} />

          {/* Jadwal berikutnya — BISA DIKLIK */}
          <Pressable
            style={s.settingRow}
            onPress={() => {
              setTimeInput(reminderTime);
              setSelectedPlan(nearestPlan(plans));
              setShowScheduleModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={MUTED} style={s.rowIcon} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.settingLabel}>Jadwal berikutnya</Text>
              <Text style={[s.settingDesc, { color: MINT }]}>{jadwalLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MUTED} />
          </Pressable>

          <View style={s.divider} />

          {/* Toggle komunitas */}
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

        {/* Section: Data Fisik */}
        <Text style={s.sectionTitle}>Data fisik &amp; tujuan</Text>
        <View style={s.card}>
          <View style={s.physRow}>
            <PhysCol value={profile.usia   || '—'} unit="th" label="Usia" />
            <View style={s.physDivider} />
            <PhysCol value={profile.tinggi || '—'} unit="cm" label="Tinggi" />
            <View style={s.physDivider} />
            <PhysCol value={profile.berat  || '—'} unit="kg" label="Berat badan" />
          </View>
          {profile.tujuan && (
            <View style={s.tujuanRow}>
              <Ionicons name="disc-outline" size={14} color={MINT} />
              <Text style={s.tujuanTxt}>
                Tujuan:{' '}
                <Text style={{ color: MINT, fontWeight: '700' }}>
                  {tujuanLabel(profile.tujuan)}
                </Text>
              </Text>
            </View>
          )}
          <Pressable style={s.editPhysBtn} onPress={() => setShowEditModal(true)}>
            <Ionicons name="pencil-outline" size={15} color={MINT} style={{ marginRight: 6 }} />
            <Text style={s.editPhysTxt}>Perbarui data fisik</Text>
          </Pressable>
        </View>

        {/* Section: Sistem */}
        <Text style={s.sectionTitle}>Sistem</Text>
        <View style={s.card}>
          <SystemRow icon="language-outline"           label="Bahasa"            right={<Text style={s.sysRight}>Indonesia</Text>} />
          <View style={s.divider} />
          <SystemRow icon="help-circle-outline"        label="Bantuan &amp; privasi"  chevron />
          <View style={s.divider} />
          <SystemRow icon="information-circle-outline" label="Tentang FitTracker" right={<Text style={s.sysRight}>v1.4.0</Text>} />
        </View>

        {/* Logout */}
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

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Modal: Atur Jadwal & Waktu Pengingat ── */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            {/* Handle */}
            <View style={s.sheetHandle} />

            <Text style={s.modalTitle}>Atur Jadwal Pengingat</Text>
            <Text style={s.modalSub}>
              Pilih jadwal dan jam latihan. Pengingat akan muncul 15 menit sebelumnya.
            </Text>

            {/* Jam latihan */}
            <Text style={s.formLabel}>Jam Latihan (HH:MM)</Text>
            <View style={s.timeInputRow}>
              <Ionicons name="time-outline" size={20} color={MINT} style={{ marginRight: 10 }} />
              <TextInput
                style={s.timeInput}
                value={timeInput}
                onChangeText={setTimeInput}
                placeholder="17:00"
                placeholderTextColor={MUTED}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            {timeInput.length === 5 && /^\d{2}:\d{2}$/.test(timeInput) && (
              <Text style={s.reminderHint}>
                💡 Pengingat akan dikirim pukul {reminderLabel(timeInput)}
              </Text>
            )}

            {/* Pilih dari plan yang ada */}
            {plans.length > 0 && (
              <>
                <Text style={[s.formLabel, { marginTop: 20 }]}>
                  Atau pilih dari jadwal aktif
                </Text>
                <ScrollView
                  style={{ maxHeight: 180 }}
                  showsVerticalScrollIndicator={false}
                >
                  {plans.slice(0, 10).map((p) => {
                    const isSelected = selectedPlan?.id === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        style={[s.planOption, isSelected && s.planOptionActive]}
                        onPress={() => setSelectedPlan(p)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[s.planOptionName, isSelected && { color: MINT }]}>
                            {p.nama_plan}
                          </Text>
                          <Text style={s.planOptionMeta}>{p.tanggal}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={MINT} />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Tombol aksi */}
            <Pressable
              style={[s.saveBtn, savingSettings && { opacity: 0.6 }]}
              onPress={saveScheduleModal}
              disabled={savingSettings}
            >
              {savingSettings
                ? <ActivityIndicator color={WHITE} />
                : <Text style={s.saveBtnTxt}>Simpan & Aktifkan</Text>}
            </Pressable>
            <Pressable style={s.cancelBtn} onPress={() => setShowScheduleModal(false)}>
              <Text style={s.cancelBtnTxt}>Batal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Edit Data Fisik ── */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
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

          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.formLabel}>Jenis Kelamin</Text>
            <View style={s.chipRow}>
              {GENDER.map((g) => (
                <Pressable
                  key={g.v}
                  style={[s.chip, profile.jenis_kelamin === g.v && s.chipActive]}
                  onPress={() => setField('jenis_kelamin', g.v)}
                >
                  <Text style={[s.chipTxt, profile.jenis_kelamin === g.v && s.chipTxtActive]}>
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.formLabel}>Usia (th)</Text>
                <TextInput
                  style={s.formInput}
                  value={profile.usia}
                  onChangeText={(v) => setField('usia', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="24"
                  placeholderTextColor={MUTED}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.formLabel}>Tinggi (cm)</Text>
                <TextInput
                  style={s.formInput}
                  value={profile.tinggi}
                  onChangeText={(v) => setField('tinggi', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="165"
                  placeholderTextColor={MUTED}
                />
              </View>
            </View>

            <Text style={s.formLabel}>Berat (kg)</Text>
            <TextInput
              style={s.formInput}
              value={profile.berat}
              onChangeText={(v) => setField('berat', v.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
              placeholder="67.8"
              placeholderTextColor={MUTED}
            />

            <Text style={s.formLabel}>Level Aktivitas</Text>
            <View style={s.chipRow}>
              {AKTIVITAS.map((a) => (
                <Pressable
                  key={a.v}
                  style={[s.chip, profile.level_aktivitas === a.v && s.chipActive]}
                  onPress={() => setField('level_aktivitas', a.v)}
                >
                  <Text style={[s.chipTxt, profile.level_aktivitas === a.v && s.chipTxtActive]}>
                    {a.label}
                  </Text>
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
                  <Text style={[s.chipTxt, profile.tujuan === t.v && s.chipTxtActive]}>
                    {t.label}
                  </Text>
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

// ── Sub-komponen ──────────────────────────────────────────────────────────────
function PhysCol({ value, unit, label }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={s.physVal}>
        {value} <Text style={s.physUnit}>{unit}</Text>
      </Text>
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
      {chevron && (
        <Ionicons name="chevron-forward" size={16} color={MUTED} style={{ marginLeft: 6 }} />
      )}
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
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },

  profileRow:      { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatarCircle:    { width: 48, height: 48, borderRadius: 24, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' },
  avatarText:      { fontSize: 16, fontWeight: 'bold', color: WHITE },
  profileName:     { fontSize: 15, fontWeight: '700', color: TEXT },
  profileUsername: { fontSize: 12, color: MUTED, marginTop: 1 },
  profileEmail:    { fontSize: 12, color: MUTED, marginTop: 1 },
  editIconBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: MINT_LL, borderWidth: 1, borderColor: MINT_L, alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: TEXT, marginHorizontal: 20, marginBottom: 8, marginTop: 4 },

  settingRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  rowIcon:      { width: 22 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: TEXT },
  settingDesc:  { fontSize: 12, color: MUTED, marginTop: 1 },
  divider:      { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },
  sysRight:     { fontSize: 13, color: MUTED },

  physRow:     { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 8 },
  physDivider: { width: 1, backgroundColor: BORDER },
  physVal:     { fontSize: 20, fontWeight: 'bold', color: TEXT },
  physUnit:    { fontSize: 12, fontWeight: '400', color: MUTED },
  physLabel:   { fontSize: 11, color: MUTED, marginTop: 2 },
  tujuanRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 6 },
  tujuanTxt:   { fontSize: 12, color: GRAY },
  editPhysBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginBottom: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: MINT, backgroundColor: WHITE },
  editPhysTxt: { fontSize: 14, fontWeight: '600', color: MINT },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: WHITE },
  logoutTxt: { fontSize: 14, fontWeight: '600', color: RED },

  /* Modal jadwal */
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: BORDER, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle:  { fontSize: 18, fontWeight: 'bold', color: TEXT, marginBottom: 4 },
  modalSub:    { fontSize: 13, color: MUTED, marginBottom: 8, lineHeight: 18 },
  formLabel:   { fontSize: 13, fontWeight: '600', color: TEXT, marginBottom: 8, marginTop: 4 },
  timeInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 14, height: 52,
  },
  timeInput:    { flex: 1, fontSize: 20, fontWeight: 'bold', color: TEXT },
  reminderHint: { fontSize: 12, color: MINT, marginTop: 6, marginBottom: 4 },

  planOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: BORDER,
    backgroundColor: WHITE, marginBottom: 8,
  },
  planOptionActive:  { borderColor: MINT, backgroundColor: MINT_LL },
  planOptionName:    { fontSize: 14, fontWeight: '600', color: TEXT },
  planOptionMeta:    { fontSize: 12, color: MUTED, marginTop: 1 },

  saveBtn:    { backgroundColor: MINT, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  saveBtnTxt: { color: WHITE, fontSize: 16, fontWeight: 'bold' },
  cancelBtn:  { alignItems: 'center', marginTop: 12 },
  cancelBtnTxt:{ fontSize: 14, color: GRAY },

  /* Modal edit profil */
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalSave:   { fontSize: 15, fontWeight: '700', color: MINT },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  chipActive:  { backgroundColor: MINT_L, borderColor: MINT },
  chipTxt:     { fontSize: 13, fontWeight: '600', color: GRAY },
  chipTxtActive:{ color: MINT },
  formInput:   { borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: TEXT, backgroundColor: BG },
});
