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
export async function scheduleReminder(timeStr) {
  const granted = await requestNotificationPermissions();
  if (!granted) throw new Error('Izin notifikasi belum diberikan.');
  const [h, m] = (timeStr || '17:00').split(':').map(Number);
  await cancelReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'Saatnya Berolahraga! 💪',
      body: 'Pengingat jadwal latihan FitTracker Anda. Ayo mulai sesi hari ini!',
      sound: true,
    },
    trigger: { hour: h, minute: m, repeats: true },
  });
}

// Membatalkan pengingat yang dijadwalkan.
export async function cancelReminder() {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
}

// Mengirim notifikasi uji coba segera (1 detik).
export async function sendTestNotification() {
  const granted = await requestNotificationPermissions();
  if (!granted) throw new Error('Izin notifikasi belum diberikan.');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Pengingat Latihan',
      body: 'Ini contoh tampilan pengingat jadwal latihan Anda.',
      sound: true,
    },
    trigger: { seconds: 1 },
  });
}
