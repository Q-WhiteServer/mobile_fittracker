import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { getToken, getUser, setToken, setUser, clearAuth } from '../storage';
import { syncPendingData } from '../localStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTok] = useState(null);
  const [user, setUsr] = useState(null);
  const [loading, setLoading] = useState(true);

  // Muat sesi tersimpan saat aplikasi dibuka.
  useEffect(() => {
    (async () => {
      const t = await getToken();
      const u = await getUser();
      setTok(t);
      setUsr(u);
      setLoading(false);
      // Sync data offline ke backend jika ada sesi aktif
      if (t) {
        syncPendingData().catch(() => {});
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    await setToken(res.token);
    await setUser(res.user);
    setTok(res.token);
    setUsr(res.user);
    // Sync data offline yang menunggu
    syncPendingData().catch(() => {});
    return res.user;
  }, []);

  const register = useCallback(async (nama_lengkap, email, password) => {
    const res = await api.register({ nama_lengkap, email, password });
    await setToken(res.token);
    await setUser(res.user);
    setTok(res.token);
    setUsr(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setTok(null);
    setUsr(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
