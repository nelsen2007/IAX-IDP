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
  Archive,
  Edit3,
  Trash2,
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
import { archiveRegisteredMember, readArchivedMembers, readRegisteredMembers, updateRegisteredMember, type RegisteredMember } from "../data/members";
import type { AdminSession } from "./api";
import { useAdminOrders } from "./orders";
import { orderMoney } from "./data";
import { createOrderSpk } from "../data/orders";

function OrderRows({
  rows,
  onSelect,
  compact = false,
  canDelete = false,
}: {
  rows: DemoOrder[];
  onSelect: (o: DemoOrder) => void;
  compact?: boolean;
  canDelete?: boolean;
}) {
  return (
    <>
      {rows.map((o) => (
        <tr key={o.id}>
          <td>
            <strong className="admin-mono">{o.id}</strong>
          </td>
          {compact ? <td>
            <strong>{o.member}</strong>
            <small>{o.citizen}</small>
          </td> : <><td><strong>{o.member}</strong></td><td>{o.citizen}</td><td>{o.phone}</td></>}
          <td>
            <div className="admin-vehicle-cell">
              <div>
                <strong>{o.vehicle}</strong>
                <small>{o.brand}</small>
              </div>
            </div>
          </td>
          <td className="admin-nowrap">{orderMoney(o)}</td>
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
            {canDelete && <button className="admin-row-button danger-icon" aria-label={`Hapus pesanan ${o.id}`} onClick={() => { const orders = JSON.parse(localStorage.getItem("iax-member-orders") || "[]").filter((item: { id: string }) => item.id !== o.id); localStorage.setItem("iax-member-orders", JSON.stringify(orders)); window.dispatchEvent(new Event("iax-orders-updated")); }}><Trash2 size={16} /></button>}
          </td>
        </tr>
      ))}
    </>
  );
}
function OrderDrawer({
  order,
  onClose,
  session,
}: {
  order: DemoOrder;
  onClose: () => void;
  session: AdminSession;
}) {
  const [error, setError] = useState("");
  const [status] = useState(order.status);
  return (
    <Drawer title="Detail Pesanan" onClose={onClose}>
      <div className="admin-detail-title">
        <h3>{order.id}</h3>
        <StatusBadge status={status} />
      </div>
      <DetailList
        items={[
          ["Nama member", order.member],
          ["STEAMHEX", order.citizen],
          ["Nomor telepon RP", order.phone],
          ["Tanggal pemesanan", dateLabel(order.date)],
          ["Kendaraan", `${order.brand} ${order.vehicle}`],
          ["Quantity", `${order.quantity || 1} unit`],
          ["Harga satuan", orderMoney(order, order.unitPrice ?? order.price)],
          ["Total harga", orderMoney(order)],
        ]}
      />
      {error && <p role="alert" className="admin-error">{error}</p>}
      <button className="admin-button primary" onClick={() => { try { createOrderSpk(order.id, session.user); onClose(); } catch (e) { setError(e instanceof Error ? e.message : "SPK gagal dibuat."); } }}>Buat SPK</button>
    </Drawer>
  );
}
export function AdminDashboard({ session }: { session: AdminSession }) {
  const orders = useAdminOrders();
  const members = readRegisteredMembers();
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
      <StatCards
        items={[
          {
            label: "Total Pesanan",
            value: String(orders.length).padStart(2, "0"),
            note: orders.length ? "Pesanan tercatat" : "Belum ada pesanan masuk",
            icon: <ShoppingBag size={19} />,
          },
          {
            label: "Pesanan Baru",
            value: String(orders.filter((o) => o.status === "Baru").length).padStart(2, "0"),
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
            value: String(members.length).padStart(2, "0"),
            note: members.length ? "Member terdaftar" : "Belum ada member",
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
              "Harga",
              "Status",
              "Aksi",
            ]}
          >
            <OrderRows rows={orders} compact onSelect={setSelected} />
          </AdminDataTable>
          <div className="admin-table-foot">
            <span>Menampilkan {orders.length} pesanan</span>
            <span>{String(orders.length).padStart(2, "0")} TOTAL</span>
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
        <OrderDrawer session={session} order={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
function ShieldIcon() {
  return <CheckCheck size={18} />;
}
export function OrdersPage({ session }: { session: AdminSession }) {
  const allOrders = useAdminOrders();
  const [search, setSearch] = useState(""),
    [date, setDate] = useState(""),
    [selected, setSelected] = useState<DemoOrder | null>(null);
  const rows = allOrders.filter(
    (o) =>
      `${o.id} ${o.member} ${o.citizen} ${o.vehicle}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      o.status === "Baru" &&
      (!date || o.date.slice(0, 10) === date),
  );
  return (
    <>
      <PageIntro
        eyebrow="OPERASIONAL / PESANAN"
        title="Pesanan kendaraan"
        description="Pantau setiap pemesanan dari permintaan awal hingga selesai."
      />
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Daftar pesanan</h2>
            <p>
              {rows.length} dari {allOrders.length} pesanan
            </p>
          </div>
          <SlidersHorizontal size={18} />
        </div>
        <div className="admin-toolbar orders-toolbar">
          <label className="admin-search">
            <Search size={17} />
            <input
              aria-label="Cari pesanan"
              placeholder="Cari ID, member, kendaraan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
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
            "Nama Member",
            "STEAMHEX",
            "Nomor Hape",
            "Kendaraan",
            "Harga",
            "Status",
            "Aksi",
          ]}
          empty={!rows.length}
        >
          <OrderRows rows={rows} onSelect={setSelected} canDelete={session.user.role === "ADMIN" || session.user.role === "CASHIER" || session.user.username === "dev"} />
        </AdminDataTable>
        <div className="admin-table-foot">
          <span>Data pembeli dan kendaraan saat pemesanan.</span>
          <span>{rows.length} PESANAN</span>
        </div>
      </section>
      {selected && (
        <OrderDrawer session={session} order={selected} onClose={() => setSelected(null)} />
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

export function MembersPage({ session }: { session: AdminSession }) {
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState<DemoMember | null>(null),
    [editing, setEditing] = useState<RegisteredMember | null>(null),
    [archiveOpen, setArchiveOpen] = useState(false),
    [archiveSearch, setArchiveSearch] = useState("");
  const members = [...demoMembers.map((m) => ({ ...m, steamhex: "—" })), ...readRegisteredMembers()];
  const rows = members.filter((m) =>
    (m.name + m.id + m.steamhex).toLowerCase().includes(search.toLowerCase()),
  );
  const history = demoOrders.filter((o) => o.citizen === selected?.citizen);
  return (
    <>
      <PageIntro
        eyebrow="KOMUNITAS / MEMBER"
        title="Member Management"
        description="Tinjau profil karakter, informasi kontak, dan riwayat pemesanan."
      />
      <StatCards
        items={[
          {
            label: "Total Member",
            value: members.length,
            note: members.length ? "Member terdaftar" : "Belum ada member",
            icon: <Users size={19} />,
          },
          {
            label: "Member Baru",
            value: members.length,
            note: "Member terbaru",
            icon: <Plus size={19} />,
          },
          {
            label: "Member Aktif",
            value: members.filter((m) => m.active).length,
            note: "Status aktif",
            icon: <CheckCheck size={19} />,
          },
          {
            label: "Member dengan Pesanan",
            value: members.filter((m) => m.orders > 0).length,
            note: "Memiliki pesanan",
            icon: <ShoppingBag size={19} />,
          },
        ]}
      />
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Daftar member</h2>
            <p>Data member terdaftar</p>
          </div>
          <div className="admin-panel-heading-actions"><button className="admin-icon" aria-label="Buka arsip member" title="Arsip member" onClick={() => setArchiveOpen(true)}><Archive size={18} /></button></div>
        </div>
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={17} />
            <input
              aria-label="Cari member"
              placeholder="Cari nama, member ID, SteamHEX…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <AdminDataTable
          headers={[
            "Nama Karakter",
            "STEAMHEX",
            "Telepon RP",
            "Tanggal Daftar",
            "Total Pesanan",
            "Aksi",
          ]}
          empty={!rows.length}
        >
          {rows.map((m) => (
            <tr key={m.id}>
              <td>
                <strong>{m.name}</strong>
                <small>{m.active ? "Aktif" : "Tidak aktif"}</small>
              </td>
              <td>{m.steamhex}</td>
              <td>{m.phone}</td>
              <td className="admin-nowrap">{dateLabel(m.joined)}</td>
              <td>{m.orders}</td>
              <td>
                {session.user.role === "ADMIN" && "password" in m && <><button className="admin-row-button" aria-label={`Edit ${m.name}`} onClick={() => setEditing(m as RegisteredMember)}><Edit3 size={15} /></button><button className="admin-row-button danger-icon" aria-label={`Hapus ${m.name}`} onClick={() => { archiveRegisteredMember(m.id); setSelected(null); window.location.reload(); }}><Trash2 size={15} /></button></>}
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
          <div className="admin-member-profile">
            <span className="admin-avatar">
              {selected.name.slice(0, 2).toUpperCase()}
            </span>
            <h3>{selected.name}</h3>
            <span>{selected.id}</span>
          </div>
          <DetailList
            items={[
              ["STEAMHEX", "steamhex" in selected ? String(selected.steamhex) : "—"],
              ["Telepon RP", selected.phone],
              ["Bergabung", dateLabel(selected.joined)],
              [
                "Status",
                selected.active ? "Aktif" : "Tidak aktif",
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
            <p className="admin-muted">Belum ada SPK.</p>
          )}
          <div className="admin-message">
            <XCircle size={15} /> Pengelolaan role admin tidak tersedia melalui
            profil member.
          </div>
        </Drawer>
      )}
      {archiveOpen && <Drawer title="Arsip member" onClose={() => setArchiveOpen(false)}><input aria-label="Cari arsip member" placeholder="Cari nama atau SteamHEX…" value={archiveSearch} onChange={(e) => setArchiveSearch(e.target.value)} />{readArchivedMembers().filter((m) => `${m.name} ${m.steamhex}`.toLowerCase().includes(archiveSearch.toLowerCase())).map((m) => <div className="admin-history" key={m.id}><strong>{m.name}</strong><span>{m.steamhex}</span></div>)}</Drawer>}
      {editing && <Drawer title="Edit member" onClose={() => setEditing(null)}><form className="admin-form" onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); const password = String(d.get("password")); updateRegisteredMember(editing.id, { name: String(d.get("name")), phone: String(d.get("phone")), steamhex: String(d.get("steamhex")), ...(password ? { password } : {}) }); setEditing(null); window.location.reload(); }}><label>Nama<input name="name" defaultValue={editing.name} required /></label><label>Nomor hape<input name="phone" defaultValue={editing.phone} required /></label><label>SteamHEX<input name="steamhex" defaultValue={editing.steamhex} required /></label><label>Password baru<small>Kosongkan jika tidak ingin mengubah password.</small><input name="password" type="password" minLength={6} placeholder="Masukkan password baru" /></label><button className="admin-button primary">Simpan perubahan</button></form></Drawer>}
    </>
  );
}
