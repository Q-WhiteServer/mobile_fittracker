// Lapisan penyimpanan offline-first.
//
// Sesuai SRS, fungsi inti US-02 s.d. US-08 harus dapat berjalan tanpa koneksi
// internet. Karena itu profil, jadwal (plans), dan riwayat latihan (logs)
// disimpan secara lokal di AsyncStorage sebagai sumber kebenaran utama.
// Katalog latihan di-cache setelah pengambilan online pertama.
//
// Sinkronisasi ke server dilakukan secara best-effort (latar belakang):
//   - Profil: di-upsert ke backend (tidak ada konflik ID karena per-user).
//   - Plans/Logs: saat ini lokal-first; sinkronisasi penuh dua-arah menjadi
//     tahap pengembangan berikutnya.

import { KEYS, getJSON, setJSON } from './storage';
import { api } from './api';

// --- Generator ID lokal ---
function localId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ===========================================================================
// KATALOG LATIHAN (US-03/US-06) — cache
// ===========================================================================
export async function cacheExercises(list) {
  await setJSON(KEYS.EXERCISES, list);
}
export async function getCachedExercises() {
  return (await getJSON(KEYS.EXERCISES)) || [];
}

// ===========================================================================
// PROFIL & DATA DIRI (US-02) — lokal + sinkronisasi ke backend
// ===========================================================================
export async function getProfile() {
  return await getJSON(KEYS.PROFILE);
}
export async function saveProfile(profile) {
  await setJSON(KEYS.PROFILE, profile);
  // Best-effort sync ke backend (abaikan kegagalan agar tetap offline).
  try {
    await api.saveProfile(profile);
  } catch (e) {
    console.warn('[localStore] Sinkronisasi profil ke backend gagal:', e.message);
    /* offline — tetap tersimpan lokal */
  }
}

// ===========================================================================
// PENJADWALAN (US-04) — lokal-first
// ===========================================================================
export async function getPlans() {
  return (await getJSON(KEYS.PLANS)) || [];
}
export async function getPlan(id) {
  const plans = await getPlans();
  return plans.find((p) => String(p.id) === String(id)) || null;
}
export async function createPlan(data) {
  const plans = await getPlans();
  const plan = {
    id: localId(),
    nama_plan: data.nama_plan || 'Jadwal Latihan',
    tanggal: data.tanggal,
    hari: data.hari || null,
    catatan: data.catatan || null,
    exercises: Array.isArray(data.exercises) ? data.exercises : [],
    created_at: new Date().toISOString(),
  };
  // Best-effort sync ke backend (abaikan kegagalan agar tetap offline).
  try {
    const res = await api.createPlan({
      nama_plan: plan.nama_plan,
      tanggal: plan.tanggal,
      hari: plan.hari,
      catatan: plan.catatan,
      exercises: (plan.exercises || []).map((ex) => ({
        id_exercise: ex.id_exercise ? Number(ex.id_exercise) : null,
        target_set: ex.target_set,
        target_reps: ex.target_reps,
      })),
    });
    if (res && res.id_plan) {
      plan.id_plan = res.id_plan; // simpan ID backend untuk sinkronisasi hapus/update
    }
  } catch (e) {
    console.warn('[localStore] Sinkronisasi plan ke backend gagal:', e.message);
    /* offline — tetap tersimpan lokal */
  }
  plans.push(plan);
  await setJSON(KEYS.PLANS, plans);
  return plan;
}
export async function updatePlan(id, patch) {
  const plans = await getPlans();
  const idx = plans.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return null;
  plans[idx] = { ...plans[idx], ...patch, id: plans[idx].id };
  // Best-effort sync ke backend bila punya id_plan.
  if (plans[idx].id_plan) {
    try {
      await api.updatePlan(plans[idx].id_plan, {
        nama_plan: plans[idx].nama_plan,
        tanggal: plans[idx].tanggal,
        hari: plans[idx].hari,
        catatan: plans[idx].catatan,
        exercises: (plans[idx].exercises || []).map((ex) => ({
          id_exercise: ex.id_exercise ? Number(ex.id_exercise) : null,
          target_set: ex.target_set,
          target_reps: ex.target_reps,
        })),
      });
    } catch (e) {
      console.warn('[localStore] Sinkronisasi update plan ke backend gagal:', e.message);
      /* offline */
    }
  }
  await setJSON(KEYS.PLANS, plans);
  return plans[idx];
}
export async function deletePlan(id) {
  const plans = await getPlans();
  const plan = plans.find((p) => String(p.id) === String(id));
  // Best-effort hapus dari backend bila punya id_plan.
  if (plan && plan.id_plan) {
    try { await api.deletePlan(plan.id_plan); } catch (e) { console.warn('[localStore] Hapus plan di backend gagal:', e.message); }
  }
  const next = plans.filter((p) => String(p.id) !== String(id));
  await setJSON(KEYS.PLANS, next);
  return true;
}
export async function addExerciseToPlan(planId, exercise, target_set, target_reps) {
  const plan = await getPlan(planId);
  if (!plan) return null;
  plan.exercises = plan.exercises || [];
  plan.exercises.push({
    id_plan_exercise: localId(),
    id_exercise: exercise.id_exercise,
    nama_gerakan: exercise.nama_gerakan,
    kategori: exercise.kategori,
    level_kesulitan: exercise.level_kesulitan,
    durasi: exercise.durasi,
    target_set: target_set ?? 3,
    target_reps: target_reps ?? 10,
  });
  await updatePlan(planId, { exercises: plan.exercises });
  return plan;
}
export async function removeExerciseFromPlan(planId, id_plan_exercise) {
  const plan = await getPlan(planId);
  if (!plan) return null;
  plan.exercises = (plan.exercises || []).filter((e) => String(e.id_plan_exercise) !== String(id_plan_exercise));
  await updatePlan(planId, { exercises: plan.exercises });
  return plan;
}

