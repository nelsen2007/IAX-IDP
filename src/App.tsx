import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, MapPin, Clock } from "lucide-react";
import { Header, Footer, PageHeader, Button } from "./components/ui";
import Home from "./pages/HomePage";
import { VehicleCatalog, VehicleDetail } from "./pages/VehiclePages";
import { AuthPage, MemberDashboard } from "./pages/MemberPages";
import { SalesDashboard, CreateSPK } from "./pages/DashboardPages";
import { readManagedVehicles } from "./data/vehicles";
const AdminApp = lazy(() => import("./admin/AdminApp"));
function Info({ type }: { type: string }) {
  const vehicles = readManagedVehicles().filter((v) => v.published);
  return (
    <main className="page-wrap info-page">
      <PageHeader
        eyebrow="INDOPRIDE AUTO EXPO"
        title={
          type === "brands"
            ? "Brand, dengan karakter."
            : type === "schedule"
              ? "Jadwal & Informasi"
              : "Satu panggung. Semua cerita."
        }
        description={
          type === "brands"
            ? "Jelajahi karakter desain dan performa dari berbagai brand otomotif."
            : type === "schedule"
              ? "Rencanakan pengalamanmu bersama IAX 2026."
              : "IAX 2026 adalah ruang pertemuan bagi antusias otomotif dalam dunia INDOPRIDE Roleplay."
        }
      />
      {type === "brands" ? (
        <div className="brand-grid">
          {vehicles.map((v) => (
            <Link
              to={"/vehicles?brand=" + encodeURIComponent(v.brand)}
              key={v.brand}
              className="brand-card"
            >
              <span>AUTOMOTIVE PARTNER</span>
              <h2>{v.brand}</h2>
              <p>
                Jelajahi koleksi <ArrowUpRight size={17} />
              </p>
            </Link>
          ))}
        </div>
      ) : type === "schedule" ? (
        <div className="info-grid">
          {[
            {
              i: CalendarDays,
              t: "IAX 2026",
              p: "Jadwal resmi akan diumumkan oleh penyelenggara.",
            },
            {
              i: MapPin,
              t: "INDOPRIDE Roleplay",
              p: "Lokasi venue dalam kota akan diumumkan menjelang event.",
            },
            {
              i: Clock,
              t: "Pengalaman Otomotif",
              p: "Eksplorasi kendaraan, konsultasi sales, dan presentasi brand.",
            },
          ].map(({ i: Icon, t, p }) => (
            <div className="panel" key={t}>
              <Icon className="green" />
              <h2>{t}</h2>
              <p>{p}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="about-layout">
          <img
            src="/images/hero-expo.webp"
            alt="Ilustrasi pameran otomotif IAX 2026"
          />
          <div>
            <span className="eyebrow">YANG PENTING ADA</span>
            <h2>
              Lebih dari sekadar
              <br />
              pameran kendaraan.
            </h2>
            <p>
              Sebuah pengalaman otomotif untuk warga INDOPRIDE. Dari
              mengeksplorasi kendaraan terbaru hingga mengenali detail yang
              membuatnya berbeda, semua perjalanan dimulai dari rasa ingin tahu.
            </p>
            <p>
              Prototype ini menampilkan konsep event dengan data ilustratif.
              Jadwal, harga, dan layanan resmi mengikuti informasi
              penyelenggara.
            </p>
            <Button to="/vehicles">
              Jelajahi Kendaraan <ArrowUpRight size={18} />
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${pathname === "/" ? "IAX 2026" : pathname.includes("vehicles") ? "Kendaraan | IAX 2026" : pathname.includes("dashboard") ? "Workspace | IAX 2026" : "IAX 2026"} — INDOPRIDE Auto Expo`;
  }, [pathname]);
  const internal =
    pathname.startsWith("/sales/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");
  return (
    <>
      {!internal && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vehicles" element={<VehicleCatalog />} />
        <Route path="/vehicles/:slug" element={<VehicleDetail />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage register />} />
        <Route path="/member/dashboard" element={<MemberDashboard />} />
        <Route path="/sales/dashboard" element={<SalesDashboard />} />
        <Route path="/sales/spk/create" element={<CreateSPK />} />
        <Route
          path="/admin/*"
          element={
            <Suspense
              fallback={
                <main className="page-wrap">Memuat control center…</main>
              }
            >
              <AdminApp />
            </Suspense>
          }
        />
        {["schedule", "about"].map((x) => (
          <Route path={"/" + x} key={x} element={<Info type={x} />} />
        ))}
        <Route
          path="*"
          element={
            <main className="page-wrap">
              <PageHeader
                eyebrow="404 / WRONG TURN"
                title="Ambil arah yang baru."
                description="Halaman yang kamu cari tidak tersedia."
              />
              <Button to="/">Kembali ke Beranda</Button>
            </main>
          }
        />
      </Routes>
      {!internal && !["/login", "/register"].includes(pathname) && <Footer />}
    </>
  );
}
