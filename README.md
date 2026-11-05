# IAX 2026 — INDOPRIDE Auto Expo

Prototype frontend event otomotif roleplay. React 19, Vite, TypeScript, Tailwind CSS 4, React Router, Lucide React, dan Framer Motion.

## Menjalankan

```sh
npm install
npm run dev
```

Buka http://localhost:5173 untuk prototype publik. Route admin memerlukan backend dan sesi administrator.

## Admin Control Center

Admin terintegrasi menggunakan Express + MySQL, Argon2id, MFA TOTP, sesi server, CSRF, rate limit persisten, dan CLI provisioning developer. Tidak ada registrasi atau akun admin default.

Panduan environment, provisioning/MFA pertama, seluruh perintah developer, mekanisme keamanan, migration dan batas produksi: [docs/admin-security.md](docs/admin-security.md).

Setelah environment dan migrasi siap:

```sh
npm run admin:create
npm run dev:all
```

Buka **http://127.0.0.1:5173/admin/login**. Modul bisnis admin tetap **DEMO DATA**; autentikasi dan perubahan keamanan menggunakan backend nyata. Jangan menggunakan Vite preview untuk deployment admin produksi.

```sh
npm run build
npm run preview
npm test
```

Pengujian browser memerlukan Chromium: `npx playwright install chromium`.

## Halaman

- `/`: hero cinematic, empat highlight, alur pemesanan. Tidak ada katalog di beranda.
- `/vehicles`: delapan kendaraan ilustratif, pencarian, filter brand/kategori/harga, empty state.
- `/vehicles/:slug`: detail, thumbnail crop, swatch pilihan warna, tab, ringkasan pemesanan demo.
- `/schedule`, `/about`: informasi event dan tentang IAX.
- `/login`, `/register`: form demo dengan validasi browser; mengarah ke profil dummy.
- `/member/dashboard`: profil, status pesanan, dan contoh SPK.
- `/sales/dashboard`: statistik, tabel, pencarian, filter tanggal/status, detail pesanan.
- `/sales/spk/create`: draft SPK dengan preview langsung dan perhitungan sisa pembayaran.
- `/admin/login`: autentikasi password dan MFA administrator.
- `/admin`: overview dengan sesi admin valid.
- `/admin/orders`, `/admin/spk`, `/admin/members`, `/admin/reports`, `/admin/settings`: lima modul admin; bisnis simulasi, keamanan akun nyata.
- `/admin/dashboard`: alias terproteksi yang mengarah ke `/admin`.

Menu workspace menggunakan query `?view=` untuk mengubah tampilan. Sidebar menjadi drawer pada layar kecil.

## Batas prototype

Database MySQL `iax_2026` menyimpan identitas/sesi admin melalui backend Express. Login member/sales dan seluruh alur bisnis masih prototype dengan mock data; belum mengirim pesanan atau menerbitkan SPK produksi. Data form bisnis hilang saat refresh. Tombol tinjau menunjukkan preview tanpa mengklaim data tersimpan. Harga menggunakan mata uang roleplay `RP $`, bukan harga kendaraan nyata. Semua spesifikasi, identitas bisnis, stok, statistik, serta pesanan merupakan data ilustratif. Kredensial admin tidak disimpan pada localStorage/sessionStorage.

Foto kendaraan adalah foto contoh, bukan jaminan kesesuaian model. Thumbnail menunjukkan crop foto yang sama; swatch mencatat pilihan tanpa mengubah warna foto. Jadwal dan venue resmi belum diberikan sehingga tidak dikarang.

## Aset brand

Lampiran yang diterima hanya brief teks. **Logo INDOPRIDE asli dan gambar referensi UI belum tersedia.** Logo INDOPRIDE tidak direkonstruksi. Untuk memasang file asli:

1. Letakkan logo di `public/images/indopride-logo.png`.
2. Ubah `indoprideLogo` di `src/data/brand.ts` menjadi `'/images/indopride-logo.png'`.

Komponen Brand menyediakan slot logo dan separator tanpa mengubah proporsi file. Typography IAX 2026 sudah tersedia.

Hero `public/images/hero-expo.webp` adalah ilustrasi AI yang dibuat khusus untuk prototype. Foto katalog disimpan lokal dari Unsplash; sumber foto terdapat di `docs/assets.md`. Font DM Sans dan Barlow Condensed dimuat dari Google Fonts dengan fallback sistem.

## Struktur

- `src/components/ui.tsx`: navbar, footer, tombol, modal dengan focus trap, dashboard shell.
- `src/pages/`: beranda, katalog/detail, member, dashboard, formulir SPK.
- `src/data/`: mock data dan konfigurasi aset brand.
- `src/styles.css`: token, komponen, breakpoint, reduced motion.
- `tests/prototype.spec.ts`: pemeriksaan browser untuk route, filter, modal, SPK, admin, dan responsivitas.
- `screenshots/`: hasil tinjauan homepage desktop/mobile.

Deployment static perlu SPA fallback ke `index.html` untuk membuka nested route secara langsung.

## Database MySQL

Skema relasional dan seed tersedia di `database/migrations/`. Konfigurasi lokal menggunakan `.env.database.local` yang diabaikan Git.

```sh
npm run db:setup
npm run db:check
```

Panduan tabel, kredensial, import, dan batas integrasi: [database/README.md](database/README.md).
