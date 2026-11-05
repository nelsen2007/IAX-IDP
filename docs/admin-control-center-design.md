# IAX 2026 Admin Control Center — rancangan implementasi

Tanggal: 6 November 2026. Status: rancangan untuk ditinjau, belum diimplementasikan.

## Tujuan dan kondisi proyek

Menambahkan pusat administrasi terintegrasi dengan autentikasi backend, MFA wajib, dan UI hitam/hijau sesuai brief. Website publik tetap berfungsi. PESANAN, SPK, MEMBER, LAPORAN, dan pengaturan bisnis menggunakan data demonstrasi berlabel DEMO DATA; tidak ada transaksi produksi atau deployment otomatis.

Proyek memakai React 19, Vite, TypeScript, React Router, Lucide, dan MySQL 8. Belum terdapat server API. Login member adalah prototype, bukan identitas yang dapat dipercaya. Route `/admin/dashboard` lama terbuka dan footer menautkannya. Konfigurasi aset menyatakan logo asli belum tersedia. Migrasi existing tidak akan ditulis ulang.

## Pendekatan

Pilihan implementer adalah Express dalam repository yang sama, menyajikan frontend hasil build dan API pada origin yang sama. React/Vite dan MySQL dipertahankan. Alternatif aplikasi admin mandiri menambah deployment dan konfigurasi origin tanpa kebutuhan saat ini. Solusi frontend saja tidak memenuhi autentikasi dan otorisasi backend dalam brief.

Saat development, Vite meneruskan `/api/admin` ke Express; data tetap memerlukan pemeriksaan sesi backend. Pada produksi, Express memeriksa sesi sebelum menyajikan dokumen halaman admin selain login. Route guard React mendukung navigasi, bukan menjadi batas keamanan. Bundle admin di-load secara lazy dan tidak dianggap rahasia.

## Penyimpanan dan autentikasi

Tambahkan migrasi tabel `admin_users`, `admin_sessions`, `admin_login_attempts`, `admin_audit_logs`, dan `admin_mfa_recovery_codes`, serta penyimpanan challenge MFA dan bucket rate limit persisten. Identitas admin sepenuhnya terpisah dari tabel `users` publik. Seed admin contoh existing tidak diberi hak autentikasi baru.

Password minimum 15 karakter, mendukung passphrase panjang dengan batas ukuran wajar, dan di-hash Argon2id. Respons login tidak membedakan pengguna tidak dikenal, password salah, dan akun nonaktif. Verifikasi hash dummy menyamakan jalur akun tidak dikenal. Pembatasan per sumber dan identifier akun menggunakan database dan backoff terbatas; bukan lockout akun permanen.

Password valid hanya menghasilkan challenge MFA berumur pendek, bukan sesi ADMIN. TOTP terenkripsi AES-GCM menggunakan kunci environment khusus; library terpelihara memverifikasi jendela waktu terbatas. Counter terakhir diperbarui atomik untuk menolak replay. Recovery code acak disimpan sebagai hash dan dikonsumsi sekali dalam transaksi. Challenge juga sekali pakai dan dibatasi percobaannya.

Keputusan implementer setelah review: disable, reset/change-password, reset-MFA, dan revoke-all membatalkan challenge pra-login sekaligus sesi aktif. Challenge terikat pada versi kredensial akun. Verifikasi MFA memeriksa ulang status/version akun, mengonsumsi challenge, memperbarui counter TOTP atau recovery code, dan menerbitkan sesi dalam transaksi dengan locking konsisten. Test mencakup request MFA paralel serta race dengan disable/reset-password.

CLI developer menangani create, enable, disable, reset-password, revoke-sessions, dan reset-mfa. Password melalui hidden prompt dan konfirmasi, tidak melalui argumen. Enrollment menampilkan URI provisioning dan recovery codes hanya dalam terminal tepercaya, meminta TOTP valid sebelum aktivasi. Akun tanpa enrollment lengkap tidak dapat login. Tidak ada HTTP provisioning, registrasi, akun default, master password, atau menu tambah admin.

## Sesi, otorisasi, dan perubahan sensitif

Token sesi acak 256 bit hanya berada pada cookie HttpOnly; database menyimpan hash. Cookie produksi `__Host-iax_admin_session`: Secure, SameSite=Strict, Path=/, tanpa Domain. Cookie development HTTP memakai nama berbeda dan hanya diizinkan pada mode development; produksi menolak konfigurasi origin non-HTTPS.

Idle timeout 30 menit, batas absolut 8 jam. Semua akses memeriksa hash sesi, revocation, waktu, role ADMIN, dan status akun dari server. Login mengganti token; logout, disable, dan reset password mencabut sesi persisten. Tidak ada token pada browser storage atau query string.

