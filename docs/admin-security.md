# Admin Control Center — panduan developer dan hasil validasi

Implementasi lokal 6 November 2026 pada branch `feat/admin-control-center`. Tidak ada deployment, akun admin default, atau akun admin produksi yang dibuat. Sistem member/sales publik tetap prototype; akun tersebut tidak dapat dipakai untuk autentikasi admin.

## Menjalankan dan membuat admin pertama

Gunakan Node.js 22.13+ (validasi dilakukan dengan Node 24). MySQL 8.0.16+ existing tetap digunakan.

```sh
npm ci
npm run db:setup
```

Siapkan `.env.database.local` menggunakan contoh database existing. Salin `.env.admin.example` ke `.env.admin.local` dan isi `ADMIN_MFA_ENCRYPTION_KEY` dengan 32 byte acak kriptografis dalam format 64 karakter hex. Untuk lingkungan lokal ini, kunci development sudah dibuat secara acak di file gitignored; nilainya tidak dimuat frontend atau dicetak. Jangan mengganti kunci setelah enrollment tanpa prosedur rotasi.

```sh
npm run admin:create
```

Jalankan dari terminal interaktif tepercaya di root proyek. CLI meminta username unik, nama administrator, password minimum 15 karakter, dan konfirmasi melalui hidden prompt. Tambahkan URI `otpauth://` yang ditampilkan langsung ke authenticator TOTP, kemudian masukkan kode TOTP valid untuk mengonfirmasi enrollment. Akun hanya disimpan setelah konfirmasi berhasil. Sepuluh recovery codes acak ditampilkan satu kali untuk disimpan dalam password manager. Jangan merekam terminal provisioning.

```sh
npm run dev:all
```

Buka **http://127.0.0.1:5173/admin/login**. Gunakan origin persis ini: hostname `localhost` merupakan origin berbeda. Backend lokal berjalan di 127.0.0.1:3001; Vite mem-proxy `/api/admin`. Password benar berlanjut ke MFA; baru MFA valid menghasilkan sesi admin.

Perintah developer lainnya meminta username dan konfirmasi interaktif. Password baru dan konfirmasi tetap disembunyikan, tanpa argumen kredensial:

```sh
npm run admin:disable
npm run admin:enable
npm run admin:reset-password
npm run admin:revoke-sessions
npm run admin:reset-mfa
```

Semua tindakan mencabut sesi/challenge yang ada dan menulis audit log. Reset MFA memerlukan enrollment TOTP baru yang valid dan mengganti seluruh recovery codes. Aktifkan kembali akun tidak menghidupkan sesi lama. Tidak ada endpoint HTTP provisioning atau registrasi admin. Pengaturan keamanan UI hanya menyediakan ganti password dan logout semua perangkat dengan verifikasi password saat ini serta MFA baru; keduanya mencabut semua sesi.

## Environment dan deployment

