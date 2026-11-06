import { useEffect, useState, type FormEvent } from "react";
import { Button } from "./ui";
import { currentMember } from "../data/members";
import type { ManagedVehicle } from "../data/vehicles";

type Sales = { id: string; name: string };
export default function OrderConfirmation({ vehicle }: { vehicle: ManagedVehicle }) {
  const member = currentMember();
  const [quantity, setQuantity] = useState(1);
  const [sales, setSales] = useState<Sales[]>([]);
  const [keyword, setKeyword] = useState("");
  const [chosen, setChosen] = useState<Sales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/sales", { signal: controller.signal }).then(async (r) => {
      if (!r.ok) throw new Error("Daftar sales gagal dimuat. Coba buka kembali pemesanan.");
      const result = await r.json(); setSales(result.sales);
    }).catch((e) => { if (e.name !== "AbortError") setError("Daftar sales gagal dimuat. Coba buka kembali pemesanan."); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  const total = vehicle.price * quantity;
  const price = (n: number) => `${vehicle.jenis === "IMPORT" ? "E MAS" : "IDP $"} ${new Intl.NumberFormat("en-US").format(n)}`;
  function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!member || !chosen || !sales.some((s) => s.id === chosen.id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 5) { setError("Pilih sales dan jumlah pembelian 1–5 unit."); return; }
    try {
      const id = `ORD-${crypto.randomUUID()}`;
      const orders = JSON.parse(localStorage.getItem("iax-member-orders") || "[]");
      orders.push({ id, memberId: member.id, member: member.name, phone: member.phone, steamhex: member.steamhex, vehicle: vehicle.name, slug: vehicle.slug, quantity, unitPrice: vehicle.price, total, currency: vehicle.jenis === "IMPORT" ? "E MAS" : "IDP $", salesId: chosen.id, salesName: chosen.name, status: "Baru", createdAt: new Date().toISOString() });
      localStorage.setItem("iax-member-orders", JSON.stringify(orders));
      setCreated(id);
    } catch { setError("Pesanan gagal disimpan. Silakan coba kembali."); }
  }
  if (created) return <div role="status"><h3>Pesanan berhasil dibuat</h3><p>{vehicle.name} · {quantity} unit · {price(total)}</p><p>Sales: {chosen?.name}</p><Button to="/member/dashboard">Ke halaman member</Button></div>;
  return <form className="order-confirmation" onSubmit={submit}>
    <div className="summary-box"><b>{vehicle.name}</b><span>Harga satuan: {price(vehicle.price)}</span><span>Nama: {member?.name}</span><span>Nomor hape: {member?.phone}</span><span>SteamHEX: {member?.steamhex}</span></div>
    <label>Quantity pembelian<select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} unit</option>)}</select><small>Maksimal 5 unit per pesanan.</small></label>
    <label>Nama SALES<input value={keyword} onChange={(e) => { setKeyword(e.target.value); setChosen(null); }} placeholder={loading ? "Memuat sales…" : "Ketik nama sales…"} disabled={loading} autoComplete="off" required /></label>
    {!chosen && !loading && <div className="sales-suggestions" aria-label="Saran sales">{sales.filter((s) => s.name.toLowerCase().includes(keyword.toLowerCase())).map((s) => <button type="button" key={s.id} onClick={() => { setChosen(s); setKeyword(s.name); }}>{s.name}</button>)}{!sales.some((s) => s.name.toLowerCase().includes(keyword.toLowerCase())) && <p>Sales tidak ditemukan.</p>}</div>}
    <strong>Total: {price(total)}</strong>
    {error && <p role="alert">{error}</p>}
    <button className="button" type="submit" disabled={loading || !chosen}>BUAT PESANAN</button>
  </form>;
}