Endpoint sesuai brief: login, mfa/verify, me, logout, logout-all, change-password. Tambahan bootstrap CSRF sebelum login didokumentasikan dan tidak memberikan data admin. CSRF terikat pada challenge/sesi dan validasi Origin melindungi mutasi, termasuk login. Logout-all dan change-password memerlukan password serta TOTP/recovery yang diverifikasi ulang. Perubahan password mencabut semua sesi dan meminta login kembali.

Seluruh namespace `/api/admin` deny by default; pengecualian hanya bootstrap dan tahap autentikasi yang eksplisit. Endpoint bisnis demo pun diperiksa otorisasinya jika disajikan server. Tidak ada akses melalui role client atau sesi member.

## Hardening dan operasional

Helmet, CSP tanpa inline script yang tidak perlu, frame-ancestors none, nosniff, referrer policy ketat, no-store, noindex/nofollow untuk admin. Server tidak menyajikan root repository, `.env`, konfigurasi, atau source map sensitif. Body dibatasi; input divalidasi dengan schema; SQL menggunakan parameter. Origin sama secara default; trust proxy ditentukan eksplisit, tidak mempercayai header IP client sembarang. Konfigurasi produksi memerlukan HTTPS dan deployment proxy terdokumentasi.

Audit mencatat provisioning, login, kegagalan MFA, logout, pencabutan, perubahan password, dan perubahan status tanpa password, token, secret, atau recovery code. Kebijakan retensi serta perintah cleanup terjadwal didokumentasikan. Akun database runtime memakai hak DML minimum; akun migrasi terpisah. Kunci enkripsi tidak menggunakan prefiks VITE dan harus dibackup secara aman. Rotasi kunci harus menyertakan re-encryption atau enrollment ulang yang dikendalikan developer.

## UI dan integrasi publik

Route `/admin`, `/admin/login`, `/admin/orders`, `/admin/spk`, `/admin/members`, `/admin/reports`, `/admin/settings`. Route lama `/admin/dashboard` diarahkan ke `/admin` melalui proteksi yang sama. Hilangkan link admin dari footer dan setiap navigasi publik. Tidak menambahkan admin ke sitemap.

Login berisi username, password/show-hide, loading/error, pesan sesi habis, dan langkah MFA. Layout admin memiliki sidebar lima menu sesuai brief, header compact, profil, status sesi, dan logout backend. Token warna mengikuti brief, radius 12px, Lucide dan typography Inter dengan fallback lokal. Slot logo menggunakan konfigurasi aset existing; tidak merekonstruksi logo asli yang belum diberikan.

Dashboard menampilkan empat statistik, recent orders, dan activity. Orders menyediakan pencarian/filter tanggal/status, reset, tabel dan drawer; aksi secara eksplisit simulasi. SPK menyediakan daftar dan dokumen putih dengan watermark contoh serta print stylesheet. Members menyediakan tabel dan drawer riwayat. Reports menyediakan filter periode, grafik tren/status/kendaraan dan preview ekspor; nilai pemesanan tidak disebut revenue. Settings memisahkan simulasi bisnis dari perubahan keamanan backend yang nyata.

Sidebar drawer pada mobile/tablet, tabel dapat digulir horizontal, drawer detail menjadi fullscreen pada layar kecil. Navigasi keyboard, focus management dialog, label input, live error, dan reduced motion diterapkan.

## Verifikasi dan batas penerimaan

Test backend memakai database pengembangan terisolasi, bukan transaksi produksi. Cakupan: password benar/salah, pengguna tidak dikenal/nonaktif, challenge tanpa sesi admin, MFA invalid/replay/recovery, timeout idle/absolut, logout replay, revocation password/disable, fixation, rate limit, CSRF/Origin, cookie, headers, input injeksi, minimisasi respons/log, dan deny-by-default seluruh endpoint. Browser test menguji redirect tamu, login MFA, lima menu, simulasi, aksesibilitas utama, viewport desktop/mobile dan regresi publik.

Jalankan typecheck, build, lint yang dikonfigurasi, unit/integration/security/browser tests dan dependency audit. Temuan high/critical harus diperbaiki atau dinilai eksplisit. Tidak mengklaim siap produksi tanpa bukti dan konfigurasi infrastruktur yang sesuai. Semua pemeriksaan yang tidak dapat dijalankan dicatat sebagai keterbatasan.

Dokumentasi akhir mencakup daftar file/migrasi, konfigurasi environment tanpa nilai secret, provisioning admin pertama, enrollment MFA, akses login, lifecycle sesi, retensi, hasil tes aktual dan pekerjaan lanjutan. Logo asli, pembuktian jaringan database privat, TLS/domain/proxy produksi, backup secret, dan monitoring produksi merupakan dependensi operasional yang tidak dapat dibuktikan hanya dari repository.
