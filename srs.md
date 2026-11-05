# DOKUMEN ANALISIS KEBUTUHAN

Tugas PjBL Tahap 1

## \[Aplikasi Manajerial Rutinitas Latihan Fisik dan Workout Berbasis Mobile/Fittracker\]![](images/image-001.png)

Kelompok 6

| **Kolom** | **Isi** |
| --- | --- |
| Mata Kuliah | SIF125113 — Pemrograman Mobile |
| Dosen Pengampu | Ahmad Yusuf M,Kom |
| Kelas | H6A.3 |
| Tanggal Pengumpulan | 16/09/2026 |
| Tautan Repositori GitHub | https://github.com/Q-WhiteServer/FitTracker.git |

1. **Identitas Kelompok dan Studi Kasus**![](images/image-002.png)
    1. **Anggota Kelompok**

| **No** | **NIM** | **Nama Lengkap** | **Peran** | **Kontribusi Utama** |
| --- | --- | --- | --- | --- |
| 1 | 09010625001 | Ahmad Faiq Dzikry | Ketua | \- |
| 2 | 09040625101 | Zhafran Era Mushaddad | Anggota | Backend & Database |
| 3 | 09020625067 | Nazwa Dwi Rizkya | Anggota | Frontend & Figma |
| 4 | 09010625011 | Lia Mesya Rahmadiani | Anggota | Frontend & Figma |

- 1.  **Studi Kasus**

**Ringkasan studi kasus (3–5 kalimat):**

Banyak individu di Indonesia yang memiliki motivasi yang rendah untuk menjalani pola hidup sehat melalui olahraga, Masalah utamanya adalah mereka bingung mengatur jadwal latihan, malas mencatat progres secara manual (pakai buku/catatan biasa) saat sedang lelah berolahraga, dan sering takut salah gerakan yang bisa menyebabkan cedera. FitTracker dibuat untuk menyediakan panduan cara gerak yang benar agar aman, serta fitur pencatatan latihan, agar pengguna tidak membuang waktu. Dengan FitTracker, pengguna bisa lebih konsisten berolahraga karena semua rencana dan kemajuan mereka terekam jelas dan aman. FitTracker dapat diakses offline maupun online dan mempunyai keunggulan sendiri-sendiri.

1. **Rumusan Masalah dan Bukti Pendukung**![](images/image-003.png)
    1. **Latar Belakang Masalah**

Banyak individu yang ingin memulai pola hidup sehat sering kali berhenti di tengah jalan karena kesulitan mengorganisir jadwal olahraga dan memantau progres fisik mereka secara berkala. Pencatatan manual menggunakan buku catatan atau aplikasi catatan umum kerap tidak praktis dilakukan saat latihan berlangsung. Selain itu, ketiadaan instruksi gerakan yang benar serta visualisasi pencapaian membuat pengguna awam rentan mengalami cedera atau kehilangan motivasi latihan. Data BKPK Kemenkes RI (2024) menunjukkan kendala utamanya adalah keterbatasan waktu (48,7%) dan kurangnya motivasi (32,6%). Hal ini diperparah oleh pencatatan latihan (beban, set, pengulangan) yang masih manual, dinilai tidak praktis, serta menyulitkan pemantauan progres fisik. Di sisi lain, penelitian oleh Solikah dkk. (2024) menguraikan bahwa kesalahan teknik gerakan merupakan salah satu penyebab utama timbulnya cedera olahraga, sehingga ketiadaan panduan gerakan yang benar bagi pemula rentan mengalami risiko cedera.

Oleh karena itu, diperlukan aplikasi _Fit Tracker_ terintegrasi yang mampu menyederhanakan pencatatan latihan, menampilkan visualisasi progresi secara otomatis, dan menyediakan panduan teknik gerakan yang aman.

- 1.  **Daftar Rumusan Masalah**

