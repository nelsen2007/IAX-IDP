# Database MySQL IAX 2026

Target MySQL **8.0.16+**, InnoDB, utf8mb4. Nama default `iax_2026`. Waktu tersimpan UTC; tampilan aplikasi dapat mengubahnya ke Asia/Jakarta. Semua harga menggunakan DECIMAL(18,2) dalam mata uang roleplay.

Backend admin kini menggunakan database ini untuk autentikasi, MFA, sesi, audit dan rate limit. Migrasi `003_admin_schema.sql` menambah tujuh tabel `admin_*` yang terpisah dari identitas member. Tidak ada seed admin baru. Panduan lengkap akun runtime, provisioning developer, environment, retensi, dan pengujian: [admin-security.md](../docs/admin-security.md). Data transaksi dan login member/sales tetap prototype.

## Membuat database lokal

MySQL80 terdeteksi aktif pada komputer ini. Akun MySQL memerlukan kredensial yang benar.

1. Salin `.env.database.example` menjadi `.env.database.local` di root proyek.
2. Isi user/password MySQL lokal. File ini diabaikan Git. Jangan masukkan kredensial ke variabel `VITE_*` karena akan terekspos di browser.
3. Jalankan:

```sh
npm run db:setup
npm run db:check
```

User setup perlu hak CREATE database/table, ALTER/index, REFERENCES, SELECT, INSERT, UPDATE, DELETE pada database target. Setelah ada backend, gunakan akun aplikasi terpisah dengan hak DML seperlunya; frontend tidak boleh mengakses MySQL secara langsung.

Runner membuat database jika belum ada, menjalankan skema dan seed, lalu mencatat checksum di `schema_migrations`. Menjalankan ulang akan melewati migrasi yang sudah tercatat, sehingga tidak menduplikasi data. Database berisi tabel yang belum dikelola runner akan ditolak. Tidak ada perintah DROP, TRUNCATE, atau reset otomatis.

`db:check` menambahkan fixture dalam transaksi lalu me-rollback. Counter auto-increment dapat maju walau fixture di-rollback. Jalankan pada database pengembangan.

## Tabel

| Tabel                  | Isi                                                                         |
| ---------------------- | --------------------------------------------------------------------------- |
| users                  | Nama, email unik, password hash nullable, role member/sales/admin, status   |
| member_profiles        | Citizen ID unik, telepon RP, relasi ke users                                |
| sales_profiles         | Kode sales unik, relasi ke users                                            |
| brands / categories    | Identitas brand dan kategori                                                |
| vehicles               | Model, brand, kategori, harga, stok, badge, status                          |
| vehicle_images         | URL, alt text, urutan galeri                                                |
| vehicle_colors         | Pilihan warna dan foto opsional                                             |
| vehicle_specifications | Mesin, tenaga, torsi, transmisi, drivetrain, kecepatan, akselerasi, kursi   |
| vehicle_features       | Fitur kendaraan                                                             |
| orders                 | Nomor pesanan, member, sales, kendaraan, snapshot harga/model/warna, status |
| order_status_history   | Riwayat status dan pelaku perubahan                                         |
| spk                    | Snapshot identitas/transaksi, diskon, DP, sisa pembayaran otomatis          |
| site_settings          | Konfigurasi event berupa JSON                                               |

`orders.member_id` mengacu ke member_profiles, `sales_id` mengacu ke sales_profiles. Pengaitan role user dengan profil perlu diperiksa backend dalam transaksi. Composite foreign key memastikan warna yang dipilih berasal dari kendaraan yang sama. Relasi transaksi menggunakan RESTRICT agar data pesanan tidak hilang ketika master data dihapus; gunakan status inactive untuk arsip kendaraan/user. Snapshot menjaga informasi pesanan/SPK saat katalog berubah.

Validasi: harga/DP/diskon tidak negatif, DP + diskon tidak melebihi harga SPK, SPK issued harus memiliki issued_at, email/Citizen ID/nomor pesanan/nomor SPK unik. Satu SPK per pesanan. `balance_due` generated otomatis. Backend kelak wajib memastikan jumlah stok, otorisasi, transisi status, kecocokan sales/order/SPK, serta status_history dalam transaksi. Skema saja tidak mengimplementasikan workflow tersebut.

## Data contoh

Delapan kendaraan, delapan brand, enam kategori, tujuh user (lima member, satu sales, satu admin), lima pesanan, dan dua SPK ilustratif. Spesifikasi yang belum diketahui dibiarkan NULL. Semua akun contoh memiliki `password_hash=NULL` dan **tidak dapat digunakan untuk login**. Jangan membuat password default; backend nantinya harus menggunakan hash password yang layak dan menolak akun tanpa hash.

Seed konsisten dengan `src/data/mock.ts` saat dibuat. Frontend belum tersambung ke database; penambahan database tidak membuat tombol form/transaksi menjadi aktif.

## Import manual alternatif

File SQL bisa dibuka melalui MySQL Workbench. Buat schema baru dengan charset utf8mb4/collation utf8mb4_0900_ai_ci, pilih schema itu, lalu jalankan `database/migrations/001_schema.sql` dan `002_seed.sql` berurutan. Import manual tidak mencatat schema_migrations; jangan mencampurnya dengan runner pada schema yang sama.

## Pemulihan migrasi gagal

MySQL DDL tidak sepenuhnya transaksional. Jika migrasi skema terputus, sebagian tabel mungkin sudah ada. Runner akan melaporkan error dan tidak menghapus data. Periksa error di MySQL; pilih database pengembangan baru melalui MYSQL_DATABASE, atau perbaiki migrasi parsial secara manual setelah memeriksa/backup data. Seed dijalankan dalam transaksi oleh runner. Jangan mengedit migrasi yang sudah diterapkan: tambahkan file SQL bernomor berikutnya.
