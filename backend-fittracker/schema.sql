-- Database schema untuk FitTracker
-- Jalankan file ini di MySQL (XAMPP/phpMyAdmin atau MySQL CLI):
--   mysql -u root < schema.sql
-- atau import via phpMyAdmin.
--
-- Skema ini menyelaraskan implementasi dengan dokumen SRS (srs.md):
--   - users            -> US-01 (autentikasi)
--   - user_profiles    -> US-02 (data diri & personalisasi)
--   - exercises        -> US-03, US-06, US-10 (katalog & detail latihan, video)
--   - workout_plans    -> US-04 (penjadwalan)
--   - plan_exercises   -> US-04 (detail gerakan per jadwal)
--   - workout_logs     -> US-05 (workout log: set, reps, beban)
--   - groups           -> US-09 (komunitas/workout group)
--   - group_members    -> US-09 (anggota grup)

CREATE DATABASE IF NOT EXISTS fittracker_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fittracker_db;

-- PERHATIAN: re-import file ini akan menghapus data yang ada.
-- DROP TABLE ditujukan agar skema selalu sinkron (mencegah tabel lama
-- yang tidak ter-update oleh CREATE TABLE IF NOT EXISTS).
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS workout_logs;
DROP TABLE IF EXISTS plan_exercises;
DROP TABLE IF EXISTS workout_plans;
DROP TABLE IF EXISTS `group_members`;
DROP TABLE IF EXISTS `groups`;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================================================
-- US-01: Akun & autentikasi (online)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS users (
  id_user       INT AUTO_INCREMENT PRIMARY KEY,
  nama_lengkap  VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password      VARCHAR(255)  NOT NULL,           -- menyimpan hash bcrypt
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- US-02: Data diri & personalisasi profil (offline-capable)
-- Menyimpan data fisik & tujuan agar program latihan dapat disesuaikan.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id_profile      INT AUTO_INCREMENT PRIMARY KEY,
  id_user         INT NOT NULL UNIQUE,
  jenis_kelamin   ENUM('L','P') DEFAULT NULL,           -- Laki-laki / Perempuan
  usia            INT DEFAULT NULL,                      -- tahun
  tinggi          INT DEFAULT NULL,                      -- cm
  berat           DECIMAL(5,2) DEFAULT NULL,             -- kg
  level_aktivitas ENUM('rendah','sedang','aktif','sangat_aktif') DEFAULT NULL,
  tujuan          ENUM('menurunkan_berat','menambah_massa','menjaga_kebugaran','meningkatkan_kekuatan') DEFAULT NULL,
  catatan_kesehatan TEXT DEFAULT NULL,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_user FOREIGN KEY (id_user)
    REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- US-03 / US-06 / US-10: Katalog & detail latihan + referensi video
-- Master data gerakan beserta kategori, level kesulitan, dan instruksi.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS exercises (
  id_exercise     INT AUTO_INCREMENT PRIMARY KEY,
  nama_gerakan    VARCHAR(150) NOT NULL,
  kategori        VARCHAR(50)  NOT NULL,            -- mis. Kardio, Kekuatan, Core, Peregangan, Full Body
  level_kesulitan ENUM('Pemula','Menengah','Lanjutan') NOT NULL DEFAULT 'Pemula',
  durasi          INT DEFAULT 0,                     -- estimasi durasi (detik); 0 = berbasis set/reps
  deskripsi       TEXT DEFAULT NULL,
  instruksi       TEXT DEFAULT NULL,                -- instruksi teknis gerakan (mengurangi risiko cedera)
  url_video       VARCHAR(255) DEFAULT NULL,        -- referensi video panduan berinstruktur (US-10)
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- US-04: Penjadwalan latihan (offline-capable)
-- Menyimpan jadwal latihan harian/mingguan yang dibuat user.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS workout_plans (
  id_plan     INT AUTO_INCREMENT PRIMARY KEY,
  id_user     INT NOT NULL,
  nama_plan   VARCHAR(150) DEFAULT NULL,
  tanggal     DATE NOT NULL,                         -- tanggal jadwal dilaksanakan
  hari        VARCHAR(20) DEFAULT NULL,              -- label hari (mis. "Senin") opsional
  catatan     TEXT DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plan_user FOREIGN KEY (id_user)
    REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- US-04: Detail gerakan spesifik di dalam satu jadwal latihan
-- ===========================================================================
CREATE TABLE IF NOT EXISTS plan_exercises (
  id_plan_exercise INT AUTO_INCREMENT PRIMARY KEY,
  id_plan          INT NOT NULL,
  id_exercise      INT NOT NULL,
  target_set       INT DEFAULT 3,
  target_reps      INT DEFAULT 10,
  urutan           INT DEFAULT 0,                    -- urutan eksekusi dalam jadwal
  CONSTRAINT fk_pe_plan FOREIGN KEY (id_plan)
    REFERENCES workout_plans(id_plan) ON DELETE CASCADE,
  CONSTRAINT fk_pe_exercise FOREIGN KEY (id_exercise)
    REFERENCES exercises(id_exercise) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- US-05: Workout log (offline-capable)
-- Pencatatan aktual riwayat latihan: set, repetisi, dan beban.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS workout_logs (
  id_log       INT AUTO_INCREMENT PRIMARY KEY,
  id_user      INT NOT NULL,
  id_plan      INT DEFAULT NULL,                     -- bisa null jika log tanpa jadwal
  id_exercise  INT DEFAULT NULL,
  jumlah_set   INT DEFAULT 0,
  reps         INT DEFAULT 0,
  beban        DECIMAL(6,2) DEFAULT 0,               -- kg (US-05)
  durasi       INT DEFAULT 0,                         -- detik (untuk latihan berbasis durasi)
  catatan      TEXT DEFAULT NULL,
  tanggal      DATE NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_user FOREIGN KEY (id_user)
    REFERENCES users(id_user) ON DELETE CASCADE,
  CONSTRAINT fk_log_plan FOREIGN KEY (id_plan)
    REFERENCES workout_plans(id_plan) ON DELETE SET NULL,
  CONSTRAINT fk_log_exercise FOREIGN KEY (id_exercise)
    REFERENCES exercises(id_exercise) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- US-09: Komunitas / workout group (online)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS `groups` (
  id_group      INT AUTO_INCREMENT PRIMARY KEY,
  nama_group    VARCHAR(150) NOT NULL,
  deskripsi     TEXT DEFAULT NULL,
  id_pembuat    INT NOT NULL,                         -- user pembuat grup
  tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_group_creator FOREIGN KEY (id_pembuat)
    REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_members (
  id_member      INT AUTO_INCREMENT PRIMARY KEY,
  id_group       INT NOT NULL,
  id_user        INT NOT NULL,
  peran          ENUM('admin','anggota') NOT NULL DEFAULT 'anggota',
  tanggal_gabung TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_group_user (id_group, id_user),
  CONSTRAINT fk_gm_group FOREIGN KEY (id_group)
    REFERENCES `groups`(id_group) ON DELETE CASCADE,
  CONSTRAINT fk_gm_user FOREIGN KEY (id_user)
    REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- SEED DATA: Katalog latihan (US-03/US-06)
-- Memberikan data awal agar aplikasi dapat dipakai segera (juga mendukung mode
-- offline setelah data di-cache di perangkat).
-- ===========================================================================
INSERT INTO exercises (nama_gerakan, kategori, level_kesulitan, durasi, deskripsi, instruksi, url_video) VALUES
('Push Up',          'Kekuatan',  'Pemula',    0,   'Latihan kekuatan otot dada, lengan, dan bahu menggunakan berat tubuh.', 'Posisikan tubuh telungkup, tangan selebar bahu, turunkan dada hingga hampir menyentuh lantai lalu dorong kembali. Jaga tubuh tetap lurus.', NULL),
('Squat',            'Kekuatan',  'Pemula',    0,   'Latihan kekuatan otot kaki dan pinggul.', 'Berdiri tegak, kangan selebar bahu, tekuk lutut dan dorong pinggul ke belakang seperti duduk, lalu kembali berdiri. Jaga lutut tidak melebihi ujung jari kaki.', NULL),
('Plank',            'Core',      'Pemula',    30,  'Latihan kekuatan otot inti (core) tubuh.', 'Posisikan tubuh telungkup disangga lengan bawah, jaga tubuh tetap lurus dari kepala hingga tumit, tahan posisi tersebut. Jangan turunkan pinggul.', NULL),
('Jumping Jack',      'Kardio',    'Pemula',    60,  'Latihan kardio sederhana untuk pemanasan.', 'Berdiri tegak, lompat sambil membuka kaki dan mengangkat tangan ke atas, lalu lompat kembali ke posisi awal secara bergantian dengan ritme stabil.', NULL),
('Lunges',            'Kekuatan',  'Menengah',  0,   'Latihan kaki satu per satu untuk keseimbangan.', 'Melangkah ke depan satu kaki, turunkan lutut belakang hingga hampir menyentuh lantai, lalu dorong kembali. Bergantian kaki.', NULL),
('Sit Up',            'Core',      'Pemula',    0,   'Latihan otot perut.', 'Berbaring telentang, tekuk lutut, silangkan tangan di dada, angkat tubuh ke depan lalu turunkan perlahan.', NULL),
('Mountain Climber',  'Kardio',    'Menengah',  45,  'Latihan kardio & core dinamis.', 'Posisi plank, tarik lutut kanan ke dada secara bergantian dengan cepat seperti memanjat. Jaga pinggul tetap rendah.', NULL),
('Burpee',            'Full Body', 'Lanjutan',  0,   'Latihan full body intens untuk kebugaran menyeluruh.', 'Dari berdiri, jongkok, telentang dorong kaki ke belakang (plank), lalu lompat ke depan dan melompat ke atas. Lakukan dengan ritme terkontrol.', NULL),
('High Knees',         'Kardio',    'Menengah',  30,  'Latihan kardio dengan mengangkat lutut tinggi.', 'Berdiri, lari di tempar sambil mengangkat lutut setinggi pinggul secara bergantian dengan ritme cepat.', NULL),
('Glute Bridge',       'Kekuatan',  'Pemula',    0,   'Latihan otot glute dan pinggul.', 'Berbaring telentang, tekuk lutut, angkat pinggul ke atas hingga tubuh lurus, tahan, lalu turunkan perlahan.', NULL),
('Russian Twist',      'Core',      'Menengah',  45,  'Latihan otot perut oblik.', 'Duduk condong ke belakang, angkat kaki, putar tubuh ke kiri dan kanan secara bergantian. Jaga punggung tetap tegak.', NULL),
('Side Plank',         'Core',      'Lanjutan',  30,  'Variasi plank samping untuk core & keseimbangan.', 'Berbaring menyamping, angkat pinggul disangga satu lengan, jaga tubuh lurus, tahan. Bergantian sisi.', NULL),
('Peregangan Dinamis', 'Peregangan','Pemula',    60,  'Peregangan dinamis untuk pemanasan.', 'Lakukan gerakan peregangan ringan secara dinamis (ayunan lengan, putar pinggul) sebelum latihan utama.', NULL),
('Bicycle Crunch',    'Core',      'Menengah',  30,  'Latihan perut menyatu gerakan sepeda.', 'Berbaring telentang, gerakkan kaki seperti mengayun sepeda sambil menempelkan siku ke lutut berlawanan secara bergantian.', NULL);
