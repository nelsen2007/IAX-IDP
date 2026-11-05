import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  LockKeyhole,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import { AdminBrand } from "./components";
import { adminApi } from "./api";

export default function AdminLoginPage() {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState("");
  const [show, setShow] = useState(false),
    [mfa, setMfa] = useState(false),
    [csrf, setCsrf] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate(),
    location = useLocation();
  useEffect(() => {
    let active = true;
    adminApi("me")
      .then(() => {
        if (active) navigate("/admin", { replace: true });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [navigate]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!mfa) {
        const boot = await adminApi<{ csrf: string }>("csrf");
        const next = await adminApi<{ csrf: string }>("login", {
          csrf: boot.csrf,
          body: { username, password },
        });
        setCsrf(next.csrf);
        setMfa(true);
        setPassword("");
      } else {
        await adminApi("mfa/verify", { csrf, body: { code: code.trim() } });
        setCode("");
        navigate("/admin", { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login gagal.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-root admin-login">
      <header className="admin-login-header">
        <AdminBrand />
        <span>
          <span className="admin-live-dot" /> SECURE ACCESS
        </span>
      </header>
      <main className="admin-login-main">
        <div className="admin-login-card">
          <div className="admin-login-mark">
            <ShieldCheck size={29} />
          </div>
          <div className="admin-eyebrow">INDOPRIDE SECURE ACCESS</div>
          <h1>
            Secure access<span>.</span>
          </h1>
          <p className="admin-login-subtitle">Authorized Personnel Only.</p>
          <div className="admin-login-divider">
            <span>
              {mfa
                ? "02 / MULTI-FACTOR VERIFICATION"
                : "01 / ADMINISTRATOR CREDENTIALS"}
            </span>
            <LockKeyhole size={14} />
          </div>
          {location.state?.reason && (
            <p className="admin-message">{location.state.reason}</p>
          )}
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={submit}>
            {mfa ? (
              <>
                <p className="admin-mfa-help">
                  Masukkan kode dari authenticator Anda atau satu recovery code
                  yang belum digunakan.
                </p>
                <label>
                  Kode TOTP atau recovery code
                  <input
                    autoFocus
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={32}
                    required
                    disabled={busy}
                    pattern="([0-9]{6}|[a-f0-9]{32})"
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Username
                  <input
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    maxLength={64}
                    disabled={busy}
                    placeholder="Username administrator"
                  />
                </label>
                <label>
                  Password
                  <div className="admin-password">
                    <input
                      name="password"
                      type={show ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      maxLength={1024}
                      disabled={busy}
                      placeholder="Masukkan password"
                    />
                    <button
                      type="button"
                      aria-label={
                        show ? "Sembunyikan password" : "Tampilkan password"
                      }
                      aria-pressed={show}
                      onClick={() => setShow(!show)}
                      disabled={busy}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </>
            )}
            <button
              className="admin-button primary admin-login-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? <LoaderCircle className="admin-spin" size={18} /> : null}
              {mfa ? "VERIFIKASI AKSES" : "LOGIN TO CONTROL CENTER"}
              {!busy && <ArrowRight size={17} />}
            </button>
            {mfa && (
              <button
                type="button"
                className="admin-text-button"
                disabled={busy}
                onClick={() => {
                  setMfa(false);
                  setCode("");
                  setError("");
                }}
              >
                Kembali ke login
              </button>
            )}
          </form>
          <div className="admin-login-restriction">
            <LockKeyhole size={13} />
            <span>Restricted access. Authorized administrators only.</span>
          </div>
        </div>
        <p className="admin-login-footnote">
          IAX 2026 <span>/</span> ADMIN CONTROL CENTER
        </p>
      </main>
      <footer className="admin-login-footer">
        <span>© 2026 INDOPRIDE Auto Expo</span>
        <span>AKSES ADMINISTRATOR TERBATAS</span>
      </footer>
    </div>
  );
}
