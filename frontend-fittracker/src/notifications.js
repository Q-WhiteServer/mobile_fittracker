// Helper pengingat notifikasi (US-07).
// Menjadwalkan notifikasi lokal harian pada jam yang dipilih pengguna.
import * as Notifications from 'expo-notifications';

const REMINDER_ID = 'fittracker-reminder';

// Meminta izin notifikasi (wajib di Android 13+ & iOS).
export async function requestNotificationPermissions() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync().catch(() => ({ status: 'undetermined' }));
    let status = existing;
    if (status !== 'granted') {
      const res = await Notifications.requestPermissionsAsync();
      status = res.status;
    }
    return status === 'granted';
  } catch (e) {
    return false;
  }
}

// Menjadwalkan pengingat harian berulang pada timeStr ("HH:MM").
// Expo SDK 52+ — trigger harus pakai type: 'daily'
export async function scheduleReminder(timeStr) {
  const granted = await requestNotificationPermissions();
  if (!granted) throw new Error('Izin notifikasi belum diberikan. Aktifkan notifikasi di Pengaturan perangkat.');
  const [h, m] = (timeStr || '17:00').split(':').map(Number);
  await cancelReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'Saatnya Berolahraga! 💪',
      body: 'Pengingat jadwal latihan FitTracker Anda. Ayo mulai sesi hari ini!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
      hour: h,
      minute: m,
    },
  });
}

// Membatalkan pengingat yang dijadwalkan.
export async function cancelReminder() {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
}

// Mengirim notifikasi uji coba segera (3 detik).
export async function sendTestNotification() {
  const granted = await requestNotificationPermissions();
  if (!granted) throw new Error('Izin notifikasi belum diberikan. Aktifkan notifikasi di Pengaturan perangkat.');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏋️ Pengingat Latihan — Uji Coba',
      body: 'Ini contoh tampilan pengingat jadwal latihan Anda.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
      seconds: 3,
      repeats: false,
    },
  });
}