// ===========================================================================
// WORKOUT LOG / RIWAYAT (US-05) — lokal-first
// ===========================================================================
export async function getLogs() {
  return (await getJSON(KEYS.LOGS)) || [];
}
export async function createLog(data) {
  const logs = await getLogs();
  const log = {
    id: localId(),
    id_exercise: data.id_exercise || null,
    nama_gerakan: data.nama_gerakan || null,
    kategori: data.kategori || null,
    jumlah_set: data.jumlah_set ?? 0,
    reps: data.reps ?? 0,
    beban: data.beban ?? 0,
    durasi: data.durasi ?? 0,
    catatan: data.catatan || null,
    tanggal: data.tanggal || new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  };
  logs.unshift(log);
  await setJSON(KEYS.LOGS, logs);
  // Best-effort push ke backend.
  try {
    await api.createLog({
      id_plan: data.id_plan || null,
      id_exercise: log.id_exercise ? Number(log.id_exercise) : null,
      jumlah_set: log.jumlah_set,
      reps: log.reps,
      beban: log.beban,
      durasi: log.durasi,
      catatan: log.catatan,
      tanggal: log.tanggal,
    }).then((res) => {
      if (res && res.id_log) log.id_log = res.id_log; // simpan ID backend untuk delete sync
    });
  } catch (e) {
    console.warn('[localStore] Sinkronisasi log ke backend gagal:', e.message);
  }
  return log;
}
export async function deleteLog(id) {
  const logs = await getLogs();
  const log = logs.find((l) => String(l.id) === String(id));
  if (log && log.id_log) {
    try { await api.deleteLog(log.id_log); } catch (e) { console.warn('[localStore] Hapus log di backend gagal:', e.message); }
  }
  await setJSON(KEYS.LOGS, logs.filter((l) => String(l.id) !== String(id)));
  return true;
}

// ===========================================================================
// STATISTIK DASHBOARD — dihitung dari data lokal (agar berfungsi offline)
// ===========================================================================
export async function getStats() {
  const profile = await getProfile();
  const plans = await getPlans();
  const logs = await getLogs();
  const total_set = logs.reduce((s, l) => s + (Number(l.jumlah_set) || 0), 0);
  const total_reps = logs.reduce((s, l) => s + (Number(l.reps) || 0), 0);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const minggu_ini = logs.filter((l) => new Date(l.tanggal) >= weekAgo).length;
  return {
    profil_lengkap: !!profile,
    total_jadwal: plans.length,
    total_latihan_selesai: logs.length,
    total_set,
    total_reps,
    latihan_minggu_ini: minggu_ini,
  };
}

// ===========================================================================
// KOMUNITAS / GRUP (US-09) — cache untuk tampilan offline
// ===========================================================================
export async function cacheGroups(list) {
  await setJSON(KEYS.GROUPS, list);
}
export async function getCachedGroups() {
  return (await getJSON(KEYS.GROUPS)) || [];
}

