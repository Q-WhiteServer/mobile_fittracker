// Helper pengingat notifikasi (US-07).
// Menjadwalkan notifikasi lokal 15 menit sebelum waktu latihan yang dipilih user.
import * as Notifications from 'expo-notifications';

const REMINDER_ID = 'fittracker-reminder';

// ── Minta izin notifikasi (wajib Android 13+ & iOS) ──────────────────────────
export async function requestNotificationPermissions() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync()
      .catch(() => ({ status: 'undetermined' }));
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ── Hitung jam & menit pengingat (15 menit sebelum timeStr "HH:MM") ──────────
function reminderTime(timeStr) {
  const [h, m] = (timeStr || '17:00').split(':').map(Number);
  const totalMin = h * 60 + m - 15;
  // Tangani tengah malam (mis. jadwal 00:10 → pengingat 23:55 hari sebelumnya)
  const adjusted = ((totalMin % 1440) + 1440) % 1440;
  return { hour: Math.floor(adjusted / 60), minute: adjusted % 60 };
}

// ── Jadwalkan pengingat harian 15 menit sebelum timeStr ──────────────────────
export async function scheduleReminder(timeStr) {
  const granted = await requestNotificationPermissions();
  if (!granted) {
    throw new Error(
      'Izin notifikasi belum diberikan. Aktifkan notifikasi di Pengaturan perangkat.'
    );
  }

  // Batalkan jadwal lama sebelum buat yang baru
  await cancelReminder();

  const { hour, minute } = reminderTime(timeStr);
  const [hJadwal, mJadwal] = (timeStr || '17:00').split(':').map(Number);

  const triggerType = Notifications.SchedulableTriggerInputTypes?.DAILY;

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'Saatnya Berolahraga! 💪',
      body: `Latihan kamu dimulai pukul ${String(hJadwal).padStart(2, '0')}.${String(mJadwal).padStart(2, '0')} — siap-siap sekarang!`,
      sound: true,
      data: { type: 'reminder', scheduledTime: timeStr },
    },
    trigger: triggerType
      ? { type: triggerType, hour, minute }
      : { hour, minute, repeats: true },
  });
}

// ── Batalkan semua pengingat FitTracker ──────────────────────────────────────
export async function cancelReminder() {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
}

// ── Kirim notifikasi uji coba (muncul 3 detik setelah dipanggil) ─────────────
export async function sendTestNotification() {
  const granted = await requestNotificationPermissions();
  if (!granted) {
    throw new Error(
      'Izin notifikasi belum diberikan. Aktifkan notifikasi di Pengaturan perangkat.'
    );
  }
  const triggerType = Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏋️ Pengingat Latihan — Uji Coba',
      body: 'Ini tampilan pengingat 15 menit sebelum jadwal latihanmu.',
      sound: true,
    },
    trigger: triggerType
      ? { type: triggerType, seconds: 3, repeats: false }
      : { seconds: 3, repeats: false },
  });
}

// ── Cek apakah notifikasi sedang aktif terjadwal ─────────────────────────────
export async function isReminderScheduled() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some((n) => n.identifier === REMINDER_ID);
  } catch {
    return false;
  }
}

// ── Notifikasi komunitas (hanya jika toggle aktif) ───────────────────────────
const COMMUNITY_NOTIF_ID_PREFIX = 'fittracker-community-';

/**
 * Kirim notifikasi lokal untuk aktivitas komunitas.
 * Dipanggil dari groups.js HANYA jika communityEnabled === true.
 *
 * @param {'join'|'create'|'new_activity'} type - jenis aksi
 * @param {string} groupName - nama grup
 */
export async function sendCommunityNotification(type, groupName = '') {
  const granted = await requestNotificationPermissions();
  if (!granted) return; // diam-diam tidak kirim

  const CONTENT = {
    join: {
      title: '🤝 Bergabung ke Grup!',
      body: `Kamu berhasil bergabung ke "${groupName}". Ayo kenalan dengan anggota lain!`,
    },
    create: {
      title: '🎉 Grup Berhasil Dibuat!',
      body: `Grup "${groupName}" siap. Ajak teman-temanmu bergabung sekarang.`,
    },
    new_activity: {
      title: `💬 Aktivitas Baru di ${groupName}`,
      body: 'Ada aktivitas terbaru di komunitas kamu. Cek sekarang!',
    },
  };

  const content = CONTENT[type] || CONTENT.new_activity;
  const triggerType = Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL;

  await Notifications.scheduleNotificationAsync({
    identifier: `${COMMUNITY_NOTIF_ID_PREFIX}${type}-${Date.now()}`,
    content: { ...content, sound: true },
    trigger: triggerType
      ? { type: triggerType, seconds: 2, repeats: false }
      : { seconds: 2, repeats: false },
  });
}
