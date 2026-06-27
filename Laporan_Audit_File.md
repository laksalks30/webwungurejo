# 🔍 Laporan Audit File Project KKN 84.095

## 🚨 MASALAH KRITIS: Total Project Terlalu Besar untuk Hosting

| Folder | Estimasi Ukuran | Status |
|--------|----------------|--------|
| `assets/profilepic/` | **~114 MB** | 🔴 KRISIS |
| `assets/team/` (file non-_web) | **~58 MB** | 🔴 HARUS DIBUANG |
| `assets/logo/` (file tidak terpakai) | **~4.2 MB** | 🟡 Sebagian hapus |
| `assets/images/` (PNG besar) | **~3 MB** | 🟡 Perlu compress |
| File akar tidak perlu | **~950 KB** | 🟡 Hapus |
| `backend/venv/` | **Ratusan MB** | 🔴 JANGAN DI-UPLOAD |

---

## 🔴 PRIORITAS 1: HAPUS SEKARANG (Tidak Terpakai & Sangat Berat)

### `assets/profilepic/` — **114 MB TOTAL** 🚨
Ini adalah biang kerok terbesar. Setiap foto anggota berukuran ~10MB.
Foto-foto ini DIPAKAI oleh app.js, tapi ukurannya jauh terlalu besar.

**Solusi: COMPRESS, jangan hapus.** Foto `10 MB` harus jadi `< 200 KB`.

File yang perlu dikompresi:
- `AHMAD.jpeg` → 9.71 MB *(seharusnya < 150 KB)*
- `ANAS.jpeg` → 9.56 MB
- `DIAN.jpeg` → 9.76 MB
- `DSCF0560.JPG.jpeg` → 12.09 MB ⚠️ *Nama file aneh, perlu dicek apakah dipakai*
- `FANIDA.jpeg` → 9.62 MB
- `HAVEZ.jpeg` → 10.67 MB
- `LAKSA.jpeg` → 10.15 MB
- `LYRA.jpeg` → 11.55 MB
- `NABILA.jpeg` → 9.44 MB
- `SABRINA.jpeg` → 11.29 MB
- `SHOFA.jpeg` → 10.09 MB

> [!CAUTION]
> File `DSCF0560.JPG.jpeg` (12 MB) TIDAK DITEMUKAN referensinya di kode manapun. File ini aman untuk dihapus.

---

### `assets/team/` — File Besar Tanpa Versi `_web` (tidak terpakai di kode)

Setelah audit kode, **HANYA 1 file team yang dipakai** yaitu `FOTOBERSAMA3_web.jpg`.
Semua file lain di bawah ini **tidak ada referensinya di HTML/CSS/JS manapun**:

| File | Ukuran | Status |
|------|--------|--------|
| `DSCF4365.JPG` | 12.7 MB | 🔴 Hapus (original mentah) |
| `DSCF4365Albet.png` | 1.5 MB | 🔴 Hapus |
| `DSCF4365Ardila.png` | 4.5 MB | 🔴 Hapus |
| `DSCF4365Dewa.png` | 5.4 MB | 🔴 Hapus |
| `DSCF4365Fadia.png` | 6.1 MB | 🔴 Hapus |
| `DSCF4365Faza.png` | 3.5 MB | 🔴 Hapus |
| `DSCF4365Ilham.png` | 2.7 MB | 🔴 Hapus |
| `DSCF4365Rara.png` | 5.2 MB | 🔴 Hapus |
| `DSCF4365Rifki.png` | 3.0 MB | 🔴 Hapus |
| `DSCF4365Tata.png` | 3.5 MB | 🔴 Hapus |
| `DSCF4365Zahra.png` | 6.1 MB | 🔴 Hapus |
| `DSCF4365_web.jpg` | 0.15 MB | 🔴 Hapus (tidak dipakai) |
| `FOTOBERSAMA2_web.jpg` | 0.15 MB | 🔴 Hapus (tidak dipakai) |
| **TOTAL bisa dihemat** | **~55 MB** | |

> [!NOTE]
> `FOTOBERSAMA3_web.jpg` (222 KB) dan `DSCF4365Albet_web.png` (52 KB) hingga `DSCF4365Zahra_web.png` perlu dicek — hanya `FOTOBERSAMA3_web.jpg` yang terbukti dipakai.

