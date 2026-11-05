import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  X,
  ArrowLeft,
  Gauge,
  Zap,
  Settings2,
  Check,
  Heart,
} from "lucide-react";
import { vehicles, money } from "../data/mock";
import { Button, Modal, PageHeader } from "../components/ui";
export function VehicleCatalog() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState(params.get("brand") || "");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const list = vehicles.filter(
    (v) =>
      (v.name + " " + v.brand).toLowerCase().includes(search.toLowerCase()) &&
      (!brand || v.brand === brand) &&
      (!category || v.category === category) &&
      (!price || (price === "low" ? v.price < 2500000 : v.price >= 2500000)),
  );
  const reset = () => {
    setSearch("");
    setBrand("");
    setCategory("");
    setPrice("");
  };
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="FIND YOUR NEXT DRIVE"
        title="Katalog Kendaraan"
        description="Bukan sekadar kendaraan. Temukan sesuatu yang mencerminkan dirimu."
      />
      <div className="catalog-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            autoFocus={params.get("search") === "1"}
            aria-label="Cari kendaraan"
            placeholder="Cari model atau brand kendaraan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Brand</span>
          <select aria-label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Semua Brand</option>
            {[...new Set(vehicles.map((v) => v.brand))].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Kategori</span>
          <select
            aria-label="Kategori" value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {[...new Set(vehicles.map((v) => v.category))].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Harga</span>
          <select aria-label="Harga" value={price} onChange={(e) => setPrice(e.target.value)}>
            <option value="">Rentang Harga</option>
            <option value="low">Di bawah RP $2.500.000</option>
            <option value="high">RP $2.500.000 ke atas</option>
          </select>
        </label>
      </div>
      <div className="results-line">
        <span>
          <b>{list.length}</b> kendaraan untuk dijelajahi
        </span>
        <button className="text-button" onClick={reset}>
          <SlidersHorizontal size={15} /> Reset filter
        </button>
      </div>
      {list.length ? (
        <div className="vehicle-grid">
          {list.map((v) => (
            <Link
              key={v.slug}
              to={"/vehicles/" + v.slug}
              className="vehicle-card"
            >
              <div className="vehicle-photo">
                <img
                  src={v.image}
                  alt={`${v.brand} ${v.name}`}
                  loading="lazy"
                />
                <span
                  className={
                    v.badge === "Limited Edition" ? "badge limited" : "badge"
                  }
                >
                  {v.badge}
                </span>
                <span className="photo-arrow">
                  <ArrowUpRight size={21} />
                </span>
              </div>
              <div className="vehicle-content">
                <div className="vehicle-label">
                  <span>{v.brand}</span>
                  <span>{v.category}</span>
                </div>
                <h2>{v.name}</h2>
                <div className="vehicle-facts">
                  <span>
                    <Zap size={14} />
                    {v.power} HP
                  </span>
                  <span>
                    <Settings2 size={14} />
                    Automatic
                  </span>
                </div>
                <div className="vehicle-price">
                  <strong>{money(v.price)}</strong>
                  <span>
                    Lihat Detail <ArrowUpRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Search size={36} />
          <h2>Kendaraan belum ditemukan</h2>
          <p>Coba kata kunci lain atau sesuaikan filter pilihanmu.</p>
          <Button onClick={reset}>
            Reset Pencarian <X size={15} />
          </Button>
        </div>
      )}
      <p className="demo-note">
        Koleksi, spesifikasi, harga RP, dan ketersediaan merupakan data
        ilustratif prototype.
      </p>
    </main>
  );
}
export function VehicleDetail() {
  const { slug } = useParams();
  const v = vehicles.find((x) => x.slug === slug);
  const [tab, setTab] = useState("Overview");
  const [color, setColor] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [modal, setModal] = useState("");
  const [saved, setSaved] = useState(false);
  if (!v)
    return (
      <main className="page-wrap">
        <PageHeader
          eyebrow="404"
          title="Kendaraan tidak ditemukan"
          description="Model yang kamu cari belum tersedia dalam koleksi ini."
        />
        <Button to="/vehicles">Kembali ke katalog</Button>
      </main>
    );
  const colors = ["#a9acab", "#18372c", "#171819"];
  return (
    <main className="page-wrap detail-page">
      <Link className="back-link" to="/vehicles">
        <ArrowLeft size={15} /> Kembali ke Katalog{" "}
        <span>
          / {v.brand} / {v.name}
        </span>
      </Link>
      <div className="detail-grid">
        <div>
          <div className={"detail-image angle-" + photo}>
            <img src={v.image} alt={`${v.brand} ${v.name}`} />
            <span className="badge">{v.badge}</span>
            <button
              className={saved ? "favorite active" : "favorite"}
              aria-label={saved ? "Hapus dari favorit" : "Tambahkan ke favorit"}
              onClick={() => setSaved(!saved)}
            >
              <Heart fill={saved ? "currentColor" : "none"} size={20} />
            </button>
          </div>
          <div className="thumbnails">
            {["Tampilan utama", "Detail eksterior", "Detail bodi"].map(
              (s, i) => (
                <button
                  key={s}
                  className={photo === i ? "chosen" : ""}
                  onClick={() => setPhoto(i)}
                  aria-label={s}
                >
                  <img
                    style={{
                      objectPosition: `${i * 35}% center`,
                      transform: `scale(${1 + i * 0.3})`,
                    }}
                    src={v.image}
                    alt={s}
                  />
                </button>
              ),
            )}
          </div>
          <div className="color-choices">
            <span>
              Warna pilihan{" "}
              <b>
                {["Silver Metallic", "Racing Green", "Obsidian Black"][color]}
              </b>
            </span>
            <div>
              {colors.map((c, i) => (
                <button
                  key={c}
                  style={{ background: c }}
                  className={color === i ? "selected" : ""}
                  aria-label={
                    ["Silver Metallic", "Racing Green", "Obsidian Black"][i]
                  }
                  aria-pressed={color === i}
                  onClick={() => setColor(i)}
                >
                  {color === i && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
          <small className="muted">
            Foto ilustratif; pilihan warna tidak mengubah foto referensi.
          </small>
        </div>
        <div className="detail-info">
          <div className="eyebrow">{v.brand.toUpperCase()}</div>
          <h1>{v.name}</h1>
          <span className="tag">{v.category}</span>
          <p className="detail-description">
            Performa tanpa kompromi. Desain yang berbicara. Hadirkan pengalaman
            berkendara yang berbeda di setiap perjalanan.
          </p>
          <div className="price-block">
            <span>Harga kendaraan</span>
            <strong>{money(v.price)}</strong>
            <small>
              <i /> Tersedia · 3 unit dalam koleksi demo
            </small>
          </div>
          <div className="spec-highlights">
            <div>
              <Zap />
              <b>{v.power} HP</b>
              <span>Tenaga</span>
            </div>
            <div>
              <Gauge />
              <b>3,2 detik</b>
              <span>0–100 km/h</span>
            </div>
            <div>
              <Settings2 />
              <b>Automatic</b>
              <span>Transmisi</span>
            </div>
          </div>
          <Button onClick={() => setModal("Ringkasan pemesanan")}>
            Pesan Sekarang <ArrowUpRight size={18} />
          </Button>
          <Button secondary onClick={() => setModal("Konsultasi sales")}>
            Hubungi Sales <ArrowUpRight size={18} />
          </Button>
          <p className="demo-note">
            Prototype · Tidak ada transaksi atau pemesanan yang dikirim.
          </p>
        </div>
      </div>
      <div className="tabs">
        {["Overview", "Spesifikasi", "Fitur", "Galeri"].map((x) => (
          <button
            key={x}
            role="tab"
            aria-selected={tab === x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tab === "Overview" ? (
          <>
            <h2>Dirancang untuk pengalaman luar biasa.</h2>
            <p>
              {v.brand} {v.name} memadukan karakter desain yang khas dengan
              teknologi performa tinggi. Jelajahi spesifikasi dan fitur dalam
              koleksi IAX 2026.
            </p>
          </>
        ) : tab === "Spesifikasi" ? (
          <div className="spec-table">
            {Object.entries({
              Mesin: "V8 Twin Turbo",
              Tenaga: `${v.power} HP`,
              Torsi: "650 Nm",
              Transmisi: "8-speed Automatic",
              Drivetrain: "AWD",
              "Top Speed": "320 km/h",
              Akselerasi: "3,2 detik",
              "Kapasitas Penumpang": "2 orang",
            }).map(([a, b]) => (
              <div key={a}>
                <span>{a}</span>
                <b>{b}</b>
              </div>
            ))}
          </div>
        ) : tab === "Fitur" ? (
          <div className="features-list">
            {[
              "Adaptive cruise control",
              "Premium audio system",
              "Carbon performance package",
              "Digital cockpit",
              "Sport exhaust",
              "Advanced safety assist",
            ].map((x) => (
              <p key={x}>
                <Check size={18} />
                {x}
              </p>
            ))}
          </div>
        ) : (
          <img
            className="gallery-wide"
            src={v.image}
            alt={`Galeri ${v.name}`}
          />
        )}
      </div>
      {modal && (
        <Modal title={modal} onClose={() => setModal("")}>
          <p>
            {modal === "Konsultasi sales"
              ? "Tim sales akan membantu konsultasi model, varian, dan alur SPK. Layanan kontak belum diaktifkan dalam prototype."
              : "Tinjau kendaraan pilihanmu. Tampilan ini hanya simulasi; pesanan tidak dikirim atau disimpan."}
          </p>
          <div className="summary-box">
            <b>
              {v.brand} {v.name}
            </b>
            <span>
              {["Silver Metallic", "Racing Green", "Obsidian Black"][color]}
            </span>
            <strong>{money(v.price)}</strong>
          </div>
          <Button to="/member/dashboard">
            Lihat Demo Member <ArrowUpRight size={16} />
          </Button>
        </Modal>
      )}
    </main>
  );
}

