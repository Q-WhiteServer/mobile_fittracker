import AsyncStorage from '@react-native-async-storage/async-storage';

// Kunci penyimpanan lokal (AsyncStorage) — aman & terisolasi di perangkat.
const TOKEN_KEY = '@fittracker_token';
const USER_KEY = '@fittracker_user';
export const KEYS = {
  EXERCISES:     '@fittracker_exercises',
  PROFILE:       '@fittracker_profile',
  PLANS:         '@fittracker_plans',
  LOGS:          '@fittracker_logs',
  GROUPS:        '@fittracker_groups',
  SETTINGS:      '@fittracker_settings',
  ONBOARDING:    '@fittracker_onboarding_done',
  OFFLINE_QUEUE: '@fittracker_offline_queue',   // antrian log yang gagal kirim
  LAST_SYNC:     '@fittracker_last_sync',        // timestamp sinkronisasi terakhir
};

// --- Token & user (sesi login) ---
export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function setToken(token) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}
export async function getUser() {
  const s = await AsyncStorage.getItem(USER_KEY);
  return s ? JSON.parse(s) : null;
}
export async function setUser(user) {
  if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  else await AsyncStorage.removeItem(USER_KEY);
}
export async function clearAuth() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

// --- Helper generik JSON ---
export async function getJSON(key) {
  const s = await AsyncStorage.getItem(key);
  return s ? JSON.parse(s) : null;
}
export async function setJSON(key, value) {
  if (value != null) await AsyncStorage.setItem(key, JSON.stringify(value));
  else await AsyncStorage.removeItem(key);
}

// --- Pengaturan notifikasi pengingat (US-07) ---
export async function getSettings() {
  return (await getJSON(KEYS.SETTINGS)) || { reminderEnabled: false, reminderTime: '17:00' };
}
export async function saveSettings(settings) {
  await setJSON(KEYS.SETTINGS, settings);
}

// --- Helper shortcut: baca/tulis status toggle komunitas ---
export async function getCommunityEnabled() {
  const s = await getSettings();
  return s.communityEnabled !== false;
}
export async function setCommunityEnabled(value) {
  const s = await getSettings();
  await saveSettings({ ...s, communityEnabled: !!value });
}

// --- Offline Queue: antrian log latihan yang belum tersinkron ---
export async function getOfflineQueue() {
  return (await getJSON(KEYS.OFFLINE_QUEUE)) || [];
}
export async function addToOfflineQueue(logData) {
  const queue = await getOfflineQueue();
  queue.push({ ...logData, _queuedAt: new Date().toISOString() });
  await setJSON(KEYS.OFFLINE_QUEUE, queue);
}
export async function clearOfflineQueue() {
  await setJSON(KEYS.OFFLINE_QUEUE, []);
}

// --- Waktu sinkronisasi terakhir ---
export async function getLastSync() {
  return await AsyncStorage.getItem(KEYS.LAST_SYNC);
}
export async function setLastSync() {
  await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
}