| Variabel | Fungsi |
| --- | --- |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE` | Database existing; koneksi backend saja |
| `MYSQL_USER`, `MYSQL_PASSWORD` | Akun runtime dengan hak minimum, bukan akun migrasi produksi |
| `ADMIN_MFA_ENCRYPTION_KEY` | Kunci AES-256-GCM server saja, 64 hex acak; backup di secret manager |
| `ADMIN_ORIGIN` | Origin frontend persis; wajib HTTPS pada produksi, tanpa path/trailing slash |
| `ADMIN_HOST`, `ADMIN_PORT` | Bind backend; default loopback:3001 |
| `ADMIN_TRUST_PROXY` | Daftar IP/CIDR proxy tepercaya, dipisahkan koma; default tidak mempercayai proxy |
| `NODE_ENV` | Set `production` ketika menjalankan server produksi |

Tidak ada variabel secret berprefiks `VITE_`. File `.env.admin.local` dan `.env.database.local` diabaikan Git. Deployment belum dijalankan. Produksi harus memakai `npm run build` lalu `npm start` dengan environment production dan reverse proxy TLS pada origin yang sama. Jangan memakai Vite dev/preview sebagai server produksi. Reverse proxy meneruskan path tanpa mengubah Origin, mengatur header forwarded sendiri, dan harus memblokir akses langsung internet ke port backend. Jangan menggunakan wildcard/public subnet pada trusted proxy. Server menggunakan redirect HTTPS, HSTS setahun termasuk subdomain, dan CSP; aktifkan deployment ini hanya setelah domain serta seluruh subdomain siap HTTPS.

Runtime MySQL hanya memerlukan SELECT/INSERT/UPDATE/DELETE pada tujuh tabel `admin_*` yang ditambahkan. Migrasi menggunakan akun deployment terpisah dengan hak DDL. Pastikan database terikat jaringan privat/firewall; repository tidak dapat membuktikan atau mengubah kebijakan jaringan deployment. Semua koneksi runtime menginisialisasi timezone SQL `+00:00`, bukan hanya konversi waktu pada driver.

## Model keamanan

- Identitas admin terpisah dari `users` member. Role diperiksa dari baris akun server pada setiap pemeriksaan sesi, tidak dari browser atau query. Endpoint yang tidak didaftarkan ditolak, termasuk endpoint bisnis yang belum tersedia.
- Argon2id: memori 64 MiB, 3 iterasi, parallelism 1; salt dikelola library. Dukungan passphrase 15 karakter hingga 1024 byte; daftar password umum lokal terbatas. Integrasi pemeriksaan password bocor eksternal belum tersedia. Konfigurasi melampaui minimum [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); benchmark kapasitas server tetap diperlukan.
- TOTP melalui otplib, jendela ±30 detik dan counter terakhir untuk menolak replay. Secret dienkripsi AES-GCM. Recovery codes 128 bit, hanya hash SHA-256 disimpan dan dipakai sekali. Perilaku time-step/replay mengikuti [dokumentasi otplib](https://otplib.yeojz.dev/guide/advanced-usage).
- Challenge CSRF dan MFA memiliki token acak 256 bit yang disimpan sebagai hash, masa berlaku 5 menit, dan konsumsi sekali pakai. Maksimum 5 kesalahan MFA per challenge. Konsumsi faktor/challenge dan penerbitan sesi dalam transaksi yang mengunci baris akun; disable/reset/revoke menaikkan versi kredensial dan mengonsumsi semua challenge.
- Token sesi 256 bit hanya dalam cookie HttpOnly; hash disimpan MySQL. Produksi menggunakan `__Host-iax_admin_session`, Secure, SameSite=Strict, Path=/, tanpa Domain; preauth juga `__Host-`. Development HTTP memakai nama `iax_admin_*_dev` tanpa Secure hanya untuk localhost. Tidak ada JWT atau browser storage untuk kredensial.
- Idle timeout 30 menit dan maksimum absolut 8 jam diperiksa server. Aktivitas API memperbarui idle, tidak memperpanjang batas absolut. Logout mencabut sesi server. Disable, ganti/reset password, reset MFA dan revoke-all mencabut sesi serta challenge lama.
- CSRF terikat challenge/sesi, header `X-CSRF-Token`, dan validasi Origin pada seluruh mutasi. SameSite merupakan lapisan tambahan. `GET /auth/csrf` bootstrap publik hanya memberikan CSRF, bukan identitas/hak admin.
- Rate limit persisten dengan locking MySQL lintas worker: login IP 60/15 menit, pasangan akun+sumber 12/15 menit dengan backoff, serta backoff bersama per akun maksimal 30 detik tanpa hard lockout akun. Bootstrap 120/15 menit/IP, MFA 60/15 menit/IP, dan reauthentication 10/15 menit/akun+sumber. Request yang ditolak tidak memperpanjang cooldown. Infrastruktur tetap harus membatasi volumetric traffic, sumber IPv6 terdistribusi, dan koneksi database.
- Query berparameter, schema Zod strict, body maksimum 8 KiB, role client ditolak, error internal generik. Audit tidak memuat password, hash password, session token, secret TOTP, atau recovery code.
- No-store dan noindex/nofollow pada admin; navbar/footer publik tidak menautkan admin. Express hanya menyajikan `dist`; `.env`, sumber backend, SQL, JSON konfigurasi dan source map tidak masuk SPA fallback. Dokumen halaman admin selain login memerlukan sesi ketika dilayani Express produksi. Lazy loading SPA bukan perlindungan kerahasiaan kode; semua operasi sensitif tetap berada di backend.
- CSP membatasi script pada self, object/frame ditolak. Font Google diizinkan. `style-src-attr 'unsafe-inline'` diperlukan oleh inline style Framer Motion publik existing dan warna grafik React; bukan izin inline script. React escaping dipakai, tanpa `dangerouslySetInnerHTML`.

## API dan data

Namespace `/api/admin/auth` menyediakan GET `csrf`, POST `login`, POST `mfa/verify`, GET `me`, POST `logout`, POST `logout-all`, dan POST `change-password`. Tidak ada endpoint lain yang memberikan hak admin. `me` mengembalikan profil minimum, CSRF, batas absolut sesi dan idle policy; tidak mengembalikan token sesi/hash/secret. Login merotasi challenge; MFA merotasi token menjadi sesi baru. Password/reset/logout-all memerlukan verifikasi ulang. `change-password` menerima `oldPassword`, `newPassword`, `code`; logout-all menerima `oldPassword`, `code`.

Migrasi `003_admin_schema.sql` menambah:

| Tabel | Tanggung jawab |
| --- | --- |
| `admin_users` | Kredensial Argon2id, role ADMIN, status, encrypted TOTP, counter dan versi kredensial, operator provisioning |
| `admin_sessions` | Hash token, CSRF, versi akun, activity/absolute expiry, revocation, IP/UA |
| `admin_auth_challenges` | Bootstrap/MFA sekali pakai, expiry, batas percobaan, hash token |
| `admin_login_attempts` | Hash identifier username, sumber, hasil, kode alasan |
| `admin_audit_logs` | Pelaku, aksi, target, metadata aman, sumber, waktu |
| `admin_mfa_recovery_codes` | Hash recovery code, waktu penggunaan |
| `admin_rate_limits` | Bucket hash dan counter/window/cooldown persisten |

Seluruh tabel memakai InnoDB; relasi akun memakai foreign key RESTRICT; identifier username/token/recovery unik, dengan index expiry, akun, dan sumber yang relevan. Migrasi existing tidak diubah. Tidak ada seed otomatis admin. Seed `users` lama memiliki hash NULL dan tidak pernah digunakan oleh autentikasi admin.

Semua data operasional pada UI menggunakan DEMO DATA statis existing. Pengaturan bisnis hanya preview; tidak menulis database. Nilai pemesanan bukan revenue aktual. Print SPK menampilkan tanda CONTOH/TIDAK BERLAKU; nomor produksi belum dibuat dan harus dihasilkan backend bisnis nantinya.

## Retensi, recovery dan operasi

Jadwalkan `npm run admin:cleanup` harian dari scheduler deployment tepercaya. Challenge dan rate bucket dibersihkan setelah 1 hari, sesi kedaluwarsa setelah 30 hari, percobaan login 90 hari, audit 365 hari. Sesuaikan kebijakan sebelum pemakaian produksi; backup audit jika kewajiban retensi lebih lama. Belum ada scheduler/alerting produksi yang dibuat.

Backup kunci enkripsi bersama prosedur pemulihan database di secret manager, dengan akses operator terbatas. Tidak ada key rotation otomatis: jika kunci hilang/harus diganti, hentikan akses, cabut sesi, deploy kunci baru, lalu lakukan `admin:reset-mfa` untuk setiap akun melalui developer. Jangan menimpa kunci dan membiarkan akun mengandalkan secret lama. Recovery codes yang habis harus diganti lewat enrollment ulang developer, bukan bypass MFA.

## Pengujian aktual dan batas

Lihat `docs/admin-implementation-progress.md` untuk hasil final. Perintah validasi:

```sh
npm run typecheck
npm run build
npm run lint
npm run test:security
npm test
npm audit
```

Tes backend dan browser membuat database MySQL acak berprefiks `iax_admin_test_` / `iax_admin_browser_test_`, menggunakan schema admin asli dan service yang sama. Akun sementara hanya berada pada database uji. Teardown menghapus database uji serta fixture lokal. Jika proses dipaksa berhenti, periksa database dengan prefix tersebut dan hapus hanya setelah memastikan tidak dipakai sesi test lain. Tes memerlukan user pengujian dengan CREATE/DROP database; **jangan jalankan suite menggunakan database/account produksi**.

Validasi dilakukan pada development HTTP, ditambah integration tests konfigurasi/cookie/header produksi melalui HTTP test harness dengan proxy tepercaya. Ini bukan uji deployment TLS publik, penetration test independen, atau bukti keamanan seluruh infrastruktur.

Pekerjaan lanjutan: logo INDOPRIDE asli belum tersedia (slot existing dipertahankan), integrasi bisnis nyata, distributed/volumetric abuse mitigation pada edge, monitoring/alerting, penjadwalan retensi, pemeriksaan password bocor penuh, secret rotation otomatis, dan pembuktian konfigurasi TLS/database least privilege/network privat sebelum produksi. Tidak ada klaim siap produksi tanpa pemeriksaan operasional tersebut.

## Peta perubahan

- `server/config.mjs`, `db.mjs`, `app.mjs`, `index.mjs`: konfigurasi, pool UTC, API/middleware, server.
- `server/admin/crypto.mjs`, `service.mjs`: kriptografi dan lifecycle identitas/sesi/MFA/audit/throttle.
- `scripts/admin.mjs`, `admin-cleanup.mjs`: provisioning/lifecycle developer dan retensi.
- `database/migrations/003_admin_schema.sql`: tujuh tabel baru.
- `src/admin/`: API client, login, layout, komponen, data demo, seluruh halaman, CSS terisolasi.
- `src/App.tsx`, `src/components/ui.tsx`: routing lazy admin, pemisahan shell, penghapusan link publik.
- `vite.config.ts`, `package.json`, lockfile, `eslint.config.js`, `.env.admin.example`, `.gitignore`: proxy/headers, dependencies/commands, lint, contoh environment aman.
- `scripts/db/check.mjs`: pemeriksaan jumlah tabel disesuaikan dari 15 menjadi 22 setelah migrasi, dengan pemeriksaan integritas publik existing tetap aktif.
- `tests/server/`, `tests/admin.spec.ts`, `tests/support/`, `playwright.config.ts`, `tests/prototype.spec.ts`: integrasi/security/browser dan regresi publik.
- `screenshots/admin-*.png`, dokumen rancangan/rencana/ledger: bukti visual dan keputusan implementasi.