| **No** | **Rumusan Masalah** | **Bukti / Alasan Pendukung** |
| --- | --- | --- |
| M1 | Bagaimana merancang sistem pencatatan aktivitas fisik (_workout log_), _timer_ otomatis, dan penyusunan jadwal agar dapat mempersiapkan latihan pengguna? | Berdasarkan data Survei Kesehatan Indonesia (SKI) Kemenkes RI, hambatan terbesar masyarakat Indonesia kurang melakukan aktivitas fisik (37,4%) adalah **keterbatasan waktu (48,7%)**. Fitur pencatatan yang rumit akan menambah beban waktu pengguna. |
| M2 | Bagaimana merancang sistem manajemen program latihan interaktif meliputi personalisasi data diri, katalog pilihan program, detail gerakan beserta durasi, dan panduan video senam berinstruktur guna menyesuaikan kondisi fisik pengguna serta meminimalisir resiko cedera akibat kesalahan teknik gerakan? | Menurut data analisis cedera olahraga, **teknik olahraga yang tidak tepat** merupakan salah satu penyebab utama cedera karena dapat meningkatkan tekanan pada otot dan sendi. Selain itu, **faktor intrinsik** seperti usia, kondisi fisik, dan riwayat kesehatan sangat mempengaruhi resiko cedera, sehingga personalisasi program latihan dan panduan video yang sesuai dengan prinsip biomekanika sangat diperlukan untuk meminimalisir kesalahan gerakan. |
| M3 | Bagaimana mengimplementasikan notifikasi pengingat dan mekanisme sistem apresiasi (_rewards_) untuk mendorong konsistensi serta menekan angka penghentian latihan harian? | Temuan Kemenkes RI menunjukkan bahwa faktor terbesar kedua masyarakat tidak berolahraga adalah **kurangnya motivasi atau rasa malas (32,6%)**, yang berdampak pada tingginya angka perilaku kurang aktif pada penduduk usia diatas 10 tahun 37,4%. |

- 1.  **Solusi yang Diusulkan**

![](images/image-004.png)

- **Solusi M1:**

1. Fitur Penjadwalan (US-04): Aplikasi FitTraker dapat menyusun _workout plan_ harian/mingguan sehingga tidak membuang waktu untuk memilih gerakan saat ingin mulai berolahraga.
2. Pencatatan Riwayat (US-05): Sistem _workout log_ dirancang untuk mencatat set, pengulangan, dan beban.
3. Timer Otomatis (US-08): Pengatur waktu sesi latihan dan jeda istirahat secara _real-time_ untuk memastikan total durasi olahraga.

- **Solusi M2:**

1. US-2 (Data Diri): Fitur Profil & Rekomendasi Fleksibel — Formulir input profil fisik dan tujuan untuk memfilter rekomendasi latihan yang aman dan sesuai kondisi tubuh.
2. US-3 (Daftar Latihan): Katalog Program Latihan — Antarmuka daftar latihan yang dilengkapi filter kategori dan tingkat kesulitan sesuai kebutuhan pengguna.
3. US-6 (Detail Latihan): Halaman Detail & Informasi Gerakan — Tampilan rincian gerakan, instruksi teknis, dan estimasi durasi sebelum memulai latihan.
4. US-9 (Video Berinstruktur): Pemutar Video Panduan Interaktif — Video panduan gerakan berinstruktur secara _real-time_ untuk memastikan ketepatan teknik dan tempo latihan.

- **Solusi M3:**

1. US-07 (Notifikasi): Fitur _Push Notification_ — Pengingat otomatis terjadwal sebelum latihan dimulai.
2. US-11 (Medsos): Fitur _Social Share_ — Generator kartu ringkasan latihan untuk dibagikan ke media sosial.
3. Solusi untuk US-12 (Papan Peringkat/Leaderboard Mingguan) yaitu sistem pemeringkatan berbasis poin aktivitas olahraga yang diperbarui secara berkala (_weekly reset_).
4. US-13 (Musik): Fitur _In-App Player_ — Pemutar musik internal untuk menemani sesi latihan.
5. **Pengguna Sasaran dan Konteks Pemakaian**
    1. **Konteks Pemakaian**

| **Aspek** | **Deskripsi** |
| --- | --- |
| Kapan aplikasi dipakai | Sebelum latihan (memilih program), saat latihan berlangsung (mencatat set/beban), dan setelah latihan (meninjau ringkasan/grafik). |
| Di mana aplikasi dipakai | Fleksibel |
| Kondisi jaringan | Fleksibel |

## 4.2 Kriteria Penerimaan per User Story

_» Salin blok di bawah untuk setiap user story. Gunakan format Given–When–Then agar kriteria dapat diuji._

| **US-01** | **Judul:** |
| --- | --- |
| User story | Sebagai \_\_\_, saya ingin \_\_\_, agar \_\_\_. |
| Prioritas | Must / Should / Could |
| Kriteria 1 | Given \_\_\_, When \_\_\_, Then \_\_\_. |
| Kriteria 2 | Given \_\_\_, When \_\_\_, Then \_\_\_. |
| Kriteria 3 | Given \_\_\_, When \_\_\_, Then \_\_\_. |
| Catatan |  |

| **US-02** | **Judul:** |
| --- | --- |
| User story | Sebagai \_\_\_, saya ingin \_\_\_, agar \_\_\_. |
| Prioritas | Must / Should / Could |
| Kriteria 1 | Given \_\_\_, When \_\_\_, Then \_\_\_. |
| Kriteria 2 | Given \_\_\_, When \_\_\_, Then \_\_\_. |
| Kriteria 3 | Given \_\_\_, When \_\_\_, Then \_\_\_. |
| Catatan |  |

