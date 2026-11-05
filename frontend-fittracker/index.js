import * as Notifications from 'expo-notifications';

// Konfigurasi cara notifikasi ditampilkan (dijalankan saat aplikasi dimulai).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Daftarkan Expo Router sebagai entry utama (diimpor terakhir).
import 'expo-router/entry';