---

## 🟡 PRIORITAS 2: HAPUS (File Proyek, Bukan Hosting)

### File di Root Project (tidak perlu di server)
| File | Ukuran | Alasan Hapus |
|------|--------|--------------|
| `095_PROPOO.pdf` | 924 KB | Dokumen internal, tidak perlu dihosting |
| `PROPOSAL_KKN_84_095.txt` | 7 KB | Dokumen internal |
| `temp_faces.jpg` | 26 KB | File sementara, tidak dipakai |
| `temp_grid.jpg` | 210 KB | File sementara, tidak dipakai |
| `trace_polygons.py` | 3 KB | Script Python development, tidak perlu di server |

### `assets/logo/` — 2 Logo Tidak Terpakai
| File | Ukuran | Status |
|------|--------|--------|
| `LogoKKNBaru.png` | 181 KB | ✅ DIPAKAI (favicon, navbar, footer, admin) |
| `logoupn.png` | 727 KB | ✅ DIPAKAI (footer) |
| `LogoKKNNoBackground.png` | **2.0 MB** | 🔴 Tidak ada referensi di kode → HAPUS |
| `LogoKKNNoText.png` | **2.0 MB** | 🔴 Tidak ada referensi di kode → HAPUS |

---

## 🔴 PRIORITAS 3: BACKEND — JANGAN PERNAH DIUPLOAD ke hosting frontend

| Folder/File | Alasan |
|-------------|--------|
| `backend/venv/` | Virtual environment Python (ratusan MB library) — tidak perlu di server, install ulang pakai `pip install -r requirements.txt` |
| `backend/__pycache__/` | File cache Python sementara — hapus sebelum upload |
| `docker-compose.yml` | Hanya untuk development lokal, tidak perlu di hosting |
| `.env.example` | Ganti dengan `.env` asli di server, jangan upload |

---

## ✅ FILE YANG HARUS TETAP ADA (Semua Dipakai)

| File | Keterangan |
|------|-----------|
| `index.html` | Halaman utama |
| `style.css` | Semua styling |
| `app.js` | Logika utama |
| `admin.html` + `admin.js` | Panel admin |
| `lang.js` | Sistem multi-bahasa |
| `sw.js` + `manifest.json` | PWA |
| `assets/logo/LogoKKNBaru.png` | Logo utama |
| `assets/logo/logoupn.png` | Logo UPN |
| `assets/images/umkm_*.png` | Gambar UMKM (perlu compress) |
| `assets/images/Gunung kidul.jpg` | Foto desa |
| `assets/team/FOTOBERSAMA3_web.jpg` | Foto grup (sudah cukup kecil) |
| `assets/profilepic/*.jpeg` | Foto anggota (**WAJIB COMPRESS dulu**) |
| `backend/main.py` | Server API |
| `backend/requirements.txt` | Dependencies |
| `backend/Dockerfile` | Deploy container |

---

## 📊 Ringkasan Penghematan

| Aksi | Perkiraan Hemat |
|------|----------------|
| Hapus `assets/team/` (non-_web) | ~55 MB |
| Compress `assets/profilepic/` ke <200KB | ~113 MB → ~2 MB |
| Hapus logo tidak terpakai | ~4 MB |
| Hapus file root tidak perlu | ~1.2 MB |
| **TOTAL HEMAT** | **~170 MB** |

> [!TIP]
> Gunakan **squoosh.app** (gratis, online) untuk compress foto anggota dari 10 MB menjadi 150-200 KB tanpa kehilangan kualitas visual yang signifikan. Konversi ke format **WebP** agar lebih kecil lagi.

---

## 🛠️ Langkah Aksi yang Disarankan

1. **Sekarang:** Hapus file yang jelas tidak terpakai (logos, temp files, dokumen, team originals)
2. **Compress foto anggota** di squoosh.app atau tools sejenisnya
3. **Pastikan `backend/venv/` dan `__pycache__`** masuk ke `.gitignore`
4. **Verifikasi** apakah file `_web.png` di folder team (Albet_web, Ardila_web, dll) masih dipakai — kalau tidak, hapus juga