_(Salin blok di atas hingga seluruh user story Must dan Should memiliki kriteria penerimaan._

1. **User Story Berprioritas**![](images/image-005.png)
    1. **Ringkasan User Story**

| **ID** | **Prioritas** | **User Story** | **Estimasi** **(1,2,3,5,8)** | **Terkait Masalah** |
| --- | --- | --- | --- | --- |
| US-01 | Must | Sebagai pengguna, saya ingin membuat akun dan login agar data tersimpan dengan aman. (online) | 2 | M1 |
| US-02 | Must | Sebagai pengguna, saya ingin mengatur data diri, agar program latihan dapat disesuaikan dengan kondisi dan tujuan. (offline) | 2 | M2 |
| US-03 | Must | Sebagai pengguna, saya ingin melihat daftar latihan, agar dapat memilih latihan yang sesuai dengan kebutuhan. (offline) | 3 | M2 |
| US-04 | Must | Sebagai pengguna, saya ingin membuat dan mengatur jadwal latihan, agar olahraga bisa teratur. (offline) | 3 | M1 |
| US-05 | Must | Sebagai pengguna, saya ingin mencatat latihan yang telah dilakukan, agar saya dapat menyimpan riwayat aktivitas tersebut. (offline) | 5 | M1 |
| US-06 | Must | Sebagai pengguna, saya ingin melihat detail setiap latihan, agar bisa melihat gerakan dan durasi yang dilakukan. (offline) | 5 | M2 |
| US-07 | Should | Sebagai pengguna, saya ingin menerima notifikasi pengingat jadwal latihan agar bisa mempersiapkan diri ketika latihan. (offline) | 5 | M3 |
| US-08 | Should | Sebagai pengguna, saya ingin menggunakan timer otomatis saat melakukan workout secara offline, agar dapat mengatur sesi latihan. | 3 | M1 |
| US-09 | Should | Sebagai pengguna, saya ingin bergabung atau membuat kelompok olahraga (_community/workout group_), agar bisa berinteraksi, berolahraga bareng, serta berbagi motivasi dengan pengguna lain. (online) | 5 | M3 |
| US-10 | Could | Sebagai pengguna, saya ingin mengikuti video senam yang dipandu oleh instruktur, agar saya dapat melakukan gerakan sesuai gerakan dan waktu yang ditentukan. (offline) | 3 | M2 |
| US-11 | Could | Sebagai pengguna, saya ingin membagikan ringkasan sesi latihan saya ke media sosial agar lebih bersemangat. (online) | 8 | M3 |
| US-12 | Won’t | Sebagai pengguna, saya ingin mendengarkan musik saat melakukan latihan di aplikasi, agar latihan terasa lebih menyenangkan dan meningkatkan motivasi. | 5 | \- |
| US-13 | Won’t | Sebagai pengguna, saya ingin menganalisis gerakan tubuh menggunakan kamera dan AI, agar mengetahui gerakan sudah benar atau salah. | 8 | \- |
| US-14 | Won’t | Sebagai pengguna, saya ingin mengintegrasikan aplikasi tersambung dengan smartwatch untuk membaca kesehatan secara real time. | 8 | \- |
| US-15 | Won’t | Sebagai pengguna, saya ingin melacak aktifitas olahraga menggunakan GPS secara real-time, agar dapat mengetahui rute, jarak, kecepatan dan lokasi aktivitas | 8 | \- |

# 5. Fungsionalitas Inti

_» Rumuskan 3–5 fungsi inti yang menjadi nilai utama aplikasi. Fungsi inti harus berasal dari user story berprioritas Must._

| **No** | **Nama Fungsi** | **Deskripsi Singkat** | **User Story Terkait** |
| --- | --- | --- | --- |
| 1. | Manajemen Akun & Personalisasi Profil | Mengelola autentikasi pengguna secara online serta pengaturan data diri fisik dan tujuan agar program latihan dapat disesuaikan secara personal. | US-01, US-02 |
| 2. | Katalog & Detail Latihan Interaktif | Menyediakan daftar katalog latihan lengkap dengan filter kategori, tingkat kesulitan. | US-03, US-06 |
| 3. | Penjadwalan & Workout Log Offline. | Memfasilitasi pembuatan jadwal latihan harian/mingguan serta pencatatan riwayat aktivitas fisik (set, repetisi, dan beban) secara offline. | US-04, US-05 |
| 4. | Timer Sesi Latihan Otomatis. | Menyediakan pengatur waktu (_timer)_ real-time untuk mengatur durasi sesi latihan dan waktu istirahat secara offline. | US-08 |
| 5. | Pengingat & Komunitas Pengguna | Mengirimkan notifikasi push pengingat jadwal latihan serta menyediakan fitur kelompok/komunitas olahraga untuk berinteraksi dan berbagi motivasi. | US-07, US-09 |

## 5.1 Batasan Ruang Lingkup

**Termasuk dalam ruang lingkup:**

- Manajemen otentikasi pengguna dan sinkronisasi data profil _cloud_
- Fitur pencatatan riwayat latihan (_workout log_), penyusunan jadwal harian/mingguan, serta pengatur waktu (_timer_) _offline_
- Katalog latihan, rincian instruksi gerakan, dan video panduan berinstruktur
- Pengingat notifikasi _push_.
- Fitur komunitas dan interaksi kelompok (_workout group_) untuk jadwal olahraga bareng dan ruang diskusi sesama pengguna secara _online_.

**Tidak termasuk dalam ruang lingkup:**

- Pemutar musik internal _in-app_ (US-13)
- Analisis koreksi gerakan tubuh berbasis AI dan kamera _real-time_ (US-14)
- Integrasi sensor _smartwatch_ / perangkat sandang (_wearable_) untuk data kesehatan _real-time_ (US-15)
- Pelacakan rute, jarak, dan kecepatan olahraga berbasis GPS secara _real-time_ (US-16)

# 6. Spesifikasi Teknis Awal

## 6.1 Pilihan Platform

| **Aspek** | **Keputusan** |
| --- | --- |
| Platform target | Mobile |
| Framework | React Native (Expo) |
| Versi minimum OS | \- |
| Bahasa pemrograman | \- |
| Pustaka navigasi | \- |
| Pengelolaan state | \- |
| Alasan pemilihan | \- |

## 6.2 Struktur Data

| **Entitas** | **Atribut Utama** | **Keterangan** |
| --- | --- | --- |
| **users** | id\_user (PK), nama\_lengkap, email | Menyimpan data profil user. |
| **exercises** | id\_exercise (PK), nama\_gerakan, kategori, url\_video | Menyimpan _master data_ catalog gerakan beserta referensi video panduan. |
| **workout\_plans** | id\_plan (PK), id\_user (FK), tanggal | Menyimpan data jadwal latihan mingguan atau harian yang dibuat oleh user. |
| plan\_exercises | id\_plan\_exercise (PK), id\_plan (FK), id\_exercise (FK) | Tabel detail yang menyimpan daftar target gerakan spesifik di dalam satu jadwal latihan. |
| groups | id\_group (PK), nama\_group, deskripsi, tanggal\_dibuat | Menyimpan data kelompok atau komunitas olahraga yang dibuat oleh user. |
| group\_members | id\_member (PK), id\_group (FK), id\_user (FK), peran (admin/anggota) | Tabel detail yang mencatat pengguna mana saja yang tergabung ke dalam suatu grup komunitas. |
| **workout\_logs** | id\_log (PK), id\_plan (FK), id\_exercise (FK), jumlah\_set, reps | Menyimpan pencatatan aktual (riwayat) dari latihan yang berhasil diselesaikan user. |

![](images/image-006.png)

## 6.3 Kebutuhan Non-Fungsional

| **Aspek** | **Target** |
| --- | --- |
| Kinerja | Aplikasi dirancang untuk bekerja secara cepat dan responsif, di mana aplikasi dapat terbuka penuh hanya dalam hitungan detik, data latihan tersimpan secara instan tanpa hambatan (_lag_), serta seluruh animasi layar berjalan dengan nyaman di mata. |
| Keamanan & privasi data | Kata sandi pengguna diacak menggunakan metode enkripsi khusus agar tidak bisa dibaca oleh siapapun jika terjadi kebocoran data. Sesi masuk (login) menggunakan sistem tiket digital otomatis agar pengguna tidak perlu terus-menerus mengetik kata sandi, serta data pribadi lokal disimpan di ruang penyimpanan HP yang aman dan terisolasi. |
| Ketersediaan saat offline | Semua fungsi inti (US-02 s.d. US-08) dapat berjalan tanpa jaringan internet, dengan mekanisme sinkronisasi latar belakang saat perangkat kembali terhubung ke jaringan |
| Kemudahan penggunaan | Tampilan aplikasi dirancang sangat ramah pengguna dan mudah dipahami, memungkinkan pencatatan latihan dilakukan hanya dalam beberapa ketukan cepat, serta dilengkapi tulisan dan warna layar yang tajam sehingga tetap terlihat jelas saat sedang berolahraga. |