// ===========================================================================
// REFRESH DARI BACKEND — tarik data terbaru server, replace lokal
// Dipanggil di useFocusEffect layar utama agar selalu konsisten.
// ===========================================================================
export async function refreshLogsFromBackend() {
  try {
    const res = await api.getLogs();
    if (res && Array.isArray(res.logs)) {
      // Map ke format lokal agar kompatibel dengan field lokal
      const mapped = res.logs.map((l) => ({
        id: String(l.id_log),          // lokal pakai "id"
        id_log: l.id_log,              // backend id untuk delete
        id_exercise: l.id_exercise,
        nama_gerakan: l.nama_gerakan || null,
        kategori: l.kategori || null,
        jumlah_set: l.jumlah_set,
        reps: l.reps,
        beban: l.beban,
        durasi: l.durasi,
        catatan: l.catatan,
        tanggal: l.tanggal,
        created_at: l.created_at,
      }));
      await setJSON(KEYS.LOGS, mapped);
      return mapped;
    }
  } catch (e) {
    console.warn('[refresh] Gagal refresh logs dari backend:', e.message);
  }
  return null; // null = gunakan data lokal
}

export async function refreshPlansFromBackend() {
  try {
    const res = await api.getPlans();
    if (res && Array.isArray(res.plans)) {
      const mapped = res.plans.map((p) => ({
        id: String(p.id_plan),
        id_plan: p.id_plan,
        nama_plan: p.nama_plan,
        tanggal: p.tanggal,
        hari: p.hari,
        catatan: p.catatan,
        exercises: [],               // detail exercises dimuat di plan/[id]
        jumlah_latihan: p.jumlah_latihan,
        created_at: p.created_at,
      }));
      await setJSON(KEYS.PLANS, mapped);
      return mapped;
    }
  } catch (e) {
    console.warn('[refresh] Gagal refresh plans dari backend:', e.message);
  }
  return null;
}

// ===========================================================================
// SINKRONISASI PENDING — kirim data lokal yang belum masuk backend
// Dipanggil saat login / sesi dimuat agar data offline tersinkron otomatis.
// ===========================================================================
export async function syncPendingData() {
  let synced = 0;

  // --- Sync plans yang belum punya id_plan dari backend ---
  try {
    const plans = await getPlans();
    let plansUpdated = false;

    for (const plan of plans) {
      if (plan.id_plan) continue; // sudah tersinkron
      try {
        const res = await api.createPlan({
          nama_plan: plan.nama_plan,
          tanggal: plan.tanggal,
          hari: plan.hari,
          catatan: plan.catatan,
          exercises: (plan.exercises || []).map((ex) => ({
            id_exercise: ex.id_exercise ? Number(ex.id_exercise) : null,
            target_set: ex.target_set,
            target_reps: ex.target_reps,
          })),
        });
        if (res && res.id_plan) {
          plan.id_plan = res.id_plan;
          plansUpdated = true;
          synced++;
          console.log('[sync] Plan tersinkron:', plan.nama_plan, '→ id_plan', res.id_plan);
        }
      } catch (e) {
        console.warn('[sync] Gagal sync plan:', plan.nama_plan, e.message);
      }
    }

    if (plansUpdated) {
      await setJSON(KEYS.PLANS, plans);
    }
  } catch (e) {
    console.warn('[sync] Error saat sync plans:', e.message);
  }

  // --- Sync logs yang belum punya id_log dari backend ---
  try {
    const logs = await getLogs();
    let logsUpdated = false;

    // Logs diurutkan terbaru dulu — sync dari yang terlama ke terbaru
    const logsToSync = [...logs].reverse();

    for (const log of logsToSync) {
      if (log.id_log) continue; // sudah tersinkron
      try {
        const res = await api.createLog({
          id_plan: log.id_plan || null,
          id_exercise: log.id_exercise ? Number(log.id_exercise) : null,
          jumlah_set: log.jumlah_set,
          reps: log.reps,
          beban: log.beban,
          durasi: log.durasi,
          catatan: log.catatan,
          tanggal: log.tanggal,
        });
        if (res && res.id_log) {
          log.id_log = res.id_log;
          logsUpdated = true;
          synced++;
          console.log('[sync] Log tersinkron:', log.nama_gerakan, '→ id_log', res.id_log);
        }
      } catch (e) {
        console.warn('[sync] Gagal sync log:', log.nama_gerakan, e.message);
      }
    }

    if (logsUpdated) {
      // Simpan kembali dalam urutan semula (terbaru dulu)
      const updatedMap = Object.fromEntries(logsToSync.map((l) => [l.id, l]));
      const mergedLogs = logs.map((l) => updatedMap[l.id] || l);
      await setJSON(KEYS.LOGS, mergedLogs);
    }
  } catch (e) {
    console.warn('[sync] Error saat sync logs:', e.message);
  }

  if (synced > 0) {
    console.log(`[sync] Selesai: ${synced} item tersinkron ke backend.`);
  }
  return synced;
}
