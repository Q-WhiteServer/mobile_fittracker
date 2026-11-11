const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool } = require('./db');
require('dotenv').config();

const app = express();

// --- Konfigurasi CORS (dapat dibatasi via env) ---
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : null; // null = izinkan semua (mode development)

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan semua jika CORS_ORIGIN tidak diset (dev)
      if (!allowedOrigins) return callback(null, true);
      // Izinkan request tanpa origin (Postman, curl, mobile app)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin tidak diizinkan oleh CORS'));
    },
  })
);

app.use(express.json());

// --- Rate limiting umum ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { pesan: 'Terlalu banyak permintaan, coba lagi nanti.' },
});
app.use(limiter);

// --- Rate limiting khusus endpoint autentikasi (lebih ketat) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // 5 percobaan per 15 menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { pesan: 'Terlalu banyak percobaan, coba lagi dalam 15 menit.' },
});

// --- Konfigurasi JWT ---
const JWT_SECRET = process.env.JWT_SECRET || 'ubah_secret_ini_di_file_env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    { id_user: user.id_user, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// --- Middleware autentikasi ---
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ pesan: 'Token tidak ditemukan, silakan login.' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ pesan: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

// --- Helper validasi ---
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

// Helper ambil string aman dari query
function str(val) {
  return val == null ? null : String(val).trim();
}

// Helper validasi enum
function isValidEnum(val, allowed) {
  return allowed.includes(val);
}

// --- Tes koneksi ---
app.get('/', (req, res) => {
  res.send('Backend Aktif!');
});

// ===========================================================================
// US-01: AUTENTIKASI
// ===========================================================================

