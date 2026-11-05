import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  ArrowUpRight,
  ShoppingBag,
  Clock,
  FileText,
  TrendingUp,
  Pencil,
  Trash2,
  Car,
  Users,
  Settings,
  Layers,
} from "lucide-react";
import { DashboardShell, Button, Modal } from "../components/ui";
import { orders, vehicles, money } from "../data/mock";
export function SalesDashboard() {
  const [params] = useSearchParams();
  const view = params.get("view") || "Dashboard";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [detail, setDetail] = useState<(typeof orders)[number] | null>(null);
  const list = orders.filter(
    (o) =>
      (o.id + o.member + o.vehicle)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!status || o.status === status) &&
      (!date || o.date === date),
  );
  return (
    <DashboardShell role="Sales">
      <div className="section-line">
        <div>
          <span className="eyebrow">SALES OVERVIEW</span>
          <h1>{view === "Dashboard" ? "Dashboard Sales" : view}</h1>
          <p className="muted">
            Kelola setiap langkah pemesanan dengan lebih mudah.
          </p>
        </div>
        <Button to="/sales/spk/create">
          <Plus size={17} /> Buat SPK
        </Button>
      </div>
      {["Dashboard", "Pesanan Masuk", "Data SPK"].includes(view) ? (
        <>
          <div className="stats-grid">
            {[
              {
                i: ShoppingBag,
                t: "Pesanan Baru",
                v: "12",
                n: "Menunggu peninjauan",
              },
              {
                i: Clock,
                t: "Dalam Proses",
                v: "8",
                n: "Ditangani oleh tim sales",
              },
              {
                i: FileText,
                t: "SPK Dibuat",
                v: "24",
                n: "Dokumen telah disiapkan",
              },
              {
                i: TrendingUp,
                t: "Total Pemesanan",
                v: "56",
                n: "Seluruh periode demo",
              },
            ].map(({ i: Icon, t, v, n }) => (
              <div className="stat" key={t}>
                <div className="section-line">
                  <span>{t}</span>
                  <Icon size={20} />
                </div>
                <strong>{v}</strong>
                <small>{n}</small>
              </div>
            ))}
          </div>
          <section className="panel">
            <div className="section-line">
              <div>
                <h2>
                  {view === "Data SPK"
                    ? "Data Surat Pemesanan"
                    : "Daftar Pesanan"}
                </h2>
                <p className="muted">
                  Pantau dan tindak lanjuti pesanan member.
                </p>
              </div>
              <span className="tag">{list.length} pesanan</span>
            </div>
            <div className="table-filters">
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label="Cari pesanan"
                  placeholder="Cari ID, member, kendaraan…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select
                aria-label="Filter status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                {[
                  "Baru",
                  "Diproses",
                  "SPK Dibuat",
                  "Selesai",
                  "Dibatalkan",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <input
                type="date"
                aria-label="Filter tanggal"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <button
                className="text-button"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setDate("");
                }}
              >
                Reset
              </button>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "ID Pesanan",
                      "Member",
                      "Kendaraan",
                      "Tanggal",
                      "Status",
                      "Aksi",
                    ].map((x) => (
                      <th key={x}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <b>{o.id}</b>
                      </td>
                      <td>
                        {o.member}
                        <small>{o.citizen}</small>
                      </td>
                      <td>{o.vehicle}</td>
                      <td>{o.date}</td>
                      <td>
                        <span
                          className={
                            "status status-" +
                            o.status.split(" ")[0].toLowerCase()
                          }
                        >
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-action"
                          onClick={() => setDetail(o)}
                        >
                          Lihat Detail <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!list.length && (
                <div className="empty">
                  <Search />
                  <h3>Pesanan tidak ditemukan</h3>
                  <p>Sesuaikan pencarian atau filter tanggal.</p>
                </div>
              )}
            </div>
            <div className="table-footer">
              Menampilkan {list.length} dari {orders.length} pesanan dummy{" "}
              <span>Halaman 1 dari 1</span>
            </div>
          </section>
        </>
      ) : (
        <WorkspaceSection view={view} />
      )}
      <p className="demo-note">
        Workspace demo · Statistik dan pesanan adalah data ilustratif.
      </p>
      {detail && (
        <Modal title={"Pesanan " + detail.id} onClose={() => setDetail(null)}>
          <div className="summary-box">
            <b>{detail.member}</b>
            <span>{detail.citizen}</span>
            <span>{detail.vehicle}</span>
            <span>
              {detail.date} · {detail.status}
            </span>
          </div>
          <Button to="/sales/spk/create">
            Buat Draft SPK <ArrowUpRight size={16} />
          </Button>
        </Modal>
      )}
    </DashboardShell>
  );
}
function WorkspaceSection({ view }: { view: string }) {
  if (view === "Kendaraan")
    return (
      <div className="panel">
        <h2>Koleksi Kendaraan</h2>
        {vehicles.map((v) => (
          <div className="list-row" key={v.slug}>
            <Car size={19} />
            <b>
              {v.brand} {v.name}
            </b>
            <span>{money(v.price)}</span>
          </div>
        ))}
      </div>
    );
  if (view === "Member" || view === "Sales")
    return (
      <div className="panel">
        <h2>Direktori {view}</h2>
        {(view === "Sales"
          ? ["Ardi Putra", "Nadia Putri"]
          : orders.map((o) => o.member)
        ).map((x, i) => (
          <div className="list-row" key={x}>
            <Users size={18} />
            <b>{x}</b>
            <span>{view === "Sales" ? "Sales aktif" : orders[i].citizen}</span>
          </div>
        ))}
      </div>
    );
  if (view === "Brand")
    return (
      <div className="brand-grid">
        {vehicles.map((v) => (
          <div className="panel" key={v.brand}>
            <h2>{v.brand}</h2>
            <p className="muted">1 model dalam koleksi</p>
          </div>
        ))}
      </div>
    );
  if (view === "Laporan")
    return (
      <div className="panel">
        <h2>Ringkasan Pemesanan</h2>
        {["Baru", "Diproses", "SPK Dibuat", "Selesai", "Dibatalkan"].map(
          (s, i) => (
            <div className="report-row" key={s}>
              <span>{s}</span>
              <div style={{ width: `${70 - i * 10}%` }} />
              <b>{12 - i * 2}</b>
            </div>
          ),
        )}
        <p className="demo-note">
          Visualisasi data demo, bukan laporan transaksi aktual.
        </p>
      </div>
    );
  return (
    <div className="panel">
      <Settings className="green" />
      <h2>{view}</h2>
      <p className="muted">Pratinjau konfigurasi workspace IAX 2026.</p>
      <div className="form-grid">
        <label>
          Nama website
          <input defaultValue="IAX 2026 — INDOPRIDE Auto Expo" />
        </label>
        <label>
          Mode website
          <select>
            <option>Prototype / Demo</option>
          </select>
        </label>
      </div>
      <p className="demo-note">Perubahan pada tampilan ini tidak disimpan.</p>
    </div>
  );
}
export function AdminDashboard() {
  const [params] = useSearchParams();
  const view = params.get("view") || "Dashboard";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [modal, setModal] = useState("");
  const list = vehicles.filter(
    (v) =>
      (v.name + v.brand).toLowerCase().includes(search.toLowerCase()) &&
      (!category || v.category === category),
  );
  return (
    <DashboardShell role="Admin">
      <div className="section-line">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h1>{view === "Dashboard" ? "Dashboard Admin" : view}</h1>
          <p className="muted">
            Semua yang kamu butuhkan untuk mengelola IAX 2026.
          </p>
        </div>
        <Button onClick={() => setModal("Tambah Kendaraan")}>
          <Plus size={17} /> Tambah Kendaraan
        </Button>
      </div>
      {["Dashboard", "Kelola Kendaraan"].includes(view) ? (
        <>
          {view === "Dashboard" && (
            <div className="stats-grid">
              {[
                [Car, "Kendaraan", "8"],
                [Layers, "Brand", "8"],
                [Users, "Member", "128"],
                [ShoppingBag, "Pemesanan", "56"],
              ].map(([Icon, t, v]) => {
                const I = Icon as typeof Car;
                return (
                  <div className="stat" key={String(t)}>
                    <I size={20} />
                    <span>Total {String(t)}</span>
                    <strong>{String(v)}</strong>
                  </div>
                );
              })}
            </div>
          )}
          <section className="panel">
            <div className="section-line">
              <h2>Kelola Kendaraan</h2>
              <span className="tag">Koleksi IAX 2026</span>
            </div>
            <div className="table-filters">
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label="Cari kendaraan admin"
                  placeholder="Cari nama kendaraan atau brand…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select
                aria-label="Kategori kendaraan"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {[...new Set(vehicles.map((v) => v.category))].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Kendaraan",
                      "Brand",
                      "Kategori",
                      "Harga",
                      "Status",
                      "Aksi",
                    ].map((x) => (
                      <th key={x}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((v) => (
                    <tr key={v.slug}>
                      <td>
                        <div className="table-vehicle">
                          <img src={v.image} alt="" />
                          <b>{v.name}</b>
                        </div>
                      </td>
                      <td>{v.brand}</td>
                      <td>{v.category}</td>
                      <td>{money(v.price)}</td>
                      <td>
                        <span className="status status-selesai">Aktif</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            aria-label={"Edit " + v.name}
                            onClick={() => setModal("Edit " + v.name)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            aria-label={"Hapus " + v.name}
                            onClick={() => setModal("Hapus " + v.name)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!list.length && (
                <div className="empty">Tidak ada kendaraan yang cocok.</div>
              )}
            </div>
          </section>
        </>
      ) : (
        <WorkspaceSection view={view} />
      )}
      <p className="demo-note">
        Mode prototype · Perubahan kendaraan tidak disimpan.
      </p>
      {modal && (
        <Modal title={modal} onClose={() => setModal("")}>
          {modal.startsWith("Hapus") ? (
            <>
              <p>
                Ini adalah pratinjau tindakan hapus. Kendaraan tidak akan
                dihapus dari data dummy.
              </p>
              <Button onClick={() => setModal("")}>Tutup Pratinjau</Button>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setModal("Pratinjau kendaraan");
              }}
            >
              {modal === "Pratinjau kendaraan" ? (
                <>
                  <p>
                    Form telah ditinjau dalam mode demo. Tidak ada perubahan
                    yang disimpan.
                  </p>
                  <Button onClick={() => setModal("")}>Selesai Meninjau</Button>
                </>
              ) : (
                <>
                  <div className="form-grid">
                    {[
                      "Nama Kendaraan",
                      "Brand",
                      "Varian",
                      "Harga RP",
                      "URL Foto",
                    ].map((x) => (
                      <label key={x}>
                        {x}
                        <input
                          required
                          placeholder={x}
                          type={x === "Harga RP" ? "number" : "text"}
                          min="0"
                        />
                      </label>
                    ))}
                    <label>
                      Kategori
                      <select>
                        {[
                          "SUV",
                          "Sedan",
                          "Sports Car",
                          "Supercar",
                          "Off-Road",
                          "Motorcycle",
                        ].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="demo-note">
                    Form visual. Tidak mengunggah foto atau menyimpan kendaraan.
                  </p>
                  <Button type="submit">
                    Tinjau Kendaraan <ArrowUpRight size={16} />
                  </Button>
                </>
              )}
            </form>
          )}
        </Modal>
      )}
    </DashboardShell>
  );
}
export function CreateSPK() {
  const [form, setForm] = useState({
    number: "SPK-2026-0042",
    name: "Raka Pratama",
    citizen: "IDP-004182",
    vehicle: vehicles[0].slug,
    variant: "Performance",
    color: "Silver Metallic",
    price: 4250000,
    discount: 0,
    dp: 1000000,
    notes: "",
    sales: "Ardi Putra",
  });
  const [review, setReview] = useState(false);
  const update = (key: string, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));
  const selected = vehicles.find((v) => v.slug === form.vehicle)!;
  const balance = Math.max(0, form.price - form.discount - form.dp);
  return (
    <DashboardShell role="Sales">
      <div className="section-line">
        <div>
          <span className="eyebrow">SURAT PEMESANAN KENDARAAN</span>
          <h1>Buat Draft SPK</h1>
          <p className="muted">
            Lengkapi detail dan tinjau dokumen secara langsung.
          </p>
        </div>
        <span className="tag">Draft · Belum disimpan</span>
      </div>
      <div className="spk-layout">
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            setReview(true);
          }}
        >
          <h2>Informasi Pemesanan</h2>
          <div className="form-grid">
            {[
              ["number", "Nomor SPK"],
              ["name", "Nama Pelanggan"],
              ["citizen", "Citizen ID"],
            ].map(([k, l]) => (
              <label key={k}>
                {l}
                <input
                  required
                  value={String(form[k as keyof typeof form])}
                  onChange={(e) => update(k, e.target.value)}
                />
              </label>
            ))}
            <label>
              Kendaraan
              <select
                value={form.vehicle}
                onChange={(e) => {
                  const v = vehicles.find((v) => v.slug === e.target.value)!;
                  setForm((f) => ({ ...f, vehicle: v.slug, price: v.price }));
                }}
              >
                {vehicles.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {v.brand} {v.name}
                  </option>
                ))}
              </select>
            </label>
            {[
              ["variant", "Varian"],
              ["color", "Warna"],
              ["price", "Harga Kendaraan"],
              ["discount", "Diskon"],
              ["dp", "DP"],
            ].map(([k, l]) => (
              <label key={k}>
                {l}
                <input
                  required
                  type={
                    ["price", "discount", "dp"].includes(k) ? "number" : "text"
                  }
                  min="0"
                  value={form[k as keyof typeof form]}
                  onChange={(e) =>
                    update(
                      k,
                      ["price", "discount", "dp"].includes(k)
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                />
              </label>
            ))}
            <label>
              Sisa Pembayaran
              <input readOnly value={money(balance)} />
            </label>
            <label>
              Nama Sales
              <input
                required
                value={form.sales}
                onChange={(e) => update("sales", e.target.value)}
              />
            </label>
          </div>
          <label>
            Catatan Sales
            <textarea
              value={form.notes}
              placeholder="Catatan tambahan untuk pemesanan…"
              onChange={(e) => update("notes", e.target.value)}
            />
          </label>
          {form.discount + form.dp > form.price && (
            <p className="form-error">
              Diskon dan DP melebihi harga kendaraan. Sesuaikan nominal sebelum
              meninjau.
            </p>
          )}
          <Button type="submit">
            Tinjau Draft SPK <ArrowUpRight size={16} />
          </Button>
          <p className="demo-note">Tidak membuat PDF atau menyimpan dokumen.</p>
        </form>
        <div>
          <div className="preview-label">
            <span className="live-dot" />
            LIVE SPK PREVIEW <span>A4 / DRAFT</span>
          </div>
          <article className="spk-document">
            <div className="doc-top">
              <b>
                IAX<span>2026</span>
              </b>
              <span>
                INDOPRIDE
                <br />
                AUTO EXPO
              </span>
            </div>
            <h2>
              SURAT PEMESANAN
              <br />
              KENDARAAN
            </h2>
            <p className="doc-number">{form.number} · 5 November 2026</p>
            <div className="doc-rule" />
            <small>INFORMASI PELANGGAN</small>
            <h3>{form.name || "Nama Pelanggan"}</h3>
            <p>Citizen ID: {form.citizen}</p>
            <small>DETAIL KENDARAAN</small>
            {[
              ["Kendaraan", selected.brand + " " + selected.name],
              ["Varian", form.variant],
              ["Warna", form.color],
              ["Harga", money(form.price)],
              ["Diskon", money(form.discount)],
              ["Down Payment", money(form.dp)],
            ].map(([k, v]) => (
              <div className="doc-row" key={k}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
            <div className="doc-total">
              <span>Sisa Pembayaran</span>
              <strong>{money(balance)}</strong>
            </div>
            <p>{form.notes || "— Tidak ada catatan tambahan —"}</p>
            <div className="doc-sign">
              <div>
                Pelanggan<span>{form.name}</span>
              </div>
              <div>
                Sales Representative<span>{form.sales}</span>
              </div>
            </div>
            <div className="doc-watermark">
              DRAFT / DEMO — BUKAN DOKUMEN RESMI
            </div>
          </article>
        </div>
      </div>
      {review && (
        <Modal title="Tinjau Draft SPK" onClose={() => setReview(false)}>
          <p>
            {form.discount + form.dp > form.price
              ? "Periksa kembali nominal DP dan diskon yang melebihi harga kendaraan."
              : "Preview dokumen telah mengikuti isian formulir. Ini hanya simulasi; SPK tidak disimpan atau diterbitkan."}
          </p>
          <div className="summary-box">
            <b>{form.number}</b>
            <span>
              {form.name} · {selected.name}
            </span>
            <strong>{money(balance)}</strong>
          </div>
          <Button onClick={() => setReview(false)}>Kembali ke Draft</Button>
        </Modal>
      )}
    </DashboardShell>
  );
}
