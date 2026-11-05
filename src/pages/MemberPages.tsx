import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowLeft,
  User,
  ShieldCheck,
  ShoppingBag,
  FileText,
  Clock,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Brand, Button, PageHeader, Modal } from "../components/ui";
import { money, vehicles } from "../data/mock";
export function AuthPage({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  return (
    <main className="auth-page">
      <div className="auth-art">
        <div>
          <span className="eyebrow">INDOPRIDE AUTO EXPO</span>
          <h2>
            Perjalanan hebat.
            <br />
            Dimulai di sini.
          </h2>
          <p>Temukan kendaraan yang menjadi bagian dari ceritamu.</p>
        </div>
        <span>IAX 2026 — YANG PENTING ADA</span>
      </div>
      <div className="auth-area">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} /> Kembali ke beranda
        </Link>
        <div className="auth-card">
          <Brand />
          <h1>
            {register ? "Jadi bagian dari IAX." : "Selamat datang kembali."}
          </h1>
          <p>
            {register
              ? "Daftar dan mulai jelajahi kendaraan impianmu."
              : "Masuk untuk melanjutkan perjalananmu."}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (register && f.get("password") !== f.get("confirm")) {
                setError("Konfirmasi password belum cocok.");
                return;
              }
              navigate("/member/dashboard");
            }}
          >
            {register && (
              <>
                <label>
                  Nama Karakter
                  <input
                    name="name"
                    required
                    placeholder="Nama lengkap karakter"
                    autoComplete="name"
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Citizen ID
                    <input required placeholder="IDP-000000" />
                  </label>
                  <label>
                    Nomor Telepon RP
                    <input required placeholder="Nomor telepon karakter" />
                  </label>
                </div>
              </>
            )}
            <label>
              {register ? "Email" : "Email / Citizen ID"}
              <input
                type={register ? "email" : "text"}
                required
                placeholder={
                  register ? "nama@example.com" : "Email atau Citizen ID"
                }
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  autoComplete={register ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={
                    show ? "Sembunyikan password" : "Tampilkan password"
                  }
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {register && (
              <label>
                Konfirmasi Password
                <input
                  name="confirm"
                  required
                  type={show ? "text" : "password"}
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                />
              </label>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit">
              {register ? "Daftar Member" : "Masuk"}
              <ArrowUpRight size={18} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? "Sudah punya akun?" : "Belum jadi member?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Masuk di sini" : "Daftar Member"}
            </Link>
          </p>
          <div className="demo-callout">
            <ShieldCheck size={18} />
            <span>
              Mode prototype. Form hanya membuka dashboard demo; data tidak
              disimpan.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
export function MemberDashboard() {
  const [modal, setModal] = useState(false);
  return (
    <main className="page-wrap">
      <div className="section-line">
        <PageHeader
          eyebrow="MEMBER AREA"
          title="Halo, Raka Pratama."
          description="Selamat datang di garasimu. Pantau perjalanan menuju kendaraan impian."
        />
        <span className="member-tag">
          <ShieldCheck size={16} /> IAX MEMBER
        </span>
      </div>
      <div className="member-grid">
        <aside className="panel profile-card">
          <span className="profile-avatar">RP</span>
          <h2>Raka Pratama</h2>
          <p>IDP-004182</p>
          <span className="badge">Member Aktif</span>
          <hr />
          <div>
            <span>
              <User size={16} />
              Citizen ID
            </span>
            <b>IDP-004182</b>
          </div>
          <div>
            <span>Email</span>
            <b>raka@example.com</b>
          </div>
          <div>
            <span>Bergabung</span>
            <b>November 2026</b>
          </div>
          <p className="demo-note">Profil dan pesanan ilustratif.</p>
        </aside>
        <div>
          <div className="stats-grid member-stats">
            {[
              [ShoppingBag, "Total Pesanan", "2"],
              [Clock, "Dalam Proses", "1"],
              [FileText, "SPK Tersedia", "1"],
            ].map(([Icon, label, value]) => {
              const I = Icon as typeof ShoppingBag;
              return (
                <div className="stat" key={String(label)}>
                  <I size={19} />
                  <span>{String(label)}</span>
                  <strong>{String(value)}</strong>
                </div>
              );
            })}
          </div>
          <div className="panel member-order">
            <div className="section-line">
              <h2>Pesanan Terbaru</h2>
              <span className="status">Diproses</span>
            </div>
            <div className="member-car">
              <img src={vehicles[0].image} alt="Porsche 911 GT3 RS" />
              <div>
                <span className="eyebrow">PORSCHE</span>
                <h3>911 GT3 RS</h3>
                <p>Silver Metallic · IAX-260041</p>
                <strong>{money(4250000)}</strong>
              </div>
            </div>
            <div className="order-progress">
              {[
                "Pesanan Diajukan",
                "Diproses Sales",
                "SPK Dibuat",
                "Selesai",
              ].map((x, i) => (
                <div key={x} className={i < 2 ? "done" : ""}>
                  <CheckCircle2 size={19} />
                  <span>{x}</span>
                </div>
              ))}
            </div>
            <div className="section-line">
              <small className="muted">Sales pendamping: Ardi Putra</small>
              <Button secondary onClick={() => setModal(true)}>
                Lihat Detail <ArrowUpRight size={16} />
              </Button>
            </div>
          </div>
          <div className="panel spk-card">
            <FileText size={27} />
            <div>
              <h3>SPK Kendaraan</h3>
              <p>SPK-2026-0039 · BMW M4 Competition</p>
            </div>
            <Button secondary onClick={() => setModal(true)}>
              Lihat SPK
            </Button>
          </div>
        </div>
      </div>
      {modal && (
        <Modal title="Dokumen & Pesanan Demo" onClose={() => setModal(false)}>
          <p>Data ini merupakan contoh tampilan area member.</p>
          <div className="summary-box">
            <b>SPK-2026-0039</b>
            <span>Raka Pratama · IDP-004182</span>
            <span>BMW M4 Competition · Obsidian Black</span>
            <strong>{money(2150000)}</strong>
            <span>Status: SPK Dibuat</span>
          </div>
          <p className="demo-note">
            Dokumen ini bukan SPK resmi dan tidak dapat digunakan untuk
            transaksi.
          </p>
        </Modal>
      )}
    </main>
  );
}
