import { getToken, setToken, setUser } from './storage';

// URL backend dibaca dari environment variable (.env)
// EXPO_PUBLIC_API_URL ter-expose ke client sesuai konvensi Expo.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  console.warn('EXPO_PUBLIC_API_URL belum diset di file .env frontend!');
}

// Wrapper fetch yang menyertakan token & menandai error jaringan.
export async function request(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (e) {
    const err = new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    err.isNetwork = true;
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }
  if (!response.ok) {
    throw new Error(data.pesan || 'Terjadi kesalahan pada server');
  }
  return data;
}

export { setToken, setUser };

export const api = {
  // US-01: Autentikasi (online)
  register: (body) => request('/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/me', { method: 'GET' }),
  logout: async () => {
    await setToken(null);
    await setUser(null);
  },

  // US-02: Profil & data diri
  getProfile: () => request('/profile', { method: 'GET' }),
  saveProfile: (body) => request('/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // US-03 / US-06 / US-10: Katalog & detail latihan
  getExercises: (params = {}) => {
    const q = new URLSearchParams();
    if (params.kategori) q.set('kategori', params.kategori);
    if (params.level_kesulitan) q.set('level_kesulitan', params.level_kesulitan);
    if (params.q) q.set('q', params.q);
    const qs = q.toString();
    return request(`/exercises${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getExercise: (id) => request(`/exercises/${id}`, { method: 'GET' }),

  // US-04: Penjadwalan (backend — cadangan online)
  getPlans: () => request('/plans', { method: 'GET' }),
  getPlan: (id) => request(`/plans/${id}`, { method: 'GET' }),
  createPlan: (body) => request('/plans', { method: 'POST', body: JSON.stringify(body) }),
  updatePlan: (id, body) => request(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePlan: (id) => request(`/plans/${id}`, { method: 'DELETE' }),
  addPlanExercise: (planId, body) => request(`/plans/${planId}/exercises`, { method: 'POST', body: JSON.stringify(body) }),

  // US-05: Workout log (backend — cadangan online)
  getLogs: (tanggal) => request(`/logs${tanggal ? `?tanggal=${tanggal}` : ''}`, { method: 'GET' }),
  createLog: (body) => request('/logs', { method: 'POST', body: JSON.stringify(body) }),
  deleteLog: (id) => request(`/logs/${id}`, { method: 'DELETE' }),

  // Dashboard
  getStats: () => request('/stats', { method: 'GET' }),

  // US-09: Komunitas / grup (online)
  getGroups: (params = {}) => {
    const q = new URLSearchParams();
    if (params.kategori) q.set('kategori', params.kategori);
    if (params.q) q.set('q', params.q);
    const qs = q.toString();
    return request(`/groups${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getGroup: (id) => request(`/groups/${id}`, { method: 'GET' }),
  createGroup: (body) => request('/groups', { method: 'POST', body: JSON.stringify(body) }),
  joinGroup: (id) => request(`/groups/${id}/join`, { method: 'POST' }),
  leaveGroup: (id) => request(`/groups/${id}/leave`, { method: 'POST' }),

  // Group Chat
  getMessages: (groupId) => request(`/groups/${groupId}/messages`, { method: 'GET' }),
  sendMessage: (groupId, body) => request(`/groups/${groupId}/messages`, { method: 'POST', body: JSON.stringify(body) }),

  // Laporan bulanan
  getMonthlyReport: (bulan) => request(`/reports/monthly${bulan ? `?bulan=${bulan}` : ''}`, { method: 'GET' }),

  // Weight log
  getWeights: (bulan) => request(`/weight${bulan ? `?bulan=${bulan}` : ''}`, { method: 'GET' }),
  logWeight: (body) => request('/weight', { method: 'POST', body: JSON.stringify(body) }),
  deleteWeight: (tanggal) => request(`/weight/${tanggal}`, { method: 'DELETE' }),
};
