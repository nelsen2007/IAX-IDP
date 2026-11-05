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
  DemoNotice,
  PageIntro,
  StatCards,
  StatusBadge,
} from "./components";
import { demoOrders, demoSpks, money, dateLabel } from "./data";

export default function ReportsPage() {
  const [period, setPeriod] = useState("7"),
    [from, setFrom] = useState("2026-11-01"),
    [to, setTo] = useState("2026-11-06"),
    [message, setMessage] = useState("");
  // Reports intentionally use a fixed demo reference day, displayed beside the filters.
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
  const rows = useMemo(
    () =>
      invalid ? [] : demoOrders.filter((o) => o.date >= start && o.date <= end),
    [start, end, invalid],
  );
  const total = rows.reduce((a, o) => a + o.price, 0),
    finished = rows.filter((o) => o.status === "Selesai").length;
  const spks = demoSpks.filter(
    (s) => s.status === "Diterbitkan" && s.date >= start && s.date <= end,
  ).length;
  const days = Array.from(new Set(rows.map((o) => o.date))).sort();
  const counts = days.map((day) => rows.filter((o) => o.date === day).length);
  const max = Math.max(1, ...counts),
    points = counts
      .map(
        (v, i) =>
          `${55 + i * (540 / Math.max(1, counts.length - 1))},${180 - (v / max) * 125}`,
      )
      .join(" ");
  const statuses = ["Baru", "Diproses", "SPK Dibuat", "Selesai", "Dibatalkan"];
  const colors = ["#78ff44", "#62b7f8", "#b49cff", "#f3c971", "#697d70"];
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
      <DemoNotice />
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
        <span>Referensi demo: 06 Nov 2026</span>
      </div>
      {invalid && (
        <p role="alert" className="admin-error">
          Tanggal akhir harus setelah tanggal awal.
        </p>
      )}
      <StatCards
        items={[
          {
            label: "Total Pesanan",
            value: rows.length,
            note: "Pada periode contoh",
            icon: <ShoppingBag size={19} />,
          },
          {
            label: "Pesanan Selesai",
            value: finished,
            note: "Status selesai",
            icon: <CheckCheck size={19} />,
          },
          {
            label: "SPK Diterbitkan",
            value: spks,
            note: "Dokumen contoh",
            icon: <FileText size={19} />,
          },
          {
            label: "Total Nilai Pemesanan",
            value: money(total),
            note: "Bukan pendapatan diterima",
            icon: <Wallet size={19} />,
          },
        ]}
      />
      <div className="admin-charts">
        <section className="admin-panel admin-trend">
          <div className="admin-panel-heading">
            <div>
              <h2>Order Trends</h2>
              <p>Jumlah pesanan per tanggal</p>
            </div>
            <span className="admin-chart-key">
              <i />
              Pesanan
            </span>
          </div>
          {rows.length ? (
            <svg viewBox="0 0 650 230" role="img" aria-label="Tren pemesanan">
              <title>Tren pemesanan</title>
              {[0, 1, 2].map((v) => (
                <g key={v}>
                  <line
                    x1="45"
                    x2="610"
                    y1={180 - (v / 2) * 125}
                    y2={180 - (v / 2) * 125}
                    stroke="#254332"
                    strokeDasharray="3 5"
                  />
                  <text x="20" y={185 - (v / 2) * 125}>
                    {Math.round((v / 2) * max)}
                  </text>
                </g>
              ))}
              <polygon
                points={`55,180 ${points} ${55 + (counts.length - 1) * (540 / Math.max(1, counts.length - 1))},180`}
                fill="#39e51b"
                fillOpacity="0.07"
              />
              <polyline
                points={points}
                fill="none"
                stroke="#78ff44"
                strokeWidth="2.5"
              />
              {counts.map((count, i) => (
                <g key={days[i]}>
                  <circle
                    cx={55 + i * (540 / Math.max(1, counts.length - 1))}
                    cy={180 - (count / max) * 125}
                    r="4"
                    fill="#78ff44"
                  />
                  <text
                    x={55 + i * (540 / Math.max(1, counts.length - 1))}
                    y="214"
                    textAnchor="middle"
                  >
                    {dateLabel(days[i]).slice(0, 6)}
                  </text>
                  <title>
                    {dateLabel(days[i])}: {count} pesanan
                  </title>
                </g>
              ))}
            </svg>
          ) : (
            <div className="admin-chart-empty">
              Tidak ada pesanan dalam periode ini.
            </div>
          )}
          <p className="admin-chart-summary">
            {days
              .map((day, i) => `${dateLabel(day)}: ${counts[i]}`)
              .join(" · ") || "0 pesanan"}
          </p>
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
                const count = rows.filter((o) => o.status === status).length;
                const prior = statuses
                  .slice(0, i)
                  .reduce(
                    (sum, s) => sum + rows.filter((o) => o.status === s).length,
                    0,
                  );
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
                    strokeDasharray={`${rows.length ? (count / rows.length) * 100 : 0} 100`}
                    strokeDashoffset={
                      rows.length ? (-prior / rows.length) * 100 : 0
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
                {rows.length}
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
                  <strong>{rows.filter((o) => o.status === s).length}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Top Ordered Vehicles</h2>
            <p>Popularitas kendaraan dalam data contoh</p>
          </div>
          <span className="admin-small-label">{rows.length} KENDARAAN</span>
        </div>
        <AdminDataTable
          headers={[
            "Kendaraan",
            "Jumlah Pemesanan",
            "Total Nilai Pesanan",
            "Status",
          ]}
          empty={!rows.length}
        >
          {sorted.map((o) => (
            <tr key={o.id}>
              <td>
                <div className="admin-vehicle-cell">
                  <img src={o.image} alt="" />
                  <div>
                    <strong>{o.vehicle}</strong>
                    <small>{o.brand}</small>
                  </div>
                </div>
              </td>
              <td>
                <div
                  className="admin-bar-track"
                  aria-label={`${o.vehicle}: 1 pemesanan`}
                >
                  <span />
                </div>
                1 pesanan
              </td>
              <td className="admin-nowrap">{money(o.price)}</td>
              <td>
                <StatusBadge status={o.status} />
              </td>
            </tr>
          ))}
        </AdminDataTable>
        <div className="admin-table-foot">
          Nilai pemesanan adalah nilai permintaan kendaraan contoh, bukan omzet
          atau pembayaran diterima.
        </div>
      </section>
    </>
  );
}
