import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { api } from '../api';
import { getToken, getUser, setToken, setUser, clearAuth, getLastSync, setLastSync } from '../storage';
import { syncPendingData, syncOfflineQueue } from '../localStore';

const AuthContext = createContext(null);

// ── Jalankan semua sinkronisasi saat koneksi tersedia ────────────────────────
async function runSync() {
  try {
    const queueSynced = await syncOfflineQueue();   // kirim log dari antrian offline
    const pendingSynced = await syncPendingData();  // kirim plan/log yang belum punya backend id
    if (queueSynced + pendingSynced > 0) {
      await setLastSync();
      console.log(`[sync] Total tersinkron: ${queueSynced + pendingSynced} item.`);
    }
  } catch {
    // Gagal sync — tidak apa-apa, akan dicoba lagi nanti
  }
}

export function AuthProvider({ children }) {
  const [token,   setTok]    = useState(null);
  const [user,    setUsr]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSyncState] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // ── Muat sesi tersimpan saat aplikasi dibuka ──────────────────────────────
  useEffect(() => {
    (async () => {
      const t  = await getToken();
      const u  = await getUser();
      const ls = await getLastSync();
      setTok(t);
      setUsr(u);
      setLastSyncState(ls);
      setLoading(false);

      // Sync saat startup jika ada sesi aktif
      if (t) runSync().then(async () => {
        const updated = await getLastSync();
        setLastSyncState(updated);
      });
    })();
  }, []);

  // ── Sync saat app kembali ke foreground ───────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && token) {
        runSync().then(async () => {
          const updated = await getLastSync();
          setLastSyncState(updated);
          setIsOnline(true);
        }).catch(() => setIsOnline(false));
      }
    });
    return () => sub.remove();
  }, [token]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    await setToken(res.token);
    await setUser(res.user);
    setTok(res.token);
    setUsr(res.user);
    setIsOnline(true);
    // Sync setelah login berhasil (online dipastikan)
    runSync().then(async () => {
      const updated = await getLastSync();
      setLastSyncState(updated);
    });
    return res.user;
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (nama_lengkap, email, password) => {
    const res = await api.register({ nama_lengkap, email, password });
    await setToken(res.token);
    await setUser(res.user);
    setTok(res.token);
    setUsr(res.user);
    setIsOnline(true);
    return res.user;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await clearAuth();
    setTok(null);
    setUsr(null);
  }, []);

  // ── Trigger sync manual (dipanggil dari komponen) ─────────────────────────
  const triggerSync = useCallback(async () => {
    if (!token) return;
    try {
      await runSync();
      const updated = await getLastSync();
      setLastSyncState(updated);
      setIsOnline(true);
      return true;
    } catch {
      setIsOnline(false);
      return false;
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{
      token, user, loading,
      login, register, logout,
      triggerSync,
      isOnline, setIsOnline,
      lastSync,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
