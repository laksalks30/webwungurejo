import os
from main import SessionLocal, AdminUserDB, ProkerDB, LogbookDB, GuestbookDB, get_password_hash
import datetime

def seed():
    db = SessionLocal()
    try:
        # 1. Create Default Admin User
        admin_username = os.environ.get("ADMIN_USERNAME", "admin")
        admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
        
        if admin_username == "admin" and admin_password == "admin123":
            print("WARNING: Using default admin credentials (admin / admin123). Please set ADMIN_USERNAME and ADMIN_PASSWORD environment variables for production.")

        admin = db.query(AdminUserDB).filter(AdminUserDB.username == admin_username).first()
        if not admin:
            admin = AdminUserDB(
                username=admin_username,
                password_hash=get_password_hash(admin_password)
            )
            db.add(admin)
            print(f"Admin user created: {admin_username}")
        else:
            print("Admin user already exists.")

        # 2. Seed Sample Prokers
        if db.query(ProkerDB).count() == 0:
            sample_prokers = [
                ProkerDB(
                    type="Proker Bersama",
                    owner_name=None,
                    title="Bimbingan Belajar Wungurejo Kreatif",
                    description_markdown="Membantu adik-adik tingkat SD dan SMP di Dusun Wungurejo untuk memahami materi sekolah dengan metode pembelajaran yang interaktif, visual, dan menyenangkan. Dilaksanakan di balai RW.",
                    status="Belum Mulai",
                    image_urls=[]
                ),
                ProkerDB(
                    type="Proker Individu",
                    owner_name="Ardila",
                    title="Digitalisasi Pemasaran dan Rebranding UMKM Makanan Ringan",
                    description_markdown="Melakukan rebranding kemasan produk makanan ringan buatan warga RT 03 dan mendaftarkan produk mereka ke platform e-commerce serta Google Maps untuk memperluas jangkauan pasar.",
                    status="Sedang Berjalan",
                    image_urls=[]
                ),
                ProkerDB(
                    type="Proker Bersama",
                    owner_name=None,
                    title="Sosialisasi PHBS & Penyuluhan Gizi Cegah Stunting",
                    description_markdown="Bekerjasama dengan bidan desa untuk menyelenggarakan posyandu balita dan sosialisasi pembuatan PMT (Pemberian Makanan Tambahan) sehat kaya protein dari bahan pangan lokal.",
                    status="Selesai",
                    image_urls=[]
                ),
                ProkerDB(
                    type="Proker Individu",
                    owner_name="Tata",
                    title="Pengembangan Website Profil Dusun Wungurejo",
                    description_markdown="Membangun portal informasi digital desa yang memuat data kependudukan, struktur pemerintahan desa, potensi wisata, dan peta interaktif wilayah desa.",
                    status="Sedang Berjalan",
                    image_urls=[]
                )
            ]
            db.bulk_save_objects(sample_prokers)
            print("Sample prokers seeded.")
        else:
            print("Proker table is not empty. Skipping.")

        # 3. Seed Sample Logbook Entries
        if db.query(LogbookDB).count() == 0:
            sample_logbooks = [
                LogbookDB(
                    phase="Pra-KKN",
                    date="2026-06-15",
                    title="Koordinasi Awal dengan Kepala Desa",
                    content_markdown="Kami melakukan kunjungan silaturahmi sekaligus pemaparan rencana program kerja umum kepada Kepala Dusun Wungurejo beserta jajaran perangkat desa. Pertemuan berjalan sangat lancar dan kami mendapatkan izin penuh untuk pelaksanaan program kerja lapangan.",
                    image_urls=[]
                ),
                LogbookDB(
                    phase="Pra-KKN",
                    date="2026-06-20",
                    title="Survei Lapangan Potensi UMKM RT 03",
                    content_markdown="Melakukan wawancara langsung dengan beberapa pemilik usaha keripik singkong di lingkungan RT 03 untuk memetakan kendala utama yang mereka hadapi dalam aspek pemasaran dan pengemasan produk.",
                    image_urls=[]
                ),
                LogbookDB(
                    phase="Pelaksanaan KKN",
                    date="2026-07-02",
                    title="Penerimaan Resmi & Pembukaan Posko",
                    content_markdown="Hari pertama pelaksanaan KKN secara resmi dimulai. Kami menghadiri upacara penerimaan mahasiswa KKN UPNVYK di kecamatan Mojotengah, dilanjutkan dengan berbenah posko utama di Dusun Wungurejo.",
                    image_urls=[]
                )
            ]
            db.bulk_save_objects(sample_logbooks)
            print("Sample logbook entries seeded.")
        else:
            print("Logbook table is not empty. Skipping.")

        # 4. Seed Guestbook Sample
        if db.query(GuestbookDB).count() == 0:
            sample_guestbook = [
                GuestbookDB(
                    name="Pak Budi",
                    role="Warga Desa",
                    message="Selamat datang adik-adik KKN UPN, semoga kerasan di Dusun Wungurejo dan program kerjanya bisa berjalan lancar membantu kemajuan warga kami.",
                    date="2026-06-19 14:35",
                    is_approved=True
                ),
                GuestbookDB(
                    name="Bu Sri",
                    role="Perangkat Desa",
                    message="Terima kasih atas kunjungan koordinasi kemarin. Kantor desa siap mendukung penuh kegiatan bimbingan belajar anak-anak.",
                    date="2026-06-20 09:12",
                    is_approved=True
                )
            ]
            db.bulk_save_objects(sample_guestbook)
            print("Sample guestbook entries seeded.")
        else:
            print("Guestbook table is not empty. Skipping.")

        db.commit()
        print("Database successfully seeded.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