// --- Endpoint Registrasi ---
app.post('/register', authLimiter, async (req, res) => {
  console.log('--- Request Registrasi Masuk ---', { email: req.body?.email });
  const { nama_lengkap, email, password } = req.body || {};

  if (!nama_lengkap || !email || !password) {
    return res.status(400).json({ pesan: 'Semua kolom wajib diisi!' });
  }
  if (String(nama_lengkap).length > 100) {
    return res.status(400).json({ pesan: 'Nama lengkap maksimal 100 karakter.' });
  }
  if (String(email).length > 150) {
    return res.status(400).json({ pesan: 'Email terlalu panjang.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ pesan: 'Format email tidak valid!' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ pesan: 'Kata sandi minimal 6 karakter!' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id_user FROM users WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ pesan: 'Email sudah terdaftar!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (nama_lengkap, email, password) VALUES (?, ?, ?)',
      [nama_lengkap, email, hashedPassword]
    );

    console.log('✅ Registrasi Berhasil!');
    const user = { id_user: result.insertId, nama_lengkap, email };
    return res.status(201).json({
      pesan: 'Registrasi berhasil! Silakan login.',
      token: generateToken(user),
      user,
    });
  } catch (error) {
    console.error('❌ Error Database Registrasi:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// --- Endpoint Login ---
app.post('/login', authLimiter, async (req, res) => {
  console.log('--- Request Login Masuk ---', { email: req.body?.email });
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ pesan: 'Email dan kata sandi wajib diisi!' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ pesan: 'Format email tidak valid!' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id_user, nama_lengkap, email, password FROM users WHERE email = ?',
      [email]
    );

    // Gunakan pesan yang sama untuk email salah & password salah (mencegah enumerasi user)
    if (rows.length === 0) {
      return res.status(401).json({ pesan: 'Email atau kata sandi salah!' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ pesan: 'Email atau kata sandi salah!' });
    }

    console.log('✅ Login Berhasil!');
    const { password: _removed, ...userWithoutPassword } = user;
    return res.json({
      pesan: 'Login berhasil!',
      token: generateToken(user),
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('❌ Error Database Login:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// --- Endpoint terproteksi: data user yang sedang login ---
app.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_user, nama_lengkap, email FROM users WHERE id_user = ?',
      [req.user.id_user]
    );
    if (rows.length === 0) {
      return res.status(404).json({ pesan: 'User tidak ditemukan.' });
    }
    return res.json({ user: rows[0] });
  } catch (error) {
    console.error('❌ Error Database /me:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// ===========================================================================
// US-02: PROFIL & DATA DIRI (PERSONALISASI)
// ===========================================================================
const AKTIVITAS_VALID = ['rendah', 'sedang', 'aktif', 'sangat_aktif'];
const TUJUAN_VALID = ['menurunkan_berat', 'menambah_massa', 'menjaga_kebugaran', 'meningkatkan_kekuatan'];

// GET /profile -> ambil profil data diri user yang sedang login
app.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_profile, jenis_kelamin, usia, tinggi, berat, level_aktivitas, tujuan, catatan_kesehatan, updated_at FROM user_profiles WHERE id_user = ?',
      [req.user.id_user]
    );
    if (rows.length === 0) {
      // Profil belum diisi -> kembalikan objek kosong
      return res.json({ profile: null });
    }
    return res.json({ profile: rows[0] });
  } catch (error) {
    console.error('❌ Error /profile:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// PUT /profile -> buat/perbarui data diri (upsert)
app.put('/profile', authMiddleware, async (req, res) => {
  const { jenis_kelamin, usia, tinggi, berat, level_aktivitas, tujuan, catatan_kesehatan } = req.body || {};

  // Validasi
  if (jenis_kelamin != null && !['L', 'P'].includes(jenis_kelamin)) {
    return res.status(400).json({ pesan: 'Jenis kelamin harus "L" atau "P".' });
  }
  if (level_aktivitas != null && !isValidEnum(level_aktivitas, AKTIVITAS_VALID)) {
    return res.status(400).json({ pesan: 'Level aktivitas tidak valid.' });
  }
  if (tujuan != null && !isValidEnum(tujuan, TUJUAN_VALID)) {
    return res.status(400).json({ pesan: 'Tujuan tidak valid.' });
  }
  if (usia != null && (isNaN(usia) || usia < 5 || usia > 120)) {
    return res.status(400).json({ pesan: 'Usia tidak valid.' });
  }
  if (tinggi != null && (isNaN(tinggi) || tinggi < 50 || tinggi > 300)) {
    return res.status(400).json({ pesan: 'Tinggi (cm) tidak valid.' });
  }
  if (berat != null && (isNaN(berat) || berat < 20 || berat > 500)) {
    return res.status(400).json({ pesan: 'Berat (kg) tidak valid.' });
  }

  try {
    await pool.query(
      `INSERT INTO user_profiles
        (id_user, jenis_kelamin, usia, tinggi, berat, level_aktivitas, tujuan, catatan_kesehatan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        jenis_kelamin = VALUES(jenis_kelamin),
        usia = VALUES(usia),
        tinggi = VALUES(tinggi),
        berat = VALUES(berat),
        level_aktivitas = VALUES(level_aktivitas),
        tujuan = VALUES(tujuan),
        catatan_kesehatan = VALUES(catatan_kesehatan)`,
      [req.user.id_user, jenis_kelamin || null, usia || null, tinggi || null, berat || null, level_aktivitas || null, tujuan || null, catatan_kesehatan || null]
    );
    return res.json({ pesan: 'Profil berhasil disimpan.' });
  } catch (error) {
    console.error('❌ Error PUT /profile:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// ===========================================================================
// US-03 / US-06 / US-10: KATALOG & DETAIL LATIHAN
// ===========================================================================

// GET /exercises -> daftar latihan dengan filter kategori & level kesulitan + pencarian
app.get('/exercises', authMiddleware, async (req, res) => {
  try {
    const kategori = str(req.query.kategori);
    const level = str(req.query.level_kesulitan);
    const q = str(req.query.q);

    let sql = 'SELECT * FROM exercises WHERE 1=1';
    const params = [];
    if (kategori) {
      sql += ' AND kategori = ?';
      params.push(kategori);
    }
    if (level) {
      sql += ' AND level_kesulitan = ?';
      params.push(level);
    }
    if (q) {
      sql += ' AND nama_gerakan LIKE ?';
      params.push(`%${q}%`);
    }
    sql += ' ORDER BY kategori, level_kesulitan, nama_gerakan';

    const [rows] = await pool.query(sql, params);
    return res.json({ exercises: rows });
  } catch (error) {
    console.error('❌ Error /exercises:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// GET /exercises/:id -> detail satu latihan
app.get('/exercises/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exercises WHERE id_exercise = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ pesan: 'Latihan tidak ditemukan.' });
    }
    return res.json({ exercise: rows[0] });
  } catch (error) {
    console.error('❌ Error /exercises/:id:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// ===========================================================================
// US-04: PENJADWALAN LATIHAN
// ===========================================================================

// GET /plans -> semua jadwal milik user yang login
app.get('/plans', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, COUNT(pe.id_plan_exercise) AS jumlah_latihan
       FROM workout_plans p
       LEFT JOIN plan_exercises pe ON pe.id_plan = p.id_plan
       WHERE p.id_user = ?
       GROUP BY p.id_plan
       ORDER BY p.tanggal ASC`,
      [req.user.id_user]
    );
    return res.json({ plans: rows });
  } catch (error) {
    console.error('❌ Error /plans:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// GET /plans/:id -> detail jadwal + daftar latihan di dalamnya
app.get('/plans/:id', authMiddleware, async (req, res) => {
  try {
    const [plans] = await pool.query('SELECT * FROM workout_plans WHERE id_plan = ? AND id_user = ?', [req.params.id, req.user.id_user]);
    if (plans.length === 0) {
      return res.status(404).json({ pesan: 'Jadwal tidak ditemukan.' });
    }
    const [items] = await pool.query(
      `SELECT pe.*, e.nama_gerakan, e.kategori, e.level_kesulitan, e.durasi
       FROM plan_exercises pe
       JOIN exercises e ON e.id_exercise = pe.id_exercise
       WHERE pe.id_plan = ?
       ORDER BY pe.urutan, pe.id_plan_exercise`,
      [req.params.id]
    );
    return res.json({ plan: plans[0], exercises: items });
  } catch (error) {
    console.error('❌ Error /plans/:id:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// POST /plans -> buat jadwal baru (opsional: sertakan daftar latihan sekaligus)
app.post('/plans', authMiddleware, async (req, res) => {
  const { nama_plan, tanggal, hari, catatan, exercises } = req.body || {};
  if (!tanggal) {
    return res.status(400).json({ pesan: 'Tanggal jadwal wajib diisi.' });
  }
  if (isNaN(Date.parse(tanggal))) {
    return res.status(400).json({ pesan: 'Format tanggal tidak valid.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO workout_plans (id_user, nama_plan, tanggal, hari, catatan) VALUES (?, ?, ?, ?, ?)',
      [req.user.id_user, nama_plan || null, tanggal, hari || null, catatan || null]
    );
    const id_plan = result.insertId;

    if (Array.isArray(exercises) && exercises.length > 0) {
      let urutan = 0;
      for (const ex of exercises) {
        if (!ex.id_exercise) continue;
        await conn.query(
          'INSERT INTO plan_exercises (id_plan, id_exercise, target_set, target_reps, urutan) VALUES (?, ?, ?, ?, ?)',
          [id_plan, ex.id_exercise, ex.target_set ?? 3, ex.target_reps ?? 10, urutan++]
        );
      }
    }

    await conn.commit();
    return res.status(201).json({ pesan: 'Jadwal berhasil dibuat.', id_plan });
  } catch (error) {
    await conn.rollback();
    console.error('❌ Error POST /plans:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  } finally {
    conn.release();
  }
});

// PUT /plans/:id -> perbarui jadwal (metadata + ganti daftar latihan jika dikirim)
app.put('/plans/:id', authMiddleware, async (req, res) => {
  const { nama_plan, tanggal, hari, catatan, exercises } = req.body || {};

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT id_user FROM workout_plans WHERE id_plan = ?', [req.params.id]);
    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ pesan: 'Jadwal tidak ditemukan.' });
    }
    if (rows[0].id_user !== req.user.id_user) {
      conn.release();
      return res.status(403).json({ pesan: 'Tidak diizinkan.' });
    }

    await conn.beginTransaction();
    await conn.query(
      'UPDATE workout_plans SET nama_plan = ?, tanggal = ?, hari = ?, catatan = ? WHERE id_plan = ?',
      [nama_plan ?? null, tanggal ?? null, hari ?? null, catatan ?? null, req.params.id]
    );

    if (Array.isArray(exercises)) {
      await conn.query('DELETE FROM plan_exercises WHERE id_plan = ?', [req.params.id]);
      let urutan = 0;
      for (const ex of exercises) {
        if (!ex.id_exercise) continue;
        await conn.query(
          'INSERT INTO plan_exercises (id_plan, id_exercise, target_set, target_reps, urutan) VALUES (?, ?, ?, ?, ?)',
          [req.params.id, ex.id_exercise, ex.target_set ?? 3, ex.target_reps ?? 10, urutan++]
        );
      }
    }

    await conn.commit();
    return res.json({ pesan: 'Jadwal berhasil diperbarui.' });
  } catch (error) {
    await conn.rollback();
    console.error('❌ Error PUT /plans/:id:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  } finally {
    conn.release();
  }
});

// DELETE /plans/:id -> hapus jadwal
app.delete('/plans/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id_user FROM workout_plans WHERE id_plan = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ pesan: 'Jadwal tidak ditemukan.' });
    }
    if (rows[0].id_user !== req.user.id_user) {
      return res.status(403).json({ pesan: 'Tidak diizinkan.' });
    }
    await pool.query('DELETE FROM workout_plans WHERE id_plan = ?', [req.params.id]);
    return res.json({ pesan: 'Jadwal berhasil dihapus.' });
  } catch (error) {
    console.error('❌ Error DELETE /plans/:id:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// POST /plans/:id/exercises -> tambah satu latihan ke jadwal
app.post('/plans/:id/exercises', authMiddleware, async (req, res) => {
  const { id_exercise, target_set, target_reps } = req.body || {};
  if (!id_exercise) {
    return res.status(400).json({ pesan: 'id_exercise wajib diisi.' });
  }
  try {
    const [rows] = await pool.query('SELECT id_user FROM workout_plans WHERE id_plan = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ pesan: 'Jadwal tidak ditemukan.' });
    }
    if (rows[0].id_user !== req.user.id_user) {
      return res.status(403).json({ pesan: 'Tidak diizinkan.' });
    }
    const [maxRow] = await pool.query('SELECT COALESCE(MAX(urutan), -1) AS m FROM plan_exercises WHERE id_plan = ?', [req.params.id]);
    const urutan = maxRow[0].m + 1;
    const [result] = await pool.query(
      'INSERT INTO plan_exercises (id_plan, id_exercise, target_set, target_reps, urutan) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, id_exercise, target_set ?? 3, target_reps ?? 10, urutan]
    );
    return res.status(201).json({ pesan: 'Latihan ditambahkan ke jadwal.', id_plan_exercise: result.insertId });
  } catch (error) {
    console.error('❌ Error POST /plans/:id/exercises:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// ===========================================================================
// US-05: WORKOUT LOG (RIWAYAT LATIHAN)
// ===========================================================================

// GET /logs -> riwayat latihan user (opsional filter tanggal)
app.get('/logs', authMiddleware, async (req, res) => {
  try {
    const tanggal = str(req.query.tanggal);
    let sql = `SELECT l.*, e.nama_gerakan, e.kategori FROM workout_logs l LEFT JOIN exercises e ON e.id_exercise = l.id_exercise WHERE l.id_user = ?`;
    const params = [req.user.id_user];
    if (tanggal) {
      sql += ' AND l.tanggal = ?';
      params.push(tanggal);
    }
    sql += ' ORDER BY l.tanggal DESC, l.id_log DESC';
    const [rows] = await pool.query(sql, params);
    return res.json({ logs: rows });
  } catch (error) {
    console.error('❌ Error /logs:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// POST /logs -> catat satu latihan yang selesai
app.post('/logs', authMiddleware, async (req, res) => {
  const { id_plan, id_exercise, jumlah_set, reps, beban, durasi, catatan, tanggal } = req.body || {};
  if (!tanggal) {
    return res.status(400).json({ pesan: 'Tanggal wajib diisi.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO workout_logs (id_user, id_plan, id_exercise, jumlah_set, reps, beban, durasi, catatan, tanggal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id_user, id_plan || null, id_exercise || null, jumlah_set ?? 0, reps ?? 0, beban ?? 0, durasi ?? 0, catatan || null, tanggal]
    );
    return res.status(201).json({ pesan: 'Latihan berhasil dicatat.', id_log: result.insertId });
  } catch (error) {
    console.error('❌ Error POST /logs:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// DELETE /logs/:id -> hapus satu catatan log
app.delete('/logs/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id_user FROM workout_logs WHERE id_log = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ pesan: 'Catatan tidak ditemukan.' });
    }
    if (rows[0].id_user !== req.user.id_user) {
      return res.status(403).json({ pesan: 'Tidak diizinkan.' });
    }
    await pool.query('DELETE FROM workout_logs WHERE id_log = ?', [req.params.id]);
    return res.json({ pesan: 'Catatan berhasil dihapus.' });
  } catch (error) {
    console.error('❌ Error DELETE /logs/:id:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// ===========================================================================
// DASHBOARD / STATISTIK
// ===========================================================================

// GET /stats -> ringkasan aktivitas user untuk dashboard
app.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [profileRow] = await pool.query('SELECT COUNT(*) AS ada FROM user_profiles WHERE id_user = ?', [req.user.id_user]);
    const [plansRow] = await pool.query('SELECT COUNT(*) AS total FROM workout_plans WHERE id_user = ?', [req.user.id_user]);
    const [logsRow] = await pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(jumlah_set),0) AS total_set, COALESCE(SUM(reps),0) AS total_reps FROM workout_logs WHERE id_user = ?', [req.user.id_user]);
    const [weekRow] = await pool.query(
      `SELECT COUNT(*) AS minggu_ini FROM workout_logs WHERE id_user = ? AND tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [req.user.id_user]
    );
    return res.json({
      stats: {
        profil_lengkap: profileRow[0].ada > 0,
        total_jadwal: plansRow[0].total,
        total_latihan_selesai: logsRow[0].total,
        total_set: logsRow[0].total_set,
        total_reps: logsRow[0].total_reps,
        latihan_minggu_ini: weekRow[0].minggu_ini,
      },
    });
  } catch (error) {
    console.error('❌ Error /stats:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// ===========================================================================
// US-09: KOMUNITAS / WORKOUT GROUP
// ===========================================================================

// GET /groups -> daftar semua grup (opsional filter kategori & cari nama)
app.get('/groups', authMiddleware, async (req, res) => {
  try {
    const kategori = str(req.query.kategori);
    const q = str(req.query.q);
    let sql = `SELECT g.*, u.nama_lengkap AS pembuat,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.id_group = g.id_group) AS jumlah_anggota,
        EXISTS(SELECT 1 FROM group_members gm WHERE gm.id_group = g.id_group AND gm.id_user = ?) AS sudah_gabung
       FROM \`groups\` g
       JOIN users u ON u.id_user = g.id_pembuat
       WHERE 1=1`;
    const params = [req.user.id_user];
    if (kategori && kategori !== 'Semua') {
      sql += ' AND g.kategori = ?';
      params.push(kategori);
    }
    if (q) {
      sql += ' AND g.nama_group LIKE ?';
      params.push(`%${q}%`);
    }
    sql += ' ORDER BY g.tanggal_dibuat DESC';
    const [rows] = await pool.query(sql, params);
    return res.json({ groups: rows });
  } catch (error) {
    console.error('❌ Error /groups:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// GET /groups/:id -> detail satu grup + anggota
app.get('/groups/:id', authMiddleware, async (req, res) => {
  try {
    const [groups] = await pool.query(
      `SELECT g.*, u.nama_lengkap AS pembuat FROM \`groups\` g JOIN users u ON u.id_user = g.id_pembuat WHERE g.id_group = ?`,
      [req.params.id]
    );
    if (groups.length === 0) {
      return res.status(404).json({ pesan: 'Grup tidak ditemukan.' });
    }
    const [members] = await pool.query(
      `SELECT gm.id_member, gm.peran, gm.tanggal_gabung, u.id_user, u.nama_lengkap
       FROM group_members gm JOIN users u ON u.id_user = gm.id_user
       WHERE gm.id_group = ? ORDER BY (gm.peran = 'admin') DESC, gm.tanggal_gabung ASC`,
      [req.params.id]
    );
    const [mine] = await pool.query('SELECT peran FROM group_members WHERE id_group = ? AND id_user = ?', [req.params.id, req.user.id_user]);
    return res.json({ group: groups[0], members, peran_saya: mine.length > 0 ? mine[0].peran : null });
  } catch (error) {
    console.error('❌ Error /groups/:id:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// POST /groups -> buat grup baru (pembuat otomatis menjadi admin)
app.post('/groups', authMiddleware, async (req, res) => {
  const { nama_group, deskripsi, kategori, privasi } = req.body || {};
  if (!nama_group || !String(nama_group).trim()) {
    return res.status(400).json({ pesan: 'Nama grup wajib diisi.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO `groups` (nama_group, deskripsi, kategori, privasi, id_pembuat) VALUES (?, ?, ?, ?, ?)',
      [
        String(nama_group).trim(),
        deskripsi || null,
        kategori || 'Umum',
        ['publik', 'privat'].includes(privasi) ? privasi : 'publik',
        req.user.id_user,
      ]
    );
    const id_group = result.insertId;
    await conn.query(
      'INSERT INTO group_members (id_group, id_user, peran) VALUES (?, ?, ?)',
      [id_group, req.user.id_user, 'admin']
    );
    await conn.commit();
    return res.status(201).json({ pesan: 'Grup berhasil dibuat.', id_group });
  } catch (error) {
    await conn.rollback();
    console.error('❌ Error POST /groups:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  } finally {
    conn.release();
  }
});

// POST /groups/:id/join -> bergabung ke grup
app.post('/groups/:id/join', authMiddleware, async (req, res) => {
  try {
    const [groups] = await pool.query('SELECT id_group FROM `groups` WHERE id_group = ?', [req.params.id]);
    if (groups.length === 0) {
      return res.status(404).json({ pesan: 'Grup tidak ditemukan.' });
    }
    const [existing] = await pool.query('SELECT id_member FROM group_members WHERE id_group = ? AND id_user = ?', [req.params.id, req.user.id_user]);
    if (existing.length > 0) {
      return res.status(400).json({ pesan: 'Anda sudah tergabung di grup ini.' });
    }
    await pool.query('INSERT INTO group_members (id_group, id_user, peran) VALUES (?, ?, ?)', [req.params.id, req.user.id_user, 'anggota']);
    return res.json({ pesan: 'Berhasil bergabung ke grup.' });
  } catch (error) {
    console.error('❌ Error POST /groups/:id/join:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// POST /groups/:id/leave -> keluar dari grup
app.post('/groups/:id/leave', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM group_members WHERE id_group = ? AND id_user = ?', [req.params.id, req.user.id_user]);
    return res.json({ pesan: 'Anda keluar dari grup.' });
  } catch (error) {
    console.error('❌ Error POST /groups/:id/leave:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// ===========================================================================
// GROUP CHAT / OBROLAN KOMUNITAS
// ===========================================================================

// GET /groups/:id/messages -> ambil pesan (100 terakhir)
app.get('/groups/:id/messages', authMiddleware, async (req, res) => {
  try {
    // Hanya anggota yang bisa baca
    const [member] = await pool.query('SELECT id_member FROM group_members WHERE id_group = ? AND id_user = ?', [req.params.id, req.user.id_user]);
    if (member.length === 0) {
      return res.status(403).json({ pesan: 'Hanya anggota grup yang dapat membaca pesan.' });
    }
    const [rows] = await pool.query(
      `SELECT m.id_message, m.pesan, m.reply_to, m.created_at,
              u.id_user, u.nama_lengkap,
              gm.peran,
              r.pesan AS reply_pesan, ru.nama_lengkap AS reply_nama
       FROM group_messages m
       JOIN users u ON u.id_user = m.id_user
       JOIN group_members gm ON gm.id_group = m.id_group AND gm.id_user = m.id_user
       LEFT JOIN group_messages r ON r.id_message = m.reply_to
       LEFT JOIN users ru ON ru.id_user = r.id_user
       WHERE m.id_group = ?
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [req.params.id]
    );
    return res.json({ messages: rows.reverse() }); // urut terlama ke terbaru
  } catch (error) {
    console.error('❌ Error GET /groups/:id/messages:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// POST /groups/:id/messages -> kirim pesan
app.post('/groups/:id/messages', authMiddleware, async (req, res) => {
  const { pesan, reply_to } = req.body || {};
  if (!pesan || !String(pesan).trim()) {
    return res.status(400).json({ pesan: 'Pesan tidak boleh kosong.' });
  }
  try {
    const [member] = await pool.query('SELECT id_member FROM group_members WHERE id_group = ? AND id_user = ?', [req.params.id, req.user.id_user]);
    if (member.length === 0) {
      return res.status(403).json({ pesan: 'Hanya anggota grup yang dapat mengirim pesan.' });
    }
    const [result] = await pool.query(
      'INSERT INTO group_messages (id_group, id_user, pesan, reply_to) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id_user, String(pesan).trim(), reply_to || null]
    );
    return res.status(201).json({ pesan: 'Pesan terkirim.', id_message: result.insertId });
  } catch (error) {
    console.error('❌ Error POST /groups/:id/messages:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// ===========================================================================
// WEIGHT LOG — riwayat berat badan untuk grafik laporan
// ===========================================================================

// GET /weight -> ambil semua catatan berat user (opsional filter bulan YYYY-MM)
app.get('/weight', authMiddleware, async (req, res) => {
  try {
    const bulan = str(req.query.bulan);
    let sql = 'SELECT * FROM weight_logs WHERE id_user = ?';
    const params = [req.user.id_user];
    if (bulan) {
      const [y, m] = bulan.split('-');
      sql += ' AND YEAR(tanggal) = ? AND MONTH(tanggal) = ?';
      params.push(y, m);
    }
    sql += ' ORDER BY tanggal ASC';
    const [rows] = await pool.query(sql, params);
    return res.json({ weights: rows });
  } catch (error) {
    console.error('❌ Error GET /weight:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// POST /weight -> catat atau update berat untuk tanggal tertentu (upsert)
app.post('/weight', authMiddleware, async (req, res) => {
  const { berat, tanggal, catatan } = req.body || {};
  if (!berat || isNaN(berat) || berat < 20 || berat > 500) {
    return res.status(400).json({ pesan: 'Berat tidak valid (20–500 kg).' });
  }
  if (!tanggal) {
    return res.status(400).json({ pesan: 'Tanggal wajib diisi.' });
  }
  try {
    await pool.query(
      `INSERT INTO weight_logs (id_user, berat, tanggal, catatan)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE berat = VALUES(berat), catatan = VALUES(catatan)`,
      [req.user.id_user, berat, tanggal, catatan || null]
    );
    // Sync berat terkini ke user_profiles (hanya update jika sudah ada row)
    await pool.query(
      `UPDATE user_profiles SET berat = ? WHERE id_user = ?`,
      [berat, req.user.id_user]
    );
    return res.status(201).json({ pesan: 'Berat berhasil dicatat.' });
  } catch (error) {
    console.error('❌ Error POST /weight:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// DELETE /weight/:tanggal -> hapus catatan berat tanggal tertentu
app.delete('/weight/:tanggal', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM weight_logs WHERE id_user = ? AND tanggal = ?', [req.user.id_user, req.params.tanggal]);
    return res.json({ pesan: 'Catatan berat dihapus.' });
  } catch (error) {
    console.error('❌ Error DELETE /weight:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

// ===========================================================================
// LAPORAN / STATISTIK BULANAN
// ===========================================================================

// GET /reports/monthly?bulan=2026-10 -> ringkasan per bulan
app.get('/reports/monthly', authMiddleware, async (req, res) => {
  try {
    const bulan = str(req.query.bulan) || new Date().toISOString().slice(0, 7); // YYYY-MM
    const [bulanY, bulanM] = bulan.split('-');

    // Total sesi, durasi, estimasi kalori
    const [summary] = await pool.query(
      `SELECT
         COUNT(*) AS total_sesi,
         COALESCE(SUM(durasi), 0) AS total_durasi_detik,
         COALESCE(SUM(jumlah_set * reps * 0.3), 0) AS estimasi_kalori
       FROM workout_logs
       WHERE id_user = ? AND YEAR(tanggal) = ? AND MONTH(tanggal) = ?`,
      [req.user.id_user, bulanY, bulanM]
    );

    // Tanggal yang ada latihan (untuk kalender)
    const [days] = await pool.query(
      `SELECT DAY(CONVERT_TZ(tanggal, '+00:00', '+07:00')) AS hari, COUNT(*) AS sesi
       FROM workout_logs
       WHERE id_user = ? AND YEAR(tanggal) = ? AND MONTH(tanggal) = ?
       GROUP BY DAY(CONVERT_TZ(tanggal, '+00:00', '+07:00'))`,
      [req.user.id_user, bulanY, bulanM]
    );

    // Riwayat latihan bulan ini
    const [history] = await pool.query(
      `SELECT l.id_log,
              DATE_FORMAT(l.tanggal, '%Y-%m-%d') AS tanggal,
              l.jumlah_set, l.reps, l.durasi,
              l.beban, l.catatan, e.nama_gerakan, e.kategori,
              p.nama_plan
       FROM workout_logs l
       LEFT JOIN exercises e ON e.id_exercise = l.id_exercise
       LEFT JOIN workout_plans p ON p.id_plan = l.id_plan
       WHERE l.id_user = ? AND YEAR(l.tanggal) = ? AND MONTH(l.tanggal) = ?
       ORDER BY l.tanggal DESC, l.id_log DESC`,
      [req.user.id_user, bulanY, bulanM]
    );

    // Data berat untuk grafik (dari weight_logs bulan ini)
    const [weightRows] = await pool.query(
      `SELECT berat, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal
       FROM weight_logs WHERE id_user = ? AND YEAR(tanggal) = ? AND MONTH(tanggal) = ?
       ORDER BY tanggal ASC`,
      [req.user.id_user, bulanY, bulanM]
    );
    // Berat terkini dari user_profiles sebagai fallback
    const [profil] = await pool.query('SELECT berat FROM user_profiles WHERE id_user = ?', [req.user.id_user]);
    // Hitung selisih berat dalam bulan ini
    let beratDelta = null;
    if (weightRows.length >= 2) {
      beratDelta = Number(weightRows[weightRows.length - 1].berat) - Number(weightRows[0].berat);
    }

    return res.json({
      bulan,
      summary: summary[0],
      hari_latihan: days,
      history,
      berat_saat_ini: weightRows.length > 0
        ? weightRows[weightRows.length - 1].berat
        : profil[0]?.berat || null,
      berat_delta: beratDelta,
      weight_history: weightRows,
    });
  } catch (error) {
    console.error('❌ Error GET /reports/monthly:', error.message);
    return res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
