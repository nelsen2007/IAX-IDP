import { useCallback, useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ShoppingBag,
  FileText,
  Users,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronRight,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import AdminLoginPage from "./LoginPage";
import { AdminBrand, Drawer } from "./components";
import { adminApi, ApiError, type AdminSession } from "./api";
import {
  AdminDashboard,
  OrdersPage,
  MembersPage,
  SPKPage,
} from "./OperationsPages";
import ReportsPage from "./ReportsPage";
import SettingsPage from "./SettingsPage";
import "./admin.css";

const menus = [
  { to: "/admin/orders", label: "PESANAN", icon: ShoppingBag },
  { to: "/admin/spk", label: "SPK", icon: FileText },
  { to: "/admin/members", label: "MEMBER", icon: Users },
  { to: "/admin/reports", label: "LAPORAN", icon: ChartNoAxesCombined },
  { to: "/admin/settings", label: "PENGATURAN", icon: Settings },
];
export default function AdminApp() {
  const location = useLocation(),
    navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(null),
    [checked, setChecked] = useState(""),
    [error, setError] = useState("");
  const [mobile, setMobile] = useState(false),
    [notification, setNotification] = useState(false),
    [loggingOut, setLoggingOut] = useState(false);
  const isLogin = location.pathname === "/admin/login";
  const refresh = useCallback(async () => {
    try {
      const s = await adminApi<AdminSession>("me");
      setSession(s);
      setChecked(location.pathname);
      setError("");
    } catch (e) {
      setSession(null);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403))
        navigate("/admin/login", {
          replace: true,
          state: {
            reason: "Sesi tidak tersedia atau telah berakhir. Silakan login.",
          },
        });
      else setError(e instanceof Error ? e.message : "Sesi gagal diperiksa.");
    }
  }, [location.pathname, navigate]);
  useEffect(() => {
    setMobile(false);
    setNotification(false);
    if (!isLogin) void refresh();
  }, [isLogin, refresh]);
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  useEffect(() => {
    if (!session || isLogin) return;
    const delay = Math.max(
      0,
      Math.min(
        30 * 60 * 1000,
        new Date(session.expiresAt).getTime() - Date.now(),
      ),
    );
    const timer = window.setTimeout(() => {
      setSession(null);
      navigate("/admin/login", {
        replace: true,
        state: { reason: "Sesi berakhir. Silakan login kembali." },
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session, isLogin, navigate]);
  async function logout() {
    if (!session) return;
    setLoggingOut(true);
    setError("");
    try {
      await adminApi("logout", { csrf: session.csrf, body: {} });
      setSession(null);
      navigate("/admin/login", { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setSession(null);
        navigate("/admin/login", { replace: true });
      } else setError(e instanceof Error ? e.message : "Logout gagal.");
    } finally {
      setLoggingOut(false);
    }
  }
  if (isLogin) return <AdminLoginPage />;
  if (!session || checked !== location.pathname)
    return (
      <div className="admin-root admin-gate">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="admin-button" onClick={() => void refresh()}>
              Coba kembali
            </button>
          </>
        ) : (
          <>
            <LoaderCircle className="admin-spin" />
            <p>Memverifikasi sesi administrator…</p>
          </>
        )}
      </div>
    );
  const active =
    menus.find((m) => m.to === location.pathname)?.label || "OVERVIEW";
  const navigation = (
    <>
      <AdminBrand />
      <div className="admin-nav-label">WORKSPACE</div>
      <nav aria-label="Navigasi admin">
        {menus.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            onClick={() => setMobile(false)}
            className={({ isActive }) =>
              "admin-nav-link" + (isActive ? " active" : "")
            }
          >
            <Icon size={18} />
            {label}
            {label === "PESANAN" && <small>05</small>}
          </NavLink>
        ))}
      </nav>
      <div className="admin-sidebar-foot">
        <div className="admin-session-indicator">
          <ShieldCheck size={16} />
          <span>Sesi terverifikasi</span>
          <i />
        </div>
        <div className="admin-profile">
          <span className="admin-avatar">
            {session.user.displayName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{session.user.displayName}</strong>
            <small>ADMINISTRATOR</small>
          </div>
        </div>
        <button
          className="admin-logout"
          onClick={() => void logout()}
          disabled={loggingOut}
        >
          <LogOut size={17} />
          {loggingOut ? "Memproses…" : "Logout"}
        </button>
      </div>
    </>
  );
  return (
    <div className="admin-root admin-shell">
      <aside className="admin-sidebar">{navigation}</aside>
      {mobile && (
        <Drawer title="Navigasi admin" onClose={() => setMobile(false)}>
          <div className="admin-mobile-nav">{navigation}</div>
        </Drawer>
      )}
      <div className="admin-workspace">
        <header className="admin-header">
          <button
            className="admin-icon admin-menu-button"
            aria-label="Buka navigasi admin"
            onClick={() => setMobile(true)}
          >
            <Menu size={20} />
          </button>
          <div className="admin-breadcrumb">
            <Link to="/admin">Control Center</Link>
            <ChevronRight size={13} />
            <span>{active}</span>
          </div>
          <div className="admin-header-right">
            <span className="admin-event-label">
              <i /> IAX 2026
            </span>
            <button
              className="admin-icon"
              aria-label="Notifikasi"
              aria-expanded={notification}
              onClick={() => setNotification(!notification)}
            >
              <Bell size={18} />
            </button>
            <Link
              to="/admin/settings"
              className="admin-avatar"
              aria-label="Pengaturan akun"
            >
              {session.user.displayName.slice(0, 2).toUpperCase()}
            </Link>
          </div>
          {notification && (
            <div className="admin-notification" role="status">
              Notifikasi transaksi belum terhubung. Data operasional menggunakan
              simulasi.
            </div>
          )}
        </header>
        <main className="admin-main">
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route
              path="dashboard"
              element={<Navigate to="/admin" replace />}
            />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="spk" element={<SPKPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route
              path="settings"
              element={
                <SettingsPage
                  session={session}
                  onRevoked={() => {
                    setSession(null);
                    navigate("/admin/login", {
                      replace: true,
                      state: {
                        reason: "Sesi telah dicabut. Silakan login kembali.",
                      },
                    });
                  }}
                />
              }
            />
            <Route
              path="*"
              element={
                <div>
                  <h1>Halaman tidak ditemukan</h1>
                  <Link to="/admin">Kembali ke overview</Link>
                </div>
              }
            />
          </Routes>
          <footer className="admin-content-footer">
            <span>IAX 2026 / INDOPRIDE AUTO EXPO</span>
            <span>ADMIN CONTROL CENTER</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
