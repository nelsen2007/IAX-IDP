import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  FileText,
  Users,
  ArrowUpRight,
  ArrowRight,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Eye,
  Printer,
  Plus,
  Clock3,
  CheckCheck,
  XCircle,
  Car,
} from "lucide-react";
import {
  AdminDataTable,
  DemoNotice,
  DetailList,
  Drawer,
  PageIntro,
  StatCards,
  StatusBadge,
} from "./components";
import {
  demoOrders,
  demoMembers,
  demoSpks,
  money,
  dateLabel,
  type DemoOrder,
  type DemoMember,
  type DemoSpk,
} from "./data";

function OrderRows({
  rows,
  onSelect,
  compact = false,
}: {
  rows: DemoOrder[];
  onSelect: (o: DemoOrder) => void;
  compact?: boolean;
}) {
  return (
    <>
      {rows.map((o) => (
        <tr key={o.id}>
          <td>
            <strong className="admin-mono">{o.id}</strong>
            {!compact && <small>{dateLabel(o.date)}</small>}
          </td>
          <td>
            <strong>{o.member}</strong>
            <small>{o.citizen}</small>
          </td>
          <td>
            <div className="admin-vehicle-cell">
              <img src={o.image} alt="" />
              <div>
                <strong>{o.vehicle}</strong>
                <small>{o.brand}</small>
              </div>
            </div>
          </td>
          {compact ? (
            <td className="admin-nowrap">{dateLabel(o.date)}</td>
          ) : (
            <td className="admin-nowrap">{money(o.price)}</td>
          )}
          <td>
            <StatusBadge status={o.status} />
          </td>
          <td>
            <button
              className="admin-row-button"
              aria-label={"Detail " + o.id}
              onClick={() => onSelect(o)}
            >
              <ArrowUpRight size={17} />
            </button>
          </td>
        </tr>
      ))}
    </>
  );
}
function OrderDrawer({
  order,
  onClose,
}: {
  order: DemoOrder;
  onClose: () => void;
}) {
  const [message, setMessage] = useState(""),
    [status, setStatus] = useState(order.status);
  function simulate(action: string, next?: string) {
    setMessage(
      `Simulasi: ${action}. Tidak ada transaksi yang dikirim atau disimpan.`,
    );
    if (next) setStatus(next);
  }
  return (
    <Drawer title="Detail Pesanan" onClose={onClose}>
      <DemoNotice />
      <div className="admin-detail-title">
        <h3>{order.id}</h3>
        <StatusBadge status={status} />
      </div>
      <img
        className="admin-detail-vehicle"
        src={order.image}
        alt={order.vehicle}
      />
      <DetailList
        items={[
          ["Nama member", order.member],
          ["Citizen ID", order.citizen],
          ["Nomor telepon RP", order.phone],
          ["Tanggal pemesanan", dateLabel(order.date)],
          ["Kendaraan", `${order.brand} ${order.vehicle}`],
          ["Varian", order.variant],
          ["Warna", order.color],
          ["Harga", money(order.price)],
          ["Catatan pelanggan", order.notes],
        ]}
      />
      <div className="admin-drawer-actions">
        <button
          className="admin-button primary"
          onClick={() => simulate("pesanan diproses dalam preview", "Diproses")}
        >
          Proses Pesanan — simulasi
        </button>
        <button
          className="admin-button"
          onClick={() =>
            simulate("draft SPK dapat ditinjau melalui menu SPK", "SPK Dibuat")
          }
        >
          Buat SPK — simulasi
        </button>
        <button
          className="admin-button danger"
          onClick={() =>
            simulate("pembatalan pesanan dalam preview", "Dibatalkan")
          }
        >
          Batalkan Pesanan — simulasi
        </button>
      </div>
      {message && (
        <p role="status" className="admin-message">
          {message}
        </p>
      )}
    </Drawer>
  );
}
export function AdminDashboard() {
  const [selected, setSelected] = useState<DemoOrder | null>(null);
  return (
    <>
      <PageIntro
        eyebrow="OVERVIEW / IAX 2026"
        title="IAX Control Center"
        description="Kelola seluruh aktivitas pameran otomotif IAX 2026 melalui satu pusat administrasi."
        action={
          <Link className="admin-button" to="/admin/reports">
            Lihat laporan <ArrowUpRight size={16} />
          </Link>
        }
      />
      <DemoNotice />
      <StatCards
        items={[
          {
            label: "Total Pesanan",
            value: String(demoOrders.length).padStart(2, "0"),
            note: demoOrders.length ? "Pesanan tercatat" : "Belum ada pesanan masuk",
            icon: <ShoppingBag size={19} />,
          },
          {
            label: "Pesanan Baru",
            value: String(demoOrders.filter((o) => o.status === "Baru").length).padStart(2, "0"),
            note: "Menunggu peninjauan",
            icon: <Clock3 size={19} />,
          },
          {
            label: "SPK Diterbitkan",
            value: String(demoSpks.length).padStart(2, "0"),
            note: demoSpks.length ? "Dokumen diterbitkan" : "Belum ada SPK",
            icon: <FileText size={19} />,
          },
          {
            label: "Total Member",
            value: String(demoMembers.length).padStart(2, "0"),
            note: demoMembers.length ? "Member terdaftar" : "Belum ada member",
            icon: <Users size={19} />,
          },
        ]}
      />
      <div className="admin-overview-grid">
        <section className="admin-panel admin-recent-orders">
          <div className="admin-panel-heading">
            <div>
              <h2>Pesanan terbaru</h2>
              <p>Aktivitas pemesanan kendaraan</p>
            </div>
            <Link className="admin-inline-link" to="/admin/orders">
              Semua pesanan <ArrowRight size={15} />
            </Link>
          </div>
          <AdminDataTable
            headers={[
              "ID Pesanan",
              "Member",
              "Kendaraan",
              "Tanggal",
              "Status",
              "Aksi",
            ]}
          >
            <OrderRows rows={demoOrders} compact onSelect={setSelected} />
          </AdminDataTable>
          <div className="admin-table-foot">
            <span>Menampilkan {demoOrders.length} pesanan</span>
            <span>{String(demoOrders.length).padStart(2, "0")} TOTAL</span>
          </div>
        </section>
        <section className="admin-panel admin-activity">
          <div className="admin-panel-heading">
            <div>
              <h2>Aktivitas terbaru</h2>
              <p>Timeline operasional contoh</p>
            </div>
            <span className="admin-small-label">PREVIEW</span>
          </div>
          <ol>
            {[
              {
                icon: ShoppingBag,
                title: "Pesanan baru masuk",
                description: "Raka Pratama · 911 GT3 RS",
                time: "05 Nov 2026 · 10:42",
              },
              {
                icon: Users,
                title: "Member baru terdaftar",
                description: "Raka Pratama bergabung",
                time: "05 Nov 2026 · 10:30",
              },
              {
                icon: FileText,
                title: "SPK diterbitkan",
                description: "SPK-DEMO-260001 · Dimas",
                time: "04 Nov 2026 · 15:20",
              },
              {
                icon: CheckCheck,
                title: "Pesanan selesai",
                description: "Sarah Wilson · Huracán EVO",
                time: "04 Nov 2026 · 14:00",
              },
            ].map(({ icon: Icon, title, description, time }) => (
              <li key={title}>
                <span className="admin-activity-icon">
                  <Icon size={15} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <time>{time} WIB</time>
                </div>
              </li>
            ))}
          </ol>
          <div className="admin-activity-note">
            <ShieldIcon />
            <p>
              Autentikasi aktif menggunakan backend. Aktivitas bisnis di panel
              ini adalah data demo.
            </p>
          </div>
        </section>
      </div>
      <div className="admin-bottom-banner">
        <div>
          <span className="admin-small-label">INDOPRIDE AUTO EXPO</span>
          <h2>Satu pusat. Seluruh aktivitas.</h2>
          <p>Tinjau pesanan, siapkan dokumen, dan pantau aktivitas member.</p>
        </div>
        <Link to="/admin/orders" className="admin-button primary">
          Kelola pesanan <ArrowRight size={16} />
        </Link>
        <span className="admin-banner-word">
          IAX<span>2026</span>
        </span>
      </div>
      {selected && (
        <OrderDrawer order={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
function ShieldIcon() {
  return <CheckCheck size={18} />;
}
export function OrdersPage() {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [date, setDate] = useState(""),
    [selected, setSelected] = useState<DemoOrder | null>(null);
  const rows = demoOrders.filter(
    (o) =>
      `${o.id} ${o.member} ${o.citizen} ${o.vehicle}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!status || o.status === status) &&
      (!date || o.date === date),
  );
  return (
    <>
      <PageIntro
        eyebrow="OPERASIONAL / PESANAN"
        title="Pesanan kendaraan"
        description="Pantau setiap pemesanan dari permintaan awal hingga selesai."
      />
      <StatCards
        items={[
          {
            label: "Semua Pesanan",
            value: demoOrders.length,
            note: demoOrders.length ? "Seluruh pesanan tercatat" : "Belum ada pesanan masuk",
            icon: <ShoppingBag size={19} />,
          },
          {
            label: "Menunggu Proses",
            value: demoOrders.filter((o) => o.status === "Baru").length,
            note: "Pesanan berstatus baru",
            icon: <Clock3 size={19} />,
          },
          {
            label: "Dalam Proses",
            value: demoOrders.filter((o) => o.status === "Diproses" || o.status === "SPK Dibuat").length,
            note: "Diproses dan SPK dibuat",
            icon: <Car size={19} />,
          },
          {
            label: "Selesai",
            value: demoOrders.filter((o) => o.status === "Selesai").length,
            note: "Pemesanan selesai",
            icon: <CheckCheck size={19} />,
          },
        ]}
      />
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Daftar pesanan</h2>
            <p>
              {rows.length} dari {demoOrders.length} pesanan
            </p>
          </div>
          <SlidersHorizontal size={18} />
        </div>
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={17} />
            <input
              aria-label="Cari pesanan"
              placeholder="Cari ID, member, kendaraan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter status pesanan"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Semua status</option>
            {["Baru", "Diproses", "SPK Dibuat", "Selesai", "Dibatalkan"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
          <input
            type="date"
            aria-label="Filter tanggal pesanan"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            className="admin-button"
            onClick={() => {
              setSearch("");
              setStatus("");
              setDate("");
            }}
          >
            <RotateCcw size={14} />
            Reset filter
          </button>
        </div>
        <AdminDataTable
          headers={[
            "ID / Tanggal",
            "Member / Citizen ID",
            "Kendaraan",
            "Harga",
            "Status",
            "Aksi",
          ]}
          empty={!rows.length}
        >
          <OrderRows rows={rows} onSelect={setSelected} />
        </AdminDataTable>
        <div className="admin-table-foot">
          <span>Identitas dan nilai RP pada tabel adalah ilustrasi.</span>
          <span>{rows.length} PESANAN</span>
        </div>
      </section>
      {selected && (
        <OrderDrawer order={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

export function SPKDocument({ spk }: { spk: DemoSpk }) {
  const o = spk.order;
  return (
    <article className="admin-spk-document">
      <div className="admin-doc-watermark">CONTOH / TIDAK BERLAKU</div>
      <header>
        <strong>IAX 2026</strong>
        <span>INDOPRIDE AUTO EXPO</span>
      </header>
      <h2>SURAT PEMESANAN KENDARAAN</h2>
      <div className="admin-doc-sub">
        <span>No. {spk.number}</span>
        <span>{dateLabel(spk.date)}</span>
      </div>
      <h3>01 / IDENTITAS PEMBELI</h3>
      <DetailList
        items={[
          ["Nama pembeli", o.member],
          ["Citizen ID", o.citizen],
          ["Nomor telepon", o.phone],
        ]}
      />
      <h3>02 / KENDARAAN & PEMBAYARAN</h3>
      <DetailList
        items={[
          ["Kendaraan", o.vehicle],
          ["Brand", o.brand],
          ["Model", o.vehicle],
          ["Varian", o.variant],
          ["Warna", o.color],
          ["Harga", money(o.price)],
          ["Diskon", money(spk.discount)],
          ["DP", money(spk.dp)],
          ["Sisa pembayaran", money(o.price - spk.discount - spk.dp)],
          ["Catatan", o.notes],
          ["Nama sales", spk.sales],
        ]}
      />
      <div className="admin-doc-signatures">
        <div>
          Pembeli
          <br />
          <span>{o.member}</span>
        </div>
        <div>
          Sales
          <br />
          <span>{spk.sales}</span>
        </div>
      </div>
      <footer>
        DEMO DATA — Dokumen contoh. Tidak disimpan, diterbitkan, atau sah untuk
        transaksi.
      </footer>
    </article>
  );
}
export function SPKPage() {
  const [selected, setSelected] = useState<DemoSpk | null>(null),
    [search, setSearch] = useState("");
  const rows = demoSpks.filter((s) =>
    (s.number + s.order.member + s.order.vehicle)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageIntro
        eyebrow="DOKUMEN / SPK"
        title="Surat Pemesanan Kendaraan"
        description="Tinjau dokumen pemesanan dan pratinjau format cetaknya."
        action={
          <button
            className="admin-button primary"
            onClick={() =>
              setSelected({
                ...demoSpks[0],
                number: "SPK-DEMO-PREVIEW",
                status: "Draft",
              })
            }
          >
            <Plus size={17} />
            Buat SPK — simulasi
          </button>
        }
      />
      <DemoNotice />
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Dokumen SPK</h2>
            <p>Nomor dokumen di bawah hanya untuk demonstrasi.</p>
          </div>
          <span className="admin-small-label">02 DOKUMEN</span>
        </div>
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={17} />
            <input
              aria-label="Cari SPK"
              placeholder="Cari nomor, member, kendaraan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <AdminDataTable
          headers={[
            "Nomor SPK",
            "Tanggal",
            "Nama Member",
            "Kendaraan",
            "Sales",
            "Harga",
            "Status",
            "Aksi",
          ]}
          empty={!rows.length}
        >
          {rows.map((s) => (
            <tr key={s.number}>
              <td className="admin-mono">{s.number}</td>
              <td className="admin-nowrap">{dateLabel(s.date)}</td>
              <td>{s.order.member}</td>
              <td>{s.order.vehicle}</td>
              <td>{s.sales}</td>
              <td className="admin-nowrap">{money(s.order.price)}</td>
              <td>
                <StatusBadge status={s.status} />
              </td>
              <td>
                <button
                  className="admin-row-button"
                  aria-label={"Lihat SPK " + s.number}
                  onClick={() => setSelected(s)}
                >
                  <Eye size={17} />
                </button>
              </td>
            </tr>
          ))}
        </AdminDataTable>
        <div className="admin-table-foot">
          Penerbitan dan nomor SPK produksi memerlukan backend bisnis.
        </div>
      </section>
      {selected && (
        <Drawer wide title="Preview SPK" onClose={() => setSelected(null)}>
          <div className="admin-print-toolbar">
            <span className="admin-small-label">PREVIEW DOKUMEN CONTOH</span>
            <button className="admin-button" onClick={() => window.print()}>
              <Printer size={16} />
              Cetak contoh
            </button>
          </div>
          <SPKDocument spk={selected} />
        </Drawer>
      )}
    </>
  );
}

export function MembersPage() {
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState<DemoMember | null>(null);
  const rows = demoMembers.filter((m) =>
    (m.name + m.id + m.citizen).toLowerCase().includes(search.toLowerCase()),
  );
  const history = demoOrders.filter((o) => o.citizen === selected?.citizen);
  return (
    <>
      <PageIntro
        eyebrow="KOMUNITAS / MEMBER"
        title="Member Management"
        description="Tinjau profil karakter, informasi kontak, dan riwayat pemesanan."
      />
      <DemoNotice />
      <StatCards
        items={[
          {
            label: "Total Member",
            value: 5,
            note: "Profil contoh",
            icon: <Users size={19} />,
          },
          {
            label: "Member Baru",
            value: 3,
            note: "Periode contoh",
            icon: <Plus size={19} />,
          },
          {
            label: "Member Aktif",
            value: 4,
            note: "Status ilustratif",
            icon: <CheckCheck size={19} />,
          },
          {
            label: "Member dengan Pesanan",
            value: 5,
            note: "Minimal satu pesanan",
            icon: <ShoppingBag size={19} />,
          },
        ]}
      />
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Daftar member</h2>
            <p>Identitas karakter untuk demonstrasi</p>
          </div>
          <Users size={18} />
        </div>
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={17} />
            <input
              aria-label="Cari member"
              placeholder="Cari nama, member ID, Citizen ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <AdminDataTable
          headers={[
            "Member ID",
            "Nama Karakter",
            "Citizen ID",
            "Telepon RP",
            "Tanggal Daftar",
            "Total Pesanan",
            "Aksi",
          ]}
          empty={!rows.length}
        >
          {rows.map((m) => (
            <tr key={m.id}>
              <td className="admin-mono">{m.id}</td>
              <td>
                <strong>{m.name}</strong>
                <small>{m.active ? "Aktif" : "Tidak aktif"} · contoh</small>
              </td>
              <td>{m.citizen}</td>
              <td>{m.phone}</td>
              <td className="admin-nowrap">{dateLabel(m.joined)}</td>
              <td>{m.orders}</td>
              <td>
                <button
                  className="admin-row-button"
                  aria-label={"Detail member " + m.name}
                  onClick={() => setSelected(m)}
                >
                  <ArrowUpRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </AdminDataTable>
        <div className="admin-table-foot">
          Profil member tidak memberikan hak akses administrator.
        </div>
      </section>
      {selected && (
        <Drawer title="Detail Member" onClose={() => setSelected(null)}>
          <DemoNotice />
          <div className="admin-member-profile">
            <span className="admin-avatar">
              {selected.name.slice(0, 2).toUpperCase()}
            </span>
            <h3>{selected.name}</h3>
            <span>{selected.id}</span>
          </div>
          <DetailList
            items={[
              ["Citizen ID", selected.citizen],
              ["Telepon RP", selected.phone],
              ["Bergabung", dateLabel(selected.joined)],
              [
                "Status",
                selected.active ? "Aktif — contoh" : "Tidak aktif — contoh",
              ],
            ]}
          />
          <h3 className="admin-subheading">Riwayat pemesanan</h3>
          {history.map((o) => (
            <div className="admin-history" key={o.id}>
              <strong>{o.id}</strong>
              <span>{o.vehicle}</span>
              <StatusBadge status={o.status} />
            </div>
          ))}
          <h3 className="admin-subheading">Riwayat SPK</h3>
          {demoSpks
            .filter((s) => s.order.citizen === selected.citizen)
            .map((s) => (
              <div className="admin-history" key={s.number}>
                <strong>{s.number}</strong>
                <StatusBadge status={s.status} />
              </div>
            ))}
          {!demoSpks.some((s) => s.order.citizen === selected.citizen) && (
            <p className="admin-muted">Belum ada SPK dalam data contoh.</p>
          )}
          <div className="admin-message">
            <XCircle size={15} /> Pengelolaan role admin tidak tersedia melalui
            profil member.
          </div>
        </Drawer>
      )}
    </>
  );
}
