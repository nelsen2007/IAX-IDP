import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { Brand, Button, PageHeader } from "../components/ui";
import { currentMember, findMember, saveRegisteredMember } from "../data/members";
export function AuthPage({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
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
              const data = new FormData(e.currentTarget);
              const phone = String(data.get("phone"));
              const password = String(data.get("password"));
              if (register) {
                const member = { id: `MBR-${Date.now().toString().slice(-6)}`, name: String(data.get("name")), citizen: `IDP-${Math.floor(100000 + Math.random() * 900000)}`, phone, steamhex: String(data.get("steamhex")), password, joined: new Date().toISOString(), orders: 0, active: true };
                saveRegisteredMember(member);
                navigate("/member/dashboard");
              } else if (findMember(phone, password)) navigate("/member/dashboard");
              else window.alert("Nomor hape atau password tidak sesuai.");
            }}
          >
            {register && (
              <>
                <label>
                  Nama
                  <input name="name" required placeholder="Nama lengkap" autoComplete="name" />
                </label>
              </>
            )}
            <label>
              Nomor Hape
              <input
                name="phone"
                type="tel"
                required
                placeholder="Nomor hape"
                autoComplete={register ? "tel" : "username"}
              />
            </label>
            {register && (
              <label>
                SteamHEX
                <input
                  name="steamhex"
                  required
                  placeholder="steam:110000112345678"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </label>
            )}
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
        </div>
      </div>
    </main>
  );
}
export function MemberDashboard() {
  const member = currentMember();
  return (
    <main className="page-wrap">
      <div className="section-line">
        <PageHeader
          eyebrow="MEMBER AREA"
          title="Area member"
          description={member ? `Selamat datang, ${member.name}.` : "Belum ada data member yang terdaftar."}
        />
        <span className="member-tag">
          <ShieldCheck size={16} /> IAX MEMBER
        </span>
      </div>
      <div className="panel empty-state">
        <h2>{member ? member.name : "Belum ada member"}</h2>
        <p>{member ? "Profil member aktif. Pesanan dan SPK akan tampil di sini setelah tersedia." : "Profil, pesanan, dan SPK akan tampil di sini setelah data member tersedia."}</p>
        {!member && <Button to="/register">Daftarkan member</Button>}
      </div>
    </main>
  );
}
