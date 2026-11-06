import { useMemo, useState } from "react";
import {
  Download,
  ShoppingBag,
  CheckCheck,
  FileText,
  Wallet,
} from "lucide-react";
import {
  AdminDataTable,
  PageIntro,
  StatCards,
  StatusBadge,
} from "./components";
import { dateLabel } from "./data";
import { readRegisteredMembers } from "../data/members";
import { useMemberOrders } from "../data/orders";

const priceLabel = (amount: number, currency = "IPD $") => `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;

export default function ReportsPage() {
  const memberOrders = useMemberOrders();
  const memberCount = readRegisteredMembers().length;
  const [period, setPeriod] = useState("7"),
    [from, setFrom] = useState("2026-11-01"),
    [to, setTo] = useState("2026-11-06"),
    [message, setMessage] = useState("");
  const start =
    period === "custom"
      ? from
      : period === "today"
        ? "2026-11-06"
        : period === "7"
          ? "2026-10-31"
          : "2026-10-08";
  const end = period === "custom" ? to : "2026-11-06";
  const invalid = start > end;
  const rows = useMemo(() => {
    const reportRows = memberOrders.map((order) => ({
      ...order,
      citizen: order.steamhex,
      date: order.createdAt,
      price: order.total,
      brand: "",
      image: order.image || "",
    }));
    return invalid ? [] : reportRows.filter((o) => o.date.slice(0, 10) >= start && o.date.slice(0, 10) <= end);
  }, [memberOrders, start, end, invalid]);
  const reportOrders = memberOrders.filter((o) => o.createdAt.slice(0, 10) >= start && o.createdAt.slice(0, 10) <= end),
    issuedSpks = reportOrders.filter((o) => o.spk).length,
    paidSpks = reportOrders.filter((o) => o.spk?.paymentStatus === "LUNAS").length,
    dealerIncome = reportOrders.filter((o) => o.currency === "IDP $" && o.spk?.paymentStatus === "LUNAS").reduce((sum, o) => sum + o.total, 0);
  const statuses = ["BELUM BAYAR", "LUNAS"];
  const colors = ["#f3c971", "#78ff44"];
  const statusRows = rows.filter((o) => o.spk);
  const paymentStatusCount = (status: string) => statusRows.filter((o) => status === "LUNAS" ? o.spk?.paymentStatus === "LUNAS" : o.spk?.paymentStatus === "BELUM BAYAR").length;
  const sorted = [...rows].sort((a, b) => b.price - a.price);
  return (
    <>
      <PageIntro
        eyebrow="INSIGHT / BUSINESS INTELLIGENCE"
        title="Laporan aktivitas"
        description="Pahami tren pemesanan dan minat kendaraan dalam satu tampilan."
        action={
          <button
            className="admin-button"
            onClick={() =>
              setMessage(
                "Simulasi ekspor laporan. Tidak ada file atau laporan produksi yang diterbitkan.",
              )
            }
          >
            <Download size={16} />
            Export Report — preview
          </button>
        }
      />
      {message && (
        <p role="status" className="admin-message">
          {message}
        </p>
      )}
      <div className="admin-report-filters">
        <div role="group" aria-label="Periode laporan">
          {[
            ["today", "Hari Ini"],
            ["7", "7 Hari"],
            ["30", "30 Hari"],
            ["custom", "Custom Range"],
          ].map(([v, l]) => (
            <button
              key={v}
              aria-pressed={period === v}
              className={period === v ? "active" : ""}
              onClick={() => setPeriod(v)}
            >
              {l}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="admin-date-range">
            <label>
              Dari
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
              />
            </label>
            <label>
              Sampai
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
              />
            </label>
          </div>
        )}
        <span>Periode: {dateLabel(start)} — {dateLabel(end)}</span>
      </div>
      {invalid && (
        <p role="alert" className="admin-error">
          Tanggal akhir harus setelah tanggal awal.
        </p>
      )}
      <StatCards
        items={[
          {
            label: "Total Member",
            value: memberCount,
            note: "Member terdaftar",
            icon: <ShoppingBag size={19} />,
          },
          {
            label: "SPK Diterbitkan",
            value: issuedSpks,
            note: "Pada periode terpilih",
            icon: <CheckCheck size={19} />,
          },
          {
            label: "SPK LUNAS",
            value: paidSpks,
            note: "Pembayaran diterima",
            icon: <FileText size={19} />,
          },
          {
            label: "Total Income DEALER",
            value: priceLabel(dealerIncome),
            note: "IPD $ · Pembayaran lunas",
            icon: <Wallet size={19} />,
          },
        ]}
      />
      <div className="admin-charts">
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Top Ordered Vehicles</h2>
              <p>Popularitas kendaraan berdasarkan pesanan masuk</p>
            </div>
            <span className="admin-small-label">{rows.length} KENDARAAN</span>
          </div>
          <AdminDataTable headers={["Kendaraan", "Jumlah Pemesanan", "Total Nilai Pesanan", "Status"]} empty={!rows.length}>
            {sorted.map((o) => <tr key={o.id}><td><div className="admin-vehicle-cell"><div><strong>{o.vehicle}</strong><small>{o.brand}</small></div></div></td><td><div className="admin-bar-track" aria-label={`${o.vehicle}: 1 pemesanan`}><span /></div>1 pesanan</td><td className="admin-nowrap">{priceLabel(o.price, o.currency)}</td><td><StatusBadge status={o.status} /></td></tr>)}
          </AdminDataTable>
          <div className="admin-table-foot">Nilai diambil dari data pesanan yang tersimpan.</div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Order Status</h2>
              <p>Distribusi status pesanan</p>
            </div>
          </div>
          <div className="admin-donut-wrap">
            <svg
              viewBox="0 0 160 160"
              role="img"
              aria-label="Distribusi status pesanan"
            >
              <circle
                cx="80"
                cy="80"
                r="55"
                fill="none"
                stroke="#1b3023"
                strokeWidth="17"
              />
              {statuses.map((status, i) => {
                const count = paymentStatusCount(status);
                const prior = statuses
                  .slice(0, i)
                  .reduce((sum, s) => sum + paymentStatusCount(s), 0);
                return (
                  <circle
                    key={status}
                    cx="80"
                    cy="80"
                    r="55"
                    fill="none"
                    stroke={colors[i]}
                    strokeWidth="17"
                    pathLength="100"
                    strokeDasharray={`${statusRows.length ? (count / statusRows.length) * 100 : 0} 100`}
                    strokeDashoffset={
                      statusRows.length ? (-prior / statusRows.length) * 100 : 0
                    }
                    transform="rotate(-90 80 80)"
                  />
                );
              })}
              <text
                x="80"
                y="78"
                textAnchor="middle"
                className="admin-donut-number"
              >
                {statusRows.length}
              </text>
              <text x="80" y="98" textAnchor="middle">
                PESANAN
              </text>
            </svg>
            <ul>
              {statuses.map((s, i) => (
                <li key={s}>
                  <span>
                    <i style={{ background: colors[i] }} />
                    {s}
                  </span>
                  <strong>{paymentStatusCount(s)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
