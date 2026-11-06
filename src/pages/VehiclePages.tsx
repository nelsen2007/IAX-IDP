import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  X,
  ArrowLeft,
  Gauge,
  Zap,
  Settings2,
  Coins,
  Heart,
  CarFront,
} from "lucide-react";
import { readManagedVehicles } from "../data/vehicles";
import { currentMember } from "../data/members";
import OrderConfirmation from "../components/OrderConfirmation";
import { Button, Modal, PageHeader } from "../components/ui";

function PublicPrice({ vehicle }: { vehicle: ReturnType<typeof readManagedVehicles>[number] }) {
  const amount = new Intl.NumberFormat("en-US").format(vehicle.price);
  return <>{vehicle.jenis === "IMPORT" ? <Coins className="emas-coin-icon" size={18} aria-label="E MAS" /> : "IDP $"} {amount}</>;
}
export function VehicleCatalog() {
  const vehicles = readManagedVehicles().filter((v) => v.published);
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
                  src={v.photos?.[0] || v.image}
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
                  <span>{v.jenis}</span>
                  <span>{v.vehicleType}</span>
                </div>
                <h2>{v.name}</h2>
                <div className="vehicle-facts">
                  <span>
                    <Zap size={14} />
                    {v.category || "Kendaraan"}
                  </span>
                  <span>
                    <Settings2 size={14} />
                    Automatic
                  </span>
                </div>
                <div className="vehicle-price">
                  <strong><PublicPrice vehicle={v} /></strong>
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
    </main>
  );
}
export function VehicleDetail() {
  const vehicles = readManagedVehicles().filter((v) => v.published);
  const navigate = useNavigate();
  const { slug } = useParams();
  const v = vehicles.find((x) => x.slug === slug);
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
  const gallery = [0, 1, 2].map((i) => v.photos?.[i] || (i === 0 ? v.image : ""));
  
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
            {gallery[photo] ? <img src={gallery[photo]} alt={`${v.name} · foto ${photo + 1}`} /> : <div className="vehicle-silhouette" aria-label={`Foto ${photo + 1} belum tersedia`}><CarFront size={96} /></div>}
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
                  {gallery[i] ? <img src={gallery[i]} alt={s} /> : <span className="thumbnail-silhouette" aria-label={`${s} belum tersedia`}><CarFront size={34} /></span>}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="detail-info">
          <div className="eyebrow">{v.jenis} / {v.vehicleType}</div>
          <h1>{v.name}</h1>
          <span className="tag">{v.category}</span>
          <p className="detail-description">
            {v.description || "Deskripsi kendaraan belum tersedia."}
          </p>
          <div className="price-block">
            <span>Harga kendaraan</span>
            <strong><PublicPrice vehicle={v} /></strong>
          </div>
          <div className="spec-highlights">
            <div>
              <Zap />
              <b>{v.vehicleType}</b>
              <span>Type kendaraan</span>
            </div>
            <div>
              <Gauge />
              <b>{v.seats}</b>
              <span>SEAT</span>
            </div>
            <div>
              <Settings2 />
              <b>Automatic</b>
              <span>Transmisi</span>
            </div>
          </div>
          <Button onClick={() => currentMember() ? setModal("Ringkasan pemesanan") : navigate("/register")}>
            Pesan Sekarang <ArrowUpRight size={18} />
          </Button>
        </div>
      </div>
      {modal && (
        <Modal title={modal} onClose={() => setModal("")}>
          {modal === "Ringkasan pemesanan" ? <OrderConfirmation vehicle={v} /> : <>
          <p>
            {modal === "Konsultasi sales"
              ? "Tim sales akan membantu konsultasi model, varian, dan alur SPK. Layanan kontak belum diaktifkan dalam prototype."
              : "Tinjau kendaraan pilihanmu. Tampilan ini hanya simulasi; pesanan tidak dikirim atau disimpan."}
          </p>
          <div className="summary-box">
            {modal === "Ringkasan pemesanan" && currentMember() && <><span>Nama: {currentMember()?.name}</span><span>Nomor hape: {currentMember()?.phone}</span><span>SteamHEX: {currentMember()?.steamhex}</span></>}
            <b>
              {v.brand} {v.name}
            </b>
            <strong><PublicPrice vehicle={v} /></strong>
          </div>
          </>}
        </Modal>
      )}
    </main>
  );
}

