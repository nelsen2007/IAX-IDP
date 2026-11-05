import { useState, type FormEvent } from "react";
import {
  ShieldCheck,
  LockKeyhole,
  LogOut,
  Save,
  Palette,
  CalendarDays,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { adminApi, type AdminSession } from "./api";
import { DemoNotice, DetailList, Drawer, PageIntro } from "./components";
import { brandAssets } from "../data/brand";

export default function SettingsPage({
  session,
  onRevoked,
}: {
  session: AdminSession;
  onRevoked: () => void;
}) {
  const [security, setSecurity] = useState<"password" | "all" | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [oldPassword, setOld] = useState(""),
    [newPassword, setNew] = useState(""),
    [confirm, setConfirm] = useState(""),
    [code, setCode] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (security === "password" && newPassword !== confirm) {
      setError("Konfirmasi password baru berbeda.");
      return;
    }
    setBusy(true);
    try {
      await adminApi(
        security === "password" ? "change-password" : "logout-all",
        {
          csrf: session.csrf,
          body: {
            oldPassword,
            code,
            ...(security === "password" ? { newPassword } : {}),
          },
        },
      );
      setOld("");
      setNew("");
      setConfirm("");
      setCode("");
      onRevoked();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Perubahan gagal.");
    } finally {
      setBusy(false);
    }
  }
  function open(mode: "password" | "all") {
    setSecurity(mode);
    setOld("");
    setNew("");
    setConfirm("");
    setCode("");
    setError("");
  }
  return (
    <>
      <PageIntro
        eyebrow="KONFIGURASI / PENGATURAN"
        title="Pengaturan control center"
        description="Kelola preferensi event dan keamanan akun administrator."
      />
      <section className="admin-panel admin-security-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>
              <ShieldCheck size={19} />
              Security & Account
            </h2>
            <p>Perubahan keamanan menggunakan backend dan verifikasi ulang.</p>
          </div>
          <span className="admin-verified">
            <i />
            MFA aktif
          </span>
        </div>
        <div className="admin-settings-security">
          <DetailList
            items={[
              ["Nama Administrator", session.user.displayName],
              ["Username", session.user.username],
              ["Role", session.user.role],
              [
                "Status MFA",
                session.user.mfaEnabled ? "TOTP aktif" : "Tidak aktif",
              ],
              [
                "Terakhir Login",
                session.user.lastLoginAt
                  ? new Date(session.user.lastLoginAt).toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                    }) + " WIB"
                  : "Belum tersedia",
              ],
              ["Kebijakan sesi", "30 menit idle / maksimum 8 jam"],
            ]}
          />
          <div className="admin-security-actions">
            <div>
              <LockKeyhole size={20} />
              <h3>Jaga akses akun Anda</h3>
              <p>
                Perubahan password dan logout semua perangkat memerlukan
                password saat ini serta kode MFA baru.
              </p>
            </div>
            <button className="admin-button" onClick={() => open("password")}>
              <LockKeyhole size={16} />
              Ubah Password
            </button>
            <button className="admin-button danger" onClick={() => open("all")}>
              <LogOut size={16} />
              Logout Semua Perangkat
            </button>
          </div>
        </div>
      </section>
      <div className="admin-settings-divider">
        <h2>Preferensi event</h2>
        <span>SIMULASI BISNIS</span>
      </div>
      <DemoNotice />
      {message && (
        <p role="status" className="admin-message">
          {message}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(
            "Simulasi pengaturan ditinjau. Tidak ada perubahan event yang disimpan.",
          );
        }}
      >
        <div className="admin-settings-grid">
          <section className="admin-panel admin-settings-card">
            <h3>
              <CalendarDays size={18} />
              General
            </h3>
            <label>
              Nama Event
              <input defaultValue="IAX 2026 — INDOPRIDE AUTO EXPO" />
            </label>
            <label>
              Slogan
              <input defaultValue="Yang penting ada." />
            </label>
            <label>
              Deskripsi
              <textarea
                defaultValue="Pameran otomotif untuk komunitas INDOPRIDE Roleplay."
                rows={3}
              />
            </label>
            <label>
              Status Event
              <select defaultValue="Persiapan">
                <option>Persiapan</option>
                <option>Berlangsung</option>
                <option>Selesai</option>
              </select>
            </label>
          </section>
          <section className="admin-panel admin-settings-card">
            <h3>
              <Palette size={18} />
              Appearance
            </h3>
            <div className="admin-brand-preview">
              {brandAssets.indoprideLogo ? (
                <img src={brandAssets.indoprideLogo} alt="Logo INDOPRIDE" />
              ) : (
                <p>
                  Logo INDOPRIDE asli belum tersedia.
                  <small>Slot aset mengikuti konfigurasi brand existing.</small>
                </p>
              )}
            </div>
            <img
              className="admin-hero-preview"
              src="/images/hero-expo.webp"
              alt="Preview hero event existing"
            />
            <div className="admin-color-grid">
              <label>
                Primary Color
                <input type="color" defaultValue="#39e51b" />
              </label>
              <label>
                Secondary Color
                <input type="color" defaultValue="#78ff44" />
              </label>
            </div>
          </section>
          <section className="admin-panel admin-settings-card">
            <h3>
              <ShoppingBag size={18} />
              Order
            </h3>
            <label>
              Status penerimaan pesanan
              <select defaultValue="Preview">
                <option>Preview</option>
                <option>Dibuka — simulasi</option>
                <option>Ditutup — simulasi</option>
              </select>
            </label>
            <label>
              Pesan konfirmasi
              <textarea
                defaultValue="Permintaan Anda akan ditinjau oleh tim IAX."
                rows={2}
              />
            </label>
            <label>
              Kebijakan pemesanan
              <textarea
                defaultValue="Pemesanan mengikuti ketentuan penyelenggara. Preview ini tidak mengirim transaksi."
                rows={3}
              />
            </label>
          </section>
          <section className="admin-panel admin-settings-card">
            <h3>
              <FileText size={18} />
              SPK
            </h3>
            <label>
              Prefix nomor SPK
              <input defaultValue="SPK-IAX" />
            </label>
            <label>
              Nama penanggung jawab
              <input defaultValue="Tim IAX 2026" />
            </label>
            <div className="admin-template-preview">
              <FileText size={26} />
              <strong>SURAT PEMESANAN KENDARAAN</strong>
              <span>
                Template dokumen contoh dapat ditinjau melalui menu SPK.
              </span>
            </div>
            <p className="admin-muted">
              Nomor produksi nantinya dibuat unik oleh server.
            </p>
          </section>
        </div>
        <div className="admin-settings-save">
          <span>Preferensi di atas hanya untuk preview.</span>
          <button className="admin-button primary" type="submit">
            <Save size={16} />
            Tinjau pengaturan — simulasi
          </button>
        </div>
      </form>
      {security && (
        <Drawer
          title={
            security === "password" ? "Ubah Password" : "Logout Semua Perangkat"
          }
          onClose={() => {
            if (!busy) setSecurity(null);
          }}
        >
          <div className="admin-message">
            <ShieldCheck size={17} />
            Tindakan ini mencabut semua sesi dan meminta login kembali.
          </div>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          <form className="admin-reauth-form" onSubmit={submit}>
            <label>
              Password saat ini
              <input
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOld(e.target.value)}
                required
                disabled={busy}
              />
            </label>
            {security === "password" && (
              <>
                <label>
                  Password baru
                  <input
                    type="password"
                    autoComplete="new-password"
                    aria-label="Password baru"
                    aria-describedby="admin-password-hint"
                    minLength={15}
                    maxLength={1024}
                    value={newPassword}
                    onChange={(e) => setNew(e.target.value)}
                    required
                    disabled={busy}
                  />
                  <small id="admin-password-hint">
                    Gunakan passphrase unik, minimal 15 karakter.
                  </small>
                </label>
                <label>
                  Konfirmasi password baru
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={15}
                    maxLength={1024}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={busy}
                  />
                </label>
              </>
            )}
            <label>
              Kode MFA untuk verifikasi ulang
              <input
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={busy}
                pattern="([0-9]{6}|[a-f0-9]{32})"
                maxLength={32}
              />
              <small>
                Kode TOTP baru atau recovery code yang belum digunakan.
              </small>
            </label>
            <button
              className="admin-button primary"
              disabled={busy}
              type="submit"
            >
              {busy
                ? "Memverifikasi…"
                : security === "password"
                  ? "Simpan password dan cabut sesi"
                  : "Verifikasi dan cabut semua sesi"}
            </button>
          </form>
        </Drawer>
      )}
    </>
  );
}
