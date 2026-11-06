import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { deleteOrderSpk, receiveSpkPayment, useMemberOrders } from "../data/orders";
import type { AdminSession } from "./api";
import { AdminDataTable, DetailList, Drawer, PageIntro, StatusBadge } from "./components";
import { dateLabel } from "./data";

export default function SpkManagementPage({ session }: { session: AdminSession }) {
  const orders = useMemberOrders();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("BELUM BAYAR");
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const selected = orders.find((o) => o.id === selectedId);
  const canPay = session.user.role === "ADMIN" || session.user.role === "CASHIER";
  const canDelete = session.user.role === "ADMIN" || session.user.username === "dev";
  const rows = orders.filter((o) => o.spk && (!status || o.spk.paymentStatus === status) && `${o.spk.number} ${o.member} ${o.steamhex} ${o.vehicle} ${o.spk.creatorName}`.toLowerCase().includes(search.toLowerCase()));
  const price = (amount: number, currency: string) => `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;
  return <>
    <PageIntro eyebrow="DOKUMEN / SPK" title="Surat Pemesanan Kendaraan" description="Kelola SPK dan status pembayaran kendaraan." />
    <section className="admin-panel">
      <div className="admin-panel-heading"><h2>Daftar SPK</h2><span>{rows.length} SPK</span></div>
      <div className="admin-toolbar spk-toolbar"><input aria-label="Cari SPK" placeholder="Cari SPK, member, kendaraan, sales…" value={search} onChange={(e) => setSearch(e.target.value)} /><select aria-label="Filter status pembayaran SPK" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Semua</option><option value="LUNAS">Lunas</option><option value="BELUM BAYAR">Belum Bayar</option></select></div>
      <AdminDataTable headers={["Nomor SPK", "Nama Member", "Kendaraan", "Sales / Pembuat SPK", "Total Harga", "Status", "Aksi"]} empty={!rows.length}>
        {rows.map((o) => <tr key={o.id}><td>{o.spk!.number}</td><td>{o.member}</td><td>{o.vehicle}<small>{o.quantity} unit</small></td><td>{o.spk!.creatorName}</td><td>{price(o.total, o.currency)}</td><td>{canPay ? <button className="admin-spk-status-button" aria-label={`Pembayaran ${o.spk!.number}`} onClick={() => { setSelectedId(o.id); setError(""); }}><StatusBadge status={o.spk!.paymentStatus} /></button> : <StatusBadge status={o.spk!.paymentStatus} />}</td><td><div className="admin-row-actions"><button className="admin-row-button" aria-label={`Detail ${o.spk!.number}`} onClick={() => { setSelectedId(o.id); setError(""); }}><Eye size={17} /></button>{canDelete && <button className="admin-row-button danger-icon" aria-label={`Hapus ${o.spk!.number}`} onClick={() => { if (!window.confirm(`Hapus permanen ${o.spk!.number} beserta pesanan terkait?`)) return; try { deleteOrderSpk(o.id, session.user); if (selectedId === o.id) setSelectedId(""); } catch (e) { setError(e instanceof Error ? e.message : "SPK gagal dihapus."); } }}><Trash2 size={17} /></button>}</div></td></tr>)}
      </AdminDataTable>
    </section>
    {selected?.spk && <Drawer title="Detail SPK" onClose={() => setSelectedId("")}>
      <div className="admin-detail-title"><h3>{selected.spk.number}</h3><StatusBadge status={selected.spk.paymentStatus} /></div>
      <DetailList items={[
        ["Nama pembeli", selected.member], ["Nomor hape", selected.phone], ["STEAMHEX", selected.steamhex], ["ID pesanan", selected.id],
        ["Tanggal pesanan", dateLabel(selected.createdAt)], ["Kendaraan", selected.vehicle], ["Quantity", `${selected.quantity} unit`], ["Harga satuan", price(selected.unitPrice, selected.currency)],
        ["Sales / Pembuat SPK", selected.spk.creatorName], ["Role pembuat", selected.spk.creatorRole], ["Tanggal SPK", dateLabel(selected.spk.createdAt)],
        ...(selected.spk.paidAt ? [["Tanggal pembayaran", dateLabel(selected.spk.paidAt)], ["Diterima oleh", selected.spk.payerName || "—"]] as [string, string][] : []),
      ]} />
      <div className="admin-spk-payment-total"><span>{selected.spk.paymentStatus === "LUNAS" ? "Total pembayaran diterima" : "Total yang harus dibayarkan"}</span><strong>{price(selected.total, selected.currency)}</strong></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {canPay && selected.spk.paymentStatus === "BELUM BAYAR" && <button className="admin-button primary" onClick={() => { try { receiveSpkPayment(selected.id, session.user); } catch (e) { setError(e instanceof Error ? e.message : "Pembayaran gagal disimpan."); } }}>Pembayaran Diterima</button>}
    </Drawer>}
  </>;
}
